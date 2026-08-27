import { useState } from 'react';
import './ObligationForm.css';

/**
 * Form to add a single obligation. Calls onAdd(obligation) when the user clicks Add.
 */
export default function ObligationForm({ onAdd }) {
  const [form, setForm] = useState({
    course: '',
    assignmentName: '',
    dueDate: '',
    estimatedHours: '2',
    difficulty: 'Medium',
    type: 'Assignment',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAdd = () => {
    if (!form.assignmentName.trim()) {
      setError('Assignment name is required.');
      return;
    }
    if (!form.dueDate) {
      setError('Due date is required.');
      return;
    }
    const hours = Number(form.estimatedHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError('Estimated hours must be a number greater than 0.');
      return;
    }

    onAdd({
      id: `${Date.now()}`, // simple id; backend doesn't require a specific format
      course: form.course,
      assignmentName: form.assignmentName.trim(),
      dueDate: form.dueDate,
      estimatedHours: hours,
      difficulty: form.difficulty,
      type: form.type,
    });

    // Reset the form
    setForm({
      course: '',
      assignmentName: '',
      dueDate: '',
      estimatedHours: '2',
      difficulty: 'Medium',
      type: 'Assignment',
    });
  };

  return (
    <fieldset className="obligation-form">
      <legend>Add an obligation</legend>

      <div className="form-row">
        <label>
          Course (optional)
          <input
            type="text"
            name="course"
            value={form.course}
            onChange={handleChange}
            placeholder="e.g., CS 221"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Assignment name *
          <input
            type="text"
            name="assignmentName"
            value={form.assignmentName}
            onChange={handleChange}
            placeholder="e.g., Data Structures Project"
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Due date *
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Estimated hours *
          <input
            type="number"
            name="estimatedHours"
            value={form.estimatedHours}
            onChange={handleChange}
            min="0.5"
            step="0.5"
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            <option>Assignment</option>
            <option>Exam</option>
            <option>Project</option>
            <option>Reading</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="button" className="form-add-btn" onClick={handleAdd}>
        Add obligation
      </button>
    </fieldset>
  );
}
