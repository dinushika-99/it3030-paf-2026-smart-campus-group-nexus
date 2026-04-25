import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CancelButton from './CancelButton';

const BookingList = ({ bookings, onCancelSuccess }) => {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6">Start by booking a resource for your activities</p>
        <Link
          to="/bookings/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <span>➕</span>
          <span>Create Your First Booking</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.bookingId}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{booking.resourceName || 'Resource'}</h3>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-sm text-gray-600">Booking Code: <span className="font-mono font-semibold">{booking.bookingCode}</span></p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date & Time</p>
                <p className="text-sm text-gray-800">
                  {new Date(booking.startTime).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Purpose</p>
                <p className="text-sm text-gray-800">{booking.purpose}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Attendees/Quantity</p>
                <p className="text-sm text-gray-800">
                  {booking.expectedAttendees || booking.quantityRequested}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                to={`/bookings/${booking.bookingId}`}
                className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center gap-1"
              >
                <span>View Details</span>
                <span>→</span>
              </Link>

              {booking.status === 'APPROVED' && (
                <CancelButton
                  bookingId={booking.bookingId}
                  onSuccess={onCancelSuccess}
                  disabled={false}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingList;