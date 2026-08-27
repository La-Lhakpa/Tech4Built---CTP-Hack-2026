# Per-Day Availability Feature

Users can now set different study hours for each day, not just a blanket "2 hours every day."

## How it works

### Frontend: `AvailabilityHoursInput` component
- **Simple mode** (default): Single slider for all days
- **Detailed mode**: Individual input for each day in the planning window
  - Click "Customize per day" to expand
  - Shows all dates from today through latest deadline
  - "Copy" button to copy previous day's value (fast fill)
  - "Reset all" to revert to simple mode value
  - Real-time total hours calculation

### Backend: Accepts both formats
Frontend can send EITHER:
```json
// Simple format (all days the same)
{ "obligations": [...], "availableHoursPerDay": 2 }

// Detailed format (per-day, e.g., work shift Wednesday)
{ "obligations": [...], "availabilityPerDay": {
    "2026-08-27": 2,
    "2026-08-28": 2,
    "2026-08-29": 0,
    "2026-08-30": 3
  }
}
```

Backend automatically:
- Sums per-day hours for total available
- Calculates risk based on total
- Sends per-day breakdown to Gemini so it respects daily capacity
- Returns same response format regardless of input format

## Example: Work shift Wednesday

Student adds obligations, sets hours:
- **Simple**: 2 hours/day
- **Switch to detailed**: Customize per day
  - Mon-Tue: 2h (study time before work)
  - Wed: 0h (full work shift)
  - Thu-Fri: 2h (study time)
  - Sat: 4h (weekend catch-up)

Total: 12h available (vs 14h if no work shift)

Backend calculates:
- Adjusted risk based on real 12h (not 14h)
- Gemini plan respects Wed with 0h — no tasks scheduled
- Friday gets safety-net task in case Thursday overruns

## Testing

**Simple format (backward compatible):**
```bash
curl -X POST http://localhost:8080/api/plan \
  -H 'Content-Type: application/json' \
  -d '{
    "obligations": [...],
    "availableHoursPerDay": 2
  }'
```

**Detailed format (per-day):**
```bash
curl -X POST http://localhost:8080/api/plan \
  -H 'Content-Type: application/json' \
  -d '{
    "obligations": [...],
    "availabilityPerDay": {
      "2026-08-27": 1,
      "2026-08-28": 1,
      "2026-08-29": 0,
      "2026-08-30": 4
    }
  }'
```

Both `/api/analysis` and `/api/plan` support both formats.

## Frontend integration

Everything is already wired:
1. User sets availability in `AvailabilityHoursInput` (simple or detailed mode)
2. `onPerDayChange` callback updates state
3. `generateStudyPlan()` sends `availabilityPerDay` if detailed mode is active
4. Backend respects per-day capacity
5. Frontend displays plan, warnings highlight any over-allocated days

## Benefits

✓ Realistic scheduling (work shifts, classes, other commitments)
✓ Better risk analysis (actual available time, not assumed uniform)
✓ Smarter Gemini plans (respects daily constraints)
✓ Backward compatible (simple mode still works)
✓ Faster entry for complex schedules (copy button)

## Next steps

- Monitor Gemini quality — still sees constraints as soft suggestions sometimes
- Could add "recurring activities" pattern (e.g., "Wed always 0h" applies to every week)
- Export plan to calendar with actual time blocks per day
