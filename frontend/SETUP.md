# DeadlineRadar frontend — setup and backend guide

DeadlineRadar includes all three MVP screens, responsive design, validation, accessible controls, typed models, and a backend-ready API service.

## Run it locally

1. Install Node.js 22 or newer from https://nodejs.org.
2. Open a terminal in this project folder.
3. Install the packages:

   ```bash
   npm install
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

The demo works immediately. Add an obligation, adjust daily hours, open **Risk radar**, and select **Build my Gemini plan**.

## Connect the backend

1. Copy `.env.example` to a new file named `.env.local`.
2. Set your backend origin:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

3. Restart the development server.

All requests are centralized in `services/api.ts`. The frontend calls `POST /api/analysis` and `POST /api/plan`. Both receive:

```json
{
  "obligations": [
    {
      "id": "string",
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

The response interfaces are `AnalysisResult` and `StudyPlan` in `lib/types.ts`. If the backend is offline or not configured, `lib/planner.ts` supplies the demo fallback.

## Commands

```bash
npm run dev      # start local development
npm run build    # production build and TypeScript check
npm run lint     # code-quality check
```

## Folder guide

```text
app/
  layout.tsx                 shared layout and metadata
  page.tsx                   main route and social metadata
  site.css                   Tailwind and custom styles
components/
  add-obligation-form.tsx
  availability-hours-input.tsx
  collision-dashboard.tsx
  deadline-radar-root.tsx
  plan-display.tsx
lib/
  planner.ts                 local collision/demo-plan logic
  types.ts                   TypeScript interfaces
services/
  api.ts                     central backend API service
public/
  og.png                     social sharing image
```

React Router uses hash routes (`#/`, `#/dashboard`, `#/plan`) so direct navigation works on simple static hosts without special rewrite rules.
