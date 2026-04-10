import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_BRAND } from './siteConfig';

export default function Dashboard() {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    email: '',
    studentId: '',
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileNoticeTone, setProfileNoticeTone] = useState('success');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const profileAvatarInputRef = useRef(null);

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setProfileDraft({
        name: parsed.name || '',
        email: parsed.email || '',
        studentId: parsed.studentId || '',
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Redirect admins and managers to the dedicated shared dashboard
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Fetch user's notifications (kept simple for now)
  useEffect(() => {
    if (!user) return;

    fetch('http://localhost:8081/api/profile/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const normalized = {
          ...user,
          ...data,
          role: (data.role || user.role || '').toLowerCase(),
        };
        setUser(normalized);
        setProfileDraft({
          name: normalized.name || '',
          email: normalized.email || '',
          studentId: normalized.studentId || '',
        });
        localStorage.setItem('smartCampusUser', JSON.stringify(normalized));
      })
      .catch(() => {});

    fetch('http://localhost:8081/api/profile/avatar', { credentials: 'include' })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setProfileAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      })
      .catch(() => {});

    fetch('http://localhost:8081/api/notifications/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setNotifications(sorted);
          setUnreadCount(sorted.filter((n) => !n.isRead && !n.read).length);
        }
      })
      .catch((err) => console.error('Failed to fetch notifications', err));
  }, [user]);

  const openProfile = () => {
    setProfileOpen(true);
    setProfileTab('profile');
    setProfileNotice('');
  };

  const selectProfileTab = (tab) => {
    setProfileTab(tab);
    setProfileNotice('');
  };

  const handleProfileDraft = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfileDraft = async () => {
    setProfileNotice('');
    setProfileSaving(true);

    try {
      const res = await fetch('http://localhost:8081/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: profileDraft.name,
          email: profileDraft.email,
          studentId: profileDraft.studentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileNoticeTone('error');
        setProfileNotice(data.error || 'Could not save profile.');
        return;
      }

      const normalizedUser = {
        ...user,
        ...(data.user || {}),
        role: (data.user?.role || user.role || '').toLowerCase(),
      };

      setUser(normalizedUser);
      setProfileDraft({
        name: normalizedUser.name || '',
        email: normalizedUser.email || '',
        studentId: normalizedUser.studentId || '',
      });
      localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));

      setProfileNoticeTone('success');
      setProfileNotice('Profile saved successfully.');
      setProfileTab('profile');
    } catch (err) {
      setProfileNoticeTone('error');
      setProfileNotice('Network error while saving profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const triggerProfileAvatarPick = () => {
    profileAvatarInputRef.current?.click();
  };

  const handleProfileAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfileAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });

    const formData = new FormData();
    formData.append('file', file);

    setProfileAvatarUploading(true);
    setProfileNotice('');
    try {
      const res = await fetch('http://localhost:8081/api/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileNoticeTone('error');
        setProfileNotice(data.error || 'Could not update profile photo.');
        return;
      }

      setProfileNoticeTone('success');
      setProfileNotice('Profile photo updated successfully.');
    } catch (err) {
      setProfileNoticeTone('error');
      setProfileNotice('Network error while uploading profile photo.');
    } finally {
      setProfileAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  // ==========================================
  // 🎓 STUDENT VIEW
  // ==========================================
  const StudentView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', borderTop: '4px solid #BF932A' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>My Academics</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Program (Year 3)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>BSc Data Science</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Priority</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>TPSM Group Project</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Student Tools</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer' }}>Book Library Room</button>
          <button style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer' }}>Cafe Pre-order</button>
          <button style={{ backgroundColor: '#BF932A', border: 'none', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer', fontWeight: '700', gridColumn: 'span 2' }}>Submit TPSM Proposal</button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 👨‍🏫 LECTURER VIEW
  // ==========================================
  const LecturerView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', borderTop: '4px solid #BF932A' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Lecturer Control Panel</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Faculty of Computing</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
               <span style={{ display: 'block', fontSize: '20px', fontWeight: '700', color: '#BF932A' }}>12</span>
               <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending Proposals</span>
             </div>
             <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
               <span style={{ display: 'block', fontSize: '20px', fontWeight: '700', color: '#374151' }}>2</span>
               <span style={{ fontSize: '12px', color: '#6b7280' }}>Lectures Today</span>
             </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Lecturer Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
          <button style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer', textAlign: 'left' }}>
            Review TPSM Proposals
          </button>
          <button style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer', textAlign: 'left' }}>
            Post Module Announcement
          </button>
          <button style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', color: '#111827', cursor: 'pointer', textAlign: 'left' }}>
            Schedule Consultation Hours
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 🛠 TECHNICIAN VIEW
  // ==========================================
  const TechnicianView = () => (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', borderTop: '4px solid #BF932A' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#111827' }}>Technician Dashboard</h3>
      <p style={{ margin: 0, color: '#4b5563' }}>View and manage IT support tickets and campus systems health.</p>
    </div>
  );

  if (!user) {
    return <div style={{ color: '#111827', padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Shared Navbar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '0.8px' }}>{SITE_BRAND.name}</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/tickets')} style={{ backgroundColor: '#111827', border: 'none', color: '#ffffff', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Create Ticket
          </button>
          <button onClick={() => navigate('/profile')} style={{ backgroundColor: 'transparent', border: '1px solid #d1d5db', color: '#374151', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Profile
          </button>

          <div style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
            <button
              onClick={openProfile}
              title="Open profile"
              style={{ width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: '#111827', color: '#fff', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0 }}
            >
              {profileAvatarUrl
                ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.name || 'U').charAt(0).toUpperCase()}
            </button>
            <button
              onClick={openProfile}
              style={{ margin: '3px 0 0 0', padding: 0, border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#111827', cursor: 'pointer', lineHeight: 1.1 }}
            >
              {user.name}
            </button>
          </div>
        </div>
      </nav>

      {/* Shared Content Area */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 5px 0', color: '#111827' }}>Welcome back, {user.name}.</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {user.role === 'lecturer' ? "Here is your academic overview for today." : "Here is what's happening around campus today."}
          </p>
        </header>

        {/* Dynamic Rendering based on role */}
        {user.role === 'technician' && <TechnicianView />}
        {user.role === 'lecturer' && <LecturerView />}
        {user.role === 'student' && <StudentView />}
        {!['technician', 'lecturer', 'student'].includes(user.role) && <StudentView />}
        
      </div>

      {profileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 16, 31, 0.42)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 35px 80px rgba(0,0,0,0.28)',
              display: 'grid',
              gridTemplateColumns: '230px 1fr',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <aside style={{ borderRight: '1px solid #e5e7eb', background: '#f8fafc', padding: '20px 14px' }}>
              <div style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ width: '78px', height: '78px', borderRadius: '999px', background: '#111827', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '26px', overflow: 'hidden' }}>
                  {profileAvatarUrl
                    ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <p style={{ margin: '10px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#111827' }}>{user.name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{user.role}</p>
              </div>

              <ProfileTabButton active={profileTab === 'profile'} onClick={() => selectProfileTab('profile')} icon="👤" label="Profile" />
              <ProfileTabButton active={profileTab === 'edit'} onClick={() => selectProfileTab('edit')} icon="✏️" label="Edit Profile" />
              <ProfileTabButton active={profileTab === 'notifications'} onClick={() => selectProfileTab('notifications')} icon="🔔" label="Notifications" />
              <ProfileTabButton active={profileTab === 'account'} onClick={() => selectProfileTab('account')} icon="⚙️" label="Account Settings" />
            </aside>

            <section style={{ padding: '26px 28px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>
                  {profileTab === 'profile' && 'Profile'}
                  {profileTab === 'edit' && 'Edit Profile'}
                  {profileTab === 'notifications' && 'Notifications'}
                  {profileTab === 'account' && 'Account Settings'}
                </h2>
                <button onClick={() => setProfileOpen(false)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>

              {profileNotice && (
                <p className={profileNoticeTone === 'success' ? 'profile-modal-success' : 'profile-modal-error'}>{profileNotice}</p>
              )}

              {profileTab === 'profile' && (
                <div key="profile-tab-profile" className="profile-modal-tab-content" style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Full Name</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827' }}>{user.name || '—'}</p>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Role</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{user.role || 'student'}</p>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827' }}>{user.email || '—'}</p>
                  </div>
                </div>
              )}

              {profileTab === 'edit' && (
                <div key="profile-tab-edit" className="profile-modal-tab-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1', display: 'grid', justifyItems: 'center', textAlign: 'center', marginBottom: '2px' }}>
                    <button
                      onClick={triggerProfileAvatarPick}
                      disabled={profileAvatarUploading}
                      style={{ width: '92px', height: '92px', borderRadius: '999px', border: 'none', background: '#111827', color: '#fff', fontWeight: 700, fontSize: '30px', cursor: profileAvatarUploading ? 'not-allowed' : 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0, opacity: profileAvatarUploading ? 0.8 : 1 }}
                      title="Change profile photo"
                    >
                      {profileAvatarUrl
                        ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (profileDraft.name || user.name || 'U').charAt(0).toUpperCase()}
                    </button>
                    <input
                      ref={profileAvatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfileAvatarChange}
                    />
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      {profileAvatarUploading ? 'Uploading photo...' : 'Edit profile photo'}
                    </p>
                  </div>
                  <Field label="Full Name" value={profileDraft.name} onChange={(v) => handleProfileDraft('name', v)} />
                  <Field label="Email" value={profileDraft.email} onChange={(v) => handleProfileDraft('email', v)} />
                  <Field label="Student/Lecturer ID" value={profileDraft.studentId} onChange={(v) => handleProfileDraft('studentId', v)} />
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button onClick={saveProfileDraft} disabled={profileSaving} style={{ border: 'none', background: '#BF932A', color: '#111827', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.8 : 1 }}>
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button onClick={() => setProfileDraft({
                      name: user.name || '',
                      email: user.email || '',
                      studentId: user.studentId || '',
                    })} style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {profileTab === 'notifications' && (
                <div key="profile-tab-notifications" className="profile-modal-tab-content" style={{ display: 'grid', gap: '10px' }}>
                  {notifications.length === 0 && <p style={{ margin: 0, color: '#6b7280' }}>No notifications available.</p>}
                  {notifications.map((item, index) => (
                    <div key={item.id || index} style={{ border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '12px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{item.title || 'Notification'}</p>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.type || 'GENERAL'}</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: '#4b5563', fontSize: '13px' }}>{item.message || 'No message provided.'}</p>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'account' && (
                <div key="profile-tab-account" className="profile-modal-tab-content" style={{ display: 'grid', gap: '14px' }}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Role</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{user.role}</p>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827' }}>{user.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '10px', padding: '10px 14px', color: '#374151', fontWeight: 600, cursor: 'not-allowed', opacity: 0.7 }} disabled>
                      Change Password
                    </button>
                    <button onClick={handleLogout} style={{ border: 'none', background: '#111827', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                      Logout Now
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value, onChange }) => (
  <label style={{ display: 'grid', gap: '6px' }}>
    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: '#111827', outline: 'none' }}
    />
  </label>
);

const ProfileTabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      border: active ? 'none' : '1px solid #e5e7eb',
      borderRadius: '10px',
      background: active ? '#BF932A' : '#ffffff',
      color: active ? '#111827' : '#374151',
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
