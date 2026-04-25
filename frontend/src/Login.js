import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './App.css';
import { SITE_BRAND } from './siteConfig';
import api from './api/axiosClient';

export default function Login() {
  const [formFields, setFormFields] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID || '';
  const githubRedirectUri = process.env.REACT_APP_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`;

  React.useEffect(() => {
    const oauthError = location.state?.oauthError;
    if (oauthError) {
      setShowRegisterPrompt(false);
      setError(oauthError);
      navigate('/login', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const handleGithubSignIn = () => {
    if (!githubClientId) {
      setShowRegisterPrompt(false);
      setError('GitHub login is not configured. Add REACT_APP_GITHUB_CLIENT_ID to frontend env.');
      return;
    }

    sessionStorage.setItem('github_oauth_mode', 'login');
    sessionStorage.removeItem('github_oauth_role');

    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', githubClientId);
    authorizeUrl.searchParams.set('redirect_uri', githubRedirectUri);
    authorizeUrl.searchParams.set('scope', 'read:user user:email');

    window.location.href = authorizeUrl.toString();
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
    setShowRegisterPrompt(false);
      setError('Google login did not return a token. Please try again.');
      return;
    }

    setError('');
    setShowRegisterPrompt(false);
    try {
      const res = await api.post('/api/auth/google', { token }, { skipAuthRefresh: true });
      const data = res.data;
      if (data?.user) {
        const normalizedUser = {
          ...data.user,
          role: data.user.role ? data.user.role.toUpperCase() : undefined,
        };
        localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
        navigate(['admin', 'manager'].includes(normalizedUser.role) ? '/admin' : '/facilities');
        if (normalizedUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (['STUDENT', 'LECTURER', 'MANAGER'].includes(normalizedUser.role?.toUpperCase())) {
          navigate('/home');  // ✅ Redirect to new HomePage
        } else {
          navigate('/dashboard');  // Fallback
        }
      } else {
        setShowRegisterPrompt(false);
        setError('Google sign-in failed.');
      }
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error;
      if (status === 404) {
        setShowRegisterPrompt(true);
        setError('No account exists for this email. Please register first.');
        return;
      }
      setShowRegisterPrompt(false);
      setError(message || 'Network error. Is the backend running?');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowRegisterPrompt(false);
    try {
      const res = await api.post('/api/auth/login', {
        email: formFields.email,
        password: formFields.password,
      }, { skipAuthRefresh: true });
      const data = res.data;
      if (data?.user) {
        const normalizedUser = {
          ...data.user,
          role: data.user.role ? data.user.role.toUpperCase() : undefined,
        };
        localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
        navigate(['admin', 'manager'].includes(normalizedUser.role) ? '/admin' : '/facilities');
       if (normalizedUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (['STUDENT', 'LECTURER', 'MANAGER'].includes(normalizedUser.role?.toUpperCase())) {
          navigate('/home');  // ✅ Redirect to new HomePage
        } else {
          navigate('/dashboard');  // Fallback
        }
      } else {
        setShowRegisterPrompt(false);
        setError('We could not sign you in. Please check your email and password, then try again.');
      }
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error;
      if (status === 404) {
        setShowRegisterPrompt(true);
        setError('No account exists for this email. Please register first.');
        return;
      }
      setShowRegisterPrompt(false);
      setError(message || 'Network error. Is the backend running?');
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
          <p>Your central hub for {SITE_BRAND.name} operations.
Log in to manage facility bookings, track maintenance tickets, and view notifications.</p>
        </section>

        <section className="clean-login-right">
          <h1 className="clean-login-title">Sign in</h1>
          <p className="clean-login-subtitle">Sign in if you have an account in here</p>

          <div className="oauth-buttons">
            <div className="oauth-google-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                width={380}
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
                theme="outline"
              />
            </div>

            <button type="button" onClick={handleGithubSignIn} className="oauth-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#24292e"
                  d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 008.36 22.91c.575.106.786-.25.786-.556 0-.275-.01-1.003-.016-1.969-3.198.695-3.873-1.54-3.873-1.54-.523-1.328-1.278-1.682-1.278-1.682-1.045-.714.079-.699.079-.699 1.156.081 1.764 1.188 1.764 1.188 1.028 1.761 2.697 1.253 3.354.958.104-.745.402-1.253.731-1.541-2.553-.29-5.238-1.277-5.238-5.684 0-1.255.448-2.282 1.183-3.086-.119-.29-.513-1.457.112-3.037 0 0 .965-.309 3.162 1.179A10.98 10.98 0 0112 6.039c.973.005 1.954.132 2.87.387 2.195-1.488 3.158-1.179 3.158-1.179.628 1.58.234 2.747.115 3.037.737.804 1.181 1.831 1.181 3.086 0 4.418-2.689 5.39-5.25 5.675.413.355.781 1.057.781 2.131 0 1.539-.014 2.78-.014 3.158 0 .309.207.668.793.554A11.502 11.502 0 0023.5 12C23.5 5.649 18.351.5 12 .5z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="divider clean-divider">
            <span>or continue with email</span>
          </div>

          <form className="form" onSubmit={handleFormSubmit}>
            <div className="form-row">
              <label htmlFor="email" className="clean-label">Your email</label>
              <input
                id="email"
                type="email"
                value={formFields.email}
                onChange={(e) => setFormFields((prev) => ({ ...prev, email: e.target.value }))}
                className={showRegisterPrompt ? 'clean-input input-shake' : 'clean-input'}
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                required
              />
              <button type="button" className="forgot-link">Forgot Password?</button>
            </div>

            {showRegisterPrompt && (
              <div className="register-cta-card" role="alert" aria-live="assertive">
                <div className="register-cta-icon" aria-hidden="true">!</div>
                <div className="register-cta-content">
                  <p className="register-cta-title">No account found</p>
                  <p className="register-cta-text">No account exists for this email yet. Register to continue.</p>
                  <button
                    type="button"
                    className="register-cta-button"
                    onClick={() => navigate('/register')}
                  >
                    Go to Register
                  </button>
                </div>
              </div>
            )}

            {!showRegisterPrompt && error && (
              <p className="inline-plain-error" role="alert" aria-live="assertive">{error}</p>
            )}

            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-[#BF932A] text-[#111827] font-extrabold tracking-[0.4px] shadow-[0_12px_28px_rgba(191,147,42,0.38)] transition duration-200 hover:bg-[#9F781E] hover:shadow-[0_16px_32px_rgba(159,120,30,0.45)] focus:outline-none focus:ring-2 focus:ring-[#BF932A]/50"
            >
              SIGN IN
            </button>
          </form>

          <div className="clean-switch-row">
            <span>Not a member?</span>
            <Link
              to="/register"
              className={showRegisterPrompt ? 'auth-switch-link auth-switch-link-highlight' : 'auth-switch-link'}
            >
              Sign up
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
