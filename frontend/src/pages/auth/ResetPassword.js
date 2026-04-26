import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import '../../App.css';
import { SITE_BRAND } from '../../siteConfig';
import api from '../../api/axiosClient';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const hasConfirmValue = passwordForm.confirmPassword.length > 0;
  const passwordsMatch = hasConfirmValue && passwordForm.newPassword === passwordForm.confirmPassword;
  const passwordsMismatch = hasConfirmValue && passwordForm.newPassword !== passwordForm.confirmPassword;

  const passwordStrength = useMemo(() => {
    const value = String(passwordForm.newPassword || '');
    if (!value) {
      return { label: 'Weak', tone: '#b91c1c', score: 0 };
    }

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score >= 4) return { label: 'Strong', tone: '#166534', score };
    if (score >= 2) return { label: 'Medium', tone: '#b45309', score };
    return { label: 'Weak', tone: '#b91c1c', score };
  }, [passwordForm.newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }, { skipAuthRefresh: true });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
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
          <h1>Create New Password</h1>
          <p>Please enter your new password below to regain access to your account.</p>
        </section>

        <section className="clean-login-right">
          <h1 className="clean-login-title">Reset Password</h1>
          <p className="clean-login-subtitle">
            Choose a strong password with at least 8 characters.
          </p>

          {!success ? (
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="newPassword" className="clean-label">New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="clean-input password-input"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9.88 5.09C10.56 4.87 11.27 4.75 12 4.75C17 4.75 20.27 9.41 21 12C20.69 13.1 19.92 14.45 18.73 15.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14.12 18.91C13.44 19.13 12.73 19.25 12 19.25C7 19.25 3.73 14.59 3 12C3.31 10.9 4.08 9.55 5.27 8.44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M2 12C3 8.5 6.5 5 12 5C17.5 5 21 8.5 22 12C21 15.5 17.5 19 12 19C6.5 19 3 15.5 2 12Z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div style={{ display: 'grid', gap: '6px', marginTop: '6px' }}>
                    <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(8, (passwordStrength.score / 4) * 100)}%`,
                          height: '100%',
                          background: passwordStrength.tone,
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                      Password strength:{' '}
                      <span style={{ fontWeight: 700, color: passwordStrength.tone }}>
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="confirmPassword" className="clean-label">Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="clean-input password-input"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9.88 5.09C10.56 4.87 11.27 4.75 12 4.75C17 4.75 20.27 9.41 21 12C20.69 13.1 19.92 14.45 18.73 15.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14.12 18.91C13.44 19.13 12.73 19.25 12 19.25C7 19.25 3.73 14.59 3 12C3.31 10.9 4.08 9.55 5.27 8.44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M2 12C3 8.5 6.5 5 12 5C17.5 5 21 8.5 22 12C21 15.5 17.5 19 12 19C6.5 19 3 15.5 2 12Z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordsMatch && <p className="password-match-hint success">Passwords match.</p>}
                {passwordsMismatch && <p className="password-match-hint error">Passwords do not match yet.</p>}
              </div>

              {error && (
                <p className="inline-plain-error" role="alert" aria-live="assertive">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-xl bg-[#BF932A] text-[#111827] font-extrabold tracking-[0.4px] shadow-[0_12px_28px_rgba(191,147,42,0.38)] transition duration-200 hover:bg-[#9F781E] hover:shadow-[0_16px_32px_rgba(159,120,30,0.45)] focus:outline-none focus:ring-2 focus:ring-[#BF932A]/50"
                style={{ opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ width: '60px', height: '60px', background: '#dcfce7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px' }}>✓</div>
              <h2 style={{ fontSize: '20px', color: '#111827', margin: '0 0 10px 0' }}>Password Reset Successful</h2>
              <p style={{ color: '#4b5563', margin: '0 0 20px 0' }}>Your password has been changed successfully. You will be redirected to the login page shortly.</p>
              <Link to="/login" className="mt-2 h-11 w-full rounded-xl border border-[#4b5563] bg-[#111827] text-[#e5e7eb] font-bold tracking-[0.3px] flex items-center justify-center" style={{ textDecoration: 'none' }}>
                Go to Sign in
              </Link>
            </div>
          )}

          {!success && (
            <div className="clean-switch-row">
              <Link to="/login" className="auth-switch-link">
                Back to Sign in
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
