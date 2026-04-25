import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';
import './App.css';

import Login from './Login';
import GithubAuthCallback from './GithubAuthCallback';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import { SITE_BRAND } from './siteConfig';
import TicketPage from './pages/tickets/TicketPage';
import TicketDetailsPage from './pages/tickets/TicketDetailsPage';
import AdminTicketManagementPage from './pages/tickets/AdminTicketManagementPage';
import AdminResourceForm from './pages/features/AdminResourceForm';
import ResourceDetail from './pages/features/ResourceDetail';
import FacilitiesCatalogue from './pages/features/FacilitiesCatalogue';
import TechnicianWorkspacePage from './pages/technician/TechnicianWorkspacePage';
import CreateBooking from './pages/bookings/CreateBooking';
import ProtectedRoute from './components/ProtectedRoute';
import MyBookings from './pages/bookings/MyBookings';
import BookingDetail from './pages/bookings/BookingDetail';
import HomePage from './pages/HomePage';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '561676533130-h2qmjsddoohsufv7ojl5pmb507e0or6e.apps.googleusercontent.com';

export default function App() {
  useEffect(() => {
    document.title = SITE_BRAND.name;
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/github/callback" element={<GithubAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/facilities" element={<FacilitiesCatalogue />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route path="/tickets" element={<TicketPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
            <Route path="/technician/workspace" element={<TechnicianWorkspacePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/tickets" element={<AdminTicketManagementPage />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            {/* <Route path="/admin" element={<AdminDashboard/>} /> */}
            <Route path="/admin/resources/new" element={<AdminResourceForm />} />
            <Route path="/admin/resources/edit/:id" element={<AdminResourceForm />} />

      <Route
        path="/bookings/new/:resourceId?"
        element={
          <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
            <CreateBooking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings/my"
        element={
          <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
            <BookingDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}