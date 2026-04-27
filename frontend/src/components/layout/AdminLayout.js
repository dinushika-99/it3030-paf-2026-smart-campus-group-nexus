import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_BRAND } from '../../siteConfig';
import api from '../../api/axiosClient';

const API_BASE = 'http://localhost:8081';

const getInitials = (name) =>
  String(name || 'AU')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const MenuCategory = ({ title }) => (
  <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 12px 8px 12px', margin: 0 }}>
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
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      marginBottom: '4px',
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

const MenuIcon = ({ type }) => {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (type === 'booking') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M8 14h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 18h.01"></path>
        <path d="M12 18h.01"></path>
        <path d="M16 18h.01"></path>
      </svg>
    );
  }
  if (type === 'ticket') {
    return (
      <svg {...common}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"></path><path d="M9 9v6"></path><path d="M15 9v6"></path></svg>
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
  if (type === 'dashboard') {
    return (
      <svg {...common}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    );
  }
  if (type === 'catalogue') {
    return (
      <svg {...common}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <path d="M8 6h.01"></path>
        <path d="M16 6h.01"></path>
        <path d="M12 6h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 10h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M8 14h.01"></path>
      </svg>
    );
  }
  return (
    <svg {...common}><rect x="6" y="4" width="12" height="16" rx="1"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>
  );
};

const AdminLayout = ({ children, user: userProp, highlightBookings = false }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(userProp || null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }

    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, [userProp]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('smartCampusUser');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Manager' : 'User';

  if (!user) {
    return <div style={{ color: '#e5e7eb', minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1120' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={SITE_BRAND.logoPath}
              alt={SITE_BRAND.logoAlt}
              style={{ width: '46px', height: '46px', objectFit: 'contain' }}
            />
            <h2 style={{ color: '#fff', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>
              {SITE_BRAND.name}
            </h2>
          </div>

          <div style={{ marginTop: '16px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
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

        <div>
          <MenuCategory title="Main" />
          <NavButton onClick={() => navigate('/admin')} text="Command Center" icon="dashboard" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Operations" />
          <NavButton active={highlightBookings} onClick={() => navigate('/admin/bookings')} text="Booking Management" icon="booking" />
          <NavButton onClick={() => navigate('/admin/tickets')} text="Ticket Management" icon="ticket" />
          <NavButton onClick={() => navigate('/admin/assets')} text="Asset Directory" icon="asset" />
          <NavButton onClick={() => navigate('/admin/scheduling')} text="Resource Scheduling" icon="schedule" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Resolution" />
          <NavButton onClick={() => navigate('/admin/incidents')} text="Incident Desk" icon="incident" />
          <NavButton onClick={() => navigate('/admin/dispatch')} text="Active Dispatch" icon="dispatch" />

          {isAdmin && (
            <>
              <div style={{ marginTop: '14px' }}></div>
              <MenuCategory title="Administration" />
              <NavButton onClick={() => navigate('/admin/users')} text="Access & Identity" icon="identity" />
              <NavButton onClick={() => navigate('/admin/communication')} text="Broadcast & Audit" icon="identity" />
            </>
          )}

          {isManager && (
            <>
              <div style={{ marginTop: '14px' }}></div>
              <MenuCategory title="Manager Workspace" />
              <NavButton onClick={() => navigate('/admin/team')} text="Team Operations" icon="identity" />
              <NavButton onClick={() => navigate('/admin/updates')} text="Service Updates" icon="identity" />
            </>
          )}

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Quick Links" />
          <NavButton onClick={() => navigate('/facilities')} text="Facilities Catalogue" icon="catalogue" />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f2937', backgroundColor: '#111827', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '9px 14px', 
              backgroundColor: '#BF932A', 
              color: '#111827', 
              border: 'none', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              fontWeight: 700, 
              fontSize: '13px' 
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
