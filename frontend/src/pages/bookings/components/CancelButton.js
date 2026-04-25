import React, { useState } from 'react';
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
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
        >
          {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isCancelling}
          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={disabled}
      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      Cancel Booking
    </button>
  );
};

export default CancelButton;