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
      </nav>

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
                <div style={{ width: '78px', height: '78px', borderRadius: '999px', background: COLORS.purple, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '26px', overflow: 'hidden' }}>
                  {resolvedAvatarUrl
                    ? <img src={resolvedAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (safeUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <p style={{ margin: '10px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#111827' }}>{safeUser.name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{safeUser.role}</p>
              </div>

              <ProfileTabButton active={profileTab === 'profile'} onClick={() => selectProfileTab('profile')} icon="PR" label="Profile" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'edit'} onClick={() => selectProfileTab('edit')} icon="ED" label="Edit Profile" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'notifications'} onClick={() => selectProfileTab('notifications')} icon="NT" label="Notifications" accent={COLORS.purple} />
              <ProfileTabButton active={profileTab === 'account'} onClick={() => selectProfileTab('account')} icon="AC" label="Account Settings" accent={COLORS.purple} />
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
                <div style={{ display: 'grid', gap: '12px' }}>
                  <ProfileInfo label="Full Name" value={safeUser.name || '—'} />
                  <ProfileInfo label="Role" value={safeUser.role || 'student'} />
                  <ProfileInfo label="Email" value={safeUser.email || '—'} />
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
                <div style={{ display: 'grid', gap: '10px' }}>
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
                <div style={{ display: 'grid', gap: '14px', maxHeight: 'calc(88vh - 240px)', overflowY: 'auto', paddingRight: '4px', paddingBottom: '12px' }}>
                  <ProfileInfo label="Role" value={safeUser.role} />
                  <ProfileInfo label="Email" value={safeUser.email} />

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
                          background: COLORS.purple,
                          borderRadius: '10px',
                          padding: '10px 16px',
                          color: '#ffffff',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {showPasswordCard ? 'Hide Change Password' : 'Change Password'}
                      </button>
                    </div>

                    {showPasswordCard && (
                      <div style={{ marginTop: '12px', border: '1px solid #dbe4ef', borderRadius: '14px', background: '#f8fafc', padding: '14px' }}>
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

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>Password strength</p>
                              <p style={{ margin: '4px 0 0 0', fontWeight: 800, color: passwordStrength.tone, fontSize: '13px' }}>{passwordStrength.label}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {[0, 1, 2, 3].map((index) => (
                                <span
                                  key={index}
                                  style={{ width: '14px', height: '8px', borderRadius: '999px', background: index < passwordStrength.score ? passwordStrength.tone : '#e5e7eb' }}
                                />
                              ))}
                            </div>
                          </div>

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

                          {passwordNotice && (
                            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: passwordNoticeTone === 'success' ? '#166534' : '#b91c1c' }}>
                              {passwordNotice}
                            </p>
                          )}

                          <button
                            onClick={handleChangePassword}
                            disabled={passwordSaving}
                            style={{ marginTop: '12px', border: 'none', background: COLORS.purple, borderRadius: '10px', padding: '10px 16px', color: '#fff', fontWeight: 800, cursor: passwordSaving ? 'not-allowed' : 'pointer' }}
                          >
                            {passwordSaving ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Two-factor authentication</p>
                    <p style={{ margin: '6px 0 12px 0', fontSize: '13px', color: '#475569' }}>
                      Status: <strong>{twoFactorLoading ? 'Checking...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}</strong>
                    </p>

                    {!twoFactorEnabled && (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <button onClick={startTwoFactorSetup} disabled={twoFactorBusy} style={{ border: 'none', background: COLORS.purple, borderRadius: '10px', padding: '10px 16px', color: '#fff', fontWeight: 700, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                          {twoFactorConfigured ? 'Generate New Setup Key' : 'Enable 2FA'}
                        </button>

                        {twoFactorOtpAuthUri && (
                          <div style={{ display: 'grid', gap: '8px', justifyItems: 'start' }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorOtpAuthUri)}`} alt="Authenticator QR" style={{ width: '180px', height: '180px', border: '1px solid #e5e7eb', borderRadius: '10px' }} />
                            <code style={{ fontSize: '12px', padding: '7px 9px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px' }}>{twoFactorSecret}</code>
                          </div>
                        )}

                        {(twoFactorConfigured || twoFactorOtpAuthUri) && (
                          <>
                            <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={inputStyle} />
                            <button onClick={enableTwoFactor} disabled={twoFactorBusy} style={{ border: 'none', background: COLORS.purple, borderRadius: '10px', padding: '10px 16px', color: '#fff', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                              Confirm and Enable 2FA
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {twoFactorEnabled && (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={inputStyle} />
                        <button onClick={disableTwoFactor} disabled={twoFactorBusy} style={{ border: '1px solid #b91c1c', background: '#fee2e2', borderRadius: '10px', padding: '10px 16px', color: '#991b1b', fontWeight: 800, cursor: twoFactorBusy ? 'not-allowed' : 'pointer' }}>
                          Disable 2FA
                        </button>
                      </div>
                    )}

                    {twoFactorNotice && (
                      <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: twoFactorNoticeTone === 'success' ? '#166534' : '#b91c1c' }}>
                        {twoFactorNotice}
                      </p>
                    )}
                  </div>

                  <button onClick={handleLogout} style={{ border: 'none', background: '#111827', borderRadius: '10px', padding: '10px 18px', color: '#fff', fontWeight: 800, cursor: 'pointer', width: 'fit-content' }}>
                    Logout
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

const ProfileInfo = ({ label, value }) => (
  <div style={{ border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '12px', padding: '12px 14px' }}>
    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{label}</p>
    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#111827', textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{value}</p>
  </div>
);

const Field = ({ label, value, onChange }) => (
  <label style={{ display: 'grid', gap: '6px' }}>
    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
  </label>
);

const ProfileTabButton = ({ active, onClick, icon, label, accent }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      border: active ? 'none' : '1px solid #e5e7eb',
      borderRadius: '10px',
      background: active ? accent : '#ffffff',
      color: active ? '#ffffff' : '#374151',
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

const inputStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  color: '#111827',
  outline: 'none',
  background: '#fff',
};