import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { ClubsPage } from './pages/ClubsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

import './index.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="app-main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/clubs" element={<ClubsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Student Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Coordinator Routes */}
                <Route
                  path="/coordinator"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <CoordinatorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
