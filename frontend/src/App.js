import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';  // ✅ Fix import path (adjust as needed)
import './App.css';

// Auth & Core Pages
import Login from './Login';
import GithubAuthCallback from './GithubAuthCallback';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';

// Site Config
import { SITE_BRAND } from './siteConfig';

// Ticket Module
import TicketPage from './pages/tickets/TicketPage';
import TicketDetailsPage from './pages/tickets/TicketDetailsPage';
import AdminTicketManagementPage from './pages/tickets/AdminTicketManagementPage';

// Features/Resources Module
import AdminResourceForm from './pages/features/AdminResourceForm';
import ResourceDetail from './pages/features/ResourceDetail';
import FacilitiesCatalogue from './pages/features/FacilitiesCatalogue';

// Technician Module
import TechnicianWorkspacePage from './pages/technician/TechnicianWorkspacePage';

// Booking Module
import CreateBooking from './pages/bookings/CreateBooking';
import ProtectedRoute from './components/ProtectedRoute';
import MyBookings from './pages/bookings/MyBookings';
import BookingDetail from './pages/bookings/BookingDetail';

// Home Page
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
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/github/callback" element={<GithubAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/facilities" element={<FacilitiesCatalogue />} />

            {/* Protected: Student/Lecturer/Manager Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER', 'ADMIN', 'TECHNICIAN']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/home" 
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER']}>
                  <HomePage />
                </ProtectedRoute>
              } 
            />

            {/* Ticket Routes */}
            <Route 
              path="/tickets" 
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER', 'ADMIN', 'TECHNICIAN']}>
                  <TicketPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tickets/:ticketId" 
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER', 'ADMIN', 'TECHNICIAN']}>
                  <TicketDetailsPage />
                </ProtectedRoute>
              } 
            />

            {/* Technician Route */}
            <Route 
              path="/technician/workspace" 
              element={
                <ProtectedRoute roles={['TECHNICIAN']}>
                  <TechnicianWorkspacePage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tickets" 
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminTicketManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/resources/new" 
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminResourceForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/resources/edit/:id" 
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminResourceForm />
                </ProtectedRoute>
              } 
            />

            {/* Resource Detail (Any authenticated user) */}
            <Route 
              path="/resources/:id" 
              element={
                <ProtectedRoute roles={['STUDENT', 'LECTURER', 'MANAGER', 'ADMIN', 'TECHNICIAN']}>
                  <ResourceDetail />
                </ProtectedRoute>
              } 
            />

            {/* ✅ Booking Routes - NOW INSIDE ROUTES/ROUTER */}
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