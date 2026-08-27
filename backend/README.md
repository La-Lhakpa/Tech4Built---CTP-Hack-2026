# DeadlineRadar Backend

Express API that calculates workload risk and uses the Gemini API to generate a
day-by-day study plan. The Gemini key never leaves the server:

```
Frontend  ->  Backend  ->  Gemini API  ->  Backend  ->  Frontend
```

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then paste your own GEMINI_API_KEY
npm start                 # http://localhost:8080
```

`npm run dev` does the same with auto-restart on file changes.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | **yes** | — | Google AI Studio key. Server-side only. |
| `GEMINI_MODEL` | no | `gemini-3.6-flash` | Model id. |
| `PORT` | no | `8080` | Listen port. |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated allowed origins. |
| `PLAN_FALLBACK` | no | `false` | See [Fallback](#fallback). |

## Endpoints

### `GET /health`

```json
{ "ok": true, "geminiConfigured": true, "model": "gemini-3.6-flash" }
```

### Request body (both POST endpoints)

```json
{
  "obligations": [
    {
      "id": "123",
      "course": "Computer Science 221",
      "assignmentName": "Data Structures Project",
      "dueDate": "2026-09-01",
      "estimatedHours": 7,
      "difficulty": "High",
      "type": "Project"
    }
  ],
  "availableHoursPerDay": 2
}
```

| Field | Rule |
|---|---|
| `assignmentName` | required, non-empty |
| `dueDate` | required, real calendar date in `YYYY-MM-DD` |
| `estimatedHours` | required, number > 0 |
| `id` | optional — defaults to the 1-based array index |
| `course` | optional — defaults to `""` |
| `difficulty` | optional — `Low` / `Medium` / `High`, defaults to `Medium` |
| `type` | optional — `Assignment` / `Exam` / `Project` / `Reading` / `Other`, defaults to `Other` |
| `availableHoursPerDay` | required, number ≥ 0 |

Casing on `difficulty` and `type` is matched case-insensitively and normalized
back to the canonical spelling, so `"high"` is accepted and treated as `"High"`.
A value that is not in the list is a 400.

### `POST /api/analysis`

Pure arithmetic — no AI call, so it is instant and always available.

```json
{
  "totalRequiredHours": 17,
  "totalAvailableHours": 10,
  "deficitHours": 7,
  "planningDays": 5,
  "riskLevel": "High",
  "utilizationPercent": 170,
  "message": "7-hour deficit detected. Prioritize urgent work and adjust your capacity."
}
```

- **`planningDays`** — today through the latest `dueDate`, inclusive. At least 1.
- **`totalAvailableHours`** — `planningDays × availableHoursPerDay`.
- **`riskLevel`** — `High` when required > available; `Medium` at ≥ 80% utilization; `Low` otherwise.
- **`utilizationPercent`** — capped at `999` when there is work but zero available time.

### `POST /api/plan`

```json
{
  "generatedAt": "2026-08-27T17:57:58.648Z",
  "overview": "With a 17-hour workload squeezed into 10 available hours, this plan prioritizes ...",
  "reasoning": "Python HW 4 is scheduled first because it has the earliest deadline ...",
  "days": [
    {
      "date": "2026-08-27",
      "label": "Today",
      "totalHours": 2,
      "tasks": [
        {
          "obligationId": "3",
          "title": "Write core script functions and logic",
          "course": "Computer Science 101",
          "hours": 2,
          "note": "Focus on main algorithmic logic before addressing edge cases."
        }
      ],
      "warning": "Severe time deficit overall; request extensions immediately."
    }
  ]
}
```

`days` always contains **one entry per date** in the planning window, in order.
A day with no work has `"tasks": []` and `"totalHours": 0`. `warning` is omitted
when the day needs no caution.

Gemini writes `overview`, `reasoning`, and the task breakdown. The server
recomputes `generatedAt`, `label`, and `totalHours`, drops tasks whose
`obligationId` does not exist, and backfills days the model skipped — so the
numbers are always internally consistent.

## Errors

| Status | When | Body |
|---|---|---|
| `400` | Missing or invalid input | `{ "error": "Invalid request body.", "details": ["obligations[0].dueDate must be ..."] }` |
| `500` | Gemini unreachable, timed out, or returned unusable JSON | `{ "error": "Unable to generate the study plan." }` |
| `404` | Unknown route | `{ "error": "Not found" }` |

`details` is an extra field on 400s — ignore it if you don't need it.

## Fallback

Set `PLAN_FALLBACK=true` to make `/api/plan` return a locally computed schedule
(`200`, identical response shape) instead of a `500` when Gemini is unavailable.
Off by default so the error contract holds. Worth turning on for a live demo.

## Layout

```
backend/
├── server.js              app wiring, CORS, /health, error handler
├── routes/
│   ├── analysis.js        POST /api/analysis
│   └── plan.js            POST /api/plan
├── services/
│   ├── analysis.js        risk math (shared by both routes)
│   ├── gemini.js          prompt, API call, parsing, normalization
│   └── schedule.js        deterministic fallback scheduler
└── lib/
    ├── validate.js        request validation + normalization
    └── dates.js           UTC-safe day arithmetic and labels
```

## Manual testing

```bash
curl -s -X POST http://localhost:8080/api/analysis \
  -H 'Content-Type: application/json' -d @sample-request.json
```

`api.http` has the same requests for the VS Code REST Client extension.
