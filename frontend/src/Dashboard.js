import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
    fetch(`http://localhost:8081/api/notifications/me`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n) => !n.isRead && !n.read).length);
        }
      })
      .catch((err) => console.error('Failed to fetch notifications', err));
  }, [user]);

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
          <img src={`${process.env.PUBLIC_URL}/LOGO.png`} alt="NEXUS logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '0.8px' }}>NEXUS</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/profile')} style={{ backgroundColor: 'transparent', border: '1px solid #d1d5db', color: '#374151', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Profile
          </button>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#BF932A', textTransform: 'capitalize' }}>{user.role}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Unread: {unreadCount}</p>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#BF932A', border: 'none', color: '#111827', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
            Logout
          </button>
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
    </div>
  );
}
