import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE_BRAND } from "../siteConfig";
import useDashboardProfile from "../hooks/useDashboardProfile";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const safeUser = user || { name: "User" };

  const COLORS = {
    purple: "#B99443"
  };

  const profileAvatarUrl = safeUser?.avatar || null;

  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [activeNotifFilter, setActiveNotifFilter] = useState('ALL');
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
    profileAvatarUrl: dashboardProfileAvatarUrl,
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
    notificationPrefs,
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
    toggleNotificationPreference,
    handleLogout,
  } = useDashboardProfile({ user, setUser, navigate });

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

  const resolvedAvatarUrl = dashboardProfileAvatarUrl || profileAvatarUrl;

  // --- NEW NOTIFICATION LOGIC ---
  // Track how many notifications the user has already seen
  const [viewedNotifCount, setViewedNotifCount] = useState(0);

  // Calculate unread by subtracting viewed from the total
  const totalNotifs = notifications ? notifications.length : 0;
  const unreadCount = Math.max(0, totalNotifs - viewedNotifCount);

  const handleNotificationClick = () => {
    setViewedNotifCount(totalNotifs);  // Marks current notifications as "read"
    selectProfileTab('notifications'); // Sets the tab
    setProfileOpen(true);              // Opens the modal
  };

  return (
    <>
      <nav className="app-navbar">
      <Link to="/dashboard" className="app-navbar-brand">
        <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} />
        <h1>{SITE_BRAND.name}</h1>
      </Link>

      <div className="app-navbar-center">
        <Link to="/dashboard">Home</Link>
        <Link to="/facilities">Facilities</Link>
        <Link to="/bookings/my">Bookings</Link>
        <Link to="/tickets">Tickets</Link>
      </div>

      <div className="app-navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* --- NEW MODERN NOTIFICATION BELL --- */}
          <button
            onClick={handleNotificationClick}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.purple}
            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
              marginRight: '8px'
            }}
            title="Notifications"
          >
            {/* SVG Bell Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            
            {/* Red Unread Badge */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '999px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #ffffff', /* Creates a cutout effect */
                boxSizing: 'border-box'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>


        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
            <button
              onClick={openProfile}
              title="Open profile"
              style={{ width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: COLORS.purple, color: '#fff', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0 }}
            >
              {resolvedAvatarUrl
                ? <img src={resolvedAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (safeUser.name || 'U').charAt(0).toUpperCase()}
            </button>
            <button
              onClick={openProfile}
              style={{ margin: '3px 0 0 0', padding: 0, border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#111827', cursor: 'pointer', lineHeight: 1.1 }}
            >
              {safeUser.name}
            </button>
          </div>

          
        </div>
      </div>
      </nav>

      {/* Profile Modal */}
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
            padding: '100px 20px 40px 20px',
            boxSizing: 'border-box',
            zIndex: 1000,
          }}
          /* The onClick event was removed from here! */
        >
          {/* OUTER WRAPPER */}
          <div
            style={{
              width: 'min(980px, 100%)',
              height: '100%',
              maxHeight: '640px',
              display: 'grid',
              gridTemplateColumns: '230px 1fr',
              gap: '24px',
            }}
            /* The e.stopPropagation() was also removed since it's no longer needed */
          >
            {/* LEFT CARD (Sidebar) */}
            <aside
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                padding: "20px 14px",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box", /* Ensures the padding creates a proper gap at the bottom */
              }}
            >
              <div
                style={{
                  display: "grid",
                  justifyItems: "center",
                  textAlign: "center",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    width: "78px",
                    height: "78px",
                    borderRadius: "999px",
                    background: COLORS.purple,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "26px",
                    overflow: "hidden",
                  }}
                >
                  {resolvedAvatarUrl ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (safeUser.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {safeUser.name}
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "12px",
                    color: "#6b7280",
                    textTransform: "capitalize",
                  }}
                >
                  {safeUser.role}
                </p>
              </div>

              <ProfileTabButton active={profileTab === 'profile'} onClick={() => selectProfileTab('profile')} label="Profile" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'edit'} onClick={() => selectProfileTab('edit')} label="Edit Profile" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'notifications'} onClick={() => selectProfileTab('notifications')} label="Notifications" accent={COLORS.purple} />
              
              {/* --- NEW ACCOUNT SETTINGS SECTION --- */}
              <div style={{ marginTop: '24px', marginBottom: '8px', paddingLeft: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Settings</span>
              </div>
              <ProfileTabButton active={profileTab === 'password'} onClick={() => selectProfileTab('password')} label="Password Security" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'two-factor'} onClick={() => selectProfileTab('two-factor')} label="Two-Factor Auth" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'preferences'} onClick={() => selectProfileTab('preferences')} label="Notification Preferences" accent={COLORS.purple} />

              {/* NEW STYLISH LOGOUT BUTTON */}
              <button
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.target.style.background = "#ef4444"; 
                  e.target.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#111827"; 
                  e.target.style.color = "#ffffff";
                }}
                style={{
                  marginTop: "auto", 
                  width: "100%",
                  border: "none",
                  background: "#111827",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "8px 12px", /* Reduced padding for a slimmer look */
                  fontWeight: 700,
                  fontSize: "13px", /* Slightly smaller font */
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Logout
              </button>
            </aside>

            {/* Fix 4: RIGHT CARD */}
            <section 
              style={{ 
                background: '#ffffff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '18px', 
                boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                padding: '26px 28px', 
                overflowY: 'auto' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>
                  {profileTab === 'profile' && 'Profile'}
                  {profileTab === 'edit' && 'Edit Profile'}
                  {profileTab === 'notifications' && 'Notifications'}
                  {profileTab === 'password' && 'Password Security'}
                  {profileTab === 'two-factor' && 'Two-Factor Authentication'}
                  {profileTab === 'preferences' && 'Notification Preferences'}
                </h2>
                
                {/* Fix 5: Close Button Gold Click Effect */}
                <button 
                  onClick={() => setProfileOpen(false)} 
                  onMouseDown={(e) => {
                    e.target.style.color = "#000000";
                    e.target.style.border = "1px solid #B99443";
                  }}
                  onMouseUp={(e) => {
                    e.target.style.color = "#374151";
                    e.target.style.border = "1px solid #d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#374151";
                    e.target.style.border = "1px solid #d1d5db";
                  }}
                  style={{ 
                    border: '1px solid #d1d5db', 
                    color: '#374151',
                    background: '#fff', 
                    borderRadius: '8px', 
                    padding: '8px 12px', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  Close
                </button>
              </div>

              {profileNotice && (
                <p className={profileNoticeTone === 'success' ? 'profile-modal-success' : 'profile-modal-error'}>{profileNotice}</p>
              )}

              {profileTab === 'profile' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    
    {/* Top Grid: Modern Info Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      <ProfileInfo icon="👤" label="Full Name" value={safeUser.name || '—'} />
      <ProfileInfo icon="🎓" label="Role" value={safeUser.role || 'student'} />
      <ProfileInfo icon="✉️" label="Email" value={safeUser.email || '—'} />
      <ProfileInfo icon="💳" label="Student/Staff ID" value={safeUser.studentId || '—'} />
      <ProfileInfo icon="🏛️" label="Department" value={safeUser.specialization || 'Data Science'} />
      <ProfileInfo icon="📅" label="Academic Year" value={safeUser.year || '3rd Year'} />
      <ProfileInfo icon="📍" label="Campus" value={safeUser.campus || 'SLIIT Malabe'} />
      <ProfileInfo icon="✅" label="Account Status" value="Active" valueColor="#166534" />
    </div>

    {/* Bottom Section: Recent Activity Timeline */}
    <div style={{ marginTop: '8px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Recent Activity
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ActivityItem 
          title="Logged in from new device" 
          time="Just now" 
          type="security" 
        />
        <ActivityItem 
          title="Booked Lecture Hall A402" 
          time="2 hours ago" 
          type="booking" 
        />
        <ActivityItem 
          title="Updated Profile Picture" 
          time="Yesterday" 
          type="profile" 
        />
      </div>
    </div>

  </div>
)}

              {profileTab === 'edit' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1', display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
                    <button
                      onClick={triggerProfileAvatarPick}
                      disabled={profileAvatarUploading}
                      style={{ width: '92px', height: '92px', borderRadius: '999px', border: 'none', background: COLORS.purple, color: '#fff', fontWeight: 700, fontSize: '30px', cursor: profileAvatarUploading ? 'not-allowed' : 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0 }}
                    >
                      {resolvedAvatarUrl
                        ? <img src={resolvedAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (profileDraft.name || safeUser.name || 'U').charAt(0).toUpperCase()}
                    </button>
                    <input ref={profileAvatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileAvatarChange} />
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      {profileAvatarUploading ? 'Uploading photo...' : 'Edit profile photo'}
                    </p>
                  </div>

                  <Field label="Full Name" value={profileDraft.name} onChange={(v) => handleProfileDraft('name', v)} />
                  <Field label="Email" value={profileDraft.email} onChange={(v) => handleProfileDraft('email', v)} />
                  <Field label="Student/Lecturer ID" value={profileDraft.studentId} onChange={(v) => handleProfileDraft('studentId', v)} />

                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button onClick={saveProfileDraft} disabled={profileSaving} style={{ border: 'none', background: COLORS.purple, color: '#fff', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer' }}>
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button onClick={resetProfileDraft} style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {profileTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(88vh - 180px)' }}>

                  {/* Horizontal Filter Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      scrollbarWidth: 'none' /* Hides scrollbar in Firefox */
                    }}
                  >
                    {[
                      { id: 'ALL', label: 'All Updates' },
                      { id: 'BOOKING', label: 'Booking Alerts' },
                      { id: 'TICKET', label: 'Maintenance Tickets' },
                      { id: 'SYSTEM', label: 'System Broadcasts' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveNotifFilter(tab.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '999px',
                          border: 'none',
                          background: activeNotifFilter === tab.id ? '#B99443' : '#f8fafc',
                          color: activeNotifFilter === tab.id ? '#ffffff' : '#64748b',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          boxShadow: activeNotifFilter === tab.id ? '0 4px 12px rgba(185, 148, 67, 0.2)' : 'none'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtered Notification List */}
                  <div style={{ display: 'grid', gap: '12px', overflowY: 'auto', paddingRight: '4px', paddingBottom: '12px' }}>
                    {notifications.filter(item => {
                      const type = String(item.type || '').toUpperCase();
                      if (activeNotifFilter === 'ALL') return true;
                      if (activeNotifFilter === 'BOOKING') return type.includes('BOOKING');
                      if (activeNotifFilter === 'TICKET') return type.includes('TICKET');
                      if (activeNotifFilter === 'SYSTEM') return ['INFO', 'WARNING', 'ALERT', 'GENERAL'].includes(type);
                      return true;
                    }).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                          No notifications found for this category.
                        </p>
                      </div>
                    ) : (
                      notifications.filter(item => {
                        const type = String(item.type || '').toUpperCase();
                        if (activeNotifFilter === 'ALL') return true;
                        if (activeNotifFilter === 'BOOKING') return type.includes('BOOKING');
                        if (activeNotifFilter === 'TICKET') return type.includes('TICKET');
                        if (activeNotifFilter === 'SYSTEM') return ['INFO', 'WARNING', 'ALERT', 'GENERAL'].includes(type);
                        return true;
                      }).map((item, index) => {

                        // Determine icon and colors based on type
                        const typeStr = String(item.type || '').toUpperCase();
                        let icon = '📢';
                        let iconBg = '#f1f5f9';
                        let iconColor = '#64748b';

                        if (typeStr.includes('BOOKING')) {
                          icon = '📅'; iconBg = '#fef3c7'; iconColor = '#0891b2';
                        } else if (typeStr.includes('TICKET')) {
                          icon = '🛠️'; iconBg = '#fce7f3'; iconColor = '#be185d';
                        } else if (typeStr === 'WARNING' || typeStr === 'ALERT') {
                          icon = '⚠️'; iconBg = '#fee2e2'; iconColor = '#b91c1c';
                        }

                        return (
                          <div
                            key={item.id || index}
                            style={{
                              display: 'flex',
                              gap: '14px',
                              border: '1px solid #e5e7eb',
                              background: '#ffffff',
                              borderRadius: '16px',
                              padding: '16px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                            }}
                          >
                            {/* Dynamic Icon */}
                            <div style={{
                              width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                              background: iconBg, color: iconColor,
                              display: 'grid', placeItems: 'center', fontSize: '18px'
                            }}>
                              {icon}
                            </div>

                            {/* Notification Content */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '14px' }}>
                                  {item.title || 'Notification'}
                                </p>
                                <span style={{
                                  fontSize: '11px', color: '#64748b', fontWeight: 700,
                                  background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.5px'
                                }}>
                                  {item.type || 'GENERAL'}
                                </span>
                              </div>
                              <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                {item.message || 'No message provided.'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {profileTab === 'preferences' && (
                <div style={{ display: 'grid', gap: '16px', maxWidth: '450px', paddingTop: '10px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Choose which updates you want to receive in your notification center.
                  </p>

                  {[
                    { key: 'BOOKING_ALERTS', label: 'Booking Alerts', desc: 'Updates when your facility bookings are approved or rejected.' },
                    { key: 'TICKET_UPDATES', label: 'Maintenance Tickets', desc: 'Alerts when your reported issues change status.' },
                    { key: 'SYSTEM_BROADCASTS', label: 'System Broadcasts', desc: 'Important announcements from campus administrators.' }
                  ].map((pref) => (
                    <div key={pref.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>{pref.label}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotificationPreference(pref.key)}
                        style={{
                          width: '44px', height: '24px', borderRadius: '999px', border: 'none',
                          background: notificationPrefs[pref.key] ? COLORS.purple : '#d1d5db',
                          position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                          position: 'absolute', top: '3px', left: notificationPrefs[pref.key] ? '23px' : '3px',
                          transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* --- NEW PASSWORD SECURITY TAB --- */}
              {profileTab === 'password' && (
                <div style={{ display: 'grid', gap: '16px', maxWidth: '450px', paddingTop: '10px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Ensure your account is using a long, secure password. We recommend updating it regularly.
                  </p>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <input
                      type={passwordVisibility.currentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordField('currentPassword', e.target.value)}
                      placeholder="Current password"
                      style={inputStyle}
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
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      style={{ justifySelf: 'end', border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '-6px' }}
                    >
                      {passwordVisibility.newPassword ? 'Hide' : 'Show'} new password
                    </button>

                    {passwordForm.newPassword && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f8fafc' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>Password strength</p>
                          <p style={{ margin: '4px 0 0 0', fontWeight: 800, color: passwordStrength.tone, fontSize: '13px' }}>{passwordStrength.label}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[0, 1, 2, 3].map((index) => (
                            <span key={index} style={{ width: '14px', height: '8px', borderRadius: '999px', background: index < passwordStrength.score ? passwordStrength.tone : '#e5e7eb' }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordField('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      style={inputStyle}
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

                    {passwordNotice && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: passwordNoticeTone === 'success' ? '#166534' : '#b91c1c' }}>
                        {passwordNotice}
                      </p>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      style={{ marginTop: '12px', border: 'none', background: COLORS.purple, borderRadius: '10px', padding: '12px 16px', color: '#fff', fontWeight: 800, cursor: passwordSaving ? 'not-allowed' : 'pointer' }}
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}

              {/* --- NEW TWO-FACTOR AUTH TAB --- */}
              {profileTab === 'two-factor' && (
                <div style={{ display: 'grid', gap: '20px', maxWidth: '450px', paddingTop: '10px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Add additional security to your account using two-factor authentication.
                  </p>
                  
                  <div style={{ padding: '16px', background: twoFactorEnabled ? '#f0fdf4' : '#f8fafc', border: twoFactorEnabled ? '1px solid #bbf7d0' : '1px solid #e5e7eb', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>
                      Current Status: <strong style={{ color: twoFactorEnabled ? '#166534' : '#111827' }}>{twoFactorLoading ? 'Checking...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}</strong>
                    </p>
                  </div>

                  {!twoFactorEnabled && (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <button onClick={startTwoFactorSetup} disabled={twoFactorBusy} style={{ border: 'none', background: COLORS.purple, borderRadius: '10px', padding: '12px 16px', color: '#fff', fontWeight: 700, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                        {twoFactorConfigured ? 'Generate New Setup Key' : 'Setup 2FA Now'}
                      </button>

                      {twoFactorOtpAuthUri && (
                        <div style={{ display: 'grid', gap: '12px', justifyItems: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569', textAlign: 'center' }}>Scan this QR code with Google Authenticator</p>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorOtpAuthUri)}`} alt="Authenticator QR" style={{ width: '180px', height: '180px', borderRadius: '10px' }} />
                          <code style={{ fontSize: '13px', padding: '8px 12px', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 700 }}>{twoFactorSecret}</code>
                        </div>
                      )}

                      {(twoFactorConfigured || twoFactorOtpAuthUri) && (
                        <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>Verify Code to Enable</p>
                          <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={inputStyle} />
                          <button onClick={enableTwoFactor} disabled={twoFactorBusy} style={{ border: 'none', background: '#111827', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                            Confirm and Enable 2FA
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {twoFactorEnabled && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>Verify Code to Disable</p>
                      <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={inputStyle} />
                      <button onClick={disableTwoFactor} disabled={twoFactorBusy} style={{ border: '1px solid #b91c1c', background: '#fee2e2', borderRadius: '10px', padding: '12px 16px', color: '#991b1b', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                        Disable 2FA
                      </button>
                    </div>
                  )}

                  {twoFactorNotice && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: twoFactorNoticeTone === 'success' ? '#166534' : '#b91c1c' }}>
                      {twoFactorNotice}
                    </p>
                  )}
                </div>
              )}

              

                  
                
              
            </section>
          </div>
        </div>
      )}
    </>
  );
}

const ProfileInfo = ({ label, value, icon, valueColor = '#111827' }) => (
  <div 
    style={{ 
      border: '1px solid #e5e7eb', 
      background: '#ffffff', 
      borderRadius: '14px', 
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'all 0.2s ease',
      cursor: 'default',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = '#d1d5db';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = '#e5e7eb';
    }}
  >
    {icon && (
      <div style={{ 
        width: '42px', height: '42px', borderRadius: '10px', 
        background: 'rgba(185, 148, 67, 0.1)', color: '#B99443', 
        display: 'grid', placeItems: 'center', fontSize: '18px', flexShrink: 0
      }}>
        {icon}
      </div>
    )}
    <div style={{ overflow: 'hidden' }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ 
        margin: '4px 0 0 0', fontWeight: 800, color: valueColor, fontSize: '14px', 
        textTransform: label === 'Role' ? 'capitalize' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {value}
      </p>
    </div>
  </div>
);

const ActivityItem = ({ title, time, type }) => {
  const getIconColor = () => {
    switch(type) {
      case 'security': return { bg: '#dcfce7', text: '#166534' };
      case 'booking': return { bg: '#dbeafe', text: '#1e40af' };
      case 'profile': return { bg: '#f3e8ff', text: '#7e22ce' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const colors = getIconColor();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.text, border: `3px solid ${colors.bg}` }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>{title}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{time}</p>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <label style={{ display: 'grid', gap: '6px' }}>
    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
  </label>
);

const ProfileTabButton = ({ active, onClick, label, accent }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      border: active ? 'none' : '1px solid #e5e7eb',
      borderRadius: '10px',
      background: active ? accent : '#ffffff',
      color: active ? '#ffffff' : '#374151',
      padding: '8px 12px', /* Reduced padding from 10px to 8px */
      marginBottom: '6px', /* Tightened the gap between buttons */
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '13px', /* Added slightly smaller font size */
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
    }}
  >
    <span>{label}</span>
  </button>
);

const inputStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  color: '#111827',
  outline: 'none',
  background: '#fff',
};