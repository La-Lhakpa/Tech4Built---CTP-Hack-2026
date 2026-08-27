// Workload collision analysis — pure math, no network calls.
// Powers POST /api/analysis and also feeds context into the Gemini prompt.

import { diffDays, todayISO } from '../lib/dates.js';

// Reported when there is required work but zero available time; the true ratio
// is unbounded, so it is capped at a finite value the frontend can render.
const UNBOUNDED_UTILIZATION = 999;

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * The planning window runs from today through the latest due date, inclusive.
 * Always at least one day, even when every deadline has already passed.
 */
export function planningWindow(obligations, today = todayISO()) {
  const lastDue = obligations.map((o) => o.dueDate).sort().at(-1);
  const end = lastDue && diffDays(today, lastDue) > 0 ? lastDue : today;
  return { start: today, end, days: diffDays(today, end) + 1 };
}

/**
 * @param {{ obligations: Array<object>, availableHoursPerDay?: number, availabilityPerDay?: Object }} request
 * @returns {{
 *   totalRequiredHours: number, totalAvailableHours: number, deficitHours: number,
 *   planningDays: number, riskLevel: 'Low'|'Medium'|'High',
 *   utilizationPercent: number, message: string,
 * }}
 */
export function analyze({ obligations, availableHoursPerDay, availabilityPerDay }, today = todayISO()) {
  const totalRequiredHours = round1(
    obligations.reduce((sum, o) => sum + o.estimatedHours, 0),
  );

  const { days: planningDays, start, end } = planningWindow(obligations, today);

  let totalAvailableHours;
  if (availabilityPerDay && typeof availabilityPerDay === 'object') {
    // Sum up per-day availability
    totalAvailableHours = round1(
      Object.values(availabilityPerDay).reduce((sum, h) => sum + (Number(h) || 0), 0),
    );
  } else {
    // Use simple per-day average
    totalAvailableHours = round1(planningDays * (availableHoursPerDay || 0));
  }

  const deficitHours = round1(Math.max(0, totalRequiredHours - totalAvailableHours));

  const utilizationPercent =
    totalAvailableHours > 0
      ? Math.round((totalRequiredHours / totalAvailableHours) * 100)
      : totalRequiredHours > 0
        ? UNBOUNDED_UTILIZATION
        : 0;

  const riskLevel = riskFor(totalRequiredHours, totalAvailableHours);

  return {
    totalRequiredHours,
    totalAvailableHours,
    deficitHours,
    planningDays,
    riskLevel,
    utilizationPercent,
    message: messageFor(riskLevel, deficitHours, utilizationPercent),
  };
}

function riskFor(required, available) {
  if (required <= 0) return 'Low';
  if (available <= 0 || required > available) return 'High';
  if (required >= 0.8 * available) return 'Medium';
  return 'Low';
}

function messageFor(riskLevel, deficitHours, utilizationPercent) {
  if (riskLevel === 'High') {
    return `${deficitHours}-hour deficit detected. Prioritize urgent work and adjust your capacity.`;
  }
  if (riskLevel === 'Medium') {
    return `You are using ${utilizationPercent}% of your available time. There is little room for slippage, so protect your study blocks.`;
  }
  return `Your workload fits within your available time (${utilizationPercent}% used). Stay on schedule and you will finish comfortably.`;
}
