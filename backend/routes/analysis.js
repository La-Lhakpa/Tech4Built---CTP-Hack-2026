import { Router } from 'express';
import { parseRequest } from '../lib/validate.js';
import { analyze } from '../services/analysis.js';

const router = Router();

/** POST /api/analysis — workload risk calculation. No AI, no network. */
router.post('/', (req, res, next) => {
  let request;
  try {
    request = parseRequest(req.body);
  } catch (err) {
    return next(err);
  }

  return res.json(analyze(request));
});

export default router;
