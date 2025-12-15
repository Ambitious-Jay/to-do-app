import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { AuthModal } from './components/AuthModal'
import { TasksPage } from './components/TasksPage'
import './App.css'

function App() {
  const { currentUser, userProfile, logout } = useAuth();
  const [authModal, setAuthModal] = useState(null); // 'signup' | 'signin' | null
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'tasks'
  const [moleMessage, setMoleMessage] = useState("You can't catch me!");

  const moleMessages = [
    "You can't catch me!",
    "Tasks fear me!",
    "Whack your worries!",
    "I'm too fast!",
    "Productivity? Never heard of it!",
    "Try and stop me!",
    "Your to-dos are TOAST!",
  ];

  const loggedInMessages = [
    "Welcome back, whacker!",
    "Ready to smash tasks?",
    "Let's get productive!",
    "Time to whack!",
    "Missed you! 🔨",
  ];

  const handleMoleClick = () => {
    const messages = currentUser ? loggedInMessages : moleMessages;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMoleMessage(randomMessage);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('home');
      setMoleMessage("See ya later! 👋");
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Count total tasks across all gardens
  const getTotalTasks = () => {
    if (!userProfile?.gardens) return 0;
    return userProfile.gardens.reduce((sum, garden) => sum + garden.tasks.length, 0);
  };

  // If showing tasks page
  if (currentUser && userProfile && currentPage === 'tasks') {
    return <TasksPage onBack={() => setCurrentPage('home')} />;
  }

  // If user is logged in, show welcome/dashboard
  if (currentUser && userProfile) {
    return (
      <div className="home-container">
        {/* Floating decorations */}
        <span className="decoration worm">🪱</span>
        <span className="decoration carrot">🥕</span>
        <span className="decoration shovel">⛏️</span>

        {/* Title */}
        <div className="title-section">
          <h1 className="main-title">
            <span className="hammer">🔨</span> Whack-A-Task
          </h1>
          <p className="tagline">Welcome back, {userProfile.username}!</p>
        </div>

        {/* Mole Character */}
        <div className="mole-container">
          <div className="speech-bubble">{moleMessage}</div>
          <div className="mole" onClick={handleMoleClick}>
            🐹
          </div>
          <div className="mole-hole"></div>
        </div>

        {/* Logged In State */}
        <div className="auth-buttons">
          <div className="user-info">
            <p className="user-greeting">🎯 Ready to whack some tasks?</p>
            <p className="user-email">{userProfile.email}</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentPage('tasks')}
          >
            🌻 View My Gardens ({userProfile.gardens?.length || 0})
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>

      {/* Fun footer */}
      <div className="fun-facts">
        <div className="emoji-row">🔨 🐹 ✅ 🎯 💪</div>
        <p>Moles spotted: {getTotalTasks()}</p>
      </div>
    </div>
  );
  }

  // Not logged in - show landing page
  return (
    <div className="home-container">
      {/* Floating decorations */}
      <span className="decoration worm">🪱</span>
      <span className="decoration carrot">🥕</span>
      <span className="decoration shovel">⛏️</span>

      {/* Title */}
      <div className="title-section">
        <h1 className="main-title">
          <span className="hammer">🔨</span> Whack-A-Task
        </h1>
        <p className="tagline">Smash your to-dos into oblivion!</p>
      </div>

      {/* Mole Character */}
      <div className="mole-container">
        <div className="speech-bubble">{moleMessage}</div>
        <div className="mole" onClick={handleMoleClick}>
          🐹
        </div>
        <div className="mole-hole"></div>
      </div>

      {/* Auth Buttons */}
      <div className="auth-buttons">
        <button 
          className="btn btn-primary"
          onClick={() => setAuthModal('signup')}
        >
          🌱 Sign Up & Start Whacking!
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setAuthModal('signin')}
        >
          🕳️ Sign In
        </button>
      </div>

      {/* Fun footer */}
      <div className="fun-facts">
        <div className="emoji-row">🔨 🐹 ✅ 🎯 💪</div>
        <p>No moles were harmed in the making of this app.</p>
        <p>(Tasks, however, are fair game.)</p>
      </div>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={() => setAuthModal(authModal === 'signup' ? 'signin' : 'signup')}
        />
      )}
    </div>
  );
}

export default App
