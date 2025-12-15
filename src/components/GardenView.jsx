import { useState } from 'react';
import { useAuth, TASK_STATUS } from '../contexts/AuthContext';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';
import './GardenView.css';

export function GardenView({ garden, onBack }) {
  const { userProfile } = useAuth();
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Get fresh garden data from userProfile
  const currentGarden = userProfile?.gardens?.find(g => g.name === garden.name) || garden;
  const tasks = currentGarden.tasks || [];
  
  const whackedCount = tasks.filter(t => t.status === TASK_STATUS.WHACKED).length;
  const progress = tasks.length > 0 ? (whackedCount / tasks.length) * 100 : 0;

  // Get emoji for status
  const getStatusEmoji = (status) => {
    switch (status) {
      case TASK_STATUS.UNWHACKED: return '🐹';
      case TASK_STATUS.IN_WHACKING: return '🔨';
      case TASK_STATUS.WHACKED: return '✅';
      default: return '🐹';
    }
  };

  // Format due date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', isSoon: true };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, isSoon: true };
    } else {
      return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isNormal: true };
    }
  };

  // Sort tasks: unwhacked first (by due date), then in-whacking, then whacked
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { [TASK_STATUS.UNWHACKED]: 0, [TASK_STATUS.IN_WHACKING]: 1, [TASK_STATUS.WHACKED]: 2 };
    const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    
    if (statusDiff !== 0) return statusDiff;
    
    // Within same status, sort by due date (earliest first, null last)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <div className="garden-view">
      {/* Header */}
      <div className="garden-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Gardens
        </button>
        
        <div className="garden-title-section">
          <span className="garden-title-icon">
            {progress === 100 && tasks.length > 0 ? '🏆' : '🌻'}
          </span>
          <h1>{currentGarden.name}</h1>
        </div>
        
        <div className="garden-progress">
          <span className="progress-text">
            {whackedCount}/{tasks.length} moles whacked
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Legend */}
        <div className="status-legend">
          <span className="legend-item">🐹 Unwhacked</span>
          <span className="legend-item">🔨 In Progress</span>
          <span className="legend-item">✅ Whacked</span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {sortedTasks.map((task) => {
          const dueDateInfo = formatDueDate(task.dueDate);
          const isWhacked = task.status === TASK_STATUS.WHACKED;
          
          return (
            <div 
              key={task.id} 
              className={`task-item status-${task.status}`}
            >
              <div className="task-status-icon">
                <span className="task-mole">
                  {getStatusEmoji(task.status)}
                </span>
              </div>
              
              <div className="task-content">
                <div className="task-header">
                  <h3 className="task-name">{task.name}</h3>
                  <span className={`status-badge status-${task.status}`}>
                    {task.status === TASK_STATUS.UNWHACKED && 'Unwhacked'}
                    {task.status === TASK_STATUS.IN_WHACKING && 'In Progress'}
                    {task.status === TASK_STATUS.WHACKED && 'Whacked'}
                  </span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                {dueDateInfo && !isWhacked && (
                  <p className={`task-due-date ${dueDateInfo.isOverdue ? 'overdue' : ''} ${dueDateInfo.isToday ? 'today' : ''} ${dueDateInfo.isSoon ? 'soon' : ''}`}>
                    📅 {dueDateInfo.text}
                  </p>
                )}
              </div>
              
              <button 
                className="task-edit"
                onClick={() => setEditingTask(task)}
                title="Edit mole"
              >
                ✏️
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="empty-garden">
          <div className="empty-icon">🕳️</div>
          <h2>No moles in this garden!</h2>
          <p>Click the button below to spot your first mole.</p>
        </div>
      )}

      {/* Add Task Button */}
      <button 
        className="add-task-fab"
        onClick={() => setShowAddTask(true)}
      >
        <span>🐹</span>
        <span>Spot a Mole</span>
      </button>

      {/* All Done Celebration */}
      {tasks.length > 0 && whackedCount === tasks.length && (
        <div className="all-done">
          <span className="celebration">🎉</span>
          <p>All moles whacked! You're a champion!</p>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal 
          onClose={() => setShowAddTask(false)}
          gardens={userProfile?.gardens || []}
          preselectedGarden={currentGarden.name}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          gardenName={currentGarden.name}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
