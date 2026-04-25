import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './TicketDetailsPage.css';

const API_BASE = 'http://localhost:8081/api/tickets';
const PROFILE_API = 'http://localhost:8081/api/profile';

function formatDateTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatFileSize(sizeInBytes) {
  if (sizeInBytes === null || sizeInBytes === undefined) return '-';
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildCommentTree(comments) {
  const byParent = new Map();

  comments.forEach((comment) => {
    const parentKey = comment.parentCommentId ?? null;
    const bucket = byParent.get(parentKey) || [];
    bucket.push(comment);
    byParent.set(parentKey, bucket);
  });

  const sortBranch = (items) =>
    [...items].sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));

  const walk = (parentId = null) => {
    const branch = sortBranch(byParent.get(parentId) || []);
    return branch.map((comment) => ({
      ...comment,
      replies: walk(comment.commentId),
    }));
  };

  return walk();
}

function TicketDetailField({ label, value }) {
  return (
    <div className="ticket-detail-field">
      <span className="ticket-detail-label">{label}</span>
      <span className="ticket-detail-value">{value || '-'}</span>
    </div>
  );
}

function CommentCard({
  comment,
  currentUserId,
  userCache,
  onReply,
  onEdit,
  onDelete,
  editingCommentId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  depth = 0,
}) {
  const isOwnComment = currentUserId && currentUserId === comment.userId;
  const isEditing = editingCommentId === comment.commentId;
  const isReplyTarget = replyingTo === comment.commentId;
  const author = userCache?.[comment.userId];
  const authorLabel = isOwnComment
    ? 'You'
    : author?.name
      ? `${author.name}${author.email ? ` (${author.email})` : ''}`
      : comment.userId || 'Unknown user';

  return (
    <article className={`comment-card depth-${Math.min(depth, 3)}`}>
      <div className="comment-header">
        <div>
          <div className="comment-author-row">
            <strong>{authorLabel}</strong>
            <span className={`comment-pill ${comment.isInternal ? 'internal' : 'public'}`}>
              {comment.isInternal ? 'Internal' : 'Public'}
            </span>
            {comment.isEdited && <span className="comment-pill edited">Edited</span>}
          </div>
          <p className="comment-meta">{formatDateTime(comment.createdAt)}</p>
        </div>
        <div className="comment-actions">
          <button type="button" className="comment-link-btn" onClick={() => onReply(comment.commentId)}>
            Reply
          </button>
          {isOwnComment && (
            <>
              <button type="button" className="comment-link-btn" onClick={() => onEdit(comment)}>
                Edit
              </button>
              <button type="button" className="comment-link-btn danger" onClick={() => onDelete(comment.commentId)}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="comment-editor">
          <textarea
            value={editingText}
            onChange={(event) => onEditingTextChange(event.target.value)}
            rows={4}
          />
          <div className="comment-editor-actions">
            <button type="button" className="ticket-primary-btn" onClick={onSaveEdit}>
              Save changes
            </button>
            <button type="button" className="ticket-secondary-btn" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-text">{comment.commentText}</p>
      )}

      {isReplyTarget && (
        <div className="inline-reply-box">
          <textarea
            value={replyText}
            onChange={(event) => onReplyTextChange(event.target.value)}
            rows={3}
            placeholder="Write a reply..."
          />
          <div className="comment-editor-actions">
            <button type="button" className="ticket-primary-btn" onClick={() => onSubmitReply(comment.commentId)}>
              Post reply
            </button>
            <button type="button" className="ticket-secondary-btn" onClick={onCancelReply}>
              Cancel reply
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.commentId}
              comment={reply}
              currentUserId={currentUserId}
              userCache={userCache}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              editingCommentId={editingCommentId}
              editingText={editingText}
              onEditingTextChange={onEditingTextChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState('success');
  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const fetchUserInfo = async (userId) => {
    if (!userId || userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await fetch(`${PROFILE_API}/user/${userId}`, { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUserCache((prev) => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
    }

    return null;
  };

  const prefetchCommentAuthors = async (commentList) => {
    if (!Array.isArray(commentList) || commentList.length === 0) return;
    const uniqueUserIds = [...new Set(commentList.map((comment) => comment.userId).filter(Boolean))];
    if (uniqueUserIds.length === 0) return;
    await Promise.all(uniqueUserIds.map((userId) => fetchUserInfo(userId)));
  };

  const fetchTicketData = async () => {
    if (!ticketId) {
      setPageError('Missing ticket ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const [ticketResponse, commentsResponse, attachmentsResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE}/${ticketId}`, { credentials: 'include' }),
        fetch(`${API_BASE}/${ticketId}/comments`, { credentials: 'include' }),
        fetch(`${API_BASE}/${ticketId}/attachments`, { credentials: 'include' }),
        fetch(`${API_BASE}/${ticketId}/history`, { credentials: 'include' }),
      ]);

      if (!ticketResponse.ok) {
        throw new Error('Ticket not found or you do not have access to it.');
      }

      const ticketData = await ticketResponse.json();
      const commentsData = commentsResponse.ok ? await commentsResponse.json() : [];
      const attachmentsData = attachmentsResponse.ok ? await attachmentsResponse.json() : [];
      const historyData = historyResponse.ok ? await historyResponse.json() : [];

      setTicket(ticketData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setAttachments(Array.isArray(attachmentsData) ? attachmentsData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);

      // Pre-fetch user details for creator and assigned technician
      if (ticketData?.createdByUserId) {
        await fetchUserInfo(ticketData.createdByUserId);
      }
      if (ticketData?.assignedTechnicianId) {
        await fetchUserInfo(ticketData.assignedTechnicianId);
      }
      await prefetchCommentAuthors(commentsData);
    } catch (error) {
      setPageError(error.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const currentUserId = user?.id || user?.userId || '';
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  const canShowInternalToggle = ['admin', 'manager'].includes((user?.role || '').toLowerCase());

  const refreshComments = async () => {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`, { credentials: 'include' });
    const data = response.ok ? await response.json() : [];
    await prefetchCommentAuthors(data);
    setComments(Array.isArray(data) ? data : []);
  };

  const submitComment = async (payload) => {
    if (!currentUserId) {
      setNoticeTone('error');
      setNotice('Unable to identify the current user. Please sign in again.');
      return;
    }

    setCommentSubmitting(true);
    setNotice('');

    try {
      const response = await fetch(`${API_BASE}/${ticketId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Could not post comment.');
      }

      setNoticeTone('success');
      setNotice('Comment posted successfully.');
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
      await refreshComments();
    } catch (error) {
      setNoticeTone('error');
      setNotice(error.message || 'Comment request failed.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handlePostComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) {
      setNoticeTone('error');
      setNotice('Please write a comment before posting.');
      return;
    }

    await submitComment({
      userId: currentUserId,
      commentText: commentText.trim(),
      isInternal: commentInternal && canShowInternalToggle,
      parentCommentId: null,
    });
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
    setEditingCommentId(null);
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!replyText.trim()) {
      setNoticeTone('error');
      setNotice('Please write a reply before posting.');
      return;
    }

    await submitComment({
      userId: currentUserId,
      commentText: replyText.trim(),
      isInternal: false,
      parentCommentId,
    });
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditingText(comment.commentText || '');
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSaveCommentEdit = async () => {
    if (!editingText.trim()) {
      setNoticeTone('error');
      setNotice('Comment text cannot be empty.');
      return;
    }

    if (!currentUserId) {
      setNoticeTone('error');
      setNotice('Unable to identify the current user. Please sign in again.');
      return;
    }

    setCommentSubmitting(true);
    setNotice('');

    try {
      const response = await fetch(`${API_BASE}/comments/${editingCommentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          commentText: editingText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Could not update comment.');
      }

      setNoticeTone('success');
      setNotice('Comment updated successfully.');
      setEditingCommentId(null);
      setEditingText('');
      await refreshComments();
    } catch (error) {
      setNoticeTone('error');
      setNotice(error.message || 'Update failed.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) {
      return;
    }

    if (!currentUserId) {
      setNoticeTone('error');
      setNotice('Unable to identify the current user. Please sign in again.');
      return;
    }

    setNotice('');

    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}?userId=${encodeURIComponent(currentUserId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Could not delete comment.');
      }

      setNoticeTone('success');
      setNotice('Comment deleted successfully.');
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingText('');
      }
      await refreshComments();
    } catch (error) {
      setNoticeTone('error');
      setNotice(error.message || 'Delete failed.');
    }
  };

  if (loading) {
    return <div className="ticket-details-page loading-state">Loading ticket details...</div>;
  }

  if (pageError) {
    return (
      <div className="ticket-details-page">
        <div className="ticket-details-shell narrow">
          <div className="ticket-error-card">
            <h1>Ticket unavailable</h1>
            <p>{pageError}</p>
            <Link to="/tickets" className="ticket-primary-btn inline-link">
              Back to tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ticketTitle = ticket?.title || 'Ticket details';
  const threadCount = comments.length;

  return (
    <div className="ticket-details-page">
      <div className="ticket-details-shell">
        <header className="ticket-details-hero">
          <div>
            <p className="ticket-hero-kicker">Student Support Center</p>
            <h1>{ticketTitle}</h1>
            <p className="ticket-hero-subtitle">
              This page keeps the full ticket context and the comment thread in one place.
            </p>
          </div>
          <div className="ticket-hero-actions">
            <Link to="/tickets" className="ticket-secondary-btn inline-link">
              Back to tickets
            </Link>
          </div>
        </header>

        <section className="ticket-summary-grid">
          <article className="ticket-summary-card ticket-summary-main">
            <div className="ticket-summary-topline">
              <span className="ticket-code">{ticket?.ticketCode || `TICKET-${ticketId}`}</span>
              <div className="ticket-badge-row">
                <span className={`status-pill ${String(ticket?.status || '').toLowerCase()}`}>{ticket?.status || 'OPEN'}</span>
                <span className="status-pill muted">{ticket?.priority || 'MEDIUM'}</span>
              </div>
            </div>

            <h2>{ticket?.title}</h2>
            <p className="ticket-description">{ticket?.description}</p>

            <div className="ticket-summary-tags">
              <span>Category: {ticket?.category || '-'}</span>
              <span>Location: {ticket?.locationId || '-'}</span>
              <span>Resource: {ticket?.resourceId || '-'}</span>
            </div>
          </article>

          <article className="ticket-summary-card ticket-summary-side">
            <h3>Important details</h3>
            <div className="ticket-detail-grid">
              <TicketDetailField 
                label="Created by" 
                value={userCache[ticket?.createdByUserId]
                  ? `${userCache[ticket.createdByUserId].name} (${userCache[ticket.createdByUserId].email})`
                  : ticket?.createdByUserId || '-'
                } 
              />
              <TicketDetailField 
                label="Assigned technician" 
                value={ticket?.assignedTechnicianId 
                  ? (userCache[ticket.assignedTechnicianId]
                    ? `${userCache[ticket.assignedTechnicianId].name} (${userCache[ticket.assignedTechnicianId].email})`
                    : ticket.assignedTechnicianId)
                  : 'Unassigned'
                }
              />
              <TicketDetailField label="Created" value={formatDateTime(ticket?.createdAt)} />
              <TicketDetailField label="Updated" value={formatDateTime(ticket?.updatedAt)} />
              <TicketDetailField label="Contact name" value={ticket?.preferredContactName} />
              <TicketDetailField label="Contact email" value={ticket?.preferredContactEmail} />
              <TicketDetailField label="Contact phone" value={ticket?.preferredContactPhone} />
              <TicketDetailField label="Comments" value={`${threadCount} message${threadCount === 1 ? '' : 's'}`} />
            </div>
          </article>
        </section>

        <section className="ticket-feature-grid">
          <article className="ticket-feature-card">
            <h3>Timeline</h3>
            <p>Recent state changes give quick context on where the case stands.</p>
            <div className="ticket-mini-list">
              {history.length === 0 ? (
                <span className="ticket-muted-copy">No status history yet.</span>
              ) : (
                history.slice(0, 4).map((entry) => (
                  <div key={entry.historyId} className="ticket-mini-row">
                    <strong>{entry.oldStatus || 'NEW'} → {entry.newStatus || '-'}</strong>
                    <span>{formatDateTime(entry.changedAt)}</span>
                    <span>{entry.changeNote || 'No note provided.'}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="ticket-feature-card">
            <h3>Attachments</h3>
            <p>Files uploaded with the ticket are shown here for quick reference.</p>
            <div className="ticket-mini-list">
              {attachments.length === 0 ? (
                <span className="ticket-muted-copy">No attachments uploaded yet.</span>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.attachmentId} className="ticket-mini-row attachment-row">
                    <strong>{attachment.fileName}</strong>
                    <span>
                      {formatFileSize(attachment.fileSize)} · {formatDateTime(attachment.uploadedAt)}
                    </span>
                    {attachment.caption && <span>{attachment.caption}</span>}
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="ticket-comments-card">
          <div className="ticket-section-heading">
            <div>
              <p className="ticket-section-kicker">Main discussion</p>
              <h2>Comments</h2>
            </div>
            <span className="ticket-comment-count">{threadCount} total</span>
          </div>

          <form className="comment-compose" onSubmit={handlePostComment}>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              placeholder="Add a comment to this ticket..."
            />

            <div className="comment-compose-footer">
              {canShowInternalToggle ? (
                <label className="comment-toggle">
                  <input
                    type="checkbox"
                    checked={commentInternal}
                    onChange={(event) => setCommentInternal(event.target.checked)}
                  />
                  Post as internal note
                </label>
              ) : (
                <span className="ticket-muted-copy">Student comments are posted publicly on this ticket.</span>
              )}

              <button type="submit" className="ticket-primary-btn" disabled={commentSubmitting}>
                {commentSubmitting ? 'Posting...' : 'Post comment'}
              </button>
            </div>
          </form>

          {notice && <p className={`ticket-notice ${noticeTone}`}>{notice}</p>}

          <div className="comment-thread">
            {commentTree.length === 0 ? (
              <div className="empty-comments-state">
                <h3>No comments yet</h3>
                <p>Start the discussion by adding the first update or question.</p>
              </div>
            ) : (
              commentTree.map((comment) => (
                <CommentCard
                  key={comment.commentId}
                  comment={comment}
                  currentUserId={currentUserId}
                  userCache={userCache}
                  onReply={handleReply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  editingCommentId={editingCommentId}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onSaveEdit={handleSaveCommentEdit}
                  onCancelEdit={() => {
                    setEditingCommentId(null);
                    setEditingText('');
                  }}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={handleSubmitReply}
                  onCancelReply={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
