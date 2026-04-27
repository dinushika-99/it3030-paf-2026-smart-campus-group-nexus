import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axiosClient';

export default function GithubAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleGithubCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');
      const mode = sessionStorage.getItem('github_oauth_mode') || 'login';
      const role = sessionStorage.getItem('github_oauth_role') || 'student';

      if (oauthError) {
        setError('GitHub sign-in was cancelled or denied.');
        setLoading(false);
        return;
      }

      if (!code) {
        setError('GitHub sign-in did not return an authorization code.');
        setLoading(false);
        return;
      }
//github auth callback, exchange code for token and log user in
      try {
        const payload = mode === 'register' ? { code, role } : { code };
        const res = await api.post('/api/auth/github', payload, { skipAuthRefresh: true });
        const data = res.data;

        if (data?.requiresTwoFactor && data?.twoFactorToken) {
          sessionStorage.removeItem('github_oauth_mode');
          sessionStorage.removeItem('github_oauth_role');
          navigate('/login', {
            replace: true,
            state: { twoFactorToken: data.twoFactorToken },
          });
          return;
        }

        if (!data?.user) {
          setError('GitHub sign-in failed. Please try again.');
          setLoading(false);
          return;
        }

        const normalizedUser = {
          ...data.user,
          role: data.user.role ? data.user.role.toLowerCase() : undefined,
        };
        localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
        sessionStorage.removeItem('github_oauth_mode');
        sessionStorage.removeItem('github_oauth_role');
        navigate(['admin', 'manager'].includes(normalizedUser.role) ? '/admin' : '/dashboard', { replace: true });
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.error;

        if (status === 404) {
          sessionStorage.removeItem('github_oauth_mode');
          sessionStorage.removeItem('github_oauth_role');
          navigate('/register', {
            replace: true,
            state: { oauthError: 'No account exists for this GitHub email. Register first, then continue with GitHub.' },
          });
          return;
        }

        setError(message || 'GitHub sign-in failed. Please try again.');
        setLoading(false);
      }
    };

    handleGithubCallback();
  }, [navigate]);

  return (
    <div className="auth-page" style={{ '--auth-bg-image': `url(${process.env.PUBLIC_URL}/authleft.jpg)` }}>
      <div className="auth-split">
        <section className="auth-left" style={{ '--auth-left-image': `url(${process.env.PUBLIC_URL}/authleft.jpg)` }} />
        <section className="clean-login-right">
          <h1 className="clean-login-title">Signing you in</h1>
          {loading && <p className="clean-login-subtitle">Completing GitHub authentication...</p>}
          {!loading && error && (
            <>
              <p className="inline-plain-error">{error}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="register-cta-button"
                  onClick={() => navigate('/register')}
                >
                  Go to Register
                </button>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
