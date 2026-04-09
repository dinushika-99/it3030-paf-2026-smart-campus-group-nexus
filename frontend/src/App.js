import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import { SITE_BRAND } from './siteConfig';

const clientId = '561676533130-h2qmjsddoohsufv7ojl5pmb507e0or6e.apps.googleusercontent.com';

export default function App() {
  useEffect(() => {
    document.title = SITE_BRAND.name;
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}
