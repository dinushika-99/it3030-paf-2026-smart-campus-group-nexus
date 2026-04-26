import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../AuthContext';
import StatusBadge from './components/StatusBadge';
import BookingTimeline from './components/BookingTimeline';
import { bookingService } from '../../services/BookingService';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookingById(id);
      const bookingData = data.data || data;
      
      setBooking(bookingData);
      
      // Fetch real status history from backend
      if (bookingData.statusHistory && Array.isArray(bookingData.statusHistory)) {
        const sortedHistory = [...bookingData.statusHistory].sort(
          (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
        );
        setStatusHistory(sortedHistory);
      } else {
        setStatusHistory([
          {
            newStatus: 'PENDING',
            changedAt: bookingData.createdAt,
            changedByUserName: bookingData.createdByUserName || user?.name || 'You',
            changeNote: 'Booking created'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    const confirmed = window.confirm(
      booking.status === 'APPROVED' 
        ? 'Are you sure you want to cancel this approved booking? This action cannot be undone.'
        : 'Are you sure you want to cancel this pending booking?'
    );
    
    if (!confirmed) return;

    try {
      await bookingService.cancelBooking(booking.bookingId);
      alert('Booking cancelled successfully!');
      navigate('/bookings/my');
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Error cancelling booking: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist</p>
            <button
              onClick={() => navigate('/bookings/my')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to My Bookings
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
            <p className="text-gray-600">View and manage your booking information</p>
          </div>
          <button
            onClick={() => navigate('/bookings/my')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Booking Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {booking.resourceName || 'Resource'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Booking Code: <span className="font-mono font-semibold">{booking.bookingCode}</span>
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date & Time</h3>
                  <p className="text-gray-900">
                    {new Date(booking.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-600">
                    {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                    {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Purpose</h3>
                  <p className="text-gray-900">{booking.purpose}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    {booking.expectedAttendees ? 'Expected Attendees' : 'Quantity Requested'}
                  </h3>
                  <p className="text-gray-900">
                    {booking.expectedAttendees || booking.quantityRequested}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Created At</h3>
                  <p className="text-gray-900">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              {booking.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-red-800 uppercase mb-2">Rejection Reason</h3>
                  <p className="text-red-900">{booking.rejectionReason}</p>
                </div>
              )}

              {booking.approvedAt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-green-800 uppercase mb-2">Approved At</h3>
                  <p className="text-green-900">
                    {new Date(booking.approvedAt).toLocaleString()}
                  </p>
                  {booking.approvedByUserName && (
                    <p className="text-green-700 text-sm mt-1">
                      By: {booking.approvedByUserName}
                    </p>
                  )}
                </div>
              )}

              {booking.cancelledAt && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase mb-2">Cancelled At</h3>
                  <p className="text-gray-900">
                    {new Date(booking.cancelledAt).toLocaleString()}
                  </p>
                  {booking.cancelledByUserName && (
                    <p className="text-gray-700 text-sm mt-1">
                      By: {booking.cancelledByUserName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <BookingTimeline statusHistory={statusHistory} />
            </div>
          </div>

          {/* Right: Actions Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              
              <div className="flex flex-col gap-3">
                {/* ✅ Show Edit Button - Only for PENDING */}
                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => navigate(`/bookings/${booking.bookingId}/edit`)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    ✏️ Edit Booking
                  </button>
                )}

                {/* ✅ Show Cancel Button - For PENDING and APPROVED */}
                {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                  <button
                    onClick={handleCancelBooking}
                    className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    🚫 Cancel Booking
                  </button>
                )}

                {/* ✅ Show Info for REJECTED/CANCELLED */}
                {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                  <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600 text-sm">
                    {booking.status === 'REJECTED' 
                      ? '❌ This booking was rejected. Please create a new booking.' 
                      : '🚫 This booking was cancelled. Please create a new booking.'}
                  </div>
                )}

                {/* ✅ Show Info for APPROVED - No Edit */}
                {booking.status === 'APPROVED' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-800 text-xs">
                    ⚠️ Approved bookings cannot be edited. If you need to make changes, please cancel this booking and create a new one.
                  </div>
                )}

                {/* Back Button */}
                <button
                  onClick={() => navigate('/bookings/my')}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  ← Back to My Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookingDetail;