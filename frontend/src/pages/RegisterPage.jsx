import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password) {
      return setErrorMsg('All fields are required.');
    }

    if (password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }

    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match.');
    }

    try {
      setSubmitting(true);
      const user = await register(name.trim(), email.trim(), password);
      showToast(`Account created successfully! Welcome, ${user.name}!`, 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🎓</span>
          <h2>Join CampusEvents</h2>
          <p>Register as a student to explore and attend campus happenings</p>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-danger" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Alex Johnson"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Campus Email Address *</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              placeholder="e.g. alex@campus.edu"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password (min 6 characters) *</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm Password *</label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-block btn-lg auth-submit-btn"
          >
            {submitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
