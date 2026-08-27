// Deterministic scheduler. Produces the same `days` shape as the Gemini plan,
// so the frontend renders it identically. Used as the fallback when the model
// is unavailable and PLAN_FALLBACK is enabled.

import { dateRange, dayLabel, todayISO } from '../lib/dates.js';
import { planningWindow } from './analysis.js';

const DIFFICULTY_RANK = { High: 0, Medium: 1, Low: 2 };

const round1 = (n) => Math.round(n * 10) / 10;

export function buildSchedule({ obligations, availableHoursPerDay }, today = todayISO()) {
  const { start, end } = planningWindow(obligations, today);

  // Earliest due first, hardest first within the same day.
  const queue = obligations
    .map((o) => ({ ...o, remaining: o.estimatedHours }))
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1),
    );

  const days = dateRange(start, end).map((date) => {
    let capacity = availableHoursPerDay;
    const tasks = [];

    for (const item of queue) {
      if (capacity <= 0) break;
      if (item.remaining <= 0) continue;
      if (date > item.dueDate) continue; // deadline already passed

      const hours = round1(Math.min(capacity, item.remaining));
      if (hours <= 0) continue;

      item.remaining = round1(item.remaining - hours);
      capacity = round1(capacity - hours);

      tasks.push({
        obligationId: item.id,
        title: item.assignmentName,
        course: item.course,
        hours,
        note:
          item.remaining > 0
            ? `Work the next block; about ${item.remaining}h remain before ${item.dueDate}.`
            : `Final block — wrap this up and submit before ${item.dueDate}.`,
      });
    }

    return { date, tasks };
  });

  const unscheduled = round1(queue.reduce((sum, item) => sum + item.remaining, 0));

  return {
    overview: overviewFor(obligations, days, unscheduled),
    reasoning:
      'Tasks were ordered by due date, then by difficulty, and split into blocks that fit each ' +
      'day\'s available hours. Nothing is scheduled after its deadline.',
    days,
    unscheduledHours: unscheduled,
  };
}

function overviewFor(obligations, days, unscheduled) {
  const scheduled = round1(
    days.reduce(
      (sum, day) => sum + day.tasks.reduce((inner, task) => inner + task.hours, 0),
      0,
    ),
  );
  const base = `${obligations.length} obligation(s) laid out across ${days.length} day(s), with ${scheduled}h of study time scheduled.`;
  return unscheduled > 0
    ? `${base} About ${unscheduled}h could not be placed before the deadlines.`
    : `${base} Everything fits within the time available.`;
}

/** Re-export for callers that only need the label helper alongside a schedule. */
export { dayLabel };
