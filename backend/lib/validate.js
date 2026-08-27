// Request validation for POST /api/analysis and POST /api/plan.
//
// Both endpoints accept the same body:
//   { obligations: [...], availableHoursPerDay: number }
//
// Casing is matched case-insensitively and normalized back to the canonical
// spelling ("high" -> "High"), so a small frontend slip does not 400. Values
// that are not in the allowed list still fail with a 400 naming the field.

export const DIFFICULTIES = ['Low', 'Medium', 'High'];
export const TYPES = ['Assignment', 'Exam', 'Project', 'Reading', 'Other'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/** Canonical spelling for `value`, or undefined when it is not in `allowed`. */
function canonicalize(allowed, value) {
  const needle = String(value).trim().toLowerCase();
  return allowed.find((option) => option.toLowerCase() === needle);
}

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Validate and normalize a request body.
 * @throws {ValidationError} with a `details` array of per-field messages.
 * @returns {{ obligations: Array<object>, availableHoursPerDay: number }}
 */
export function parseRequest(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const { obligations, availableHoursPerDay, availabilityPerDay } = body;

  if (!Array.isArray(obligations) || obligations.length === 0) {
    details.push('"obligations" must be a non-empty array.');
  }

  // Accept either simple (availableHoursPerDay: number) or detailed (availabilityPerDay: object)
  let resolvedAvailability;

  if (availabilityPerDay && typeof availabilityPerDay === 'object' && !Array.isArray(availabilityPerDay)) {
    // Per-day format: validate and use as-is
    const perDay = {};
    let hasError = false;
    for (const [date, hours] of Object.entries(availabilityPerDay)) {
      const h = Number(hours);
      if (!Number.isFinite(h) || h < 0) {
        details.push(`availabilityPerDay["${date}"] must be a number greater than or equal to 0.`);
        hasError = true;
      } else {
        perDay[date] = h;
      }
    }
    if (Object.keys(perDay).length === 0 && !hasError) {
      details.push('"availabilityPerDay" must contain at least one valid date.');
    }
    resolvedAvailability = { availabilityPerDay: perDay };
  } else {
    // Simple format: validate single number
    const hoursPerDay = Number(availableHoursPerDay);
    if (
      availableHoursPerDay === undefined ||
      availableHoursPerDay === null ||
      availableHoursPerDay === '' ||
      !Number.isFinite(hoursPerDay) ||
      hoursPerDay < 0
    ) {
      details.push('"availableHoursPerDay" must be a number greater than or equal to 0.');
    }
    resolvedAvailability = { availableHoursPerDay: hoursPerDay };
  }

  const normalized = Array.isArray(obligations)
    ? obligations.map((raw, i) => normalizeObligation(raw, i, details))
    : [];

  if (details.length > 0) {
    throw new ValidationError('Invalid request body.', details);
  }

  return { obligations: normalized, ...resolvedAvailability };
}

function normalizeObligation(raw, index, details) {
  const at = `obligations[${index}]`;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    details.push(`${at} must be an object.`);
    return null;
  }

  const assignmentName = String(raw.assignmentName ?? '').trim();
  if (!assignmentName) {
    details.push(`${at}.assignmentName is required.`);
  }

  if (!isValidDate(raw.dueDate)) {
    details.push(`${at}.dueDate must be a real date in YYYY-MM-DD form.`);
  }

  const estimatedHours = Number(raw.estimatedHours);
  if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) {
    details.push(`${at}.estimatedHours must be a number greater than 0.`);
  }

  // Optional fields fall back to a default; a value that is present but
  // unrecognized is an error rather than a silent substitution.
  let difficulty = 'Medium';
  if (raw.difficulty != null && raw.difficulty !== '') {
    const match = canonicalize(DIFFICULTIES, raw.difficulty);
    if (match) difficulty = match;
    else details.push(`${at}.difficulty must be one of: ${DIFFICULTIES.join(', ')}.`);
  }

  let type = 'Other';
  if (raw.type != null && raw.type !== '') {
    const match = canonicalize(TYPES, raw.type);
    if (match) type = match;
    else details.push(`${at}.type must be one of: ${TYPES.join(', ')}.`);
  }

  return {
    id: String(raw.id ?? index + 1),
    course: String(raw.course ?? '').trim(),
    assignmentName,
    dueDate: raw.dueDate,
    estimatedHours,
    difficulty,
    type,
  };
}
