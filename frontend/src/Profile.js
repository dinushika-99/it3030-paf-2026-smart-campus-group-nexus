import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axiosClient';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', studentId: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
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
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    api.get('/api/profile/me')
      .then((res) => res.data)
      .then((data) => {
        if (!data) return;
        const normalized = {
          ...user,
          ...data,
          role: (data.role || user.role || '').toLowerCase(),
        };
        setUser(normalized);
        setForm({
          name: data.name || normalized.name || '',
          email: data.email || normalized.email || '',
          studentId: data.studentId || normalized.studentId || '',
        });
        localStorage.setItem('smartCampusUser', JSON.stringify(normalized));
      })
      .catch(() => {});

    // fetch avatar blob
    api.get('/api/profile/avatar', { responseType: 'blob' })
      .then((res) => res.data)
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

    api.get('/api/notifications/me')
      .then((res) => res.data || [])
      .then((data) => {
        if (Array.isArray(data)) {
          const unread = data.filter((n) => !n.isRead && !n.read).length;
          setNotifications(data);
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', null, { skipAuthRefresh: true });
    } catch (err) {
      // Continue with client-side logout even if network fails.
    }
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  const handleEditToggle = () => setIsEditing((v) => !v);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaveMessage('');
    setSaveError('');
    setSaving(true);

    try {
      const res = await api.put('/api/profile/me', {
        name: form.name,
        email: form.email,
        studentId: form.studentId,
      });

      const data = res.data;

      const normalizedUser = {
        ...user,
        ...(data.user || {}),
        role: (data.user?.role || user.role || '').toLowerCase(),
      };

      setUser(normalizedUser);
      localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
      setIsEditing(false);
      setActiveSection('profile');
      setSaveMessage('Profile saved successfully.');
      setTimeout(() => setSaveMessage(''), 2600);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Network error while saving profile.');
    } finally {
      setSaving(false);
    }
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
      await api.post('/api/profile/avatar', formData);
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Upload failed. Please try again.');
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
        <div className="profile-hero__top profile-top-nav">
          <button className="profile-menu-button" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            Dashboard
          </button>

          <div className="profile-menu-wrap">
            <button className="profile-menu-button profile-menu-button-accent" onClick={() => setIsMenuOpen((v) => !v)}>
              Profile Menu
            </button>
            {isMenuOpen && (
              <div className="profile-menu-dropdown">
                <button onClick={() => { setActiveSection('profile'); setIsMenuOpen(false); }}>Profile</button>
                <button onClick={() => { setActiveSection('edit'); setIsMenuOpen(false); }}>Edit Profile</button>
                <button onClick={() => { setActiveSection('notifications'); setIsMenuOpen(false); }}>Notifications</button>
                <button onClick={() => { setActiveSection('account'); setIsMenuOpen(false); }}>Account Settings</button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-avatar-block">
          <button className="avatar avatar-xl actionable" onClick={handleAvatarClick} aria-label="Change profile image" title={isEditing ? 'Update profile photo' : 'Click Edit Profile to change photo'}>
            {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{user.name?.[0]?.toUpperCase()}</span>}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-role">{(user.role || 'student').toUpperCase()}</p>
          {isEditing && <p className="muted small">Tap profile photo to edit</p>}
          {avatarError && <p className="error" style={{ margin: '10px auto 0 auto', maxWidth: '430px' }}>{avatarError}</p>}
        </div>

        <div className="profile-hero__content">
          <div className="profile-hero__actions">
            {!isEditing && <button className="primary-btn" onClick={handleEditToggle}>Edit Profile</button>}
            {isEditing && (
              <div className="action-group">
                <button className="primary-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                <button className="ghost-btn" onClick={handleEditToggle}>Cancel</button>
              </div>
            )}
            <button className="danger-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="profile-grid">
        {saveMessage && <div className="profile-toast success">{saveMessage}</div>}
        {saveError && <div className="profile-toast error-tone">{saveError}</div>}

        {activeSection === 'profile' && (
        <section className="panel span-2 profile-section-animate">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Profile overview</h2>
            </div>
          </div>
          <div className="info-grid">
            <div>
              <p className="label">Full Name</p>
              <p className="value">{user.name || '—'}</p>
            </div>
            <div>
              <p className="label">Role</p>
              <p className="pill">{(user.role || 'student').toUpperCase()}</p>
            </div>
            <div>
              <p className="label">Email</p>
              <p className="value">{user.email || '—'}</p>
            </div>
            <div>
              <p className="label">Unread Notifications</p>
              <p className="value">{unreadCount}</p>
            </div>
          </div>
        </section>
        )}

        {activeSection === 'edit' && (
        <section className="panel span-2 profile-section-animate">
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
        )}

        {activeSection === 'notifications' && (
        <section className="panel span-2 profile-section-animate">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Messages</p>
              <h2>Notification Center</h2>
            </div>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>Unread notifications: {unreadCount}</p>
          <ul className="activity-list" style={{ marginTop: 12 }}>
            {notifications.length === 0 && (
              <li>
                <div>
                  <p className="value">No notifications</p>
                  <p className="muted">Your inbox is clear.</p>
                </div>
                <span className="pill pill-light">Clean</span>
              </li>
            )}
            {notifications.map((item, index) => (
              <li key={item.id || index}>
                <div>
                  <p className="value">{item.title || 'Notification'}</p>
                  <p className="muted">{item.message || 'No message provided'}</p>
                </div>
                <span className="pill pill-light">{item.type || 'General'}</span>
              </li>
            ))}
          </ul>
        </section>
        )}

        {activeSection === 'account' && (
        <section className="panel span-2 profile-section-animate">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Security</p>
              <h2>Account settings</h2>
            </div>
          </div>
          <div className="info-grid">
            <div>
              <p className="label">Authentication</p>
              <p className="value">Google OAuth + Session</p>
            </div>
            <div>
              <p className="label">Session state</p>
              <p className="value">Active</p>
            </div>
            <div>
              <p className="label">Primary email</p>
              <p className="value">{user.email}</p>
            </div>
            <div>
              <p className="label">Role</p>
              <p className="pill">{(user.role || 'student').toUpperCase()}</p>
            </div>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
