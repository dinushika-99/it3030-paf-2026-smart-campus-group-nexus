import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_BRAND } from './siteConfig';

const API_BASE = 'http://localhost:8081';

export default function AdminDashboard({ user: userProp }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('command-center');
  const [user, setUser] = useState(userProp || null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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

  const isAdmin = user?.role === 'admin';
  const roleLabel = isAdmin ? 'Admin' : 'Manager';

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={`${process.env.PUBLIC_URL}/LOGO.png`}
              alt="Site logo"
              style={{ width: '46px', height: '46px', objectFit: 'contain' }}
            />
            <h2 style={{ color: '#fff', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>
              NEXUS
            </h2>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #BF932A', backgroundColor: '#1f2937', display: 'grid', placeItems: 'center', color: '#BF932A', fontWeight: 700 }}>
              {(avatarUrl || user.avatarUrl) ? (
                <img src={avatarUrl || `${API_BASE}${user.avatarUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#BF932A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Welcome</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#fff', fontWeight: 700 }}>{user.name || 'Admin User'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="admin-nav-group">
          <MenuCategory title="Main" />
          <NavButton active={activeTab === 'command-center'} onClick={() => setActiveTab('command-center')} text="Command Center" icon="dashboard" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Operations" />
          <NavButton active={activeTab === 'asset-directory'} onClick={() => setActiveTab('asset-directory')} text="Asset Directory" icon="asset" />
          <NavButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} text="Resource Scheduling" icon="schedule" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Resolution" />
          <NavButton active={activeTab === 'incident-desk'} onClick={() => setActiveTab('incident-desk')} text="Incident Desk" icon="incident" />
          <NavButton active={activeTab === 'dispatch'} onClick={() => setActiveTab('dispatch')} text="Active Dispatch" icon="dispatch" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Administration" />
          <NavButton active={activeTab === 'admin-users'} onClick={() => setActiveTab('admin-users')} text="Access & Identity" icon="identity" />
          <NavButton active={activeTab === 'admin-communication'} onClick={() => setActiveTab('admin-communication')} text="Broadcast & Audit" icon="audit" />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '14px 16px', border: '1px solid #1f2937', borderRadius: '12px', backgroundColor: '#111827' }}>
          <div>
            <p style={{ color: '#BF932A', margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back</p>
            <h1 style={{ color: 'white', margin: '2px 0 0 0', fontSize: '24px', textTransform: 'capitalize' }}>
              {TAB_TITLES[activeTab] || 'Command Center'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TopNavIconButton label="Profile" onClick={() => navigate('/profile')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </TopNavIconButton>

            <TopNavIconButton label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </TopNavIconButton>

            <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 14px', backgroundColor: '#BF932A', color: '#111827', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {activeTab === 'command-center' && <OverviewTab isAdmin={isAdmin} onJump={setActiveTab} refreshKey={refreshKey} />}
        {activeTab === 'asset-directory' && <PlaceholderPanel title="Asset Directory" description="Track spaces, facilities, and assets across NEXUS." />}
        {activeTab === 'scheduling' && <PlaceholderPanel title="Resource Scheduling" description="Manage bookings, time slots, and allocation calendars." />}
        {activeTab === 'incident-desk' && <PlaceholderPanel title="Incident Desk" description="Review, triage, and resolve technical incidents." />}
        {activeTab === 'dispatch' && <PlaceholderPanel title="Active Dispatch" description="Coordinate live assignments for technician teams." />}
        {activeTab === 'admin-users' && <AdminUsersTab isAdmin={isAdmin} refreshKey={refreshKey} onChanged={() => setRefreshKey((v) => v + 1)} />}
        {activeTab === 'admin-communication' && <AdminCommunicationTab isAdmin={isAdmin} refreshKey={refreshKey} />}
      </main>
    </div>
  );
}

const TAB_TITLES = {
  'command-center': 'Command Center',
  'asset-directory': 'Asset Directory',
  scheduling: 'Resource Scheduling',
  'incident-desk': 'Incident Desk',
  dispatch: 'Active Dispatch',
  'admin-users': 'Access & Identity',
  'admin-communication': 'Broadcast & Audit',
};

const CARD_STYLE = {
  backgroundColor: '#111827',
  padding: '22px',
  borderRadius: '12px',
  border: '1px solid #1f2937',
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
    style={{
      padding: '12px 15px',
      backgroundColor: active ? '#BF932A' : 'transparent',
      color: active ? '#000' : '#d1d5db',
      border: active ? 'none' : '1px solid #1f2937',
      borderRadius: '8px',
      textAlign: 'left',
      fontSize: '15px',
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}
  >
    <span
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '999px',
        display: 'grid',
        placeItems: 'center',
        border: active ? '1px solid #BF932A' : '1px solid #334155',
        backgroundColor: active ? 'rgba(191,147,42,0.18)' : '#1f2937',
        color: active ? '#BF932A' : '#94a3b8',
        flexShrink: 0,
      }}
    >
      <MenuIcon type={icon} />
    </span>
    <span>{text}</span>
  </button>
);

const TopNavIconButton = ({ children, onClick, label }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      border: '1px solid #334155',
      backgroundColor: '#0f172a',
      color: '#BF932A',
      display: 'grid',
      placeItems: 'center',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

const MenuIcon = ({ type }) => {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (type === 'dashboard') {
    return (
      <svg {...common}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    );
  }
  if (type === 'asset') {
    return (
      <svg {...common}><rect x="4" y="3" width="16" height="18"></rect><path d="M9 21V8h6v13"></path></svg>
    );
  }
  if (type === 'schedule') {
    return (
      <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    );
  }
  if (type === 'incident') {
    return (
      <svg {...common}><path d="M14.7 6.3a1 1 0 0 0-1.4 0L5 14.6V19h4.4l8.3-8.3a1 1 0 0 0 0-1.4z"></path><path d="M16 5l3 3"></path></svg>
    );
  }
  if (type === 'dispatch') {
    return (
      <svg {...common}><path d="M4 20l16-8-16-8 4 8-4 8z"></path></svg>
    );
  }
  if (type === 'identity') {
    return (
      <svg {...common}><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"></path><path d="M9 12l2 2 4-4"></path></svg>
    );
  }

  return (
    <svg {...common}><rect x="6" y="4" width="12" height="16" rx="1"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>
  );
};

const getInitials = (name) =>
  String(name || 'AU')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function OverviewTab({ isAdmin, onJump, refreshKey }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    fetch(`${API_BASE}/api/admin/summary`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, [isAdmin, refreshKey]);

  if (!isAdmin) {
    return (
      <div style={{ ...CARD_STYLE, color: '#fcd34d' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Restricted Area</h3>
        <p style={{ marginBottom: 0 }}>Only administrator accounts can use Administration functions.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        <MetricCard title="Total Users" value={summary?.totalUsers ?? '--'} borderColor="#BF932A" />
        <MetricCard title="Total Staff" value={summary?.totalStaff ?? '--'} borderColor="#3b82f6" />
        <MetricCard title="Students" value={summary?.students ?? '--'} borderColor="#22c55e" />
        <MetricCard title="Unread Notifications" value={summary?.unreadNotifications ?? '--'} borderColor="#ef4444" />
      </div>

      <div style={{ ...CARD_STYLE, color: '#d1d5db' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Administration Shortcuts</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={() => onJump('admin-users')} style={ShortcutButtonStyle}>Access & Identity</button>
          <button onClick={() => onJump('admin-communication')} style={ShortcutButtonStyle}>Broadcast & Audit</button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPanel({ title, description }) {
  return (
    <div style={CARD_STYLE}>
      <h3 style={{ marginTop: 0, color: 'white' }}>{title}</h3>
      <p style={{ color: '#9ca3af', marginBottom: 0 }}>{description}</p>
    </div>
  );
}

function AdminUsersTab({ isAdmin, refreshKey, onChanged }) {
  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <AccessIdentityTab isAdmin={isAdmin} onCreated={onChanged} />
      <StaffDirectoryTab isAdmin={isAdmin} refreshKey={refreshKey} onChanged={onChanged} />
    </div>
  );
}

function AdminCommunicationTab({ isAdmin, refreshKey }) {
  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <BroadcastTab isAdmin={isAdmin} />
      <AuditTab isAdmin={isAdmin} refreshKey={refreshKey} />
    </div>
  );
}

function AccessIdentityTab({ isAdmin, onCreated }) {
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
      const res = await fetch(`${API_BASE}/api/admin/create-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          newRole: form.newRole,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        return;
      }

      const tempPassword = data.defaultPassword ? ` Temporary password: ${data.defaultPassword}` : '';
      setSuccess((data.message || 'Account created successfully.') + tempPassword);
      setForm({ name: '', email: '', newRole: 'technician' });
      onCreated();
    } catch (err) {
      setError('Network error while creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...CARD_STYLE, maxWidth: '760px' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0' }}>Create Staff Account</h3>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <LabeledInput
          label="Full Name"
          type="text"
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="e.g., John Doe"
          required
        />

        <LabeledInput
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          placeholder="staff@nexus.edu"
          required
        />

        <div>
          <label style={LabelStyle}>Role Assignment</label>
          <select
            value={form.newRole}
            onChange={(e) => setForm((prev) => ({ ...prev, newRole: e.target.value }))}
            style={InputStyle}
          >
            <option value="technician">Technician</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        {error && <p style={{ margin: 0, color: '#fca5a5' }}>{error}</p>}
        {success && <p style={{ margin: 0, color: '#86efac' }}>{success}</p>}

        <button type="submit" disabled={loading} style={{ padding: '13px', backgroundColor: '#BF932A', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

function StaffDirectoryTab({ isAdmin, refreshKey, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/admin/staff`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load staff list');
        }
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message || 'Failed to load staff list'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const updateRole = async (id, newRole) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/staff/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update role');
        return;
      }

      setMessage('Role updated successfully.');
      onChanged();
      load();
    } catch (err) {
      setError('Network error while updating role.');
    }
  };

  const deleteStaff = async (id, name) => {
    setError('');
    setMessage('');

    const confirmed = window.confirm(`Delete ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/staff/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not delete user');
        return;
      }

      setMessage('User deleted successfully.');
      onChanged();
      load();
    } catch (err) {
      setError('Network error while deleting user.');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ ...CARD_STYLE, color: '#fcd34d' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Restricted Area</h3>
        <p style={{ marginBottom: 0 }}>Only admins can manage staff directory records.</p>
      </div>
    );
  }

  return (
    <div style={CARD_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'white', margin: 0 }}>Staff Management</h3>
        <button onClick={load} style={MiniButtonStyle}>Refresh</button>
      </div>

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {message && <p style={{ color: '#86efac' }}>{message}</p>}

      {loading ? (
        <p style={{ color: '#9ca3af', marginBottom: 0 }}>Loading staff records...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#9ca3af', marginBottom: 0 }}>No staff records found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={TableHeadStyle}>Name</th>
                <th style={TableHeadStyle}>Email</th>
                <th style={TableHeadStyle}>Role</th>
                <th style={TableHeadStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={TableCellStyle}>{row.name}</td>
                  <td style={TableCellStyle}>{row.email}</td>
                  <td style={TableCellStyle}>
                    <select
                      value={String(row.role || '').toLowerCase()}
                      onChange={(e) => updateRole(row.id, e.target.value)}
                      style={{ ...InputStyle, minWidth: '140px', margin: 0 }}
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="technician">Technician</option>
                      <option value="manager">Manager</option>
                    </select>
                  </td>
                  <td style={TableCellStyle}>
                    <button onClick={() => deleteStaff(row.id, row.name)} style={{ ...MiniButtonStyle, backgroundColor: '#7f1d1d' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BroadcastTab({ isAdmin }) {
  const [form, setForm] = useState({ title: '', message: '', type: 'INFO', targetRole: 'ALL' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAdmin) {
      setError('Only admins can send system broadcast notifications.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError('Failed to send broadcast notification.');
        return;
      }

      setSuccess('Broadcast sent successfully.');
      setForm({ title: '', message: '', type: 'INFO', targetRole: 'ALL' });
    } catch (err) {
      setError('Network error while sending broadcast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...CARD_STYLE, maxWidth: '820px' }}>
      <h3 style={{ color: 'white', margin: '0 0 18px 0' }}>Send Broadcast Notification</h3>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <LabeledInput
          label="Title"
          type="text"
          value={form.title}
          onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
          placeholder="System Maintenance Notice"
          required
        />

        <div>
          <label style={LabelStyle}>Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Enter your message"
            style={{ ...InputStyle, minHeight: '110px', resize: 'vertical' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={LabelStyle}>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              style={InputStyle}
            >
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ALERT">ALERT</option>
            </select>
          </div>

          <div>
            <label style={LabelStyle}>Target</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}
              style={InputStyle}
            >
              <option value="ALL">All Users</option>
              <option value="STUDENT">Students</option>
              <option value="LECTURER">Lecturers</option>
              <option value="TECHNICIAN">Technicians</option>
              <option value="MANAGER">Managers</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>}
        {success && <p style={{ color: '#86efac', margin: 0 }}>{success}</p>}

        <button type="submit" disabled={loading} style={{ padding: '13px', backgroundColor: '#BF932A', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}>
          {loading ? 'Sending...' : 'Send Broadcast'}
        </button>
      </form>
    </div>
  );
}

function AuditTab({ isAdmin, refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    setError('');
    Promise.all([
      fetch(`${API_BASE}/api/admin/summary`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : null)),
      fetch(`${API_BASE}/api/admin/staff`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([summaryData, staffData]) => {
        setSummary(summaryData);
        setStaff(Array.isArray(staffData) ? staffData.slice(0, 8) : []);
      })
      .catch(() => setError('Could not load audit information.'));
  }, [isAdmin, refreshKey]);

  const roleDistribution = useMemo(() => {
    if (!summary) return [];
    return [
      ['Lecturers', summary.lecturers ?? 0],
      ['Technicians', summary.technicians ?? 0],
      ['Managers', summary.managers ?? 0],
      ['Students', summary.students ?? 0],
    ];
  }, [summary]);

  if (!isAdmin) {
    return (
      <div style={{ ...CARD_STYLE, color: '#fcd34d' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Restricted Area</h3>
        <p style={{ marginBottom: 0 }}>Only admins can view audit details.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={CARD_STYLE}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Role Distribution</h3>
        {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
        {!summary ? (
          <p style={{ color: '#9ca3af', marginBottom: 0 }}>Loading summary...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {roleDistribution.map(([label, value]) => (
              <div key={label} style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px' }}>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ margin: '6px 0 0 0', color: '#fff', fontSize: '24px', fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={CARD_STYLE}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Recent Staff Records</h3>
        {staff.length === 0 ? (
          <p style={{ color: '#9ca3af', marginBottom: 0 }}>No records to show.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db' }}>
            {staff.map((member) => (
              <li key={member.id} style={{ marginBottom: '8px' }}>
                {member.name} ({member.email}) - {String(member.role || '').toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ShortcutButtonStyle = {
  backgroundColor: '#1f2937',
  color: '#fff',
  border: '1px solid #374151',
  borderRadius: '8px',
  padding: '10px 14px',
  cursor: 'pointer',
};

const MiniButtonStyle = {
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 12px',
  cursor: 'pointer',
};

const LabelStyle = {
  color: '#d1d5db',
  fontSize: '14px',
  marginBottom: '8px',
  display: 'block',
};

const InputStyle = {
  width: '100%',
  padding: '11px',
  borderRadius: '6px',
  border: '1px solid #374151',
  backgroundColor: '#1f2937',
  color: 'white',
  outline: 'none',
  margin: 0,
};

const TableHeadStyle = {
  textAlign: 'left',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#9ca3af',
  padding: '10px 8px',
};

const TableCellStyle = {
  padding: '10px 8px',
  fontSize: '14px',
};

function MetricCard({ title, value, borderColor }) {
  return (
    <div style={{ ...CARD_STYLE, borderLeft: `4px solid ${borderColor}` }}>
      <p style={{ color: '#9ca3af', margin: '0 0 6px 0', fontSize: '13px' }}>{title}</p>
      <h2 style={{ color: 'white', margin: 0, fontSize: '30px' }}>{value}</h2>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type, placeholder, required }) {
  return (
    <div>
      <label style={LabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={InputStyle}
        required={required}
      />
    </div>
  );
}
