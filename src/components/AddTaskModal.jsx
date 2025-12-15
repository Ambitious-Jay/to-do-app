import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CustomDropdown } from './CustomDropdown';
import './AddTaskModal.css';

export function AddTaskModal({ onClose, gardens, preselectedGarden = null }) {
  const { addTask, addGarden } = useAuth();
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedGarden, setSelectedGarden] = useState(preselectedGarden || '');
  const [newGardenName, setNewGardenName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAddingNewGarden = selectedGarden === '__new__';

  // Build dropdown options
  const dropdownOptions = [
    ...gardens.map(garden => ({
      value: garden.name,
      label: garden.name,
      icon: garden.tasks.length > 0 ? '🌱' : '🌾',
      count: garden.tasks.length
    })),
    {
      value: '__new__',
      label: 'Create New Garden...',
      icon: '➕',
      isSpecial: true
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let gardenName = selectedGarden;
      let updatedGardens = null;

      // If creating a new garden
      if (isAddingNewGarden) {
        if (!newGardenName.trim()) {
          setError('Please enter a garden name.');
          setIsSubmitting(false);
          return;
        }

        // Check if garden already exists
        if (gardens.some(g => g.name.toLowerCase() === newGardenName.trim().toLowerCase())) {
          setError('A garden with this name already exists!');
          setIsSubmitting(false);
          return;
        }

        // Create the garden and get the updated gardens array
        updatedGardens = await addGarden(newGardenName.trim());
        gardenName = newGardenName.trim();
      }

      if (!gardenName || gardenName === '__new__') {
        setError('Please select or create a garden.');
        setIsSubmitting(false);
        return;
      }

      if (!taskName.trim()) {
        setError('Please give this mole a name.');
        setIsSubmitting(false);
        return;
      }

      // Pass the updated gardens if we just created one
      await addTask(gardenName, taskName.trim(), taskDescription.trim(), dueDate || null, updatedGardens);
      onClose();
    } catch (err) {
      setError('Failed to add mole. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGardenChange = (value) => {
    setSelectedGarden(value);
    if (value !== '__new__') {
      setNewGardenName('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content add-task-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">🐹</span>
          <h2>Spot a New Mole</h2>
          <p className="modal-subtitle">Add a task to whack later!</p>
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
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
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
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add some details about this sneaky mole..."
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate">Due Date 📅 (optional)</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              className="date-input"
            />
          </div>

          {/* Garden Selection - Custom Dropdown */}
          <div className="form-group">
            <label>Which Garden? 🌻</label>
            <CustomDropdown
              options={dropdownOptions}
              value={selectedGarden}
              onChange={handleGardenChange}
              placeholder="-- Select a garden --"
              disabled={isSubmitting}
            />
          </div>

          {/* New Garden Input - Only shows when "Create New Garden" is selected */}
          {isAddingNewGarden && (
            <div className="form-group new-garden-group">
              <label htmlFor="newGardenName">New Garden Name</label>
              <input
                type="text"
                id="newGardenName"
                value={newGardenName}
                onChange={(e) => setNewGardenName(e.target.value)}
                placeholder="e.g., Work, Personal, Shopping"
                disabled={isSubmitting}
                maxLength={50}
                autoFocus
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner">🔨</span>
            ) : (
              '🔨 Track This Mole!'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
