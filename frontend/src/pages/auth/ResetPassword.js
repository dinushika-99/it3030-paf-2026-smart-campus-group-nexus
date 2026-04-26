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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="clean-input"
                  placeholder="Enter new password"
                  required
                />
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
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="clean-input"
                  placeholder="Confirm new password"
                  required
                />
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
