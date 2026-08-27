import { Router } from 'express';
import { generatePlan, createFallbackPlan } from '../services/gemini.js';

const router = Router();

/**
 * POST /api/plan
 * Body: collisionData (see backend/sample-request.json)
 * Response: { plan, source: 'gemini' | 'fallback', reason? }
 */
router.post('/', async (req, res) => {
  const data = req.body ?? {};

  if (!Array.isArray(data.obligations) || data.obligations.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty "obligations" array.' });
  }
  if (!data.availabilityPerDay || typeof data.availabilityPerDay !== 'object') {
    return res
      .status(400)
      .json({ error: 'Body must include an "availabilityPerDay" object keyed by date.' });
  }

  try {
    const result = await generatePlan(withDerivedTotals(data));
    return res.json(result);
  } catch (err) {
    // generatePlan is designed not to throw, but guard the endpoint anyway.
    console.error('[plan] unexpected error:', err);
    return res.status(200).json({
      plan: createFallbackPlan(data),
      source: 'fallback',
      reason: 'unexpected server error',
    });
  }
});

/**
 * Fill in the summary fields the AI prompt expects when the caller did not
 * run collision detection itself. These are conveniences, not a replacement
 * for the real collision engine.
 */
function withDerivedTotals(data) {
  const totalRequired =
    data.totalRequired ??
    data.obligations.reduce((sum, o) => sum + (Number(o.estimatedHours) || 0), 0);

  const totalAvailable =
    data.totalAvailable ??
    Object.values(data.availabilityPerDay).reduce((sum, h) => sum + (Number(h) || 0), 0);

  const hoursDeficit = data.hoursDeficit ?? Math.max(0, totalRequired - totalAvailable);
  const riskLevel = data.riskLevel ?? deriveRisk(totalRequired, totalAvailable);

  return { ...data, totalRequired, totalAvailable, hoursDeficit, riskLevel };
}

function deriveRisk(required, available) {
  if (available <= 0) return 'HIGH';
  const ratio = required / available;
  if (ratio > 1) return 'HIGH';
  if (ratio >= 0.8) return 'MEDIUM';
  return 'LOW';
}

export default router;
