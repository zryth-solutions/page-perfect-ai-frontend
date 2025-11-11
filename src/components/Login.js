import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/page_perfect_ai.png" alt="PagePerfect AI" className="login-logo" />
          <h1 className="login-title">
            Welcome to <span className="gradient-text">PagePerfect AI</span>
          </h1>
          <p className="login-subtitle">
            Professional manuscript review with unmatched accuracy
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 10.5C7.58579 10.5 7.25 10.1642 7.25 9.75V8C7.25 7.58579 7.58579 7.25 8 7.25C8.41421 7.25 8.75 7.58579 8.75 8V9.75C8.75 10.1642 8.41421 10.5 8 10.5ZM8.75 5.75C8.75 6.16421 8.41421 6.5 8 6.5C7.58579 6.5 7.25 6.16421 7.25 5.75C7.25 5.33579 7.58579 5 8 5C8.41421 5 8.75 5.33579 8.75 5.75Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-gradient login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Powered by <a href="https://zryth.com" target="_blank" rel="noopener noreferrer">Zryth Solutions</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

