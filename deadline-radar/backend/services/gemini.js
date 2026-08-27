// Gemini integration for DeadlineRadar.
//
// Responsibilities:
//   - buildPrompt(collisionData)   -> the user-facing prompt text
//   - generatePlan(collisionData)  -> { plan, source, reason? }  (never throws)
//   - parsePlan(text)              -> normalized plan object (throws on bad input)
//   - createFallbackPlan(data)     -> deterministic plan when Gemini is unavailable

const DEFAULT_MODEL = 'gemini-3.6-flash';
const GEMINI_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are an intelligent academic planning assistant. Your job is to analyze a
student's workload and create a realistic, day-by-day preparation schedule.

You receive:
- A list of obligations (assignments, exams, projects, work shifts)
- Available hours per day
- A risk assessment (LOW / MEDIUM / HIGH collision)

Rules:
- Respond ONLY with a single valid JSON object. No markdown, no code fences, no preamble.
- Never schedule more total task hours in a day than that day's availableHours.
- Break large obligations into concrete subtasks spread across multiple days.
- Schedule the earliest-due and highest-difficulty work first.
- If required work exceeds available time, say so plainly in "warnings" with specific,
  actionable options (reduce scope, add study time, request an extension, drop a shift).
- "priority" is an integer starting at 1, where 1 means "do this first".

Required JSON shape:
{
  "planOverview": string,
  "recommendation": string,
  "dailyPlan": [
    {
      "date": "YYYY-MM-DD",
      "dayOfWeek": string,
      "availableHours": number,
      "tasks": [
        { "taskName": string, "duration": number, "priority": number, "notes": string }
      ]
    }
  ],
  "warnings": string[],
  "successTips": string[]
}`;

/* ------------------------------------------------------------------ */
/* Prompt building                                                     */
/* ------------------------------------------------------------------ */

export function buildPrompt(data = {}) {
  const {
    obligations = [],
    availabilityPerDay = {},
    riskLevel = 'UNKNOWN',
    totalRequired,
    totalAvailable,
    hoursDeficit,
  } = data;

  const obligationLines = obligations
    .map((o, i) => {
      const name = o.name ?? o.taskName ?? `Obligation ${i + 1}`;
      return `- [${o.course ?? 'N/A'}] ${name} | due ${o.dueDate ?? 'N/A'} | ~${
        o.estimatedHours ?? '?'
      }h | difficulty: ${o.difficulty ?? 'n/a'} | type: ${o.type ?? 'n/a'}`;
    })
    .join('\n');

  const availabilityLines = Object.entries(availabilityPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => `- ${date}: ${hours}h available`)
    .join('\n');

  return [
    `RISK LEVEL: ${riskLevel}`,
    totalRequired != null ? `Total required: ${totalRequired}h` : null,
    totalAvailable != null ? `Total available: ${totalAvailable}h` : null,
    hoursDeficit != null ? `Hours deficit: ${hoursDeficit}h` : null,
    '',
    'OBLIGATIONS:',
    obligationLines || '(none)',
    '',
    'AVAILABILITY PER DAY:',
    availabilityLines || '(none)',
    '',
    'Produce the day-by-day plan as a single JSON object following the required shape.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Gemini call                                                         */
/* ------------------------------------------------------------------ */

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_api_key_here') return null;
  return key;
}

async function callGemini(prompt, { signal } = {}) {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey()}`;

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
/* Parsing / normalization                                             */
/* ------------------------------------------------------------------ */

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toStringArray = (v) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const round1 = (n) => Math.round(n * 10) / 10;

function weekdayFor(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { weekday: 'long' });
}

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
  return normalizePlan(parsed);
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('Plan is not an object');
  if (!Array.isArray(plan.dailyPlan) || plan.dailyPlan.length === 0) {
    throw new Error('Plan is missing a non-empty dailyPlan');
  }

  return {
    planOverview: str(plan.planOverview),
    recommendation: str(plan.recommendation),
    dailyPlan: plan.dailyPlan.map((day) => ({
      date: str(day.date),
      // Trust the date over the model's weekday string (it sometimes disagrees).
      dayOfWeek: weekdayFor(day.date) || str(day.dayOfWeek),
      availableHours: num(day.availableHours),
      tasks: Array.isArray(day.tasks)
        ? day.tasks.map((t, i) => ({
            taskName: str(t.taskName ?? t.name),
            duration: num(t.duration),
            priority: Number.isFinite(Number(t.priority)) ? Number(t.priority) : i + 1,
            notes: str(t.notes),
          }))
        : [],
    })),
    warnings: toStringArray(plan.warnings),
    successTips: toStringArray(plan.successTips),
  };
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

export async function generatePlan(collisionData) {
  if (!apiKey()) {
    return {
      plan: createFallbackPlan(collisionData),
      source: 'fallback',
      reason: 'GEMINI_API_KEY is not configured',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const text = await callGemini(buildPrompt(collisionData), { signal: controller.signal });

    // Model politely declined instead of returning JSON.
    if (!text.trim().startsWith('{') && /\bI (cannot|can't|am unable|'m unable)\b/i.test(text)) {
      return {
        plan: createFallbackPlan(collisionData),
        source: 'fallback',
        reason: 'model declined the request',
      };
    }

    return { plan: parsePlan(text), source: 'gemini' };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'Gemini request timed out' : err.message;
    console.error('[gemini] falling back:', reason);
    return { plan: createFallbackPlan(collisionData), source: 'fallback', reason };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Deterministic fallback scheduler                                    */
/* ------------------------------------------------------------------ */

const DIFFICULTY_RANK = { high: 0, medium: 1, low: 2 };

export function createFallbackPlan(data = {}) {
  const obligations = Array.isArray(data.obligations) ? data.obligations : [];
  const availability = data.availabilityPerDay ?? {};
  const days = Object.keys(availability).sort();

  const queue = obligations
    .map((o, i) => ({
      label: `${o.course ? `${o.course} - ` : ''}${o.name ?? o.taskName ?? `Obligation ${i + 1}`}`,
      due: o.dueDate ?? '',
      remaining: Math.max(0, Number(o.estimatedHours) || 0),
      difficulty: String(o.difficulty ?? 'medium').toLowerCase(),
    }))
    .sort(
      (a, b) =>
        (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99') ||
        (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1),
    );

  const dailyPlan = days.map((date) => {
    let capacity = Math.max(0, Number(availability[date]) || 0);
    const tasks = [];
    let priority = 1;

    for (const item of queue) {
      if (capacity <= 0) break;
      if (item.remaining <= 0) continue;
      if (item.due && date > item.due) continue; // past this obligation's due date

      const chunk = round1(Math.min(capacity, item.remaining));
      if (chunk <= 0) continue;

      item.remaining = round1(item.remaining - chunk);
      capacity = round1(capacity - chunk);
      tasks.push({
        taskName: item.label,
        duration: chunk,
        priority: priority++,
        notes: item.due
          ? `Due ${item.due}. ~${item.remaining}h left after this block.`
          : `~${item.remaining}h left after this block.`,
      });
    }

    return {
      date,
      dayOfWeek: weekdayFor(date),
      availableHours: Math.max(0, Number(availability[date]) || 0),
      tasks,
    };
  });

  const leftover = round1(queue.reduce((sum, item) => sum + item.remaining, 0));
  const deficit = Number(data.hoursDeficit);
  const warnings = [];
  if (leftover > 0) {
    warnings.push(
      `This plan leaves ~${leftover}h of work unscheduled before the listed days run out. ` +
        `Consider reducing scope, adding study time, or requesting an extension.`,
    );
  } else if (Number.isFinite(deficit) && deficit > 0) {
    warnings.push(
      `Your workload exceeds available time by ~${deficit}h. Build in buffer wherever you can.`,
    );
  }

  return {
    planOverview:
      `${obligations.length} obligation(s) across ${days.length} day(s).` +
      (data.riskLevel ? ` Risk level: ${data.riskLevel}.` : ''),
    recommendation:
      'Generated by the built-in scheduler (AI plan unavailable). Work the earliest-due and ' +
      'hardest items first, in blocks that fit each day.',
    dailyPlan,
    warnings,
    successTips: [
      'Use focused 45-minute blocks with short breaks in between.',
      'Start the highest-difficulty task while your energy is highest.',
      'Check off subtasks as you finish them to keep momentum.',
    ],
  };
}
