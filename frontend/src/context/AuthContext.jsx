import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('campus_event_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount if token exists
  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('campus_event_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getCurrentUser();
      if (res && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.warn('Session verification failed:', err.response?.data?.message || err.message);
      localStorage.removeItem('campus_event_token');
      localStorage.removeItem('campus_event_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res && res.data) {
      const { user: loggedInUser, token: authToken } = res.data;
      localStorage.setItem('campus_event_token', authToken);
      localStorage.setItem('campus_event_user', JSON.stringify(loggedInUser));
      setToken(authToken);
      setUser(loggedInUser);
      return loggedInUser;
    }
    throw new Error(res?.message || 'Login failed');
  };

  // Register handler
  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    if (res && res.data) {
      const { user: registeredUser, token: authToken } = res.data;
      localStorage.setItem('campus_event_token', authToken);
      localStorage.setItem('campus_event_user', JSON.stringify(registeredUser));
      setToken(authToken);
      setUser(registeredUser);
      return registeredUser;
    }
    throw new Error(res?.message || 'Registration failed');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('campus_event_token');
    localStorage.removeItem('campus_event_user');
    setUser(null);
    setToken(null);
  };

  // Profile update handler
  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    if (res && res.data) {
      setUser(prev => ({ ...prev, ...res.data }));
      return res.data;
    }
    throw new Error(res?.message || 'Profile update failed');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordinator',
    isStudent: user?.role === 'student',
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
