import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/BookingService';

const ActionButtons = ({ booking, onUpdateSuccess }) => {
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await bookingService.cancelBooking(booking.bookingId);
      onUpdateSuccess();
      alert('Booking cancelled successfully');
    } catch (error) {
      alert('Error cancelling booking: ' + error.message);
    } finally {
      setIsProcessing(false);
      setShowCancelConfirm(false);
    }
  };

  const canCancel = booking.status === 'APPROVED';

  return (
    <div className="space-y-3">
      {/* Cancel Button */}
      {canCancel && (
        <>
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>🚫</span>
              <span>Cancel Booking</span>
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-3">
                Are you sure you want to cancel this booking?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
                >
                  {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
                >
                  No, Keep It
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cannot Cancel Message */}
      {!canCancel && booking.status !== 'CANCELLED' && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            {booking.status === 'PENDING' && '⏳ Cannot cancel while pending approval'}
            {booking.status === 'REJECTED' && '❌ This booking was rejected'}
            {booking.status === 'CANCELLED' && '🚫 This booking is already cancelled'}
          </p>
        </div>
      )}

      {/* Back to My Bookings */}
      <button
        onClick={() => navigate('/bookings/my')}
        className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
      >
        <span>←</span>
        <span>Back to My Bookings</span>
      </button>
    </div>
  );
};

export default ActionButtons;