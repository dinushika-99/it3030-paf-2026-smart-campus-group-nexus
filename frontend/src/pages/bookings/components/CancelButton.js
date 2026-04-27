import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { bookingService } from '../../../services/BookingService';

const CancelButton = ({ bookingId, onSuccess, disabled }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId);
      onSuccess();
    } catch (error) {
      alert('Error cancelling booking: ' + error.message);
    } finally {
      setIsCancelling(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="btn-confirm"
          style={{
            background: '#b91c1c',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
            opacity: isCancelling ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !isCancelling && (e.target.style.background = '#8b1515')}
          onMouseLeave={(e) => !isCancelling && (e.target.style.background = '#b91c1c')}
        >
          <Trash2 size={14} />
          <span>{isCancelling ? 'Cancelling...' : 'Yes'}</span>
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isCancelling}
          className="btn-cancel-confirm"
          style={{
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
            opacity: isCancelling ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !isCancelling && (e.target.style.background = '#d1d5db')}
          onMouseLeave={(e) => !isCancelling && (e.target.style.background = '#e5e7eb')}
        >
          <X size={14} />
          <span>No</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={disabled}
      className="btn-danger"
      style={{
        background: '#dc2626',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.15s ease',
        boxShadow: 'none',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.background = '#b91c1c')}
      onMouseLeave={(e) => !disabled && (e.target.style.background = '#dc2626')}
    >
      <Trash2 size={14} />
      <span>Cancel</span>
    </button>
  );
};

export default CancelButton;