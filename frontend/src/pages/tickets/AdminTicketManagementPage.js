import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8081';

const pageShellStyle = {
  minHeight: '100vh',
  backgroundColor: '#0b1120',
  color: '#e5e7eb',
  fontFamily: 'system-ui, sans-serif',
  padding: '24px',
};

const cardStyle = {
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '12px',
  padding: '18px',
};

const labelStyle = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.9px',
  color: '#94a3b8',
  margin: 0,
};

const valueStyle = {
  margin: '4px 0 0 0',
  color: '#f8fafc',
  fontSize: '14px',
};

const SIDEBAR_STYLE = {
  width: '280px',
  backgroundColor: '#111827',
  borderRight: '1px solid #1f2937',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

const MAIN_CONTENT_STYLE = {
  flex: 1,
  padding: '36px',
  overflowY: 'auto',
};

const pageTitleCardStyle = {
  ...cardStyle,
  marginBottom: '18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
};

const ticketSubNavStyle = {
  ...cardStyle,
  marginBottom: '12px',
  padding: '10px',
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const MenuCategory = ({ title }) => (
  <p className="admin-menu-category">{title}</p>
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

const MenuIcon = ({ type }) => {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

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

function statusColor(status) {
  if (status === 'OPEN') return '#f59e0b';
  if (status === 'IN_PROGRESS') return '#3b82f6';
  if (status === 'RESOLVED') return '#22c55e';
  if (status === 'CLOSED') return '#64748b';
  if (status === 'REJECTED') return '#ef4444';
  return '#94a3b8';
}

function formatDate(value) {
  if (!value) return '-';

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    if (!year || !month || !day) return '-';
    const millis = Math.floor((nano || 0) / 1000000);
    const dateFromArray = new Date(year, month - 1, day, hour, minute, second, millis);
    if (!Number.isNaN(dateFromArray.getTime())) {
      return dateFromArray.toLocaleString();
    }
  }

  if (typeof value === 'object') {
    const year = value.year;
    const month = value.monthValue || value.month;
    const day = value.dayOfMonth || value.day;
    if (year && month && day) {
      const hour = value.hour || 0;
      const minute = value.minute || 0;
      const second = value.second || 0;
      const millis = Math.floor((value.nano || 0) / 1000000);
      const dateFromObject = new Date(year, month - 1, day, hour, minute, second, millis);
      if (!Number.isNaN(dateFromObject.getTime())) {
        return dateFromObject.toLocaleString();
      }
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function normalizeError(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

function attachmentUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = String(path).replace(/^\/+/, '');
  return `${API_BASE}/${normalized}`;
}

function canReject(ticket) {
  return ticket?.status === 'OPEN';
}

function canAssign(ticket) {
  return ticket?.status === 'OPEN' || ticket?.status === 'IN_PROGRESS';
}

export default function AdminTicketManagementPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tickets, setTickets] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [history, setHistory] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [assignTechnicianId, setAssignTechnicianId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [ticketView, setTicketView] = useState('manager');

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => String(ticket.ticketId) === String(selectedTicketId)) || null,
    [tickets, selectedTicketId]
  );

  const usersById = useMemo(() => {
    const map = new Map();
    staffDirectory.forEach((entry) => {
      map.set(entry.id, entry);
    });
    return map;
  }, [staffDirectory]);

  const creatorInfo = selectedTicket?.createdByUserId ? usersById.get(selectedTicket.createdByUserId) : null;
  const assignedTechnicianInfo = selectedTicket?.assignedTechnicianId ? usersById.get(selectedTicket.assignedTechnicianId) : null;

  const formatUserWithId = (userId) => {
    if (!userId) return '-';
    const userInfo = usersById.get(userId);
    if (userInfo?.name) return `${userInfo.name} (${userId})`;
    if (user?.id && userId === user.id) return `${user.name || 'Admin'} (${userId})`;
    return userId;
  };

  const viewTitle = ticketView === 'manager'
    ? 'Ticket Management'
    : ticketView === 'status'
      ? 'Status History'
      : ticketView === 'assignment'
        ? 'Assignment History'
        : 'Ticket Attachments';

  const viewSubtitle = ticketView === 'manager'
    ? 'Review ticket details, assign technicians, and reject requests.'
    : ticketView === 'status'
      ? 'View status transitions for the selected ticket.'
      : ticketView === 'assignment'
        ? 'View technician assignment timeline for the selected ticket.'
        : 'View, preview, and manage ticket evidence files.';

  const fetchTickets = useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/tickets`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load tickets.');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const fetchStaffDirectory = useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/admin/staff`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load staff directory.');
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data;
  }, []);

  const fetchHistory = async (ticketId) => {
    if (!ticketId) {
      setHistory([]);
      return;
    }

    const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/history`, {
      credentials: 'include',
    });

    if (!response.ok) {
      setHistory([]);
      return;
    }

    const data = await response.json();
    setHistory(Array.isArray(data) ? data : []);
  };

  const fetchAssignmentHistory = async (ticketId) => {
    if (!ticketId) {
      setAssignmentHistory([]);
      return;
    }

    const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/assignments`, {
      credentials: 'include',
    });

    if (!response.ok) {
      setAssignmentHistory([]);
      return;
    }

    const data = await response.json();
    setAssignmentHistory(Array.isArray(data) ? data : []);
  };

  const fetchAttachments = async (ticketId) => {
    if (!ticketId) {
      setAttachments([]);
      return;
    }

    setAttachmentsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/attachments`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setAttachments([]);
        return;
      }

      const data = await response.json();
      setAttachments(Array.isArray(data) ? data : []);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ticketList, staffList] = await Promise.all([fetchTickets(), fetchStaffDirectory()]);
      setTickets(ticketList);
      setStaffDirectory(staffList);
      setTechnicians(staffList.filter((item) => (item.role || '').toUpperCase() === 'TECHNICIAN'));

      setSelectedTicketId((currentSelectedTicketId) => {
        if (ticketList.length && !currentSelectedTicketId) {
          return ticketList[0].ticketId;
        }

        if (
          currentSelectedTicketId &&
          !ticketList.find((item) => String(item.ticketId) === String(currentSelectedTicketId))
        ) {
          return ticketList[0]?.ticketId || null;
        }

        return currentSelectedTicketId;
      });
    } catch (loadError) {
      setError(normalizeError(loadError, 'Could not load ticket data.'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchTickets, fetchStaffDirectory]);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUser);
    const role = String(parsed.role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/admin');
      return;
    }

    setUser(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    refreshData();
  }, [user, refreshData]);

  useEffect(() => {
    if (!user) return;

    fetch(`${API_BASE}/api/profile/avatar`, { credentials: 'include' })
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

  useEffect(() => {
    if (!selectedTicketId) {
      setAssignTechnicianId('');
      setHistory([]);
      setAssignmentHistory([]);
      setAttachments([]);
      return;
    }

    const selected = tickets.find((item) => String(item.ticketId) === String(selectedTicketId));
    setAssignTechnicianId(selected?.assignedTechnicianId || '');
    fetchHistory(selectedTicketId);
    fetchAssignmentHistory(selectedTicketId);
    fetchAttachments(selectedTicketId);
  }, [selectedTicketId, tickets]);

  const handleAssignTechnician = async () => {
    if (!selectedTicket) {
      setError('Select a ticket first.');
      return;
    }

    if (!assignTechnicianId) {
      setError('Please select a technician to assign.');
      return;
    }

    if (!canAssign(selectedTicket)) {
      setError('This ticket cannot be assigned in its current status.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const assignResponse = await fetch(`${API_BASE}/api/tickets/${selectedTicket.ticketId}/assign`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicianId: assignTechnicianId,
          assignedByUserId: user?.id,
          assignmentNote: assignNote.trim() || null,
        }),
      });

      if (!assignResponse.ok) {
        throw new Error('Could not assign technician.');
      }

      setMessage('Technician assigned successfully.');
      setAssignNote('');
      await refreshData();
      await fetchHistory(selectedTicket.ticketId);
      await fetchAssignmentHistory(selectedTicket.ticketId);
    } catch (assignError) {
      setError(normalizeError(assignError, 'Failed to assign technician.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTicket = async () => {
    if (!selectedTicket) {
      setError('Select a ticket first.');
      return;
    }

    if (!canReject(selectedTicket)) {
      setError('Only OPEN tickets can be rejected.');
      return;
    }

    if (!rejectReason.trim()) {
      setError('Please add a rejection reason.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const statusResponse = await fetch(`${API_BASE}/api/tickets/${selectedTicket.ticketId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectReason.trim(),
          changeNote: rejectNote.trim() || 'Rejected by admin.',
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to reject ticket.');
      }

      setMessage('Ticket rejected successfully.');
      setRejectReason('');
      setRejectNote('');
      await refreshData();
      await fetchHistory(selectedTicket.ticketId);
      await fetchAssignmentHistory(selectedTicket.ticketId);
    } catch (rejectError) {
      setError(normalizeError(rejectError, 'Failed to reject ticket.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteAttachment = (attachment) => {
    if (!user || !attachment) return false;
    const role = String(user.role || '').toLowerCase();
    if (role === 'admin' || role === 'manager') return true;
    return String(attachment.uploadedByUserId || '') === String(user.id || user.userId || '');
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!selectedTicketId || !attachmentId) return;

    const confirmed = window.confirm('Delete this attachment?');
    if (!confirmed) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/tickets/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment.');
      }

      setMessage('Attachment deleted successfully.');
      await fetchAttachments(selectedTicketId);
    } catch (deleteError) {
      setError(normalizeError(deleteError, 'Failed to delete attachment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div style={{ ...pageShellStyle, display: 'grid', placeItems: 'center' }}>Loading...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={SIDEBAR_STYLE}>
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
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#BF932A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Welcome</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#fff', fontWeight: 700 }}>{user.name || 'Admin User'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Admin</p>
            </div>
          </div>
        </div>

        <div className="admin-nav-group">
          <MenuCategory title="Main" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Command Center" icon="dashboard" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Operations" />
          <NavButton active={true} onClick={() => navigate('/admin/tickets')} text="Ticket Management" icon="ticket" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Asset Directory" icon="asset" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Resource Scheduling" icon="schedule" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Resolution" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Incident Desk" icon="incident" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Active Dispatch" icon="dispatch" />

          <div style={{ marginTop: '14px' }}></div>
          <MenuCategory title="Administration" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Access & Identity" icon="identity" />
          <NavButton active={false} onClick={() => navigate('/admin')} text="Broadcast & Audit" icon="audit" />
        </div>
      </aside>

      <main style={MAIN_CONTENT_STYLE}>
        <div style={pageTitleCardStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#BF932A' }}>Administration</p>
            <h1 style={{ margin: '3px 0 0 0', fontSize: '24px', color: '#fff' }}>{viewTitle}</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              {viewSubtitle}
            </p>
          </div>
          <button
            type="button"
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
              fontSize: '13px',
            }}
          >
            Logout
          </button>
        </div>

      <div style={ticketSubNavStyle}>
        <button
          type="button"
          onClick={() => setTicketView('manager')}
          style={{
            border: ticketView === 'manager' ? '1px solid #BF932A' : '1px solid #334155',
            background: ticketView === 'manager' ? 'rgba(191,147,42,0.18)' : '#0f172a',
            color: ticketView === 'manager' ? '#FDE68A' : '#cbd5e1',
            borderRadius: '999px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ticket Manager
        </button>
        <button
          type="button"
          onClick={() => setTicketView('status')}
          style={{
            border: ticketView === 'status' ? '1px solid #BF932A' : '1px solid #334155',
            background: ticketView === 'status' ? 'rgba(191,147,42,0.18)' : '#0f172a',
            color: ticketView === 'status' ? '#FDE68A' : '#cbd5e1',
            borderRadius: '999px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Status History
        </button>
        <button
          type="button"
          onClick={() => setTicketView('assignment')}
          style={{
            border: ticketView === 'assignment' ? '1px solid #BF932A' : '1px solid #334155',
            background: ticketView === 'assignment' ? 'rgba(191,147,42,0.18)' : '#0f172a',
            color: ticketView === 'assignment' ? '#FDE68A' : '#cbd5e1',
            borderRadius: '999px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Assignment History
        </button>
        <button
          type="button"
          onClick={() => setTicketView('attachments')}
          style={{
            border: ticketView === 'attachments' ? '1px solid #BF932A' : '1px solid #334155',
            background: ticketView === 'attachments' ? 'rgba(191,147,42,0.18)' : '#0f172a',
            color: ticketView === 'attachments' ? '#FDE68A' : '#cbd5e1',
            borderRadius: '999px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Attachments
        </button>
      </div>

      {message && (
        <div style={{ ...cardStyle, borderColor: '#14532d', color: '#86efac', marginBottom: '12px', padding: '12px 14px' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ ...cardStyle, borderColor: '#7f1d1d', color: '#fca5a5', marginBottom: '12px', padding: '12px 14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px' }}>
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>All Tickets</h3>
          {isLoading ? (
            <p style={{ color: '#9ca3af' }}>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p style={{ color: '#9ca3af', marginBottom: 0 }}>
              No tickets returned. If backend still filters by owner, admin list may be empty until admin ticket APIs are enabled.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '8px', maxHeight: '68vh', overflowY: 'auto', paddingRight: '2px' }}>
              {tickets.map((ticket) => {
                const active = String(ticket.ticketId) === String(selectedTicketId);
                return (
                  <button
                    key={ticket.ticketId}
                    type="button"
                    onClick={() => {
                      setSelectedTicketId(ticket.ticketId);
                      setMessage('');
                      setError('');
                    }}
                    style={{
                      textAlign: 'left',
                      background: active ? 'rgba(191,147,42,0.12)' : '#0f172a',
                      border: active ? '1px solid #BF932A' : '1px solid #1f2937',
                      color: '#e5e7eb',
                      borderRadius: '10px',
                      padding: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#fff', fontSize: '13px' }}>{ticket.ticketCode || `#${ticket.ticketId}`}</strong>
                      <span
                        style={{
                          border: `1px solid ${statusColor(ticket.status)}`,
                          color: statusColor(ticket.status),
                          borderRadius: '999px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          fontWeight: 700,
                        }}
                      >
                        {ticket.status || 'OPEN'}
                      </span>
                    </div>
                    <p style={{ margin: '7px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>{ticket.title || 'Untitled ticket'}</p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Priority: {ticket.priority || '-'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ display: 'grid', gap: '16px' }}>
          {ticketView === 'manager' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', color: '#fff' }}>Ticket Details</h3>
            {!selectedTicket ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>Select a ticket to view complete details.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <p style={labelStyle}>Ticket ID</p>
                    <p style={valueStyle}>{selectedTicket.ticketId}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Ticket Code</p>
                    <p style={valueStyle}>{selectedTicket.ticketCode || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Status</p>
                    <p style={{ ...valueStyle, color: statusColor(selectedTicket.status), fontWeight: 700 }}>{selectedTicket.status || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Priority</p>
                    <p style={valueStyle}>{selectedTicket.priority || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Category</p>
                    <p style={valueStyle}>{selectedTicket.category || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Created By</p>
                    <p style={valueStyle}>{creatorInfo?.name || selectedTicket.createdByUserId || '-'}</p>
                    {creatorInfo?.email && (
                      <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>{creatorInfo.email}</p>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <p style={labelStyle}>Title</p>
                  <p style={valueStyle}>{selectedTicket.title || '-'}</p>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <p style={labelStyle}>Description</p>
                  <p style={{ ...valueStyle, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{selectedTicket.description || '-'}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <p style={labelStyle}>Contact Name</p>
                    <p style={valueStyle}>{selectedTicket.preferredContactName || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Contact Email</p>
                    <p style={valueStyle}>{selectedTicket.preferredContactEmail || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Contact Phone</p>
                    <p style={valueStyle}>{selectedTicket.preferredContactPhone || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Assigned Technician</p>
                    <p style={valueStyle}>{assignedTechnicianInfo?.name || selectedTicket.assignedTechnicianId || '-'}</p>
                    {assignedTechnicianInfo?.email && (
                      <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>{assignedTechnicianInfo.email}</p>
                    )}
                  </div>
                  <div>
                    <p style={labelStyle}>Location</p>
                    <p style={valueStyle}>{selectedTicket.locationId || '-'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Resource</p>
                    <p style={valueStyle}>{selectedTicket.resourceId || '-'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={labelStyle}>Created At</p>
                    <p style={valueStyle}>{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Updated At</p>
                    <p style={valueStyle}>{formatDate(selectedTicket.updatedAt)}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Assigned At</p>
                    <p style={valueStyle}>{formatDate(selectedTicket.assignedAt)}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Resolved At</p>
                    <p style={valueStyle}>{formatDate(selectedTicket.resolvedAt)}</p>
                  </div>
                </div>

                {selectedTicket.rejectionReason && (
                  <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.22)' }}>
                    <p style={{ ...labelStyle, color: '#fca5a5' }}>Rejection Reason</p>
                    <p style={{ ...valueStyle, color: '#fecaca', marginTop: '6px' }}>{selectedTicket.rejectionReason}</p>
                  </div>
                )}

              </>
            )}
          </div>
          )}

          {ticketView === 'manager' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>Assign Technician</h3>
              <p style={{ margin: '0 0 10px 0', color: '#9ca3af', fontSize: '13px' }}>
                Assign to technician and move status from OPEN to IN_PROGRESS.
              </p>
              <select
                value={assignTechnicianId}
                onChange={(e) => setAssignTechnicianId(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', padding: '10px', marginBottom: '10px' }}
                disabled={!selectedTicket || !canAssign(selectedTicket) || isSubmitting}
              >
                <option value="">Select Technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.email})
                  </option>
                ))}
              </select>

              <textarea
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Optional assignment note"
                rows={3}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', padding: '10px', marginBottom: '10px', resize: 'vertical' }}
                disabled={!selectedTicket || isSubmitting}
              />

              <button
                type="button"
                onClick={handleAssignTechnician}
                disabled={!selectedTicket || !canAssign(selectedTicket) || isSubmitting}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  background: '#BF932A',
                  color: '#111827',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Working...' : 'Assign Technician'}
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>Reject Ticket</h3>
              <p style={{ margin: '0 0 10px 0', color: '#9ca3af', fontSize: '13px' }}>
                Reject OPEN tickets with a mandatory reason and status update.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required)"
                rows={3}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', padding: '10px', marginBottom: '10px', resize: 'vertical' }}
                disabled={!selectedTicket || !canReject(selectedTicket) || isSubmitting}
              />

              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Optional internal note"
                rows={2}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', padding: '10px', marginBottom: '10px', resize: 'vertical' }}
                disabled={!selectedTicket || isSubmitting}
              />

              <button
                type="button"
                onClick={handleRejectTicket}
                disabled={!selectedTicket || !canReject(selectedTicket) || isSubmitting}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Working...' : 'Reject Ticket'}
              </button>
            </div>
          </div>
          )}

          {ticketView === 'attachments' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>Ticket Attachments</h3>
            {!selectedTicket ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>Select a ticket to view attachments.</p>
            ) : attachmentsLoading ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>Loading attachments...</p>
            ) : attachments.length === 0 ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>No attachments uploaded for this ticket.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.attachmentId || `${attachment.fileUrl}-${attachment.uploadedAt}`}
                    style={{ border: '1px solid #1f2937', borderRadius: '10px', background: '#0f172a', overflow: 'hidden' }}
                  >
                    <a href={attachmentUrl(attachment.fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                      <img
                        src={attachmentUrl(attachment.fileUrl)}
                        alt={attachment.fileName || 'Ticket attachment'}
                        style={{ width: '100%', height: '132px', objectFit: 'cover', display: 'block' }}
                      />
                    </a>

                    <div style={{ padding: '10px' }}>
                      <p style={{ margin: 0, color: '#f8fafc', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {attachment.fileName || 'Attachment'}
                      </p>

                      <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                        Caption: {attachment.caption || '-'}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>
                        Uploaded by: {formatUserWithId(attachment.uploadedByUserId)}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>
                        Uploaded at: {formatDate(attachment.uploadedAt)}
                      </p>

                      {canDeleteAttachment(attachment) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment.attachmentId)}
                          disabled={isSubmitting}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            background: '#dc2626',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          Delete Attachment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {ticketView === 'status' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>Status History</h3>
            {!selectedTicket ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>Select a ticket to view its status history.</p>
            ) : history.length === 0 ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>No history entries yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {history.map((entry) => (
                  <div key={entry.historyId || `${entry.oldStatus}-${entry.newStatus}-${entry.changedAt}`} style={{ border: '1px solid #1f2937', borderRadius: '10px', background: '#0f172a', padding: '10px 12px' }}>
                    <p style={{ margin: 0, color: '#fff', fontSize: '13px' }}>
                      <strong>{entry.oldStatus || '-'}</strong> {'->'} <strong>{entry.newStatus || '-'}</strong>
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      By: {formatUserWithId(entry.changedByUserId)} | {formatDate(entry.changedAt)}
                    </p>
                    {entry.changeNote && (
                      <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                        Note: {entry.changeNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {ticketView === 'assignment' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#fff' }}>Assignment History</h3>
            {!selectedTicket ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>Select a ticket to view assignment history.</p>
            ) : assignmentHistory.length === 0 ? (
              <p style={{ margin: 0, color: '#9ca3af' }}>No assignment entries yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {assignmentHistory.map((entry) => (
                  <div
                    key={entry.assignmentId || `${entry.technicianId}-${entry.assignedAt}`}
                    style={{ border: '1px solid #1f2937', borderRadius: '10px', background: '#0f172a', padding: '10px 12px' }}
                  >
                    <p style={{ margin: 0, color: '#fff', fontSize: '13px' }}>
                      Technician: <strong>{formatUserWithId(entry.technicianId)}</strong>
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      Assigned by: {formatUserWithId(entry.assignedByUserId)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      Assigned at: {formatDate(entry.assignedAt)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      Unassigned at: {formatDate(entry.unassignedAt)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: entry.isActive ? '#86efac' : '#fca5a5', fontSize: '12px', fontWeight: 700 }}>
                      {entry.isActive ? 'Active Assignment' : 'Closed Assignment'}
                    </p>
                    {entry.assignmentNote && (
                      <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                        Note: {entry.assignmentNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </section>
      </div>
      </main>
    </div>
  );
}
