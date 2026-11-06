import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-card">
          <div className="unauthorized-icon">⚠️</div>
          <h2>Access Restricted</h2>
          <p>
            Your current role is <strong>{user?.role}</strong>, but this section requires one of: {' '}
            <code>{allowedRoles.join(', ')}</code>.
          </p>
          <div className="unauthorized-actions">
            <Link to="/" className="btn btn-primary">Return Home</Link>
            {user?.role === 'coordinator' && (
              <Link to="/coordinator" className="btn btn-secondary">Coordinator Portal</Link>
            )}
            {user?.role === 'student' && (
              <Link to="/student" className="btn btn-secondary">Student Dashboard</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary">Admin Console</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
};
