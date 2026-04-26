import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';
import './App.css';

import Navbar from './components/Navbar';

import Login from './Login';
import GithubAuthCallback from './GithubAuthCallback';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import { SITE_BRAND } from './siteConfig';

import TicketPage from './pages/tickets/TicketPage';
import TicketDetailsPage from './pages/tickets/TicketDetailsPage';
import AdminTicketManagementPage from './pages/tickets/AdminTicketManagementPage';

import AdminBookingsPage from './pages/bookings/AdminBookingsPage';
import CreateBooking from './pages/bookings/CreateBooking';
import MyBookings from './pages/bookings/MyBookings';
import BookingDetail from './pages/bookings/BookingDetail';

import AdminResourceForm from './pages/features/AdminResourceForm';
import ResourceDetail from './pages/features/ResourceDetail';
import FacilitiesCatalogue from './pages/features/FacilitiesCatalogue';

import TechnicianWorkspacePage from './pages/technician/TechnicianWorkspacePage';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';

const clientId =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '561676533130-h2qmjsddoohsufv7ojl5pmb507e0or6e.apps.googleusercontent.com';

function AppRoutes() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, [location.pathname]);

  const hideNavbarPaths = ['/login', '/register', '/auth/github/callback'];
  const shouldShowNavbar = user && !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar user={user} />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/auth/github/callback" element={<GithubAuthCallback />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route path="/facilities" element={<FacilitiesCatalogue />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />

        <Route path="/tickets" element={<TicketPage user={user} />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailsPage user={user} />} />

        <Route path="/technician/workspace" element={<TechnicianWorkspacePage />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/tickets" element={<AdminTicketManagementPage />} />
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
    </>
  );
}

export default function App() {
  useEffect(() => {
    document.title = SITE_BRAND.name;
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}