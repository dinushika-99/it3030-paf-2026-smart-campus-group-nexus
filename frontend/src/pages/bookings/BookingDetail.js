import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../AuthContext';
import StatusBadge from './components/StatusBadge';
import BookingTimeline from './components/BookingTimeline';
import ActionButtons from './components/ActionButtons';
import { bookingService } from '../../services/BookingService';

const BookingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data.data || data);
      // In a real app, fetch status history from API
      // For now, create mock history
      setStatusHistory([
        {
          newStatus: 'PENDING',
          changedAt: data.createdAt,
          changedByUserName: data.createdByUserName || 'You',
          changeNote: 'Booking created'
        },
        // Add more history items as needed
      ]);
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    fetchBookingDetails();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
          <p className="text-gray-600">View and manage your booking information</p>
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
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <BookingTimeline statusHistory={statusHistory} />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <ActionButtons
                booking={booking}
                onUpdateSuccess={handleUpdateSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingDetail;