import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../AuthContext';
import BookingList from './components/BookingList';
import { bookingService } from '../../services/BookingService';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data.data || data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuccess = () => {
    fetchBookings(); // Refresh the list
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status.toLowerCase() === filter);

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage and track your resource bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg cursor-pointer transition-all ${filter === 'all' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}
          >
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-sm opacity-80">Total</p>
          </div>
          <div
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg cursor-pointer transition-all ${filter === 'pending' ? 'bg-yellow-500 text-black' : 'bg-yellow-100 text-yellow-900'}`}
          >
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
            <p className="text-sm opacity-80">Pending</p>
          </div>
          <div
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-lg cursor-pointer transition-all ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-900'}`}
          >
            <p className="text-2xl font-bold">{statusCounts.approved}</p>
            <p className="text-sm opacity-80">Approved</p>
          </div>
          <div
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-lg cursor-pointer transition-all ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-900'}`}
          >
            <p className="text-2xl font-bold">{statusCounts.rejected}</p>
            <p className="text-sm opacity-80">Rejected</p>
          </div>
          <div
            onClick={() => setFilter('cancelled')}
            className={`p-4 rounded-lg cursor-pointer transition-all ${filter === 'cancelled' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            <p className="text-2xl font-bold">{statusCounts.cancelled}</p>
            <p className="text-sm opacity-80">Cancelled</p>
          </div>
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : (
          <BookingList
            bookings={filteredBookings}
            onCancelSuccess={handleCancelSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default MyBookings;