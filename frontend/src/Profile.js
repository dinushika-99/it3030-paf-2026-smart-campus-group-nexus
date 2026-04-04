import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', studentId: '', program: '', year: '', advisor: '', status: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('smartCampusUser');
    if (!stored) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    setForm({
      name: parsed.name || '',
      email: parsed.email || '',
      studentId: parsed.studentId || '',
      program: parsed.program || '',
      year: parsed.year || '',
      advisor: parsed.advisor || '',
      status: parsed.status || '',
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    // fetch avatar blob
    fetch('http://localhost:8081/api/profile/avatar', { credentials: 'include' })
      .then((res) => res.ok ? res.blob() : null)
      .then((blob) => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      })
      .catch(() => {});

    fetch('http://localhost:8081/api/notifications/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const unread = data.filter((n) => !n.isRead && !n.read).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  const handleEditToggle = () => setIsEditing((v) => !v);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Placeholder: persist to backend when API is ready
    const updated = { ...user, ...form };
    setUser(updated);
    localStorage.setItem('smartCampusUser', JSON.stringify(updated));
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localUrl;
    });
    setAvatarError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8081/api/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        setAvatarError('Could not save image. Use an image under 2MB.');
      }
    } catch (err) {
      setAvatarError('Upload failed. Please try again.');
    }

    // allow re-selecting same file later
    e.target.value = '';
  };

  if (!user) {
    return <div style={{ color: '#e5e7eb', minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1120' }}>Loading profile…</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-hero__bg" />
        <div className="profile-hero__top">
          {/* Navigation Back */}
          <div style={{ width: '100%', margin: '0 0 20px 0', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => navigate('/dashboard')}
              title="Back to Dashboard"
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#FF7F50';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Circled Left Arrow SVG - Slightly larger since it sits alone */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 8 8 12 12 16"></polyline>
              </svg>
            </button>
          </div>
          <div className="hero-meta">
            <div className="meta-item">
              <span className="meta-dot" aria-hidden="true" />
              <p className="muted small">Profile overview</p>
            </div>
            <span className="pill pill-light meta-pill" title="Unread notifications">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
               {unreadCount}
            </span>
          </div>
        </div>
        <div className="profile-hero__content">
          <div className="profile-hero__id">
            <button className="avatar actionable" onClick={handleAvatarClick} aria-label="Change profile image" title={isEditing ? 'Update profile photo' : 'Click Edit Profile to change photo'}>
              {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{user.name?.[0]?.toUpperCase()}</span>}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div>
              <p className="eyebrow">Campus profile</p>
              <h1>{user.name}</h1>
              <p className="muted">{user.email}</p>
              <p className="muted small">Tap the avatar while editing to update your photo</p>
              {avatarError && <p className="error" style={{ margin: '8px 0 0 0' }}>{avatarError}</p>}
            </div>
          </div>
          <div className="profile-hero__actions">
            {!isEditing && (
              <button className="primary-btn" onClick={handleEditToggle}>Edit Profile</button>
            )}
            {isEditing && (
              <div className="action-group">
                <button className="primary-btn" onClick={handleSave}>Save</button>
                <button className="ghost-btn" onClick={handleEditToggle}>Cancel</button>
              </div>
            )}
            <div className="action-group">
              <button className="danger-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="profile-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Identity</p>
              <h2>Personal details</h2>
            </div>
          </div>
          <div className="info-grid">
            <div>
              <p className="label">Full name</p>
              {isEditing ? (
                <input className="input" value={form.name} placeholder="Add full name" onChange={(e) => handleChange('name', e.target.value)} />
              ) : (
                <p className="value">{user.name}</p>
              )}
            </div>
            <div>
              <p className="label">Email</p>
              {isEditing ? (
                <input className="input" value={form.email} placeholder="Add email" onChange={(e) => handleChange('email', e.target.value)} />
              ) : (
                <p className="value">{user.email}</p>
              )}
            </div>
            <div>
              <p className="label">Role</p>
              <p className="pill">{user.role}</p>
            </div>
            <div>
              <p className="label">ID</p>
              {isEditing ? (
                <input className="input" value={form.studentId} placeholder="Add Lecturer ID" onChange={(e) => handleChange('studentId', e.target.value)} />
              ) : (
                <p className="value">{user.studentId || '—'}</p>
              )}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Security</p>
              <h2>Access controls</h2>
            </div>
          </div>
          <ul className="badge-list">
            <li>
              <span className="dot green" />
              Session active
            </li>
            <li>
              <span className="dot amber" />
              MFA pending setup
            </li>
            <li>
              <span className="dot blue" />
              OAuth2 enabled (Google)
            </li>
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Academic</p>
              <h2>Enrollment</h2>
            </div>
          </div>
          <div className="info-grid">
            <div>
              <p className="label">Program</p>
              {isEditing ? (
                <input className="input" value={form.program} placeholder="Add Program" onChange={(e) => handleChange('program', e.target.value)} />
              ) : (
                <p className="value">{user.program || '—'}</p>
              )}
            </div>
            <div>
              <p className="label">Year</p>
              {isEditing ? (
                <input className="input" value={form.year} placeholder="Add Year" onChange={(e) => handleChange('year', e.target.value)} />
              ) : (
                <p className="value">{user.year || '—'}</p>
              )}
            </div>
            <div>
              <p className="label">Advisor</p>
              {isEditing ? (
                <input className="input" value={form.advisor} placeholder="Add Advisor" onChange={(e) => handleChange('advisor', e.target.value)} />
              ) : (
                <p className="value">{user.advisor || '—'}</p>
              )}
            </div>
            <div>
              <p className="label">Status</p>
              {isEditing ? (
                <input className="input" value={form.status} placeholder="Add Status" onChange={(e) => handleChange('status', e.target.value)} />
              ) : (
                <p className="pill">{user.status || 'Pending'}</p>
              )}
            </div>
          </div>
        </section>

        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Highlights</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          <ul className="activity-list">
            <li>
              <div>
                <p className="value">TPSM proposal</p>
                <p className="muted">Submitted to Faculty of Computing</p>
              </div>
              <span className="pill pill-light">Submitted</span>
            </li>
            <li>
              <div>
                <p className="value">Library booking</p>
                <p className="muted">Room B4 · 2h slot</p>
              </div>
              <span className="pill pill-light">Confirmed</span>
            </li>
            <li>
              <div>
                <p className="value">Notification digest</p>
                <p className="muted">Unread items:  {unreadCount}</p>
              </div>
              <span className="pill pill-light">Inbox</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
