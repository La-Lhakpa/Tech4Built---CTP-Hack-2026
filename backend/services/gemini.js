// Gemini integration for DeadlineRadar.
//
//   buildPrompt(request, analysis)  -> prompt text
//   generatePlan(request)           -> the POST /api/plan response body
//   parsePlan(text)                 -> { overview, reasoning, days } (throws on bad input)
//
// The model supplies the editorial parts (task breakdown, wording, warnings).
// Arithmetic and labels are recomputed server-side in finalizePlan() so the
// response is internally consistent even when the model miscounts.

import { dateRange, dayLabel, todayISO } from '../lib/dates.js';
import { analyze, planningWindow } from './analysis.js';
import { buildSchedule } from './schedule.js';

const DEFAULT_MODEL = 'gemini-3.6-flash';
const GEMINI_TIMEOUT_MS = 30_000;

const round1 = (n) => Math.round(n * 10) / 10;

const SYSTEM_PROMPT = `You are an academic planning assistant. You turn a student's workload into a
realistic, day-by-day study schedule.

Respond with ONE valid JSON object and nothing else. No markdown, no code fences, no preamble.

{
  "overview": "1-2 sentences on the workload and how this plan approaches it",
  "reasoning": "1-2 sentences on why tasks are ordered this way",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "obligationId": "the id of the obligation this task belongs to",
          "title": "short, concrete subtask - not the whole assignment name",
          "course": "the obligation's course",
          "hours": 2,
          "note": "one short sentence of practical guidance"
        }
      ],
      "warning": "optional; only when the day needs a caution"
    }
  ]
}

Hard rules:
- Include one entry in "days" for EVERY date in the planning window, in order. A day with no
  work gets an empty "tasks" array.
- The sum of "hours" within a day must never exceed that day's available hours.
- Never schedule work for an obligation after its due date.
- "obligationId" must exactly match one of the ids provided. Never invent ids.
- "hours" is a number, in increments of 0.5.
- Break multi-hour obligations into distinct subtasks across days; do not repeat one generic title.
- Schedule the earliest-due and hardest work first, and finish work before its deadline day
  wherever the hours allow.
- Omit "warning" entirely when the day needs no caution.`;

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

export function buildPrompt(request, analysis, today = todayISO()) {
  const { obligations, availableHoursPerDay } = request;
  const { start, end } = planningWindow(obligations, today);

  const obligationLines = obligations
    .map(
      (o) =>
        `- id: ${o.id} | ${o.course || 'No course'} | ${o.assignmentName} | due ${o.dueDate} | ` +
        `${o.estimatedHours}h estimated | difficulty: ${o.difficulty} | type: ${o.type}`,
    )
    .join('\n');

  return [
    `Today is ${today}.`,
    `Planning window: ${start} through ${end} (${analysis.planningDays} days, inclusive).`,
    `Available study time: ${availableHoursPerDay}h on every day in the window.`,
    '',
    'WORKLOAD ANALYSIS:',
    `- Required: ${analysis.totalRequiredHours}h`,
    `- Available: ${analysis.totalAvailableHours}h`,
    `- Deficit: ${analysis.deficitHours}h`,
    `- Utilization: ${analysis.utilizationPercent}%`,
    `- Risk level: ${analysis.riskLevel}`,
    '',
    'OBLIGATIONS:',
    obligationLines,
    '',
    analysis.deficitHours > 0
      ? `There is not enough time for everything. Schedule what fits, front-load the highest-risk ` +
        `work, and use day "warning" fields to flag where the student must cut scope, add hours, ` +
        `or ask for an extension.`
      : `The workload fits. Spread it sensibly and leave room to review before each deadline.`,
    '',
    'Produce the JSON object now.',
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* API call                                                            */
/* ------------------------------------------------------------------ */

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== 'your_api_key_here' ? key : null;
}

export function isConfigured() {
  return Boolean(apiKey());
}

export function modelName() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

async function callGemini(prompt, { signal }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName()}:generateContent` +
    `?key=${apiKey()}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = await res.json();
  const candidate = json?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) {
    const finish = candidate?.finishReason;
    throw new Error(`Gemini returned no text${finish ? ` (finishReason: ${finish})` : ''}`);
  }
  return text;
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

export function parsePlan(text) {
  const clean = String(text)
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini response was not JSON');
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== 'object') throw new Error('Plan is not an object');
  if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
    throw new Error('Plan is missing a non-empty "days" array');
  }

  return {
    overview: str(parsed.overview),
    reasoning: str(parsed.reasoning),
    days: parsed.days.map((day) => ({
      date: str(day.date),
      warning: str(day.warning),
      tasks: Array.isArray(day.tasks)
        ? day.tasks.map((t) => ({
            obligationId: str(t.obligationId),
            title: str(t.title),
            course: str(t.course),
            hours: Number(t.hours),
            note: str(t.note),
          }))
        : [],
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

/**
 * Rebuild the response so the numbers are trustworthy: drop tasks pointing at
 * unknown obligations, fill in `course` from the obligation, recompute
 * `totalHours`, derive `label`, and emit exactly one entry per day in the
 * planning window.
 */
function finalizePlan(draft, request, today) {
  const { obligations, availableHoursPerDay } = request;
  const byId = new Map(obligations.map((o) => [o.id, o]));
  const { start, end } = planningWindow(obligations, today);

  const draftByDate = new Map(draft.days.map((day) => [day.date, day]));

  const days = dateRange(start, end).map((date) => {
    const source = draftByDate.get(date);

    const tasks = (source?.tasks ?? [])
      .map((task) => {
        const obligation = byId.get(task.obligationId);
        if (!obligation) return null; // hallucinated id
        const hours = Number.isFinite(task.hours) ? round1(Math.max(0, task.hours)) : 0;
        if (hours <= 0) return null;
        return {
          obligationId: obligation.id,
          title: task.title || obligation.assignmentName,
          course: task.course || obligation.course,
          hours,
          note: task.note,
        };
      })
      .filter(Boolean);

    const totalHours = round1(tasks.reduce((sum, t) => sum + t.hours, 0));
    const day = { date, label: dayLabel(date, today), totalHours, tasks };

    const warning = source?.warning || defaultWarning(totalHours, availableHoursPerDay);
    if (warning) day.warning = warning;

    return day;
  });

  return { generatedAt: new Date().toISOString(), overview: draft.overview, reasoning: draft.reasoning, days };
}

function defaultWarning(totalHours, capacity) {
  if (capacity <= 0) return '';
  if (totalHours > capacity) {
    return `This day is scheduled for ${totalHours}h but you only have ${capacity}h — move something.`;
  }
  if (totalHours === capacity) return 'Full-capacity day—protect this study block.';
  return '';
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * @param {{ obligations: Array<object>, availableHoursPerDay: number }} request
 * @returns {Promise<object>} the POST /api/plan response body
 * @throws {Error} when Gemini is unreachable, times out, or returns unusable JSON
 */
export async function generatePlan(request, today = todayISO()) {
  if (!apiKey()) throw new Error('GEMINI_API_KEY is not configured');

  const analysis = analyze(request, today);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const text = await callGemini(buildPrompt(request, analysis, today), {
      signal: controller.signal,
    });
    return finalizePlan(parsePlan(text), request, today);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Locally computed plan in the same response shape, for when Gemini is down. */
export function generateFallbackPlan(request, today = todayISO()) {
  const draft = buildSchedule(request, today);
  return finalizePlan(draft, request, today);
}
