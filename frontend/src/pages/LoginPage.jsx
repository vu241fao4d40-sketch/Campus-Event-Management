import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      return setErrorMsg('Please enter both email and password.');
    }

    try {
      setSubmitting(true);
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.name}!`, 'success');

      // Redirect to previous intended page or role dashboard
      const targetFrom = location.state?.from?.pathname;
      if (targetFrom) {
        navigate(targetFrom, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'coordinator') {
        navigate('/coordinator', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🎓</span>
          <h2>Sign in to CampusEvents</h2>
          <p>Access your registrations, club activities, and campus updates</p>
        </div>

        {isExpired && (
          <div className="alert-banner alert-warning" role="alert">
            Your session has expired. Please sign in again.
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner alert-danger" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              autoFocus
              placeholder="e.g. student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-block btn-lg auth-submit-btn"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
