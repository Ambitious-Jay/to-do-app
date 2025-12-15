import { useState } from 'react';
import { useAuth, TASK_STATUS } from '../contexts/AuthContext';
import { AddTaskModal } from './AddTaskModal';
import { GardenView } from './GardenView';
import './TasksPage.css';

export function TasksPage({ onBack }) {
  const { userProfile, deleteGarden } = useAuth();
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState(null);

  const gardens = userProfile?.gardens || [];
  
  // Count total tasks across all gardens
  const totalMoles = gardens.reduce((sum, garden) => sum + garden.tasks.length, 0);
  const whackedMoles = gardens.reduce(
    (sum, garden) => sum + garden.tasks.filter(t => t.status === TASK_STATUS.WHACKED).length, 
    0
  );

  const handleDeleteGarden = async (gardenName, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${gardenName}" garden and all its moles? This mole hole will be filled in forever! 🕳️`)) {
      await deleteGarden(gardenName);
    }
  };

  // Get status emoji for mini mole display
  const getStatusEmoji = (status) => {
    switch (status) {
      case TASK_STATUS.WHACKED:
        return '✅';
      case TASK_STATUS.IN_WHACKING:
        return '🔨';
      default:
        return '🐹';
    }
  };

  // If a garden is selected, show the garden view
  if (selectedGarden) {
    return (
      <GardenView 
        garden={selectedGarden} 
        onBack={() => setSelectedGarden(null)}
        onAddTask={() => setShowAddTask(true)}
      />
    );
  }

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Burrow
        </button>
        <div className="tasks-title">
          <h1>🌻 My Gardens</h1>
          <p className="tasks-subtitle">
            {totalMoles === 0 
              ? "No moles spotted yet! Start tracking some tasks 🐹" 
              : `${whackedMoles}/${totalMoles} moles whacked!`}
          </p>
        </div>
        <p className="tasks-hint">
          Each garden helps you organize your moles by category (Work, Personal, Shopping, etc.)
        </p>
      </div>

      {/* Gardens Grid */}
      <div className="gardens-grid">
        {gardens.map((garden) => {
          const gardenWhacked = garden.tasks.filter(t => t.status === TASK_STATUS.WHACKED).length;
          const gardenTotal = garden.tasks.length;
          const progress = gardenTotal > 0 ? (gardenWhacked / gardenTotal) * 100 : 0;
          
          return (
            <div 
              key={garden.name} 
              className="garden-card"
              onClick={() => setSelectedGarden(garden)}
            >
              <button 
                className="delete-garden-btn"
                onClick={(e) => handleDeleteGarden(garden.name, e)}
                title="Delete garden"
              >
                ×
              </button>
              
              <div className="garden-icon">
                {progress === 100 && gardenTotal > 0 ? '🏆' : '🌻'}
              </div>
              <h3 className="garden-name">{garden.name}</h3>
              <div className="garden-stats">
                <span className="task-count">
                  {gardenTotal === 0 
                    ? 'No moles here yet' 
                    : `${gardenWhacked}/${gardenTotal} moles whacked`}
                </span>
              </div>
              <div className="garden-progress-bar">
                <div 
                  className="garden-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="garden-moles">
                {garden.tasks.slice(0, 3).map((task) => (
                  <span 
                    key={task.id} 
                    className={`mini-mole ${task.status === TASK_STATUS.WHACKED ? 'whacked' : ''}`}
                    title={task.name}
                  >
                    {getStatusEmoji(task.status)}
                  </span>
                ))}
                {garden.tasks.length > 3 && (
                  <span className="more-moles">+{garden.tasks.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Task Card */}
        <div 
          className="garden-card add-garden-card"
          onClick={() => setShowAddTask(true)}
        >
          <div className="garden-icon">🐹</div>
          <h3 className="garden-name">Spot a Mole</h3>
          <p className="add-garden-hint">Add a new task to track</p>
        </div>
      </div>

      {/* Empty State */}
      {gardens.length === 0 && (
        <div className="empty-state">
          <div className="empty-mole">🐹</div>
          <h2>No gardens yet!</h2>
          <p>Click "Spot a Mole" to create your first garden and start tracking tasks to whack!</p>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal 
          onClose={() => setShowAddTask(false)}
          gardens={gardens}
        />
      )}
    </div>
  );
}
