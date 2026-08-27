import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import planRouter from './routes/plan.js';

const app = express();
const PORT = process.env.PORT || 5000;
    
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({
    ok: true,
    geminiConfigured: Boolean(key && key !== 'your_api_key_here'),
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  });
});

app.use('/api/plan', planRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`DeadlineRadar backend listening on http://localhost:${PORT}`);
});
