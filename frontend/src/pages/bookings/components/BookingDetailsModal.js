import React from 'react';

const BookingDetailsModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      case 'CANCELLED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 16px 12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
            Booking Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              lineHeight: '1',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {/* Booking Code & Status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                BOOKING CODE
              </p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                {booking.bookingCode || 'N/A'}
              </p>
            </div>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: getStatusColor(booking.status),
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              {booking.status || 'PENDING'}
            </span>
          </div>

          {/* Resource Information */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
              Resource Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Resource Name</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  {booking.resourceName || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Resource Category</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                  {booking.resourceCategory || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Schedule */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
              Schedule
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Start Time</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                  {formatDateTime(booking.startTime)}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>End Time</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                  {formatDateTime(booking.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Requester Information */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
              Requester Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Requested By</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
                  {booking.userName || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>User Role</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                  {booking.userRole || 'N/A'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Attendees/Quantity</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                {booking.expectedAttendees || booking.quantityRequested || 0}
              </p>
            </div>
          </div>

          {/* Purpose */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
              Purpose
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', lineHeight: '1.4' }}>
              {booking.purpose || 'No purpose provided'}
            </p>
          </div>

          {/* Approval/Rejection Details */}
          {(booking.status === 'APPROVED' || booking.status === 'REJECTED') && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: booking.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                borderRadius: '8px',
                borderLeft: `4px solid ${booking.status === 'APPROVED' ? '#10b981' : '#ef4444'}`,
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: booking.status === 'APPROVED' ? '#065f46' : '#991b1b',
                  textTransform: 'uppercase',
                }}
              >
                {booking.status === 'APPROVED' ? 'Approval Details' : 'Rejection Details'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: booking.status === 'APPROVED' ? '#065f46' : '#991b1b' }}>
                    {booking.status === 'APPROVED' ? 'Approved By' : 'Rejected By'}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
                    {booking.approvedByUserName || 'Admin'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: booking.status === 'APPROVED' ? '#065f46' : '#991b1b' }}>
                    {booking.status === 'APPROVED' ? 'Approved At' : 'Rejected At'}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                    {formatDateTime(booking.approvedAt)}
                  </p>
                </div>
              </div>

              {booking.status === 'REJECTED' && booking.rejectionReason && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#991b1b' }}>Rejection Reason</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', lineHeight: '1.4' }}>
                    {booking.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cancellation Details */}
          {booking.status === 'CANCELLED' && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                borderLeft: '4px solid #6b7280',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>
                Cancellation Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Cancelled By</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
                    {booking.cancelledByUserName || 'User/Admin'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>Cancelled At</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
                    {formatDateTime(booking.cancelledAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Created At */}
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
              Booking Created
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#1f2937' }}>
              {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;