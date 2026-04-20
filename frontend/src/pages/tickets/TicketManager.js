import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TicketPage.css';
import api from '../../api/axiosClient';

const API_BASE = '/api/tickets';

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
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

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
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
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
      const response = await api.get(API_BASE);
      const data = response.data;
      setTickets(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.error || fetchError.message || 'Could not load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [selectedImages]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetSelectedImages = () => {
    setSelectedImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    setError('');

    const availableSlots = MAX_ATTACHMENTS - selectedImages.length;
    if (availableSlots <= 0) {
      setError('Maximum 3 images allowed. Remove one to add another.');
      return;
    }

    const nextImages = [];

    for (const file of files) {
      if (nextImages.length >= availableSlots) {
        break;
      }

      const type = (file.type || '').toLowerCase();
      if (!ALLOWED_ATTACHMENT_TYPES.includes(type)) {
        setError('Only JPG, JPEG, PNG, and WEBP images are allowed.');
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('Each image must be 5MB or smaller.');
        continue;
      }

      nextImages.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nextImages.length === 0) {
      return;
    }

    setSelectedImages((prev) => [...prev, ...nextImages]);
  };

  const removeSelectedImage = (imageId) => {
    setSelectedImages((prev) => {
      const target = prev.find((image) => image.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((image) => image.id !== imageId);
    });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    resetSelectedImages();
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
      let ticketResponse;
      if (editingId) {
        ticketResponse = await api.put(endpoint, payload);
      } else {
        ticketResponse = await api.post(endpoint, payload);
      }

      const savedTicket = ticketResponse?.data;

      if (!editingId && selectedImages.length > 0) {
        const createdTicketId = savedTicket?.ticketId;
        const uploadedByUserId = user?.id || user?.userId;

        if (!createdTicketId) {
          throw new Error('Ticket created but attachment upload could not start (missing ticket ID).');
        }
        if (!uploadedByUserId) {
          throw new Error('Ticket created but attachment upload failed (missing user ID).');
        }

        for (const image of selectedImages) {
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('uploadedByUserId', uploadedByUserId);

          await api.post(`${API_BASE}/${createdTicketId}/attachments`, formData);
        }
      }

      setMessage(editingId ? 'Ticket updated successfully.' : 'Ticket created successfully.');
      resetForm();
      await fetchTickets();
    } catch (submitError) {
      const uploadError = submitError?.response?.data?.error || submitError?.response?.data?.message;
      setError(uploadError || submitError.message || 'Ticket request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.ticketId);
    resetSelectedImages();
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
      await api.delete(`${API_BASE}/${ticketId}`);

      setMessage('Ticket deleted successfully.');
      if (editingId === ticketId) {
        resetForm();
      }
      await fetchTickets();
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || deleteError.message || 'Delete request failed.');
    }
  };

  const openTicketDetails = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
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

        {!editingId && (
          <div className="attachment-section">
            <label className="attachment-label" htmlFor="ticket-attachments">Attach images (optional)</label>
            <input
              id="ticket-attachments"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleImageSelect}
            />
            <p className="attachment-rules">
              Max 3 images. Only JPG/PNG/JPEG/WEBP. Max 5MB per image.
            </p>

            {selectedImages.length > 0 && (
              <div className="attachment-preview-grid">
                {selectedImages.map((image) => (
                  <div className="attachment-preview-card" key={image.id}>
                    <img src={image.previewUrl} alt={image.file.name} className="attachment-preview-image" />
                    <div className="attachment-preview-meta">
                      <span className="attachment-file-name">{image.file.name}</span>
                      <button
                        type="button"
                        className="btn-danger attachment-remove-btn"
                        onClick={() => removeSelectedImage(image.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="6">No tickets found.</td>
                </tr>
              )}

              {tickets.map((ticket) => (
                <tr key={ticket.ticketId}>
                  <td>{ticket.ticketId}</td>
                  <td>{ticket.ticketCode || '-'}</td>
                  <td>{ticket.title}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.priority}</td>
                  <td className="ticket-row-actions">
                    <button type="button" className="btn-view" onClick={() => openTicketDetails(ticket.ticketId)}>
                      View
                    </button>
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