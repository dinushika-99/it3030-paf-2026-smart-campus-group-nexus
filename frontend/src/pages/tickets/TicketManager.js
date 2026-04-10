import React, { useEffect, useMemo, useState } from 'react';
import './TicketPage.css';

const API_BASE = 'http://localhost:8081/api/tickets';

const EMPTY_FORM = {
  title: '',
  category: '',
  description: '',
  priority: 'MEDIUM',
  preferredContactName: '',
  preferredContactEmail: '',
  preferredContactPhone: '',
  resourceId: '',
  locationId: '',
};

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function toPayload(form, editingTicket) {
  const resourceId = form.resourceId.trim();
  const locationId = form.locationId.trim();

  return {
    title: form.title.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    priority: form.priority,
    // New tickets must always start in OPEN; edits preserve current status.
    status: editingTicket?.status || 'OPEN',
    preferredContactName: form.preferredContactName.trim(),
    preferredContactEmail: form.preferredContactEmail.trim(),
    preferredContactPhone: form.preferredContactPhone.trim(),
    resourceId: resourceId || null,
    locationId: locationId || null,
  };
}

export default function TicketManager({ user }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitLabel = useMemo(() => (editingId ? 'Update Ticket' : 'Create Ticket'), [editingId]);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load tickets.');
      }

      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const editingTicket = tickets.find((ticket) => ticket.ticketId === editingId) || null;
      const payload = toPayload(form, editingTicket);
      const endpoint = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(editingId ? 'Failed to update ticket.' : 'Failed to create ticket.');
      }

      setMessage(editingId ? 'Ticket updated successfully.' : 'Ticket created successfully.');
      resetForm();
      await fetchTickets();
    } catch (submitError) {
      setError(submitError.message || 'Ticket request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.ticketId);
    setForm({
      title: ticket.title || '',
      category: ticket.category || '',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM',
      preferredContactName: ticket.preferredContactName || '',
      preferredContactEmail: ticket.preferredContactEmail || '',
      preferredContactPhone: ticket.preferredContactPhone || '',
      resourceId: String(ticket.resourceId ?? ''),
      locationId: String(ticket.locationId ?? ''),
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (ticketId) => {
    const confirmed = window.confirm('Delete this ticket?');
    if (!confirmed) {
      return;
    }

    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_BASE}/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticket.');
      }

      setMessage('Ticket deleted successfully.');
      if (editingId === ticketId) {
        resetForm();
      }
      await fetchTickets();
    } catch (deleteError) {
      setError(deleteError.message || 'Delete request failed.');
    }
  };

  return (
    <section className="ticket-manager">
      <h3 className="ticket-manager-title">Ticket Management</h3>
      <p className="ticket-manager-subtitle">Create, view, update, and delete support tickets.</p>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          required
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          rows={3}
          required
        />

        <div className="ticket-form-row">
          <select name="priority" value={form.priority} onChange={handleChange}>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="ticket-form-row">
          <input
            name="resourceId"
            value={form.resourceId}
            onChange={handleChange}
            placeholder="Resource (optional)"
            type="text"
          />
          <input
            name="locationId"
            value={form.locationId}
            onChange={handleChange}
            placeholder="Location (optional)"
            type="text"
          />
        </div>

        <div className="ticket-form-row">
          <input
            name="preferredContactName"
            value={form.preferredContactName}
            onChange={handleChange}
            placeholder="Contact Name"
          />
          <input
            name="preferredContactEmail"
            value={form.preferredContactEmail}
            onChange={handleChange}
            placeholder="Contact Email"
            type="email"
          />
        </div>

        <input
          name="preferredContactPhone"
          value={form.preferredContactPhone}
          onChange={handleChange}
          placeholder="Contact Phone"
          required
        />

        <div className="ticket-action-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {message && <p className="ticket-feedback success">{message}</p>}
      {error && <p className="ticket-feedback error">{error}</p>}

      <div className="ticket-list-wrap">
        {isLoading ? (
          <p>Loading tickets...</p>
        ) : (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="7">No tickets found.</td>
                </tr>
              )}

              {tickets.map((ticket) => (
                <tr key={ticket.ticketId}>
                  <td>{ticket.ticketId}</td>
                  <td>{ticket.ticketCode || '-'}</td>
                  <td>{ticket.title}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.priority}</td>
                  <td>{ticket.createdByUserId || user?.id || '-'}</td>
                  <td className="ticket-row-actions">
                    <button type="button" className="btn-secondary" onClick={() => handleEdit(ticket)}>
                      Edit
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(ticket.ticketId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}