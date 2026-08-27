# Backend Handoff

Everything you asked for. The backend follows your spec exactly — same endpoint
names, same request format, same response fields.

## 1. Backend folder

`backend/` at the repo root, a sibling of the frontend:

```
DeadlineRadar/
├── frontend/    (yours)
└── backend/     (this)
```

## 2. Start command

```bash
cd backend
npm install
cp .env.example .env      # paste your own Gemini key into it
npm start
```

## 3. URL and port

```
http://localhost:8080
```

## 4. Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/analysis` | Workload risk calculation. No AI call — instant. |
| `POST` | `/api/plan` | Gemini-generated day-by-day study plan. |
| `GET` | `/health` | Sanity check: is the server up, is the key loaded. |

Both POST endpoints take the exact request body you specified.

## 5. Required `.env` variables

```env
GEMINI_API_KEY=your-secret-key
```

That is the only required one. Everything else has a working default:

| Variable | Default |
|---|---|
| `GEMINI_MODEL` | `gemini-3.6-flash` |
| `PORT` | `8080` |
| `CORS_ORIGIN` | `http://localhost:3000` |
| `PLAN_FALLBACK` | `false` |

**Get your own key at https://aistudio.google.com/app/apikey** — we each keep our
own. The key stays in `backend/.env`, which is gitignored. It is never sent to
the frontend.

## 6. Example `/api/analysis` response

Request:

```json
{
  "obligations": [
    { "id": "1", "course": "Computer Science 221", "assignmentName": "Data Structures Project",
      "dueDate": "2026-08-31", "estimatedHours": 8, "difficulty": "High", "type": "Project" },
    { "id": "2", "course": "Statistics 150", "assignmentName": "Midterm Exam",
      "dueDate": "2026-08-31", "estimatedHours": 6, "difficulty": "High", "type": "Exam" },
    { "id": "3", "course": "Computer Science 101", "assignmentName": "Python Homework 4",
      "dueDate": "2026-08-30", "estimatedHours": 3, "difficulty": "Medium", "type": "Assignment" }
  ],
  "availableHoursPerDay": 2
}
```

Response:

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

## 7. Example `/api/plan` response

Same request body. Real response from a live Gemini call:

```json
{
  "generatedAt": "2026-08-27T18:09:36.812Z",
  "overview": "With 17 hours of work due and only 10 hours available, this schedule prioritizes the earliest-due Python assignment while carving out dedicated time for high-risk CS and Statistics milestones.",
  "reasoning": "Python Homework 4 is tackled first because it has the earliest deadline, followed by alternating high-priority prep for the CS 221 project and Stats 150 midterm.",
  "days": [
    {
      "date": "2026-08-27",
      "label": "Today",
      "totalHours": 2,
      "tasks": [
        {
          "obligationId": "3",
          "title": "Draft core Python functions and logic",
          "course": "Computer Science 101",
          "hours": 2,
          "note": "Focus on main algorithmic structure before worrying about edge cases."
        }
      ],
      "warning": "Heavy overall deficit (7h); request an extension on CS 221 or Stats 150 early if possible."
    },
    {
      "date": "2026-08-28",
      "label": "Tomorrow",
      "totalHours": 2,
      "tasks": [
        {
          "obligationId": "3",
          "title": "Debug and finalize Python Homework 4",
          "course": "Computer Science 101",
          "hours": 1,
          "note": "Run test cases and submit early to clear time for other subjects."
        },
        {
          "obligationId": "1",
          "title": "Set up project architecture and interfaces",
          "course": "Computer Science 221",
          "hours": 1,
          "note": "Define essential data structures and class structures first."
        }
      ],
      "warning": "Full-capacity day—protect this study block."
    }
  ]
}
```

(Five days total for this input — one per date in the planning window.)

---

## Notes for wiring it up

Your `.env.local` needs only:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

A few things worth knowing:

**`days` always covers every date in the window.** One entry per date from today
through the latest `dueDate`, in order. A day with nothing scheduled comes back
as `"tasks": [], "totalHours": 0`. Filter those out if you'd rather not render
empty cards.

**`warning` is omitted, not null,** when a day needs no caution — so
`day.warning &&` works as a guard.

**`difficulty` and `type` casing is forgiving.** I match case-insensitively and
normalize back to canonical (`"high"` → `"High"`), so a casing slip won't 400
you. Genuinely unknown values (`"Extreme"`) still return 400.

**Optional request fields.** `id`, `course`, `difficulty`, and `type` all have
defaults, so partial obligations won't break. `assignmentName`, `dueDate`, and
`estimatedHours` are required.

**400s include a `details` array** naming each bad field, e.g.
`["obligations[0].dueDate must be a real date in YYYY-MM-DD form."]`. Handy while
debugging; ignore it if you don't need it.

**`planningDays`** is today through the latest due date, inclusive — minimum 1,
even if every deadline has passed. `totalAvailableHours` is
`planningDays × availableHoursPerDay`.

**One thing to decide together:** per your spec, `/api/plan` returns `500` when
Gemini is down or rate-limited. There's also a `PLAN_FALLBACK=true` env flag that
makes it return `200` with a locally computed schedule instead — same response
shape, no AI. It's **off** by default so the contract you specified holds. For
the live demo I'd suggest turning it on so a Gemini hiccup can't blank the screen.
Your call.

**Rate limit:** free tier is 60 requests/minute, so avoid firing `/api/plan` on
every keystroke. `/api/analysis` has no such limit — it's local math, so it's
safe to call on every input change.
