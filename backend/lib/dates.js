// Date helpers. Everything is computed in UTC from YYYY-MM-DD strings so that
// day arithmetic is not shifted by daylight-saving transitions.

const MS_PER_DAY = 86_400_000;

/** Today as YYYY-MM-DD, in the server's local calendar. */
export function todayISO(now = new Date()) {
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function diffDays(from, to) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY,
  );
}

/** `date` shifted by `n` days, as YYYY-MM-DD. */
export function addDays(date, n) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Inclusive list of YYYY-MM-DD strings from `start` to `end`. */
export function dateRange(start, end) {
  const span = Math.max(0, diffDays(start, end));
  return Array.from({ length: span + 1 }, (_, i) => addDays(start, i));
}

/**
 * Human label for a day relative to today: "Today", "Tomorrow", a weekday name
 * within the next week, or "Mon, Sep 7" beyond that.
 */
export function dayLabel(date, today) {
  const delta = diffDays(today, date);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';

  const parsed = new Date(`${date}T00:00:00Z`);
  if (delta > 1 && delta <= 6) {
    return parsed.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  }
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
