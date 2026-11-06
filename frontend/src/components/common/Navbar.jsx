import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleVariant = (role) => {
    if (role === 'admin') return 'danger';
    if (role === 'coordinator') return 'warning';
    return 'primary';
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">
            Campus<span className="brand-accent">Events</span>
          </span>
        </Link>

        {/* Mobile toggle button */}
        <button 
          className="mobile-nav-toggle" 
          onClick={() => setMenuOpen(!menuOpen)} 
          aria-label="Toggle navigation"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation items */}
        <nav className={`navbar-nav ${menuOpen ? 'is-open' : ''}`}>
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Events
          </NavLink>
          <NavLink 
            to="/clubs" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Clubs
          </NavLink>

          {isAuthenticated && user?.role === 'student' && (
            <NavLink 
              to="/student" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              My Dashboard
            </NavLink>
          )}

          {isAuthenticated && (user?.role === 'coordinator' || user?.role === 'admin') && (
            <NavLink 
              to="/coordinator" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Coordinator Hub
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Admin Console
            </NavLink>
          )}

          <div className="navbar-auth-actions">
            {isAuthenticated ? (
              <div className="user-profile-menu">
                <span className="user-greeting">
                  <strong>{user.name}</strong>
                  <Badge variant={getRoleVariant(user.role)} className="user-role-badge">
                    {user.role}
                  </Badge>
                </span>
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="guest-actions">
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
