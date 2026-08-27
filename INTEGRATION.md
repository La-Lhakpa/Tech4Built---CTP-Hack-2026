# Frontend + Backend Integration Guide

Everything is wired up. Here's how to use it:

## Start both services

**Terminal 1 — Backend:**
```bash
cd backend
npm install
cp .env.example .env          # paste your GEMINI_API_KEY
npm start                     # runs on http://localhost:8080
```

**Terminal 2 — Frontend:**
```bash
cd deadline-radar
npm install
npm run dev                   # runs on http://localhost:5173
```

## How it works

### 1. User adds obligations

The `ObligationForm` component lets users enter:
- Course (optional)
- Assignment name (required)
- Due date (required, YYYY-MM-DD)
- Estimated hours (required, > 0)
- Difficulty (Low/Medium/High, defaults to Medium)
- Type (Assignment/Exam/Project/Reading/Other, defaults to Other)

Each obligation gets a unique `id` (timestamp-based).

### 2. User sets available hours per day

The `AvailabilityInput` component collects a single number that applies to
every day in the planning window (today through the latest deadline).

### 3. Frontend constructs request body

When the user clicks "Generate plan", `App.jsx` builds:

```javascript
{
  obligations: [
    {
      id: "...",
      course: "...",
      assignmentName: "...",
      dueDate: "YYYY-MM-DD",
      estimatedHours: number,
      difficulty: "Low" | "Medium" | "High",
      type: "Assignment" | "Exam" | "Project" | "Reading" | "Other"
    },
    ...
  ],
  availableHoursPerDay: number
}
```

### 4. Frontend calls backend

`src/services/planApi.js` has `requestPlan(body)`, which:
- POSTs to `http://localhost:8080/api/plan` (from `VITE_API_BASE_URL` env var)
- Returns `{ plan, source: 'gemini' | 'fallback', reason? }`

### 5. Backend generates plan

- **POST /api/plan:** calls Gemini with a carefully engineered prompt
- Gemini returns a JSON object with:
  - `overview` — 1-2 sentence summary
  - `reasoning` — why tasks are ordered this way
  - `days[]` — an array of day objects (one per date in the window)
    - Each day has `date`, `label` ("Today", "Tomorrow", weekday, etc.), `totalHours`, `tasks[]`, optional `warning`
    - Each task has `obligationId`, `title`, `course`, `hours`, `note`
- Server normalizes the response:
  - Drops hallucinated `obligationId`s
  - Fills in any skipped dates
  - Recomputes `label` and `totalHours` to be trustworthy
  - Returns the same shape every time

### 6. Frontend displays the plan

`PlanDisplay.jsx` renders:
- Plan overview and recommendation
- Per-day cards with tasks sorted by priority
- Warnings (when a day is over-capacity, when there's a deficit, etc.)
- Success tips

## Files involved

### Frontend

| File | Purpose |
|---|---|
| `src/App.jsx` | Main app: state management, form → API call → plan display |
| `src/services/planApi.js` | Thin HTTP client: `requestPlan(body)` |
| `src/components/ObligationForm.jsx` | Form to add a single obligation |
| `src/components/ObligationsList.jsx` | Display added obligations with delete buttons |
| `src/components/AvailabilityInput.jsx` | Input for availableHoursPerDay |
| `src/components/PlanDisplay.jsx` | Display the generated plan |
| `.env` | `VITE_API_BASE_URL=http://localhost:8080` |

### Backend

| File | Purpose |
|---|---|
| `server.js` | App wiring, CORS, /health, error handler |
| `routes/analysis.js` | POST /api/analysis (workload risk calculation) |
| `routes/plan.js` | POST /api/plan (Gemini-generated schedule) |
| `services/gemini.js` | Prompt building, API call, parsing, normalization |
| `services/analysis.js` | Risk math (shared by both routes) |
| `services/schedule.js` | Deterministic fallback scheduler |
| `lib/validate.js` | Request validation & normalization |
| `lib/dates.js` | UTC-safe day arithmetic and labels |
| `.env` | `GEMINI_API_KEY`, `PORT=8080`, `CORS_ORIGIN=http://localhost:3000` |

## Request/response flow

**Frontend sends:**
```json
{
  "obligations": [...],
  "availableHoursPerDay": 2
}
```

**Backend returns (on success):**
```json
{
  "generatedAt": "2026-08-27T18:00:00.000Z",
  "overview": "...",
  "reasoning": "...",
  "days": [
    {
      "date": "2026-08-27",
      "label": "Today",
      "totalHours": 2,
      "tasks": [
        {
          "obligationId": "...",
          "title": "...",
          "course": "...",
          "hours": 2,
          "note": "..."
        }
      ],
      "warning": "..." // optional
    }
  ]
}
```

**On error (400 or 500):**
```json
{ "error": "message" }
```

## Environment variables

**Frontend (deadline-radar/.env):**
- `VITE_API_BASE_URL=http://localhost:8080` — where to find the backend

**Backend (backend/.env):**
- `GEMINI_API_KEY=...` — get from https://aistudio.google.com/app/apikey
- `GEMINI_MODEL=gemini-3.6-flash` — Gemini model to use
- `PORT=8080` — listen port
- `CORS_ORIGIN=http://localhost:3000` — allowed frontend origin(s)
- `PLAN_FALLBACK=false` — serve local plan instead of 500 when Gemini down (optional)

## CORS

Backend allows requests from `http://localhost:3000` only. If your frontend
runs elsewhere (e.g., `http://localhost:5173`), update `backend/.env`:

```env
CORS_ORIGIN=http://localhost:5173
```

(Comma-separated list of origins is supported.)

## Testing without the frontend

```bash
cd backend

# Health check
curl http://localhost:8080/health

# Analysis
curl -X POST http://localhost:8080/api/analysis \
  -H 'Content-Type: application/json' \
  -d @sample-request.json

# Plan
curl -X POST http://localhost:8080/api/plan \
  -H 'Content-Type: application/json' \
  -d @sample-request.json
```

Or open `api.http` in VS Code (REST Client extension) or JetBrains.

## Troubleshooting

**Frontend can't reach backend:** check `VITE_API_BASE_URL` in `deadline-radar/.env`.

**Backend can't call Gemini:** verify `GEMINI_API_KEY` is set and valid in `backend/.env`.

**CORS errors:** check `CORS_ORIGIN` in `backend/.env` matches your frontend origin.

**Plan takes > 30 seconds:** Gemini is slow or timed out. Check the server logs.

---

You're good to go. Build away!
