import { useState } from 'react';
import { requestPlan } from './services/planApi';
import ObligationForm from './components/ObligationForm';
import ObligationsList from './components/ObligationsList';
import AvailabilityInput from './components/AvailabilityInput';
import PlanDisplay from './components/PlanDisplay';
import './App.css';

function App() {
  const [obligations, setObligations] = useState([]);
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(2);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddObligation = (obligation) => {
    setObligations((prev) => [...prev, obligation]);
  };

  const handleDeleteObligation = (id) => {
    setObligations((prev) => prev.filter((o) => o.id !== id));
  };

  const handleGeneratePlan = async () => {
    if (obligations.length === 0) {
      setError('Add at least one obligation to generate a plan.');
      return;
    }

    setLoading(true);
    setError('');
    setPlan(null);

    try {
      const result = await requestPlan({
        obligations,
        availableHoursPerDay,
      });
      setPlan(result);
    } catch (err) {
      setError(err.message || 'Failed to generate the plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setObligations([]);
    setAvailableHoursPerDay(2);
    setPlan(null);
    setError('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>DeadlineRadar</h1>
        <p>Know when your deadlines don't fit. Plan before you fall behind.</p>
      </header>

      {!plan ? (
        <section className="input-section">
          <div className="input-container">
            <ObligationForm onAdd={handleAddObligation} />
            <ObligationsList obligations={obligations} onDelete={handleDeleteObligation} />
            <AvailabilityInput value={availableHoursPerDay} onChange={setAvailableHoursPerDay} />

            {error && <p className="error-banner">{error}</p>}

            <div className="action-buttons">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGeneratePlan}
                disabled={loading || obligations.length === 0}
              >
                {loading ? 'Generating plan...' : 'Generate plan'}
              </button>
              {obligations.length > 0 && (
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="plan-section">
          <div className="plan-header">
            <h2>Your study plan</h2>
            <button type="button" className="btn-back" onClick={handleReset}>
              ← Start over
            </button>
          </div>
          <PlanDisplay plan={plan.plan} source={plan.source} reason={plan.reason} />
        </section>
      )}
    </div>
  );
}

export default App;
