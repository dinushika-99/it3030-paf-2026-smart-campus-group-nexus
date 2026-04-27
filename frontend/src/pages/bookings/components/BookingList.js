import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CancelButton from './CancelButton';
import '../MyBookings.css';

const BookingList = ({ bookings, onCancelSuccess }) => {
  const navigate = useNavigate();

  if (!bookings || bookings.length === 0) {
    return (
      <div className="booking-empty">
        <div className="empty-icon">📋</div>
        <h3>No bookings found</h3>
        <p>You don't have any bookings matching this filter.</p>
        <button 
          className="btn-primary"
          onClick={() => navigate('/bookings/new')}
        >
          + Create New Booking
        </button>
      </div>
    );
  }

  return (
    <div className="booking-cards-container">
      {bookings.map((booking) => (
        <div key={booking.bookingId} className="booking-card">
          <div className="booking-card-header">
            <div className="booking-card-title-section">
              <h4 className="booking-card-title">{booking.resourceName || 'Resource'}</h4>
              <StatusBadge status={booking.status} />
            </div>
            <code className="booking-card-code">{booking.bookingCode}</code>
          </div>

          <div className="booking-card-details">
            <div className="detail-group">
              <span className="detail-label">📅 Date</span>
              <span className="detail-value">
                {new Date(booking.startTime).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="detail-group">
              <span className="detail-label">🕐 Time</span>
              <span className="detail-value">
                {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>

            <div className="detail-group">
              <span className="detail-label">👥 Attendees</span>
              <span className="detail-value">
                {booking.expectedAttendees || booking.quantityRequested || 'N/A'}
              </span>
            </div>
          </div>

          <div className="booking-card-purpose">
            <span className="detail-label">📝 Purpose</span>
            <p className="purpose-text">{booking.purpose || 'No purpose specified'}</p>
          </div>

          <div className="booking-card-footer">
            <span
              className="booking-card-link"
              onClick={() => navigate(`/bookings/${booking.bookingId}`)}
            >
              View Details →
            </span>
            {booking.status === 'APPROVED' && (
              <CancelButton
                bookingId={booking.bookingId}
                onSuccess={onCancelSuccess}
                disabled={false}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingList;