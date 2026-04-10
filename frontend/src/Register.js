import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './App.css';
import { SITE_BRAND } from './siteConfig';

const BACKEND_BASE = 'http://localhost:8081';
const ALLOWED_ROLES = ['student', 'lecturer'];

export default function Register() {
  const [formFields, setFormFields] = useState({ name: '', email: '', password: '', studentId: '' });
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const idLabel = selectedRole === 'lecturer' ? 'Lecturer ID' : 'Student ID';
  const idPlaceholder = selectedRole === 'lecturer' ? 'LEC-001' : '2024-001';

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
      setError('Google login did not return a token. Please try again.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, role: selectedRole }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const normalizedUser = {
          ...data.user,
          role: data.user.role ? data.user.role.toLowerCase() : undefined,
        };
        localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
        navigate(['admin', 'manager'].includes(normalizedUser.role) ? '/admin' : '/dashboard');
      } else {
        setError(data.error || 'Google sign-up failed.');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!ALLOWED_ROLES.includes(selectedRole)) {
      setError('Only STUDENT or LECTURER roles are allowed for self-registration.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formFields.name,
          email: formFields.email,
          password: formFields.password,
          studentId: formFields.studentId,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful. You can now log in.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    }
  };

  return (
    <div className="auth-page" style={{ '--auth-bg-image': `url(${process.env.PUBLIC_URL}/authleft.jpg)` }}>
      <div className="auth-split">
        <section className="auth-left" style={{ '--auth-left-image': `url(${process.env.PUBLIC_URL}/authleft.jpg)` }}>
          <div className="auth-left-brand">
            <div className="auth-left-top">{SITE_BRAND.name}</div>
            <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} className="auth-left-logo" />
          </div>
          <h1>Welcome back.</h1>
          <p>Securely access your campus workspace, notifications, and role-based dashboard from one place.</p>
        </section>

        <section className="clean-login-right">
          <h1 className="clean-login-title">Create account</h1>
          <p className="clean-login-subtitle">Register if you don't have an account yet</p>

          <div className="mt-1">
            <label className="clean-label block mb-2">I am registering as:</label>
            <div className="inline-flex w-full rounded-xl border border-gray-300 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`flex-1 py-2.5 text-sm font-semibold transition ${selectedRole === 'student' ? 'bg-[#BF932A] text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('lecturer')}
                className={`flex-1 py-2.5 text-sm font-semibold transition ${selectedRole === 'lecturer' ? 'bg-[#BF932A] text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Lecturer
              </button>
            </div>
          </div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-up was cancelled or failed.')}
            width="100%"
            text="continue_with"
            shape="rectangular"
          />

          <div className="divider clean-divider">
            <span>or continue with email</span>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name" className="clean-label">Full Name</label>
              <input
                id="name"
                type="text"
                value={formFields.name}
                onChange={(e) => setFormFields((prev) => ({ ...prev, name: e.target.value }))}
                className="clean-input"
                placeholder="Alex Doe"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="email" className="clean-label">Email</label>
              <input
                id="email"
                type="email"
                value={formFields.email}
                onChange={(e) => setFormFields((prev) => ({ ...prev, email: e.target.value }))}
                className="clean-input"
                placeholder="you@campus.edu"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="password" className="clean-label">Password</label>
              <input
                id="password"
                type="password"
                value={formFields.password}
                onChange={(e) => setFormFields((prev) => ({ ...prev, password: e.target.value }))}
                className="clean-input"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="studentId" className="clean-label">{idLabel}</label>
              <input
                id="studentId"
                type="text"
                value={formFields.studentId}
                onChange={(e) => setFormFields((prev) => ({ ...prev, studentId: e.target.value }))}
                className="clean-input"
                placeholder={idPlaceholder}
                required
              />
            </div>
            {error && <p className="inline-plain-error" role="alert" aria-live="assertive">{error}</p>}
            {success && <p className="inline-success auth-inline-success">{success}</p>}
            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-[#BF932A] text-[#111827] font-extrabold tracking-[0.4px] shadow-[0_12px_28px_rgba(191,147,42,0.38)] transition duration-200 hover:bg-[#9F781E] hover:shadow-[0_16px_32px_rgba(159,120,30,0.45)] focus:outline-none focus:ring-2 focus:ring-[#BF932A]/50"
            >
              SIGN UP
            </button>
          </form>

          <div className="clean-switch-row">
            <span>Already have an account?</span>
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
