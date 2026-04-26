import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './App.css';
import { SITE_BRAND } from './siteConfig';
import api from './api/axiosClient';

const ALLOWED_ROLES = ['student', 'lecturer'];

export default function Register() {
  const [formFields, setFormFields] = useState({ name: '', email: '', password: '', confirmPassword: '', studentId: '' });
  
  // NEW: State to track errors for individual fields
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirmPassword: '', studentId: '' });
  
  const [selectedRole, setSelectedRole] = useState('student');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const idLabel = selectedRole === 'lecturer' ? 'Lecturer ID' : 'Student ID';
  const idPlaceholder = selectedRole === 'lecturer' ? 'LEC-001' : 'IT23816404';
  const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID || '';
  const githubRedirectUri = process.env.REACT_APP_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`;

  // --- NEW: Real-time Field Validation Logic ---
  const validateField = (fieldName, value) => {
    let errorMsg = '';
    const trimmedValue = value.trim();

    switch (fieldName) {
      case 'name':
        if (!trimmedValue) {
          errorMsg = 'Full Name is required.';
        } else if (trimmedValue.length < 3) {
          errorMsg = 'Must be at least 3 characters.';
        } else if (trimmedValue.split(/\s+/).length < 2) {
          errorMsg = 'Please enter your first and last name.';
        } else if (!/^[\p{L}\s\-']+$/u.test(trimmedValue)) {
          errorMsg = 'Letters, spaces, and hyphens only.';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedValue) {
          errorMsg = 'Email is required.';
        } else if (!emailRegex.test(trimmedValue)) {
          errorMsg = 'Please enter a valid email address.';
        }
        break;

      case 'password':
        if (!value) {
          errorMsg = 'Password is required.';
        } else if (value.length < 8) {
          errorMsg = 'Must be at least 8 characters long.';
        }
        // If they update the password, re-check confirm password automatically
        if (formFields.confirmPassword && value !== formFields.confirmPassword) {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
        } else if (formFields.confirmPassword && value === formFields.confirmPassword) {
           setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errorMsg = 'Please confirm your password.';
        } else if (value !== formFields.password) {
          errorMsg = 'Passwords do not match.';
        }
        break;

      case 'studentId':
        if (!trimmedValue) {
          errorMsg = `${selectedRole === 'lecturer' ? 'Lecturer' : 'Student'} ID is required.`;
        } else if (trimmedValue.length < 4) {
          errorMsg = 'ID must be at least 4 characters long.';
        }
        break;
      
      default:
        break;
    }

    // Update the specific field's error state
    setFieldErrors((prev) => ({ ...prev, [fieldName]: errorMsg }));
    return errorMsg;
  };

  // Triggers when the user clicks out of an input field
  const handleBlur = (e) => {
    validateField(e.target.id, e.target.value);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormFields((prev) => ({ ...prev, [id]: value }));
    // Optional: Clear the error the moment they start typing again
    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };
  // ----------------------------------------------

  const handleGithubSignUp = () => {
    if (!githubClientId) {
      setSubmitError('GitHub sign-up is not configured.');
      return;
    }
    sessionStorage.setItem('github_oauth_mode', 'register');
    sessionStorage.setItem('github_oauth_role', selectedRole);
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', githubClientId);
    authorizeUrl.searchParams.set('redirect_uri', githubRedirectUri);
    authorizeUrl.searchParams.set('scope', 'read:user user:email');
    window.location.href = authorizeUrl.toString();
  };

  React.useEffect(() => {
    const oauthError = location.state?.oauthError;
    if (oauthError) {
      setSubmitError(oauthError);
      navigate('/register', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) return setSubmitError('Google login failed.');
    setSubmitError('');
    try {
      const res = await api.post('/api/auth/google', { token, role: selectedRole }, { skipAuthRefresh: true });
      if (res.data?.user) {
        const normalizedUser = { ...res.data.user, role: res.data.user.role?.toLowerCase() };
        localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
        navigate(['admin', 'manager'].includes(normalizedUser.role) ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Network error.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    // Check ALL fields one last time before submitting
    const nameErr = validateField('name', formFields.name);
    const emailErr = validateField('email', formFields.email);
    const passErr = validateField('password', formFields.password);
    const confirmErr = validateField('confirmPassword', formFields.confirmPassword);
    const idErr = validateField('studentId', formFields.studentId);

    // If any error string was returned, stop the submission
    if (nameErr || emailErr || passErr || confirmErr || idErr) {
      return setSubmitError('Please fix the errors in the form before submitting.');
    }

    try {
      await api.post('/api/auth/register', {
        name: formFields.name.trim(),
        email: formFields.email.trim(),
        password: formFields.password,
        studentId: formFields.studentId.trim(),
        role: selectedRole,
      }, { skipAuthRefresh: true });

      setSuccess('Registration successful. You can now log in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Network error. Is the backend running?');
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

          <div className="oauth-buttons">
            <div className="oauth-google-wrap">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setSubmitError('Google sign-up failed.')} width={380} text="continue_with" shape="rectangular" theme="outline" />
            </div>
            <button type="button" onClick={handleGithubSignUp} className="oauth-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#24292e"><path d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 008.36 22.91c.575.106.786-.25.786-.556 0-.275-.01-1.003-.016-1.969-3.198.695-3.873-1.54-3.873-1.54-.523-1.328-1.278-1.682-1.278-1.682-1.045-.714.079-.699.079-.699 1.156.081 1.764 1.188 1.764 1.188 1.028 1.761 2.697 1.253 3.354.958.104-.745.402-1.253.731-1.541-2.553-.29-5.238-1.277-5.238-5.684 0-1.255.448-2.282 1.183-3.086-.119-.29-.513-1.457.112-3.037 0 0 .965-.309 3.162 1.179A10.98 10.98 0 0112 6.039c.973.005 1.954.132 2.87.387 2.195-1.488 3.158-1.179 3.158-1.179.628 1.58.234 2.747.115 3.037.737.804 1.181 1.831 1.181 3.086 0 4.418-2.689 5.39-5.25 5.675.413.355.781 1.057.781 2.131 0 1.539-.014 2.78-.014 3.158 0 .309.207.668.793.554A11.502 11.502 0 0023.5 12C23.5 5.649 18.351.5 12 .5z" /></svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="divider clean-divider"><span>or continue with email</span></div>

          <form className="form" onSubmit={handleSubmit}>
            
            {/* FULL NAME */}
            <div className="form-row" style={{ marginBottom: fieldErrors.name ? '18px' : '10px' }}>
              <label htmlFor="name" className="clean-label">Full Name</label>
              <input
                id="name"
                type="text"
                value={formFields.name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="clean-input"
                style={{ borderColor: fieldErrors.name ? '#ef4444' : '' }}
                placeholder="Alex Doe"
              />
              {fieldErrors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.name}</p>}
            </div>

            {/* EMAIL */}
            <div className="form-row" style={{ marginBottom: fieldErrors.email ? '18px' : '10px' }}>
              <label htmlFor="email" className="clean-label">Email</label>
              <input
                id="email"
                type="email"
                value={formFields.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="clean-input"
                style={{ borderColor: fieldErrors.email ? '#ef4444' : '' }}
                placeholder="you@campus.edu"
              />
              {fieldErrors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div className="form-row" style={{ marginBottom: fieldErrors.password ? '18px' : '10px' }}>
              <label htmlFor="password" className="clean-label">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formFields.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="clean-input password-input"
                  style={{ borderColor: fieldErrors.password ? '#ef4444' : '' }}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', placeItems: 'center' }}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye Slash Icon (Hide) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye Icon (Show) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-row" style={{ marginBottom: fieldErrors.confirmPassword ? '18px' : '10px' }}>
              <label htmlFor="confirmPassword" className="clean-label">Confirm Password</label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formFields.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="clean-input password-input"
                  style={{ borderColor: fieldErrors.confirmPassword ? '#ef4444' : '' }}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', placeItems: 'center' }}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    /* Eye Slash Icon (Hide) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye Icon (Show) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.confirmPassword}</p>}
            </div>

            {/* STUDENT/LECTURER ID */}
            <div className="form-row" style={{ marginBottom: fieldErrors.studentId ? '18px' : '10px' }}>
              <label htmlFor="studentId" className="clean-label">{idLabel}</label>
              <input
                id="studentId"
                type="text"
                value={formFields.studentId}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="clean-input"
                style={{ borderColor: fieldErrors.studentId ? '#ef4444' : '' }}
                placeholder={idPlaceholder}
              />
              {fieldErrors.studentId && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.studentId}</p>}
            </div>

            {/* SUBMIT MESSAGES */}
            {submitError && <p style={{ color: '#b91c1c', fontSize: '14px', marginBottom: '10px', fontWeight: 600 }}>{submitError}</p>}
            {success && <p style={{ color: '#166534', fontSize: '14px', marginBottom: '10px', fontWeight: 600 }}>{success}</p>}
            
            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-[#BF932A] text-[#111827] font-extrabold tracking-[0.4px] shadow-[0_12px_28px_rgba(191,147,42,0.38)] transition duration-200 hover:bg-[#9F781E] focus:outline-none"
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