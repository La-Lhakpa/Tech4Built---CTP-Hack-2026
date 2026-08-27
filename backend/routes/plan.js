import { Router } from 'express';
import { parseRequest } from '../lib/validate.js';
import { generatePlan, generateFallbackPlan } from '../services/gemini.js';

const router = Router();

/** POST /api/plan — Gemini-generated day-by-day study plan. */
router.post('/', async (req, res, next) => {
  let request;
  try {
    request = parseRequest(req.body);
  } catch (err) {
    return next(err); // 400
  }

  try {
    return res.json(await generatePlan(request));
  } catch (err) {
    console.error('[plan] Gemini failed:', err.message);

    // Opt-in safety net: serve a locally computed plan in the same shape rather
    // than failing the request. Off by default so the 500 contract holds.
    if (process.env.PLAN_FALLBACK === 'true') {
      console.warn('[plan] serving local fallback plan (PLAN_FALLBACK=true)');
      return res.json(generateFallbackPlan(request));
    }

    return res.status(500).json({ error: 'Unable to generate the study plan.' });
  }
});

export default router;
