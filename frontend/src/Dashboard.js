import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SITE_BRAND } from './siteConfig';
import useDashboardProfile from './hooks/useDashboardProfile';

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const {
    notifications,
    profileOpen,
    setProfileOpen,
    profileTab,
    profileDraft,
    profileAvatarUrl,
    profileNotice,
    profileNoticeTone,
    profileSaving,
    profileAvatarUploading,
    passwordForm,
    passwordSaving,
    passwordNotice,
    passwordNoticeTone,
    twoFactorEnabled,
    twoFactorConfigured,
    twoFactorLoading,
    twoFactorBusy,
    twoFactorCode,
    twoFactorSecret,
    twoFactorOtpAuthUri,
    twoFactorNotice,
    twoFactorNoticeTone,
    profileAvatarInputRef,
    passwordStrength,
    openProfile,
    selectProfileTab,
    handleProfileDraft,
    saveProfileDraft,
    resetProfileDraft,
    triggerProfileAvatarPick,
    handleProfileAvatarChange,
    handlePasswordField,
    handleChangePassword,
    setTwoFactorCode,
    startTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    handleLogout,
  } = useDashboardProfile({ user, setUser, navigate });

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
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

  useEffect(() => {
    if (!profileOpen || profileTab !== 'account') {
      setShowPasswordCard(false);
    }
  }, [profileOpen, profileTab]);

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // ==========================================
  // 🎓 STUDENT VIEW
  // ==========================================
  const StudentView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          style={{
            backgroundColor: '#111827',
            border: 'none',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
          }}
        >
          Create Ticket
        </button>
         <button
          type="button"
          onClick={() => navigate('/bookings/my')}
          style={{
            backgroundColor: '#111827',
            border: 'none',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
          }}
        >
          Booking
        </button>
        <button
          type="button"
          onClick={() => navigate('/facilities')}
          style={{
            backgroundColor: '#111827',
            border: 'none',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
          }}
        >
          Facilities
        </button>
      </div>

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
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 55%, #334155 100%)', color: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #0f172a', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Technician Workspace</h3>
        <p style={{ margin: 0, color: '#cbd5e1', maxWidth: '720px' }}>
          Track your assigned tickets, update progress, and record resolution notes from one place.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assigned Queue</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '30px', fontWeight: 800, color: '#111827' }}>Live</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>Update status and resolution notes</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shortcut</p>
          <button
            type="button"
            onClick={() => navigate('/technician/workspace')}
            style={{ marginTop: '8px', backgroundColor: '#BF932A', color: '#111827', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}
          >
            Open Technician Workspace
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return <div style={{ color: '#111827', padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Shared Navbar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/facilities" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '0.8px' }}>{SITE_BRAND.name}</h1>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/facilities')} style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#111827', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Facilities Catalogue
          </button>
          <button onClick={() => navigate('/tickets')} style={{ backgroundColor: '#111827', border: 'none', color: '#ffffff', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Create Ticket
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
                    <button onClick={resetProfileDraft} style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
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
                <div key="profile-tab-account" className="profile-modal-tab-content" style={{ display: 'grid', gap: '14px', maxHeight: 'calc(88vh - 240px)', overflowY: 'auto', paddingRight: '4px', paddingBottom: '12px' }}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Role</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{user.role}</p>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827' }}>{user.email}</p>
                  </div>

                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Password security</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>Use a strong password and update it regularly.</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordCard((prev) => !prev)}
                        style={{
                          border: 'none',
                          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          color: '#ffffff',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 10px 24px rgba(17,24,39,0.22)',
                        }}
                      >
                        {showPasswordCard ? 'Hide Change Password' : 'Change Password'}
                      </button>
                    </div>

                    {showPasswordCard && (
                      <div style={{ marginTop: '12px', border: '1px solid #dbe4ef', borderRadius: '14px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', padding: '14px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <input
                            type={passwordVisibility.currentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordField('currentPassword', e.target.value)}
                            placeholder="Current password"
                            style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', background: '#fff' }}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                            style={{ justifySelf: 'end', border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '-6px' }}
                          >
                            {passwordVisibility.currentPassword ? 'Hide' : 'Show'} current password
                          </button>
                          <input
                            type={passwordVisibility.newPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordField('newPassword', e.target.value)}
                            placeholder="New password"
                            style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', background: '#fff' }}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('newPassword')}
                            style={{ justifySelf: 'end', border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '-6px' }}
                          >
                            {passwordVisibility.newPassword ? 'Hide' : 'Show'} new password
                          </button>
                          {passwordForm.newPassword && (
                            <div style={{ display: 'grid', gap: '6px', marginTop: '-2px' }}>
                              <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.max(8, (passwordStrength.score / 4) * 100)}%`,
                                    height: '100%',
                                    background: passwordStrength.tone,
                                    transition: 'width 0.2s ease',
                                  }}
                                />
                              </div>
                              <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                                Password strength:{' '}
                                <span style={{ fontWeight: 700, color: passwordStrength.tone }}>
                                  {passwordStrength.label}
                                </span>
                              </p>
                            </div>
                          )}
                          <input
                            type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordField('confirmPassword', e.target.value)}
                            placeholder="Confirm new password"
                            style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', background: '#fff' }}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            style={{ justifySelf: 'end', border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '-6px' }}
                          >
                            {passwordVisibility.confirmPassword ? 'Hide' : 'Show'} confirm password
                          </button>
                          {passwordForm.confirmPassword && (
                            <p style={{ margin: 0, fontSize: '12px', color: passwordForm.newPassword === passwordForm.confirmPassword ? '#166534' : '#b91c1c' }}>
                              {passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match.' : 'Passwords do not match yet.'}
                            </p>
                          )}
                        </div>

                        {passwordNotice && (
                          <p
                            style={{
                              margin: '12px 0 0 0',
                              fontSize: '13px',
                              color: passwordNoticeTone === 'success' ? '#166534' : '#b91c1c',
                              background: passwordNoticeTone === 'success' ? '#dcfce7' : '#fee2e2',
                              border: passwordNoticeTone === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
                              borderRadius: '10px',
                              padding: '10px 12px',
                            }}
                          >
                            {passwordNotice}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                          <button
                            onClick={handleChangePassword}
                            disabled={passwordSaving}
                            style={{
                              border: 'none',
                              background: 'linear-gradient(135deg, #c79a2b 0%, #e8bf57 100%)',
                              borderRadius: '10px',
                              padding: '10px 16px',
                              color: '#111827',
                              fontWeight: 800,
                              cursor: passwordSaving ? 'not-allowed' : 'pointer',
                              boxShadow: '0 8px 20px rgba(199,154,43,0.35)',
                              opacity: passwordSaving ? 0.8 : 1,
                            }}
                          >
                            {passwordSaving ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Two-factor authentication (Google Authenticator)</p>
                    <p style={{ margin: '6px 0 12px 0', fontSize: '13px', color: '#475569' }}>
                      Status: <strong>{twoFactorLoading ? 'Checking...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}</strong>
                    </p>

                    {!twoFactorEnabled && (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <button
                          onClick={startTwoFactorSetup}
                          disabled={twoFactorBusy}
                          style={{ border: 'none', background: '#111827', borderRadius: '10px', padding: '10px 16px', color: '#fff', fontWeight: 700, cursor: twoFactorBusy ? 'not-allowed' : 'pointer', opacity: twoFactorBusy ? 0.8 : 1 }}
                        >
                          {twoFactorConfigured ? 'Generate New Setup Key' : 'Enable 2FA'}
                        </button>

                        {twoFactorOtpAuthUri && (
                          <div style={{ display: 'grid', gap: '8px', justifyItems: 'start' }}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorOtpAuthUri)}`}
                              alt="Authenticator QR"
                              style={{ width: '180px', height: '180px', border: '1px solid #e5e7eb', borderRadius: '10px' }}
                            />
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Manual key:</p>
                            <code style={{ fontSize: '12px', padding: '7px 9px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px' }}>{twoFactorSecret}</code>
                          </div>
                        )}

                        {(twoFactorConfigured || twoFactorOtpAuthUri) && (
                          <>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit code"
                              inputMode="numeric"
                              maxLength={6}
                              style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px' }}
                            />
                            <button
                              onClick={enableTwoFactor}
                              disabled={twoFactorBusy}
                              style={{ border: 'none', background: '#BF932A', borderRadius: '10px', padding: '10px 16px', color: '#111827', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer', opacity: twoFactorBusy ? 0.8 : 1 }}
                            >
                              Confirm and Enable 2FA
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {twoFactorEnabled && (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>To disable 2FA, enter the current code from your authenticator app.</p>
                        <input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          inputMode="numeric"
                          maxLength={6}
                          style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 12px', fontSize: '14px' }}
                        />
                        <button
                          onClick={disableTwoFactor}
                          disabled={twoFactorBusy}
                          style={{ border: '1px solid #b91c1c', background: '#fee2e2', borderRadius: '10px', padding: '10px 16px', color: '#991b1b', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer', opacity: twoFactorBusy ? 0.8 : 1 }}
                        >
                          Disable 2FA
                        </button>
                      </div>
                    )}

                    {twoFactorNotice && (
                      <p
                        style={{
                          margin: '12px 0 0 0',
                          fontSize: '13px',
                          color: twoFactorNoticeTone === 'success' ? '#166534' : '#b91c1c',
                          background: twoFactorNoticeTone === 'success' ? '#dcfce7' : '#fee2e2',
                          border: twoFactorNoticeTone === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
                          borderRadius: '10px',
                          padding: '10px 12px',
                        }}
                      >
                        {twoFactorNotice}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        border: 'none',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1f2937 100%)',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        color: '#fff',
                        fontWeight: 800,
                        letterSpacing: '0.3px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 26px rgba(15,23,42,0.28)',
                      }}
                    >
                      Logout
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
