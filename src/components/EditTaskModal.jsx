import { useState } from 'react';
import { useAuth, TASK_STATUS } from '../contexts/AuthContext';
import './EditTaskModal.css';

export function EditTaskModal({ task, gardenName, onClose }) {
  const { updateTask, deleteTask } = useAuth();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status || TASK_STATUS.UNWHACKED);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        setError('Please enter a mole name.');
        setIsSubmitting(false);
        return;
      }

      await updateTask(gardenName, task.id, {
        name: name.trim(),
        description: description.trim(),
        status,
        dueDate: dueDate || null
      });
      
      onClose();
    } catch (err) {
      setError('Failed to update mole. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Remove "${task.name}" from your garden? 🗑️`)) {
      setIsSubmitting(true);
      try {
        await deleteTask(gardenName, task.id);
        onClose();
      } catch (err) {
        setError('Failed to delete mole.');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusEmoji = (s) => {
    switch (s) {
      case TASK_STATUS.UNWHACKED: return '🐹';
      case TASK_STATUS.IN_WHACKING: return '🔨';
      case TASK_STATUS.WHACKED: return '✅';
      default: return '🐹';
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content edit-task-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">✏️</span>
          <h2>Edit Mole</h2>
          <p className="modal-subtitle">Update this sneaky critter's details</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Task Name */}
          <div className="form-group">
            <label htmlFor="taskName">Mole Name 🐹</label>
            <input
              type="text"
              id="taskName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs whacking?"
              required
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          {/* Task Description */}
          <div className="form-group">
            <label htmlFor="taskDescription">Details (optional)</label>
            <textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details about this sneaky mole..."
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate">Due Date 📅</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              className="date-input"
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <div className="status-options">
              {Object.values(TASK_STATUS).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-option ${status === s ? 'selected' : ''} status-${s}`}
                  onClick={() => setStatus(s)}
                  disabled={isSubmitting}
                >
                  <span className="status-emoji">{getStatusEmoji(s)}</span>
                  <span className="status-label">
                    {s === TASK_STATUS.UNWHACKED && 'Unwhacked'}
                    {s === TASK_STATUS.IN_WHACKING && 'In Progress'}
                    {s === TASK_STATUS.WHACKED && 'Whacked'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="button-row">
            <button 
              type="submit" 
              className="btn-submit btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-spinner">🔨</span>
              ) : (
                '💾 Save Changes'
              )}
            </button>
            
            {status === TASK_STATUS.WHACKED && (
              <button 
                type="button" 
                className="btn-delete"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                🗑️ Delete Mole
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

