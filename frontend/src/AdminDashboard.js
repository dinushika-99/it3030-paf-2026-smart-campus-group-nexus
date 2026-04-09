import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_BRAND } from './siteConfig';

export default function AdminDashboard({ user: userProp }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('command-center');
  const [user, setUser] = useState(userProp || null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }

    const storedUser = localStorage.getItem('smartCampusUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'admin' && parsed.role !== 'manager') {
      navigate('/dashboard');
      return;
    }
    setUser(parsed);
  }, [navigate, userProp]);

  const handleLogout = () => {
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  useEffect(() => {
    if (!user) return;

    fetch('http://localhost:8081/api/profile/avatar', { credentials: 'include' })
      .then((res) => (res.ok ? res.blob() : null))
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
  }, [user]);

  if (!user) {
    return <div style={{ color: '#e5e7eb', minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1120' }}>Loading...</div>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <div className="admin-brand-row">
            <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} className="admin-brand-logo" />
            <h2 className="admin-brand-name">{SITE_BRAND.name}</h2>
          </div>

          <button className="admin-user-chip" onClick={handleOpenProfile}>
            <div className="admin-user-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="admin-user-avatar-img" />
                : (user.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-text">
              <p>{user.name || 'Admin User'}</p>
              <span>System Administrator</span>
            </div>
          </button>
        </div>

        <div className="admin-nav-group">
          <MenuCategory title="Main" />
          <NavButton active={activeTab === 'command-center'} onClick={() => setActiveTab('command-center')} text="Mission Control" icon="gauge" />

          <div className="admin-menu-spacer" />
          <MenuCategory title="Operations" />
          <NavButton active={activeTab === 'asset-directory'} onClick={() => setActiveTab('asset-directory')} text="Asset Atlas" icon="building" />
          <NavButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} text="Smart Scheduling" icon="calendar" />

          <div className="admin-menu-spacer" />
          <MenuCategory title="Resolution" />
          <NavButton active={activeTab === 'incident-desk'} onClick={() => setActiveTab('incident-desk')} text="Incident Desk" icon="wrench" />
          <NavButton active={activeTab === 'dispatch'} onClick={() => setActiveTab('dispatch')} text="Live Dispatch" icon="rocket" />

          <div className="admin-menu-spacer" />
          <MenuCategory title="Administration" />
          <NavButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} text="Identity Hub" icon="lock" />
          <NavButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} text="Audit Stream" icon="clipboard" />
        </div>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left" />
          <div className="admin-topbar-actions">
            <button className="admin-icon-btn" title="Notifications" aria-label="Notifications">
              <IconBell />
            </button>
            <button className="admin-icon-btn" title="Profile" aria-label="Profile" onClick={handleOpenProfile}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="admin-top-avatar-img" />
                : <IconUser />}
            </button>
          </div>
        </header>

        <div className="admin-content-wrap">
          <h1 className="admin-page-title">
            {TAB_TITLES[activeTab] || 'Command Center'}
          </h1>
        </div>

        {activeTab === 'command-center' && <OverviewTab />}
        {activeTab === 'identity' && <AddStaffTab isAdmin={user.role === 'admin'} />}
        {activeTab === 'asset-directory' && <PlaceholderPanel title="Asset Directory" description={`Track spaces, facilities, and assets across ${SITE_BRAND.name}.`} />}
        {activeTab === 'scheduling' && <PlaceholderPanel title="Resource Scheduling" description="Manage bookings, time slots, and allocation calendars." />}
        {activeTab === 'incident-desk' && <PlaceholderPanel title="Incident Desk" description="Review, triage, and resolve technical incidents." />}
        {activeTab === 'dispatch' && <PlaceholderPanel title="Active Dispatch" description="Coordinate live assignments for technician teams." />}
        {activeTab === 'audit' && <PlaceholderPanel title="System Audit" description="Inspect access logs, policy events, and system checks." />}
      </main>
    </div>
  );
}

const TAB_TITLES = {
  'command-center': 'Mission Control',
  'asset-directory': 'Asset Atlas',
  'scheduling': 'Smart Scheduling',
  'incident-desk': 'Incident Desk',
  'dispatch': 'Live Dispatch',
  'identity': 'Identity Hub',
  'audit': 'Audit Stream',
};

const MenuCategory = ({ title }) => (
  <p className="admin-menu-category">
    {title}
  </p>
);

const NavButton = ({ active, onClick, text, icon }) => (
  <button
    className={`admin-nav-btn ${active ? 'is-active' : ''}`}
    onClick={onClick}
  >
    <span className="admin-nav-icon"><MenuIcon type={icon} /></span>
    <span>{text}</span>
  </button>
);

const PlaceholderPanel = ({ title, description }) => (
  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', color: 'white', border: '1px solid #1f2937', margin: '0 40px 40px' }}>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    <p style={{ color: '#9ca3af', marginBottom: 0 }}>{description}</p>
  </div>
);

const OverviewTab = () => (
  <div style={{ padding: '0 40px 40px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #BF932A' }}>
        <p style={{ color: '#9ca3af', margin: '0 0 10px 0', fontSize: '14px' }}>Pending Bookings</p>
        <h2 style={{ color: 'white', margin: 0, fontSize: '32px' }}>14</h2>
      </div>

      <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
        <p style={{ color: '#9ca3af', margin: '0 0 10px 0', fontSize: '14px' }}>Open Maintenance Tickets</p>
        <h2 style={{ color: 'white', margin: 0, fontSize: '32px' }}>8</h2>
      </div>

      <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
        <p style={{ color: '#9ca3af', margin: '0 0 10px 0', fontSize: '14px' }}>Active Staff Users</p>
        <h2 style={{ color: 'white', margin: 0, fontSize: '32px' }}>42</h2>
      </div>
    </div>

    <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', color: 'white' }}>
      <h3>Recent Activity</h3>
      <p style={{ color: '#9ca3af' }}>Connect this to your Spring Boot API to show a live feed of actions.</p>
    </div>
  </div>
);

function AddStaffTab({ isAdmin }) {
  const [form, setForm] = useState({ name: '', email: '', newRole: 'technician' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAdmin) {
      setError('Only admins can create staff accounts.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8081/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          newRole: form.newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        return;
      }
      const tempPassword = data.defaultPassword ? ` Temporary password: ${data.defaultPassword}` : '';
      setSuccess((data.message || 'Account created.') + tempPassword);
      setForm({ name: '', email: '', newRole: 'technician' });
    } catch (err) {
      setError('Network error while creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#111827', padding: '30px', borderRadius: '12px', maxWidth: '600px', margin: '0 40px 40px' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0' }}>Register New Staff Member</h3>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ color: '#d1d5db', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., John Doe"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#1f2937', color: 'white', outline: 'none' }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#d1d5db', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="staff@nexus.edu"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#1f2937', color: 'white', outline: 'none' }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#d1d5db', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Role Assignment</label>
          <select
            value={form.newRole}
            onChange={(e) => setForm((prev) => ({ ...prev, newRole: e.target.value }))}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#1f2937', color: 'white', outline: 'none' }}
          >
            <option value="technician">Technician</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        {error && <p style={{ margin: 0, color: '#fca5a5' }}>{error}</p>}
        {success && <p style={{ margin: 0, color: '#86efac' }}>{success}</p>}

        <button type="submit" disabled={loading} style={{ padding: '14px', backgroundColor: '#BF932A', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', opacity: loading ? 0.8 : 1 }}>
          {loading ? 'Creating...' : 'Create Account & Send Invite'}
        </button>
      </form>
    </div>
  );
}

const MenuIcon = ({ type }) => {
  if (type === 'gauge') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4a8 8 0 0 0-8 8v4h16v-4a8 8 0 0 0-8-8Z"/><path d="m12 12 3-3"/></svg>;
  if (type === 'building') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h2M11 8h2M15 8h2M7 12h2M11 12h2M15 12h2M11 20v-4h2v4"/></svg>;
  if (type === 'calendar') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>;
  if (type === 'wrench') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a4 4 0 0 0 3 6.8l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4a4 4 0 0 0-6.8-3"/></svg>;
  if (type === 'rocket') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 19c2-1 4-1 6 1 2-2 2-4 1-6l6-6a5 5 0 0 0-7-7l-6 6c-2-1-4-1-6 1 2 2 2 4 1 6-1 2-1 4 1 6Z"/></svg>;
  if (type === 'lock') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11h10M9 16h10"/><path d="M5 7h14v14H5z"/></svg>;
};

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="8" r="4" />
  </svg>
);
