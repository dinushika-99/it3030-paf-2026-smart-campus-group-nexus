import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axiosClient';
import { SITE_BRAND } from './siteConfig';

const API_BASE = 'http://localhost:8081';

export default function AdminDashboard({ user: userProp }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('command-center');
  const [user, setUser] = useState(userProp || null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    email: '',
    studentId: '',
  });
  const [profileNotice, setProfileNotice] = useState('');
  const [profileNoticeTone, setProfileNoticeTone] = useState('success');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const profileAvatarInputRef = useRef(null);

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
  const isManager = user?.role === 'manager';
  const roleLabel = isAdmin ? 'Admin' : 'Manager';

  const navigationTabs = useMemo(() => {
    const baseTabs = [
      'command-center',
      'asset-directory',
      'scheduling',
      'incident-desk',
      'dispatch',
    ];

    if (isAdmin) {
      return [...baseTabs, 'admin-users', 'admin-communication'];
    }

    return [...baseTabs, 'manager-ops', 'manager-communication'];
  }, [isAdmin]);

  useEffect(() => {
    if (!navigationTabs.includes(activeTab)) {
      setActiveTab('command-center');
    }
  }, [activeTab, navigationTabs]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', null, { skipAuthRefresh: true });
    } catch (err) {
      // Continue with client-side logout even if network fails.
    }
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  const handleOpenProfile = useCallback(() => {
    setProfileOpen(true);
    setProfileTab('profile');
    setProfileNotice('');
    setProfileNoticeTone('success');
  }, []);

  const selectProfileTab = useCallback((tab) => {
    setProfileTab(tab);
    setProfileNotice('');
  }, []);

  const triggerProfileAvatarPick = useCallback(() => {
    profileAvatarInputRef.current?.click();
  }, []);

  const handleProfileDraft = useCallback((field, value) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const saveProfileDraft = useCallback(async () => {
    const name = String(profileDraft.name || '').trim();
    const email = String(profileDraft.email || '').trim();
    const studentId = String(profileDraft.studentId || '').trim();

    if (!name || !email) {
      setProfileNotice('Name and email are required.');
      setProfileNoticeTone('error');
      return;
    }

    setProfileSaving(true);
    setProfileNotice('');

    try {
      const response = await api.put('/api/profile/me', {
        name,
        email,
        studentId: studentId || null,
      });

      const nextUser = {
        ...user,
        ...(response.data?.user || {}),
        role: String(response.data?.user?.role || user?.role || '').toLowerCase(),
      };

      setUser(nextUser);
      localStorage.setItem('smartCampusUser', JSON.stringify(nextUser));

      setProfileNotice(response.data?.message || 'Profile updated successfully.');
      setProfileNoticeTone('success');
    } catch (error) {
      setProfileNotice(error.response?.data?.error || 'Could not update profile.');
      setProfileNoticeTone('error');
    } finally {
      setProfileSaving(false);
    }
  }, [profileDraft, user]);

  const handleProfileAvatarChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!String(file.type || '').startsWith('image/')) {
      setProfileNotice('Please select an image file.');
      setProfileNoticeTone('error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileNotice('Image must be under 2MB.');
      setProfileNoticeTone('error');
      return;
    }

    setProfileAvatarUploading(true);
    setProfileNotice('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const nextAvatarUrl = response.data?.avatarUrl;
      if (nextAvatarUrl) {
        setAvatarUrl((prev) => {
          if (prev && prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
          }
          return `${API_BASE}${nextAvatarUrl}?t=${Date.now()}`;
        });

        setUser((prev) => {
          const next = {
            ...prev,
            avatarUrl: nextAvatarUrl,
          };
          localStorage.setItem('smartCampusUser', JSON.stringify(next));
          return next;
        });
      }

      setProfileNotice('Profile photo updated.');
      setProfileNoticeTone('success');
    } catch (error) {
      setProfileNotice(error.response?.data?.error || 'Could not upload profile photo.');
      setProfileNoticeTone('error');
    } finally {
      setProfileAvatarUploading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileDraft({
      name: user.name || '',
      email: user.email || '',
      studentId: user.studentId || '',
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

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
          const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setNotifications(sorted);
        }
      })
      .catch(() => {});
  }, [user, refreshKey]);

  if (!user) {
    return <div style={{ color: '#e5e7eb', minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1120' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'system-ui, sans-serif' }}>
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

          <button
            onClick={handleOpenProfile}
            style={{ marginTop: '16px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer' }}
          >
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
          </button>
        </div>

        <div className="admin-nav-group">
          <MenuCategory title="Main" />
          <NavButton active={activeTab === 'command-center'} onClick={() => setActiveTab('command-center')} text="Command Center" icon="dashboard" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Operations" />
          <NavButton active={false} onClick={() => navigate('/admin/tickets')} text="Ticket Management" icon="ticket" />
          <NavButton active={activeTab === 'asset-directory'} onClick={() => setActiveTab('asset-directory')} text="Asset Directory" icon="asset" />
          <NavButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} text="Resource Scheduling" icon="schedule" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Resolution" />
          <NavButton active={activeTab === 'incident-desk'} onClick={() => setActiveTab('incident-desk')} text="Incident Desk" icon="incident" />
          <NavButton active={activeTab === 'dispatch'} onClick={() => setActiveTab('dispatch')} text="Active Dispatch" icon="dispatch" />

          <div style={{ marginTop: '14px' }}></div>
          {isAdmin && (
            <>
              <MenuCategory title="Administration" />
              <NavButton active={activeTab === 'admin-users'} onClick={() => setActiveTab('admin-users')} text="Access & Identity" icon="identity" />
              <NavButton active={activeTab === 'admin-communication'} onClick={() => setActiveTab('admin-communication')} text="Broadcast & Audit" icon="audit" />
            </>
          )}

          {isManager && (
            <>
              <MenuCategory title="Manager Workspace" />
              <NavButton active={activeTab === 'manager-ops'} onClick={() => setActiveTab('manager-ops')} text="Team Operations" icon="identity" />
              <NavButton active={activeTab === 'manager-communication'} onClick={() => setActiveTab('manager-communication')} text="Service Updates" icon="audit" />
            </>
          )}
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
            <TopNavIconButton label="Profile" onClick={handleOpenProfile}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </TopNavIconButton>

            <TopNavIconButton label="Notifications" onClick={() => {
              setProfileOpen(true);
              setProfileTab('notifications');
              setProfileNotice('');
            }}>
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

        {activeTab === 'command-center' && (
          isAdmin
            ? <OverviewTab onJump={setActiveTab} refreshKey={refreshKey} />
            : <ManagerOverviewTab notifications={notifications} onJump={setActiveTab} />
        )}
        {activeTab === 'asset-directory' && <PlaceholderPanel title="Asset Directory" description="Track spaces, facilities, and assets across NEXUS." />}
        {activeTab === 'scheduling' && <PlaceholderPanel title="Resource Scheduling" description="Manage bookings, time slots, and allocation calendars." />}
        {activeTab === 'incident-desk' && <PlaceholderPanel title="Incident Desk" description="Review, triage, and resolve technical incidents." />}
        {activeTab === 'dispatch' && <PlaceholderPanel title="Active Dispatch" description="Coordinate live assignments for technician teams." />}
        {activeTab === 'admin-users' && <AdminUsersTab isAdmin={isAdmin} refreshKey={refreshKey} onChanged={() => setRefreshKey((v) => v + 1)} />}
        {activeTab === 'admin-communication' && <AdminCommunicationTab isAdmin={isAdmin} refreshKey={refreshKey} />}
        {activeTab === 'manager-ops' && <ManagerOpsTab notifications={notifications} />}
        {activeTab === 'manager-communication' && <ManagerCommunicationTab notifications={notifications} />}

        {profileOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 8, 20, 0.62)',
              backdropFilter: 'blur(9px)',
              WebkitBackdropFilter: 'blur(9px)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
            onClick={() => setProfileOpen(false)}
          >
            <div
              style={{
                width: 'min(980px, 100%)',
                minHeight: 'min(640px, 88vh)',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#0b1120',
                border: '1px solid #334155',
                boxShadow: '0 35px 80px rgba(0,0,0,0.45)',
                display: 'grid',
                gridTemplateColumns: '230px 1fr',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <aside style={{ borderRight: '1px solid #334155', background: '#111827', padding: '20px 14px' }}>
                <div style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', marginBottom: '18px' }}>
                  <div style={{ width: '78px', height: '78px', borderRadius: '999px', background: '#0f172a', color: '#BF932A', border: '2px solid #BF932A', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '26px', overflow: 'hidden' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#fff' }}>{user.name}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>{roleLabel}</p>
                </div>

                <AdminProfileTabButton active={profileTab === 'profile'} onClick={() => selectProfileTab('profile')} icon="👤" label="Profile" />
                <AdminProfileTabButton active={profileTab === 'edit'} onClick={() => selectProfileTab('edit')} icon="✏️" label="Edit Profile" />
                <AdminProfileTabButton active={profileTab === 'notifications'} onClick={() => selectProfileTab('notifications')} icon="🔔" label="Notifications" />
                <AdminProfileTabButton active={profileTab === 'account'} onClick={() => selectProfileTab('account')} icon="⚙️" label="Account Settings" />
              </aside>

              <section style={{ padding: '26px 28px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '26px', color: '#fff' }}>
                    {profileTab === 'profile' && 'Profile'}
                    {profileTab === 'edit' && 'Edit Profile'}
                    {profileTab === 'notifications' && 'Notifications'}
                    {profileTab === 'account' && 'Account Settings'}
                  </h2>
                  <button onClick={() => setProfileOpen(false)} style={{ border: '1px solid #334155', background: '#111827', color: '#e5e7eb', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>

                {profileNotice && (
                  <p style={{ marginTop: 0, marginBottom: '14px', padding: '10px 12px', borderRadius: '10px', border: profileNoticeTone === 'success' ? '1px solid #14532d' : '1px solid #7f1d1d', color: profileNoticeTone === 'success' ? '#86efac' : '#fca5a5', background: profileNoticeTone === 'success' ? 'rgba(20,83,45,0.26)' : 'rgba(127,29,29,0.22)' }}>
                    {profileNotice}
                  </p>
                )}

                {profileTab === 'profile' && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ border: '1px solid #334155', background: '#111827', borderRadius: '12px', padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Full Name</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff' }}>{user.name || '—'}</p>
                    </div>
                    <div style={{ border: '1px solid #334155', background: '#111827', borderRadius: '12px', padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Role</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{roleLabel}</p>
                    </div>
                    <div style={{ border: '1px solid #334155', background: '#111827', borderRadius: '12px', padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Email</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff' }}>{user.email || '—'}</p>
                    </div>
                  </div>
                )}

                {profileTab === 'edit' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: '1 / -1', display: 'grid', justifyItems: 'center', textAlign: 'center', marginBottom: '2px' }}>
                      <button
                        onClick={triggerProfileAvatarPick}
                        disabled={profileAvatarUploading}
                        style={{ width: '92px', height: '92px', borderRadius: '999px', border: '2px solid #BF932A', background: '#111827', color: '#BF932A', fontWeight: 700, fontSize: '30px', cursor: profileAvatarUploading ? 'not-allowed' : 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0, opacity: profileAvatarUploading ? 0.8 : 1 }}
                        title="Change profile photo"
                      >
                        {avatarUrl
                          ? <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (profileDraft.name || user.name || 'U').charAt(0).toUpperCase()}
                      </button>
                      <input
                        ref={profileAvatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfileAvatarChange}
                      />
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        {profileAvatarUploading ? 'Uploading photo...' : 'Edit profile photo'}
                      </p>
                    </div>
                    <AdminProfileField label="Full Name" value={profileDraft.name} onChange={(v) => handleProfileDraft('name', v)} />
                    <AdminProfileField label="Email" value={profileDraft.email} onChange={(v) => handleProfileDraft('email', v)} />
                    <AdminProfileField label="Staff ID" value={profileDraft.studentId} onChange={(v) => handleProfileDraft('studentId', v)} />
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button onClick={saveProfileDraft} disabled={profileSaving} style={{ border: 'none', background: '#BF932A', color: '#111827', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.8 : 1 }}>
                        {profileSaving ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button onClick={() => setProfileDraft({
                        name: user.name || '',
                        email: user.email || '',
                        studentId: user.studentId || '',
                      })} style={{ border: '1px solid #334155', background: '#111827', color: '#e5e7eb', borderRadius: '10px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {profileTab === 'notifications' && (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {notifications.length === 0 && <p style={{ margin: 0, color: '#9ca3af' }}>No notifications available.</p>}
                    {notifications.map((item, index) => (
                      <div key={item.id || index} style={{ border: '1px solid #334155', background: '#111827', borderRadius: '12px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{item.title || 'Notification'}</p>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{item.type || 'GENERAL'}</span>
                        </div>
                        <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '13px' }}>{item.message || 'No message provided.'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {profileTab === 'account' && (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ border: '1px solid #334155', borderRadius: '12px', background: '#111827', padding: '14px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Role</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{roleLabel}</p>
                    </div>
                    <div style={{ border: '1px solid #334155', borderRadius: '12px', background: '#111827', padding: '14px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Email</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff' }}>{user.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button style={{ border: '1px solid #334155', background: '#0f172a', borderRadius: '10px', padding: '10px 14px', color: '#94a3b8', fontWeight: 600, cursor: 'not-allowed', opacity: 0.7 }} disabled>
                        Change Password
                      </button>
                      <button onClick={handleLogout} style={{ border: 'none', background: '#BF932A', borderRadius: '10px', padding: '10px 14px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}>
                        Logout Now
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
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
  'manager-ops': 'Team Operations',
  'manager-communication': 'Service Updates',
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
  if (type === 'ticket') {
    return (
      <svg {...common}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"></path><path d="M9 9v6"></path><path d="M15 9v6"></path></svg>
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

const AdminProfileField = ({ label, value, onChange }) => (
  <label style={{ display: 'grid', gap: '6px' }}>
    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: '#e5e7eb', background: '#111827', outline: 'none' }}
    />
  </label>
);

const AdminProfileTabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      border: active ? 'none' : '1px solid #334155',
      borderRadius: '10px',
      background: active ? '#BF932A' : '#0f172a',
      color: active ? '#111827' : '#d1d5db',
      padding: '10px 12px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700,
      cursor: 'pointer',
      textAlign: 'left',
    }}
  >
    <span aria-hidden="true">{icon}</span>
    <span>{label}</span>
  </button>
);

function OverviewTab({ onJump, refreshKey }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/api/admin/summary')
      .then((res) => res.data)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, [refreshKey]);

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

function ManagerOverviewTab({ notifications, onJump }) {
  const totalNotifications = notifications.length;
  const unreadNotifications = notifications.filter((item) => !item.isRead && !item.read).length;
  const warningCount = notifications.filter((item) => String(item.type || '').toUpperCase() === 'WARNING').length;

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <MetricCard title="Assigned Alerts" value={totalNotifications} borderColor="#BF932A" />
        <MetricCard title="Unread" value={unreadNotifications} borderColor="#ef4444" />
        <MetricCard title="Warnings" value={warningCount} borderColor="#f59e0b" />
      </div>

      <div style={{ ...CARD_STYLE, color: '#d1d5db' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Manager Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={() => onJump('manager-ops')} style={ShortcutButtonStyle}>Open Team Operations</button>
          <button onClick={() => onJump('manager-communication')} style={ShortcutButtonStyle}>Review Service Updates</button>
          <button onClick={() => onJump('dispatch')} style={ShortcutButtonStyle}>Check Dispatch Queue</button>
        </div>
      </div>
    </div>
  );
}

function ManagerOpsTab({ notifications }) {
  const recent = notifications.slice(0, 6);

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={CARD_STYLE}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Team Operations Board</h3>
        <p style={{ marginTop: 0, color: '#9ca3af' }}>
          Manager workspace for coordinating field updates and prioritizing service issues.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <ManagerBadge title="High Priority" value={recent.filter((n) => String(n.type || '').toUpperCase() === 'ALERT').length} />
          <ManagerBadge title="Warnings" value={recent.filter((n) => String(n.type || '').toUpperCase() === 'WARNING').length} />
          <ManagerBadge title="Recent Updates" value={recent.length} />
        </div>
      </div>

      <div style={CARD_STYLE}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Recommended Workflow</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db' }}>
          <li style={{ marginBottom: '8px' }}>Review new alerts from the Notifications tab in your profile panel.</li>
          <li style={{ marginBottom: '8px' }}>Coordinate with technicians using the Dispatch workspace.</li>
          <li>Escalate critical cases to administrators when policy-level changes are required.</li>
        </ul>
      </div>
    </div>
  );
}

function ManagerCommunicationTab({ notifications }) {
  return (
    <div style={CARD_STYLE}>
      <h3 style={{ marginTop: 0, color: '#fff' }}>Service Updates</h3>
      {notifications.length === 0 ? (
        <p style={{ marginBottom: 0, color: '#9ca3af' }}>No updates available for your team.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {notifications.slice(0, 10).map((item, index) => (
            <div key={item.id || index} style={{ border: '1px solid #334155', background: '#0f172a', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700 }}>{item.title || 'Update'}</p>
                <span style={{ color: '#BF932A', fontSize: '11px', letterSpacing: '0.5px' }}>{String(item.type || 'INFO').toUpperCase()}</span>
              </div>
              <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '13px' }}>{item.message || 'No details provided.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManagerBadge({ title, value }) {
  return (
    <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px' }}>
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
      <p style={{ margin: '6px 0 0 0', color: '#fff', fontSize: '24px', fontWeight: 700 }}>{value}</p>
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
      const res = await api.post('/api/users/invite', {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.newRole,
      });

      const data = res.data || {};

      const tempPassword = data.defaultPassword ? ` Temporary password: ${data.defaultPassword}` : '';
      setSuccess((data.message || 'Account created successfully.') + tempPassword);
      setForm({ name: '', email: '', newRole: 'technician' });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while creating account.');
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
    api.get('/api/users')
      .then((res) => {
        const data = res.data;
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
      await api.patch(`/api/users/${id}/role`, { role: newRole });

      setMessage('Role updated successfully.');
      onChanged();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while updating role.');
    }
  };

  const deleteStaff = async (id, name) => {
    setError('');
    setMessage('');

    const confirmed = window.confirm(`Delete ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/users/${id}`);

      setMessage('User deleted successfully.');
      onChanged();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while deleting user.');
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
      await api.post('/api/admin/notifications/broadcast', form);

      setSuccess('Broadcast sent successfully.');
      setForm({ title: '', message: '', type: 'INFO', targetRole: 'ALL' });
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while sending broadcast.');
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
      api.get('/api/admin/summary').then((res) => res.data),
      api.get('/api/users').then((res) => res.data || []),
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
