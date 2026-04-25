import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';
import './TechnicianWorkspacePage.css';

const API_BASE = '/api/tickets';
const PROFILE_API = '/api/profile';

const STATUS_OPTIONS = {
  OPEN: ['OPEN', 'IN_PROGRESS'],
  IN_PROGRESS: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['RESOLVED', 'CLOSED'],
  CLOSED: ['CLOSED'],
  REJECTED: ['REJECTED'],
};

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusTone(status) {
  switch (String(status || '').toUpperCase()) {
    case 'OPEN':
      return 'amber';
    case 'IN_PROGRESS':
      return 'blue';
    case 'RESOLVED':
      return 'green';
    case 'CLOSED':
      return 'slate';
    case 'REJECTED':
      return 'red';
    default:
      return 'slate';
  }
}

function uniqueSorted(items) {
  return [...new Set(items)].sort((left, right) => left.localeCompare(right));
}

export default function TechnicianWorkspacePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [comments, setComments] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ status: '', resolutionNotes: '', changeNote: '' });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    const role = String(parsed?.role || '').toLowerCase();
    if (!['technician', 'admin'].includes(role)) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const fetchAssignedTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`${API_BASE}/my-assigned`);
      const data = Array.isArray(response?.data) ? response.data : [];
      setTickets(data);
      setSelectedTicketId((currentSelectedId) => {
        if (currentSelectedId && data.some((ticket) => String(ticket.ticketId) === String(currentSelectedId))) {
          return currentSelectedId;
        }
        return data[0]?.ticketId || null;
      });
    } catch (fetchError) {
      setError(fetchError.response?.data?.error || fetchError.message || 'Could not load technician assignments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = useCallback(async (userId) => {
    if (!userId) {
      return null;
    }
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await api.get(`${PROFILE_API}/user/${encodeURIComponent(userId)}`);
      const profile = response?.data || null;
      if (profile) {
        setUserCache((prev) => ({ ...prev, [userId]: profile }));
      }
      return profile;
    } catch {
      return null;
    }
  }, [userCache]);

  const prefetchCommentAuthors = useCallback(async (commentItems) => {
    if (!Array.isArray(commentItems) || commentItems.length === 0) {
      return;
    }

    const uniqueUserIds = [...new Set(commentItems.map((item) => item.userId).filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return;
    }

    await Promise.all(uniqueUserIds.map((id) => fetchUserInfo(id)));
  }, [fetchUserInfo]);

  useEffect(() => {
    if (user) {
      fetchAssignedTickets();
    }
  }, [user]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => String(ticket.ticketId) === String(selectedTicketId)) || null,
    [tickets, selectedTicketId]
  );

  const isTechnician = String(user?.role || '').toLowerCase() === 'technician';

  useEffect(() => {
    if (!selectedTicket) {
      setForm({ status: '', resolutionNotes: '', changeNote: '' });
      setComments([]);
      setCommentText('');
      return;
    }

    setForm((prev) => ({
      ...prev,
      status: selectedTicket.status || 'IN_PROGRESS',
      resolutionNotes: selectedTicket.resolutionNotes || '',
      changeNote: prev.changeNote || '',
    }));

    const fetchComments = async () => {
      try {
        const response = await api.get(`${API_BASE}/${selectedTicket.ticketId}/comments`);
        const commentItems = Array.isArray(response?.data) ? response.data : [];
        await prefetchCommentAuthors(commentItems);
        setComments(commentItems);
      } catch {
        setComments([]);
      }
    };

    fetchComments();
  }, [selectedTicket, prefetchCommentAuthors]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'ALL' || String(ticket.status || '').toUpperCase() === statusFilter;
      const searchable = [ticket.ticketCode, ticket.title, ticket.category, ticket.locationId, ticket.resourceId]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      const matchesQuery = !query || searchable.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [tickets, search, statusFilter]);

  const stats = useMemo(() => {
    const summary = { total: tickets.length, open: 0, active: 0, resolved: 0 };
    tickets.forEach((ticket) => {
      const status = String(ticket.status || '').toUpperCase();
      if (status === 'OPEN') summary.open += 1;
      if (status === 'IN_PROGRESS') summary.active += 1;
      if (status === 'RESOLVED' || status === 'CLOSED') summary.resolved += 1;
    });
    return summary;
  }, [tickets]);

  useEffect(() => {
    if (!selectedTicketId && filteredTickets.length > 0) {
      setSelectedTicketId(filteredTickets[0].ticketId);
    }
  }, [filteredTickets, selectedTicketId]);

  const allowedStatuses = useMemo(() => {
    const currentStatus = String(selectedTicket?.status || '').toUpperCase();
    if (!currentStatus) {
      return ['IN_PROGRESS'];
    }

    if (isTechnician) {
      return currentStatus === 'IN_PROGRESS' ? ['RESOLVED'] : [currentStatus];
    }

    return STATUS_OPTIONS[currentStatus] || [currentStatus];
  }, [selectedTicket, isTechnician]);

  const canTechnicianResolve = !isTechnician || String(selectedTicket?.status || '').toUpperCase() === 'IN_PROGRESS';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTicket) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.put(`${API_BASE}/${selectedTicket.ticketId}/status`, {
        status: form.status,
        resolutionNotes: form.resolutionNotes,
        changeNote: form.changeNote,
        changedByUserId: user?.id || user?.userId,
      });

      setMessage('Ticket updated successfully.');
      await fetchAssignedTickets();
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || 'Could not update ticket status.');
    } finally {
      setSaving(false);
    }
  };

  const quickSetStatus = (status) => {
    setForm((prev) => ({ ...prev, status }));
  };

  const handlePostComment = async (event) => {
    event.preventDefault();
    if (!selectedTicket) {
      return;
    }

    const normalizedComment = commentText.trim();
    if (!normalizedComment) {
      setError('Please enter a comment before posting.');
      return;
    }

    const currentUserId = user?.id || user?.userId;
    if (!currentUserId) {
      setError('Unable to identify current user for comment posting.');
      return;
    }

    setCommentSubmitting(true);
    setError('');

    try {
      await api.post(`${API_BASE}/${selectedTicket.ticketId}/comments`, {
        userId: currentUserId,
        commentText: normalizedComment,
        isInternal: false,
        parentCommentId: null,
      });

      setCommentText('');
      setMessage('Comment posted successfully.');

      const commentsResponse = await api.get(`${API_BASE}/${selectedTicket.ticketId}/comments`);
      const commentItems = Array.isArray(commentsResponse?.data) ? commentsResponse.data : [];
      await prefetchCommentAuthors(commentItems);
      setComments(commentItems);
    } catch (commentError) {
      setError(commentError.response?.data?.error || commentError.message || 'Could not post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!user) {
    return <div className="technician-page-loading">Loading technician workspace...</div>;
  }

  return (
    <div className="technician-page-root">
      <div className="technician-page-shell">
        <header className="technician-hero">
          <div>
            <p className="technician-kicker">Assigned Workbench</p>
            <h1>Technician Workspace</h1>
            <p className="technician-subtitle">Track assigned tickets, update progress, and close the loop with resolution notes.</p>
          </div>
          <div className="technician-hero-actions">
            <Link to="/dashboard" className="technician-btn secondary">Dashboard</Link>
          </div>
        </header>

        <section className="technician-stats-grid">
          <article className="technician-stat-card accent">
            <span>Assigned</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="technician-stat-card">
            <span>Open</span>
            <strong>{stats.open}</strong>
          </article>
          <article className="technician-stat-card">
            <span>In Progress</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="technician-stat-card">
            <span>Resolved / Closed</span>
            <strong>{stats.resolved}</strong>
          </article>
        </section>

        <section className="technician-main-grid">
          <aside className="technician-panel queue-panel">
            <div className="technician-panel-head">
              <div>
                <p className="panel-kicker">Your Queue</p>
                <h2>Assigned Tickets</h2>
              </div>
              <span className="queue-count">{filteredTickets.length}</span>
            </div>

            <div className="technician-filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code, title, category..."
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All Statuses</option>
                {uniqueSorted(tickets.map((ticket) => String(ticket.status || '').toUpperCase())).map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="ticket-queue-list">
              {loading ? (
                <p className="empty-state">Loading assignments...</p>
              ) : filteredTickets.length === 0 ? (
                <div className="empty-state">
                  <h3>No assigned tickets</h3>
                  <p>When an admin assigns a ticket to you, it will appear here automatically.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const selected = String(ticket.ticketId) === String(selectedTicketId);
                  return (
                    <button
                      key={ticket.ticketId}
                      type="button"
                      className={`queue-item ${selected ? 'selected' : ''}`}
                      onClick={() => setSelectedTicketId(ticket.ticketId)}
                    >
                      <div className="queue-item-top">
                        <span className="queue-code">{ticket.ticketCode || `TCK-${ticket.ticketId}`}</span>
                        <span className={`status-pill ${statusTone(ticket.status)}`}>{ticket.status || 'OPEN'}</span>
                      </div>
                      <h3>{ticket.title}</h3>
                      <p>{ticket.category || 'No category'} · {ticket.locationId || ticket.resourceId || 'No location'}</p>
                      <div className="queue-item-meta">
                        <span>Updated {formatDateTime(ticket.updatedAt)}</span>
                        <span>Priority {ticket.priority || '-'}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="technician-panel detail-panel">
            {selectedTicket ? (
              <>
                <div className="technician-panel-head">
                  <div>
                    <p className="panel-kicker">Ticket Detail</p>
                    <h2>{selectedTicket.title}</h2>
                  </div>
                </div>

                <div className="detail-summary-grid">
                  <div>
                    <span>Ticket Code</span>
                    <strong>{selectedTicket.ticketCode || '-'}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selectedTicket.status || '-'}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{selectedTicket.priority || '-'}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{selectedTicket.category || '-'}</strong>
                  </div>
                </div>

                <div className="detail-notes-box">
                  <p className="panel-kicker">Problem Summary</p>
                  <p>{selectedTicket.description || '-'}</p>
                </div>

                <div className="detail-summary-grid">
                  <div>
                    <span>Location</span>
                    <strong>{selectedTicket.locationId || '-'}</strong>
                  </div>
                  <div>
                    <span>Resource</span>
                    <strong>{selectedTicket.resourceId || '-'}</strong>
                  </div>
                  <div>
                    <span>Contact Name</span>
                    <strong>{selectedTicket.preferredContactName || '-'}</strong>
                  </div>
                  <div>
                    <span>Contact Phone</span>
                    <strong>{selectedTicket.preferredContactPhone || '-'}</strong>
                  </div>
                </div>

                <div className="detail-notes-box">
                  <p className="panel-kicker">Contact Email</p>
                  <p>{selectedTicket.preferredContactEmail || '-'}</p>
                </div>

                <form className="status-form" onSubmit={handleSubmit}>
                  <div className="status-form-grid">
                    <label>
                      Status
                      <select
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        disabled={isTechnician}
                      >
                        {allowedStatuses.map((status) => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Change Note
                      <input
                        value={form.changeNote}
                        onChange={(event) => setForm((prev) => ({ ...prev, changeNote: event.target.value }))}
                        placeholder="Short update for the status history"
                      />
                    </label>
                  </div>

                  <label>
                    Resolution Notes
                    <textarea
                      value={form.resolutionNotes}
                      onChange={(event) => setForm((prev) => ({ ...prev, resolutionNotes: event.target.value }))}
                      rows={5}
                      placeholder="Write what you checked, fixed, or need to follow up on..."
                    />
                  </label>

                  {isTechnician && !canTechnicianResolve && (
                    <p className="feedback error" style={{ marginTop: '-4px' }}>
                      Technician can only resolve tickets that are IN_PROGRESS.
                    </p>
                  )}

                  <div className="quick-actions">
                    {isTechnician ? (
                      <button
                        type="button"
                        className="technician-btn secondary"
                        onClick={() => quickSetStatus('RESOLVED')}
                        disabled={!canTechnicianResolve}
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <>
                        <button type="button" className="technician-btn secondary" onClick={() => quickSetStatus('IN_PROGRESS')}>Mark In Progress</button>
                        <button type="button" className="technician-btn secondary" onClick={() => quickSetStatus('RESOLVED')}>Mark Resolved</button>
                        <button type="button" className="technician-btn secondary" onClick={() => quickSetStatus('CLOSED')}>Close Ticket</button>
                      </>
                    )}
                    <button type="submit" className="technician-btn primary" disabled={saving || !canTechnicianResolve}>
                      {saving ? 'Saving...' : 'Save Update'}
                    </button>
                  </div>
                </form>

                {message && <p className="feedback success">{message}</p>}
                {error && <p className="feedback error">{error}</p>}

                <section className="technician-comments-section">
                  <div className="technician-panel-head compact">
                    <div>
                      <p className="panel-kicker">Collaboration</p>
                      <h3>Comments</h3>
                    </div>
                  </div>

                  <form className="technician-comment-form" onSubmit={handlePostComment}>
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Add technician update or follow-up note..."
                    />
                    <div className="technician-comment-form-actions">
                      <button type="submit" className="technician-btn primary" disabled={commentSubmitting}>
                        {commentSubmitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>

                  {comments.length === 0 ? (
                    <p className="empty-history">No comments yet.</p>
                  ) : (
                    <div className="history-list">
                      {comments.map((entry) => (
                        <article key={entry.commentId} className="history-item">
                          <div>
                            <strong>
                              {userCache[entry.userId]?.name || 'Unknown user'}
                              {userCache[entry.userId]?.email ? ` (${userCache[entry.userId].email})` : ''}
                            </strong>
                            <span>{formatDateTime(entry.createdAt)}</span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                            Role: {String(userCache[entry.userId]?.role || '-').toUpperCase()}
                          </p>
                          <p>{entry.commentText || '-'}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="empty-state large">
                <h2>No ticket selected</h2>
                <p>Choose an assigned ticket from the queue to review it and update its status.</p>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}