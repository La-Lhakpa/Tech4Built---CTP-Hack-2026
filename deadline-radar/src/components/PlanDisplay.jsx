import './PlanDisplay.css';

/**
 * Renders a plan returned by requestPlan().
 *
 * @param {{
 *   plan: {
 *     planOverview?: string,
 *     recommendation?: string,
 *     dailyPlan?: Array<object>,
 *     warnings?: string[],
 *     successTips?: string[],
 *   } | null,
 *   source?: 'gemini' | 'fallback',
 *   reason?: string,
 * }} props
 */
export default function PlanDisplay({ plan, source, reason }) {
  if (!plan) return null;

  const dailyPlan = plan.dailyPlan ?? [];
  const warnings = plan.warnings ?? [];
  const successTips = plan.successTips ?? [];

  return (
    <div className="plan">
      {source === 'fallback' && (
        <p className="plan__notice">
          Showing a built-in schedule — the AI planner was unavailable
          {reason ? ` (${reason})` : ''}.
        </p>
      )}

      <header className="plan__overview">
        <h3>Plan overview</h3>
        {plan.planOverview && <p>{plan.planOverview}</p>}
        {plan.recommendation && (
          <p className="plan__recommendation">{plan.recommendation}</p>
        )}
      </header>

      <div className="plan__days">
        {dailyPlan.map((day, i) => (
          <DayCard key={day.date ?? i} day={day} />
        ))}
      </div>

      {warnings.length > 0 && (
        <section className="plan__warnings">
          <h3>⚠️ Workload warnings</h3>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {successTips.length > 0 && (
        <section className="plan__tips">
          <h3>✓ Success tips</h3>
          <ul>
            {successTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DayCard({ day }) {
  const tasks = [...(day.tasks ?? [])].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
  );
  const scheduled = round1(
    tasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0),
  );
  const available = Number(day.availableHours) || 0;
  const over = scheduled > available;

  return (
    <article className="day">
      <header className="day__head">
        <h4>{day.dayOfWeek || day.date}</h4>
        {day.dayOfWeek && day.date && <span className="day__date">{day.date}</span>}
        <span className={`day__hours${over ? ' day__hours--over' : ''}`}>
          {scheduled}h / {available}h
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="day__empty">No tasks scheduled.</p>
      ) : (
        <ol className="day__tasks">
          {tasks.map((task, i) => (
            <li key={i} className="task">
              <div className="task__row">
                <span className="task__name">{task.taskName}</span>
                <span className="task__dur">{task.duration}h</span>
              </div>
              {task.notes && <p className="task__notes">{task.notes}</p>}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

const round1 = (n) => Math.round(n * 10) / 10;
