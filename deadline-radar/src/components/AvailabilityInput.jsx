import './AvailabilityInput.css';

/**
 * Input for availableHoursPerDay (the same number applies to every day in the window).
 */
export default function AvailabilityInput({ value, onChange }) {
  return (
    <div className="availability-input">
      <label>
        <span className="label-text">Available study hours per day</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min="0"
          step="0.5"
          placeholder="2"
        />
      </label>
      <p className="availability-hint">
        How many hours per day can you dedicate to these obligations?
      </p>
    </div>
  );
}
