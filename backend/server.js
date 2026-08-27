import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import analysisRouter from './routes/analysis.js';
import planRouter from './routes/plan.js';
import { ValidationError } from './lib/validate.js';
import { isConfigured, modelName } from './services/gemini.js';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, geminiConfigured: isConfigured(), model: modelName() });
});

app.use('/api/analysis', analysisRouter);
app.use('/api/plan', planRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler: validation problems are 400, everything else is 500.
// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
app.use((err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, details: err.details });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  console.error('[server] unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`DeadlineRadar backend listening on http://localhost:${PORT}`);
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`);
  if (!isConfigured()) console.warn('WARNING: GEMINI_API_KEY is not set — /api/plan will 500.');
});
