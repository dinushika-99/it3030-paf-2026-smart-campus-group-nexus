import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import { SITE_BRAND } from '../../siteConfig';
import api from '../../api/axiosClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email }, { skipAuthRefresh: true });
      setMessage(res.data?.message || 'If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
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
          <h1>Password Reset</h1>
          <p>Don't worry, we'll help you get back into your account. Enter your email to receive a password reset link.</p>
        </section>

        <section className="clean-login-right">
          <h1 className="clean-login-title">Forgot Password</h1>
          <p className="clean-login-subtitle">
            Enter the email address associated with your account.
          </p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="email" className="clean-label">Your email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clean-input"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <p className="inline-plain-error" role="alert" aria-live="assertive">{error}</p>
            )}

            {message && (
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#166534', background: '#dcfce7', border: '1px solid #86efac', padding: '12px', borderRadius: '10px' }} role="alert" aria-live="polite">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-xl bg-[#BF932A] text-[#111827] font-extrabold tracking-[0.4px] shadow-[0_12px_28px_rgba(191,147,42,0.38)] transition duration-200 hover:bg-[#9F781E] hover:shadow-[0_16px_32px_rgba(159,120,30,0.45)] focus:outline-none focus:ring-2 focus:ring-[#BF932A]/50"
              style={{ opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="clean-switch-row">
            <span>Remembered your password?</span>
            <Link to="/login" className="auth-switch-link">
              Back to Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
