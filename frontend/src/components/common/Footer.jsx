import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="footer-logo">
            <span className="brand-icon">🎓</span>
            <strong>CampusEvents Portal</strong>
          </div>
          <p className="footer-tagline">
            Empowering campus life through seamless event coordination, student club governance, and active community participation.
          </p>
        </div>

        <div className="footer-links-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Upcoming Events</Link></li>
            <li><Link to="/clubs">Campus Clubs</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Roles & Portals</h4>
          <ul>
            <li><Link to="/student">Student Dashboard</Link></li>
            <li><Link to="/coordinator">Club Coordinator Hub</Link></li>
            <li><Link to="/admin">Administrator Console</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} Campus Event Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
