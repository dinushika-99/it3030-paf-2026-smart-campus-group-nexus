import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import BookingList from './components/BookingList';
import { bookingService } from '../../services/BookingService';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      setBookings(data.data || data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuccess = () => {
    fetchBookings();
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingStatus = String(booking.status || '').toLowerCase();
    const statusMatch = filter === 'all' || bookingStatus === filter;

    const query = searchTerm.trim().toLowerCase();
    if (!query) return statusMatch;

    const searchableText = [
      booking.resourceName,
      booking.bookingCode,
      booking.purpose,
      booking.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return statusMatch && searchableText.includes(query);
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <div className="booking-page-root">
      <button 
        type="button" 
        className="booking-back-btn"
        onClick={() => navigate('/dashboard')}
      >
        ← Back
      </button>

      <div className="booking-manager">
        <div className="booking-header-section">
          <h3 className="booking-manager-title">📅 My Bookings</h3>
          <button 
            type="button" 
            className="booking-nav-btn-primary"
            onClick={() => navigate('/bookings/new')}
          >
            + New Booking
          </button>
        </div>
        <p className="booking-manager-subtitle">View and manage all your resource bookings</p>

        {/* Stats Section */}
        <div className="booking-stats-grid">
          <StatCard 
            label="Total Bookings"
            count={statusCounts.all}
            isActive={filter === 'all'}
            className="stat-card-total"
          />
          <StatCard 
            label="Pending"
            status="pending"
            count={statusCounts.pending}
            isActive={filter === 'pending'}
            className="stat-card-pending"
          />
          <StatCard 
            label="Approved"
            status="approved"
            count={statusCounts.approved}
            isActive={filter === 'approved'}
            className="stat-card-approved"
          />
          <StatCard 
            label="Rejected"
            status="rejected"
            count={statusCounts.rejected}
            isActive={filter === 'rejected'}
            className="stat-card-rejected"
          />
          <StatCard 
            label="Cancelled"
            status="cancelled"
            count={statusCounts.cancelled}
            isActive={filter === 'cancelled'}
            className="stat-card-cancelled"
          />
        </div>

        <div className="booking-filter-controls">
          <input
            type="text"
            className="booking-search-input"
            placeholder="Search by resource, booking code, or purpose"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="booking-status-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="booking-loading">
            <div className="spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="booking-empty">
            <div className="empty-icon">📋</div>
            <h3>No bookings found</h3>
            <p>No bookings match your current search or status filter.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/bookings/new')}
            >
              Create Your First Booking
            </button>
          </div>
        ) : (
          <BookingList 
            bookings={filteredBookings} 
            onCancelSuccess={handleCancelSuccess}
          />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, count, status, isActive, className }) => {
  return (
    <div className={`stat-card ${className} ${isActive ? 'stat-card-active' : ''}`}>
      <div className="stat-value">{count}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default MyBookings;