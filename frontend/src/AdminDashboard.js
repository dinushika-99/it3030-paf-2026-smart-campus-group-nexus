import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user: userProp }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('command-center');
  const [user, setUser] = useState(userProp || null);

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

  if (!user) {
    return <div style={{ color: '#e5e7eb', minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1120' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #374151' }}>
          <img
            src={`${process.env.PUBLIC_URL}/LOGO.png`}
            alt="NEXUS logo"
            style={{ width: '42px', height: '42px', objectFit: 'contain', marginBottom: '12px' }}
          />
          <h2 style={{ color: '#fff', margin: 0, fontSize: '22px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ backgroundColor: '#BF932A', color: '#000', padding: '4px 8px', borderRadius: '6px', fontSize: '14px' }}>NX</span>
            NEXUS <span style={{ color: '#BF932A' }}>HQ</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <MenuCategory title="Main" />
          <NavButton active={activeTab === 'command-center'} onClick={() => setActiveTab('command-center')} text="Command Center" icon="📊" />

          <div style={{ marginTop: '15px' }}></div>
          <MenuCategory title="Operations" />
          <NavButton active={activeTab === 'asset-directory'} onClick={() => setActiveTab('asset-directory')} text="Asset Directory" icon="🏢" />
          <NavButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} text="Resource Scheduling" icon="📅" />

          <div style={{ marginTop: '15px' }}></div>
          <MenuCategory title="Resolution" />
          <NavButton active={activeTab === 'incident-desk'} onClick={() => setActiveTab('incident-desk')} text="Incident Desk" icon="🛠️" />
          <NavButton active={activeTab === 'dispatch'} onClick={() => setActiveTab('dispatch')} text="Active Dispatch" icon="🚀" />

          <div style={{ marginTop: '15px' }}></div>
          <MenuCategory title="Administration" />
          <NavButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} text="Access & Identity" icon="🔐" />
          <NavButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} text="System Audit" icon="📋" />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#1f2937', borderRadius: '8px', borderLeft: '3px solid #BF932A' }}>
            <p style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{user.name || 'Admin User'}</p>
            <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Administrator</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '28px', textTransform: 'capitalize' }}>
            {TAB_TITLES[activeTab] || 'Command Center'}
          </h1>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {activeTab === 'command-center' && <OverviewTab />}
        {activeTab === 'identity' && <AddStaffTab isAdmin={user.role === 'admin'} />}
        {activeTab === 'asset-directory' && <PlaceholderPanel title="Asset Directory" description="Track spaces, facilities, and assets across NEXUS." />}
        {activeTab === 'scheduling' && <PlaceholderPanel title="Resource Scheduling" description="Manage bookings, time slots, and allocation calendars." />}
        {activeTab === 'incident-desk' && <PlaceholderPanel title="Incident Desk" description="Review, triage, and resolve technical incidents." />}
        {activeTab === 'dispatch' && <PlaceholderPanel title="Active Dispatch" description="Coordinate live assignments for technician teams." />}
        {activeTab === 'audit' && <PlaceholderPanel title="System Audit" description="Inspect access logs, policy events, and system checks." />}
      </div>
    </div>
  );
}

const TAB_TITLES = {
  'command-center': 'Command Center',
  'asset-directory': 'Asset Directory',
  'scheduling': 'Resource Scheduling',
  'incident-desk': 'Incident Desk',
  'dispatch': 'Active Dispatch',
  'identity': 'Access & Identity',
  'audit': 'System Audit',
};

const MenuCategory = ({ title }) => (
  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.1px', fontWeight: 700 }}>
    {title}
  </p>
);

const NavButton = ({ active, onClick, text, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 15px',
      backgroundColor: active ? '#BF932A' : 'transparent',
      color: active ? '#000' : '#d1d5db',
      border: active ? 'none' : '1px solid #1f2937',
      borderRadius: '8px',
      textAlign: 'left',
      fontSize: '15px',
      fontWeight: active ? 'bold' : '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}
  >
    <span>{icon}</span>
    <span>{text}</span>
  </button>
);

const PlaceholderPanel = ({ title, description }) => (
  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', color: 'white', border: '1px solid #1f2937' }}>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    <p style={{ color: '#9ca3af', marginBottom: 0 }}>{description}</p>
  </div>
);

const OverviewTab = () => (
  <div>
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
    <div style={{ backgroundColor: '#111827', padding: '30px', borderRadius: '12px', maxWidth: '600px' }}>
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
