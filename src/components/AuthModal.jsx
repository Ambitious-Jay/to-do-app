import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

export function AuthModal({ mode, onClose, onSwitchMode }) {
  const [email, setEmail] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, login, error, setError } = useAuth();

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isSignUp) {
        // Validate username
        if (username.length < 3) {
          setError('Username must be at least 3 characters.');
          setIsSubmitting(false);
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('Username can only contain letters, numbers, and underscores.');
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, username);
      } else {
        await login(emailOrUsername, password);
      }
      onClose();
    } catch (err) {
      // Error is handled in AuthContext
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">{isSignUp ? '🌱' : '🕳️'}</span>
          <h2>{isSignUp ? 'Join the Whacking!' : 'Welcome Back, Whacker!'}</h2>
          <p className="modal-subtitle">
            {isSignUp 
              ? 'Create an account to start smashing tasks' 
              : 'Sign in to continue your rampage'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="MoleWhacker42"
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          {isSignUp ? (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="whacker@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="emailOrUsername">Email or Username</label>
              <input
                type="text"
                id="emailOrUsername"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="whacker@example.com or MoleWhacker42"
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className={`btn-submit ${isSignUp ? 'btn-primary' : 'btn-secondary'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner">🔨</span>
            ) : (
              isSignUp ? '🔨 Start Whacking!' : '🔨 Let\'s Go!'
            )}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchMode}
              disabled={isSubmitting}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
