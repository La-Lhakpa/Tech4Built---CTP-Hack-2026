import './ObligationsList.css';

/**
 * Display added obligations with a delete button for each.
 */
export default function ObligationsList({ obligations, onDelete }) {
  if (obligations.length === 0) {
    return <p className="obligations-empty">No obligations yet. Add one to get started.</p>;
  }

  return (
    <div className="obligations-list">
      <h3>Obligations ({obligations.length})</h3>
      {obligations.map((ob) => (
        <div key={ob.id} className="obligation-item">
          <div className="obligation-header">
            <h4>{ob.assignmentName}</h4>
            <button
              type="button"
              className="obligation-delete"
              onClick={() => onDelete(ob.id)}
              title="Delete this obligation"
            >
              ✕
            </button>
          </div>
          <p className="obligation-meta">
            {ob.course && <span className="meta-tag">{ob.course}</span>}
            <span className="meta-tag">{ob.type}</span>
            <span className="meta-tag">{ob.difficulty}</span>
          </p>
          <p className="obligation-details">
            Due <strong>{ob.dueDate}</strong> • <strong>{ob.estimatedHours}h</strong> estimated
          </p>
        </div>
      ))}
    </div>
  );
}
