import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SITE_BRAND } from './siteConfig';
import useDashboardProfile from './hooks/useDashboardProfile';
import api from './api/axiosClient';

const COLORS = {
  white: '#FFFFFF',
  bg: '#E9EEF4',
  overlay: 'rgba(233, 238, 244, 0.48)',
  purple: '#B99443',
  black: '#111111',
  muted: '#5f6470',
  border: '#d9deea',
  softPurple: '#f7eedf',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [studentStats, setStudentStats] = useState({
    resources: 0,
    bookings: 0,
    pendingBookings: 0,
    notifications: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

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

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

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
  useEffect(() => {
    if (!user || user.role !== 'student') {
      return;
    }

    let active = true;

    const fetchStudentStats = async () => {
      setStatsLoading(true);
      try {
        const [resourcesRes, bookingsRes] = await Promise.all([
          api.get('/api/resources'),
          api.get('/api/bookings/my'),
        ]);

        const resources = Array.isArray(resourcesRes.data) ? resourcesRes.data : [];
        const bookingsData = bookingsRes.data?.data ?? bookingsRes.data ?? [];
        const bookings = Array.isArray(bookingsData) ? bookingsData : [];

        const pendingBookings = bookings.filter((booking) => {
          const status = String(booking.status || booking.bookingStatus || '').toUpperCase();
          return status === 'PENDING';
        }).length;

        if (active) {
          setStudentStats({
            resources: resources.length,
            bookings: bookings.length,
            pendingBookings,
            notifications: notifications.length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch student dashboard stats:', error);
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    };

    fetchStudentStats();

    return () => {
      active = false;
    };
  }, [user, notifications.length]);

  const formatStat = (value) => {
    if (statsLoading) {
      return '...';
    }
    return String(value).padStart(2, '0');
  };

  const ActionButton = ({ children, onClick, filled = false }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: filled ? 'none' : `1px solid ${COLORS.purple}`,
        background: filled ? COLORS.purple : COLORS.white,
        color: filled ? COLORS.white : COLORS.purple,
        padding: '12px 18px',
        borderRadius: '999px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: filled ? '0 14px 28px rgba(114,96,180,0.25)' : 'none',
      }}
    >
      {children}
    </button>
  );

  const StatBadge = ({ value, label, top, left, right }) => (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        background: COLORS.white,
        padding: '14px 18px',
        borderRadius: '4px',
        boxShadow: '0 18px 45px rgba(0,0,0,0.12)',
        minWidth: '120px',
        zIndex: 2,
      }}
    >
      <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: COLORS.black }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: '12px', color: COLORS.muted }}>{label}</p>
    </div>
  );

  const ServiceCard = ({ icon, title, text, active, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: active ? COLORS.purple : COLORS.white,
        color: active ? COLORS.white : COLORS.black,
        padding: '28px',
        borderRadius: '4px',
        border: `1px solid ${active ? COLORS.purple : COLORS.border}`,
        cursor: 'pointer',
        minHeight: '190px',
        boxShadow: active ? '0 22px 45px rgba(114,96,180,0.25)' : '0 16px 35px rgba(17,17,17,0.05)',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '999px',
          display: 'grid',
          placeItems: 'center',
          background: active ? COLORS.white : COLORS.softPurple,
          color: COLORS.purple,
          fontSize: '22px',
          marginBottom: '18px',
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{title}</h3>
      <p style={{ margin: '12px 0 18px', fontSize: '13px', lineHeight: 1.7, color: active ? '#f4f2ff' : COLORS.muted }}>
        {text}
      </p>
      <span style={{ fontSize: '13px', fontWeight: 900 }}>
        Open Now
      </span>
    </div>
  );

  const StudentView = () => (
    <div>
      <section
        style={{
          background: '#0f172a',
          padding: '70px 30px',
          marginBottom: '55px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)),
              url('/authleft.jpg')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)',
            transform: 'scale(1.03)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: '40px', alignItems: 'center',paddingTop : '10px' }}>
          <div>
            <p style={{ color: '#ffffff', fontWeight: 800, marginBottom: '12px', fontSize: '13px' }}>
              Welcome to Smart Campus
            </p>
            <h1 style={{ margin: 0, color: '#ffffff', fontSize: '46px', lineHeight: 1.12, fontWeight: 900 }}>
              Manage Your Campus Tasks And Resources
            </h1>
            <p style={{ margin: '18px 0 26px', maxWidth: '560px', color: '#e2e8f0', lineHeight: 1.8, fontSize: '14px' }}>
              Request facilities, check your bookings, create maintenance tickets, and follow campus updates from one simple student dashboard.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <ActionButton filled onClick={() => navigate('/facilities')}>Browse Facilities</ActionButton>
              <ActionButton onClick={() => navigate('/bookings/my')}>My Bookings</ActionButton>
              <ActionButton onClick={() => navigate('/tickets')}>Create Ticket</ActionButton>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: '320px' }}>
          <div
            style={{
              position: 'absolute',
              width: '320px',
              height: '320px',
              borderRadius: '999px',
              border: `2px solid rgba(114,96,180,0.25)`,
              left: '-25px',
              top: '-10px',
            }}
          />
          
         

          <div
            style={{
              position: 'relative',
              marginLeft: '70px',
              marginTop: '35px',
              height: '285px',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <img
              src="/LOGO.png"
              alt="Smart Campus logo"
              style={{ width: '280px', height: '280px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '0.95fr 1fr',
          gap: '45px',
          alignItems: 'center',
          marginBottom: '65px',
          maxWidth: '1200px',
          margin: '0 auto 65px auto',
          padding: '0 30px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            minHeight: '360px',
            padding: '35px',
            borderRadius: '4px',
            boxShadow: '0 16px 40px rgba(17,17,17,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '30px', color: COLORS.black }}>Today's Student Overview</h2>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            Keep your campus work organized. This dashboard helps you access booking, resource, and support services faster.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '26px' }}>
            <InfoBox number={formatStat(studentStats.resources)} title="Find Resource" />
            <InfoBox number={formatStat(studentStats.bookings)} title="Request Booking" />
            <InfoBox number={formatStat(studentStats.pendingBookings)} title="Track Status" />
            <InfoBox number={formatStat(studentStats.notifications)} title="Get Notification" />
          </div>
        </div>

        <div>
          <p style={{ color: COLORS.purple, fontWeight: 800, fontSize: '13px' }}>About Student Services</p>
          <h2 style={{ margin: '0 0 16px', fontSize: '34px', color: COLORS.black, lineHeight: 1.2 }}>
            Request Facilities And Report Issues Easily
          </h2>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            Students can browse lecture halls, labs, meeting rooms, and equipment. They can request a booking with date, time, purpose, and expected attendees. They can also create incident tickets with priority and contact details.
          </p>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            The system supports clear workflows, so every request has a visible status and users can follow progress without confusion.
          </p>
          <ActionButton filled onClick={() => navigate('/facilities')}>Discover Campus Services</ActionButton>
        </div>
      </section>

      <section style={{ background: COLORS.bg, padding: '58px 48px', borderRadius: '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ margin: 0, color: COLORS.purple, fontWeight: 800, fontSize: '13px' }}>Our Services</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '34px', color: COLORS.black }}>
            Student Services We Offered
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <ServiceCard
            icon="FC"
            title="Facilities Catalogue"
            text="View lecture halls, labs, meeting rooms, projectors, cameras, capacity, location, availability, and status."
            onClick={() => navigate('/facilities')}
          />
          <ServiceCard
            icon="BK"
            title="Booking Management"
            text="Create resource booking requests and track the workflow from pending to approved, rejected, or cancelled."
            active
            onClick={() => navigate('/bookings/my')}
          />
          <ServiceCard
            icon="MT"
            title="Maintenance Tickets"
            text="Report incidents for resources or locations with category, description, priority, contact details, and images."
            onClick={() => navigate('/tickets')}
          />
          <ServiceCard
            icon="NT"
            title="Notifications"
            text="View updates for booking approval, rejection, ticket status changes, and comments in your profile panel."
            onClick={openProfile}
          />
          <ServiceCard
            icon="PS"
            title="Profile & Security"
            text="Manage your profile, account settings, password security, and two-factor authentication from one place."
            onClick={openProfile}
          />
        </div>
      </section>
    </div>
  );

  const LecturerView = () => (
    <div>
      <section
        style={{
          backgroundImage: `
            linear-gradient(${COLORS.overlay}, ${COLORS.overlay}),
            url('/authleft.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '70px 30px',
          marginBottom: '55px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <p style={{ color: COLORS.purple, fontWeight: 800, marginBottom: '12px', fontSize: '13px' }}>
              Welcome Lecturer
            </p>
            <h1 style={{ margin: 0, color: COLORS.black, fontSize: '46px', lineHeight: 1.12, fontWeight: 900 }}>
              Coordinate Campus Resources And Academic Requests
            </h1>
            <p style={{ margin: '18px 0 26px', maxWidth: '560px', color: COLORS.muted, lineHeight: 1.8, fontSize: '14px' }}>
              Manage lecture resources, review bookings, monitor classroom issues, and support smooth academic operations.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <ActionButton filled onClick={() => navigate('/facilities')}>View Resources</ActionButton>
              <ActionButton onClick={() => navigate('/bookings/my')}>My Bookings</ActionButton>
              <ActionButton onClick={() => navigate('/tickets')}>Report Issue</ActionButton>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: '320px' }}>
          <div
            style={{
              position: 'absolute',
              width: '320px',
              height: '320px',
              borderRadius: '999px',
              border: `2px solid rgba(114,96,180,0.25)`,
              left: '-25px',
              top: '-10px',
            }}
          />
          <StatBadge value="16+" label="Available Rooms" top="8px" left="0" />
          <StatBadge value="95%" label="Resource Readiness" top="115px" left="-55px" />

          <div
            style={{
              position: 'relative',
              marginLeft: '70px',
              marginTop: '35px',
              background: COLORS.white,
              borderRadius: '8px',
              height: '285px',
              padding: '28px',
              boxShadow: '0 25px 55px rgba(0,0,0,0.12)',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '22px', color: COLORS.black }}>Lecturer Control Panel</h3>
            <p style={{ color: COLORS.muted, lineHeight: 1.7, fontSize: '14px' }}>
              Access resource booking, lecture hall availability, maintenance reporting, and academic facility support.
            </p>

            <div style={{ display: 'grid', gap: '12px', marginTop: '22px' }}>
              <MiniRow label="Department" value="Faculty of Computing" />
              <MiniRow label="Role" value="Lecturer" />
              <MiniRow label="Today Focus" value="Resource Planning" />
            </div>
          </div>
        </div>
      </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '0.95fr 1fr',
          gap: '45px',
          alignItems: 'center',
          marginBottom: '65px',
        }}
      >
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            minHeight: '360px',
            padding: '35px',
            borderRadius: '4px',
            boxShadow: '0 16px 40px rgba(17,17,17,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '30px', color: COLORS.black }}>Lecturer Overview</h2>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            Use this dashboard to keep resource usage, class activities, and facility issues organized.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '26px' }}>
            <InfoBox number="12" title="Pending Reviews" />
            <InfoBox number="02" title="Lectures Today" />
            <InfoBox number="04" title="Resource Requests" />
            <InfoBox number="03" title="Open Issues" />
          </div>
        </div>

        <div>
          <p style={{ color: COLORS.purple, fontWeight: 800, fontSize: '13px' }}>About Lecturer Services</p>
          <h2 style={{ margin: '0 0 16px', fontSize: '34px', color: COLORS.black, lineHeight: 1.2 }}>
            Support Teaching Through Better Campus Operations
          </h2>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            Lecturers can check available rooms and equipment, request bookings for academic activities, and report problems in classrooms, labs, or equipment.
          </p>
          <p style={{ color: COLORS.muted, lineHeight: 1.8 }}>
            This view is designed for quick access, so academic staff can complete common tasks without searching through multiple pages.
          </p>
          <ActionButton filled onClick={() => navigate('/facilities')}>Open Resource Catalogue</ActionButton>
        </div>
      </section>

      <section style={{ background: COLORS.bg, padding: '58px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ margin: 0, color: COLORS.purple, fontWeight: 800, fontSize: '13px' }}>Lecturer Tools</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '34px', color: COLORS.black }}>
            Academic Services We Offered
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <ServiceCard
            icon="LH"
            title="Lecture Hall Booking"
            text="Search lecture halls and labs by capacity, location, status, and available time windows."
            onClick={() => navigate('/facilities')}
          />
          <ServiceCard
            icon="BK"
            title="Booking Requests"
            text="Request campus resources for lectures, meetings, workshops, and consultation sessions."
            active
            onClick={() => navigate('/bookings/my')}
          />
          <ServiceCard
            icon="EQ"
            title="Equipment Issues"
            text="Report damaged projectors, lab equipment issues, room problems, or technical failures."
            onClick={() => navigate('/tickets')}
          />
          <ServiceCard
            icon="AL"
            title="Academic Alerts"
            text="Receive updates when bookings are approved, rejected, cancelled, or when tickets are updated."
            onClick={openProfile}
          />
          <ServiceCard
            icon="LS"
            title="Location Support"
            text="Find facilities by building, floor, room type, and available resources."
            onClick={() => navigate('/facilities')}
          />
          <ServiceCard
            icon="SA"
            title="Secure Account"
            text="Manage profile information, password security, and two-factor authentication."
            onClick={openProfile}
          />
        </div>
      </section>
    </div>
  );

  // Technician view kept same as your original
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
    return <div style={{ color: COLORS.black, padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.white, color: COLORS.black, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 1100, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/facilities" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '0.8px' }}>{SITE_BRAND.name}</h1>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
            <button
              onClick={openProfile}
              title="Open profile"
              style={{ width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: COLORS.purple, color: '#fff', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0 }}
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

      <div style={{ padding: '0', width: '100%', margin: 0 }}>
        <header style={{  top: '72px', zIndex: 1090, width: '100%', margin: 0, padding: '12px 30px', background: '#ffffff', borderBottom: '1px solid #eef2f7' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px 12px' }}>
            <h2 style={{ fontSize: '28px', margin: 0, color: COLORS.black }}>
              Welcome back, {user.name}.
            </h2>
            <p style={{ color: COLORS.muted, margin: 0 }}>
              {user.role === 'lecturer'
                ? 'Here is your academic operations dashboard for today.'
                : user.role === 'technician'
                ? 'Here is your technician workspace overview.'
                : "Here is what's happening around campus today."}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', marginTop: '10px', color: COLORS.black, fontSize: '13px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: COLORS.purple, color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '12px', flexShrink: 0 }}>U</span>
              <span>University Contact: NEXUS Student Services</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: COLORS.purple, color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '12px', flexShrink: 0 }}>☎</span>
              <span>Phone: +94 11 234 5678</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: COLORS.purple, color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '11px', flexShrink: 0 }}>@</span>
              <span>Email: support@nexus.edu.lk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: COLORS.purple, color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '11px', flexShrink: 0 }}>⏰</span>
              <span>Help Desk: Mon-Fri, 8:30 AM - 4:30 PM</span>
            </div>
          </div>
        </header>

        <div style={{ width: '100%' }}>
          {user.role === 'technician' && (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 30px' }}>
              <TechnicianView />
            </div>
          )}

          {user.role === 'lecturer' && <LecturerView />}
          {user.role === 'student' && <StudentView />}
          {!['technician', 'lecturer', 'student'].includes(user.role) && <StudentView />}
        </div>
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
                <div style={{ width: '78px', height: '78px', borderRadius: '999px', background: COLORS.purple, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '26px', overflow: 'hidden' }}>
                  {profileAvatarUrl
                    ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <p style={{ margin: '10px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#111827' }}>{user.name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{user.role}</p>
              </div>

              <ProfileTabButton active={profileTab === 'profile'} onClick={() => selectProfileTab('profile')} icon="PR" label="Profile" />
              <ProfileTabButton active={profileTab === 'edit'} onClick={() => selectProfileTab('edit')} icon="ED" label="Edit Profile" />
              <ProfileTabButton active={profileTab === 'notifications'} onClick={() => selectProfileTab('notifications')} icon="NT" label="Notifications" />
              <ProfileTabButton active={profileTab === 'account'} onClick={() => selectProfileTab('account')} icon="AC" label="Account Settings" />
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
                  <ProfileInfo label="Full Name" value={user.name || '—'} />
                  <ProfileInfo label="Role" value={user.role || 'student'} />
                  <ProfileInfo label="Email" value={user.email || '—'} />
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
                      {profileAvatarUrl
                        ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (profileDraft.name || user.name || 'U').charAt(0).toUpperCase()}
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
                  <ProfileInfo label="Role" value={user.role} />
                  <ProfileInfo label="Email" value={user.email} />

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
                          <input type="password" value={passwordForm.currentPassword} onChange={(e) => handlePasswordField('currentPassword', e.target.value)} placeholder="Current password" style={inputStyle} />
                          <input type="password" value={passwordForm.newPassword} onChange={(e) => handlePasswordField('newPassword', e.target.value)} placeholder="New password" style={inputStyle} />

                          {passwordForm.newPassword && (
                            <div style={{ display: 'grid', gap: '6px' }}>
                              <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(8, (passwordStrength.score / 4) * 100)}%`, height: '100%', background: passwordStrength.tone }} />
                              </div>
                              <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                                Password strength: <span style={{ fontWeight: 700, color: passwordStrength.tone }}>{passwordStrength.label}</span>
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

                          <input type="password" value={passwordForm.confirmPassword} onChange={(e) => handlePasswordField('confirmPassword', e.target.value)} placeholder="Confirm new password" style={inputStyle} />
                        </div>

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
    </div>
  );
}

const MiniRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #edf0f5', paddingBottom: '10px' }}>
    <span style={{ color: '#5f6470', fontSize: '13px' }}>{label}</span>
    <strong style={{ color: '#111111', fontSize: '13px' }}>{value}</strong>
  </div>
);

const InfoBox = ({ number, title }) => (
  <div style={{ background: '#f1effa', border: '1px solid #ded8f4', borderRadius: '8px', padding: '18px' }}>
    <p style={{ margin: 0, color: COLORS.purple, fontWeight: 900, fontSize: '22px' }}>{number}</p>
    <p style={{ margin: '6px 0 0', color: '#111111', fontWeight: 800, fontSize: '14px' }}>{title}</p>
  </div>
);

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

const ProfileTabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      border: active ? 'none' : '1px solid #e5e7eb',
      borderRadius: '10px',
      background: active ? COLORS.purple : '#ffffff',
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
