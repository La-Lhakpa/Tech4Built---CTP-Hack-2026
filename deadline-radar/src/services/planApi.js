// Thin client for the DeadlineRadar backend (/api/plan).
// The backend holds the Gemini key and does prompt building + parsing;
// this module only sends the collision data and handles transport errors.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/+$/, '');

/**
 * @param {object} collisionData - obligations, availabilityPerDay, riskLevel, totals...
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ plan: object, source: 'gemini' | 'fallback', reason?: string }>}
 */
export async function requestPlan(collisionData, { timeoutMs = 35_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collisionData),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || `Plan request failed (${res.status})`);
    }
    if (!data?.plan) {
      throw new Error('Malformed response from the planning service.');
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The planning service took too long to respond. Please try again.', {
        cause: err,
      });
    }
    if (err instanceof TypeError) {
      // fetch network failure (backend down, CORS, offline)
      throw new Error('Could not reach the planning service. Is the backend running?', {
        cause: err,
      });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
