import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/BookingService';
import DashboardLayout from '../../components/layout/DashboardLayout';

const AdminBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processing, setProcessing] = useState({});

  // Fetch all bookings on component mount
  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingService.getAllBookings();
      // Handle different response formats
      const data = Array.isArray(response) 
        ? response 
        : response?.data 
        ? response.data 
        : [];
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load bookings. Please try again.';
      setError(errorMsg);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = useCallback(() => {
    let filtered = bookings;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) => {
        const bookingId = (booking.bookingId || booking.id || '').toString().toLowerCase();
        const resourceName = (booking.resourceName || '').toLowerCase();
        const userName = (booking.userName || '').toLowerCase();
        const purpose = (booking.purpose || '').toLowerCase();
        return bookingId.includes(query) || resourceName.includes(query) || userName.includes(query) || purpose.includes(query);
      });
    }

    // Role filter
    if (roleFilter !== 'All Roles') {
      filtered = filtered.filter((booking) => booking.userRole === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    return filtered;
  }, [bookings, searchQuery, roleFilter, statusFilter]);

  const handleApprove = async (bookingId) => {
    try {
      setProcessing((prev) => ({ ...prev, [bookingId]: true }));
      await bookingService.approveBooking(bookingId);
      // Refresh bookings list
      await fetchAllBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to approve booking.';
      setError(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setProcessing((prev) => ({ ...prev, [bookingId]: true }));
      await bookingService.rejectBooking(bookingId);
      // Refresh bookings list
      await fetchAllBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to reject booking.';
      setError(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      case 'CANCELLED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    return (status || 'PENDING').toUpperCase();
  };

  const formatDateTime = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    try {
      // Parse ISO datetime string
      const start = new Date(startTime);
      const formattedDate = start.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const formattedTime = start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      if (endTime) {
        const end = new Date(endTime);
        const endFormattedTime = end.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
        return `${formattedDate} - ${formattedTime}-${endFormattedTime}`;
      }
      
      return `${formattedDate} - ${formattedTime}`;
    } catch (e) {
      return startTime || 'N/A';
    }
  };

  const currentBookings = filteredBookings();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <DashboardLayout>
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
              All Bookings
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Review and manage booking requests
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Search and Filter Bar */}
          <div
            style={{
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by resource, user, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '16px',
                }}
              >
                🔍
              </span>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option>All Roles</option>
              <option>STUDENT</option>
              <option>LECTURER</option>
              <option>MANAGER</option>
              <option>ADMIN</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option>All Status</option>
              <option>PENDING</option>
              <option>APPROVED</option>
              <option>REJECTED</option>
              <option>CANCELLED</option>
            </select>
          </div>

          {/* Booking Count */}
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
            {currentBookings.length} booking{currentBookings.length !== 1 ? 's' : ''}
          </div>

          {/* Loading State */}
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ marginTop: '12px' }}>Loading bookings...</p>
            </div>
          ) : currentBookings.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>No bookings found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {currentBookings.map((booking) => (
                <div
                  key={booking.bookingId || booking.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Calendar Icon */}
                  <div
                    style={{
                      fontSize: '32px',
                      color: '#3b82f6',
                      minWidth: '40px',
                      textAlign: 'center',
                      marginTop: '4px',
                    }}
                  >
                    📅
                  </div>

                  {/* Main Content */}
                  <div style={{ flex: 1 }}>
                    {/* Header with Title and Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                          Code: {booking.bookingCode || (booking.bookingId ? booking.bookingId.substring(0, 8) : 'N/A')}
                        </h3>
                        <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                          <span style={{ color: '#059669' }}>{booking.resourceName || 'Unknown Resource'}</span>
                        </h2>
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
                        {getStatusLabel(booking.status)}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        👤 {booking.userRole || 'User'}
                      </span>
                    </div>

                    {/* Purpose */}
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                      {booking.purpose || 'No description provided'}
                    </p>

                    {/* Details Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👤</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Requested by:</span>
                        <span style={{ color: '#1f2937' }}>{booking.userName || 'Unknown User'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏰</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Schedule:</span>
                        <span>{formatDateTime(booking.startTime, booking.endTime)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👥</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Attendees:</span>
                        <span>{booking.expectedAttendees || booking.quantityRequested || 0} {booking.expectedAttendees ? 'people' : 'items'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      minWidth: '240px',
                      justifyContent: 'flex-end',
                      flexShrink: 0,
                    }}
                  >
                    {booking.status?.toUpperCase() === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApprove(booking.bookingId)}
                          disabled={processing[booking.bookingId]}
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: processing[booking.bookingId] ? 'not-allowed' : 'pointer',
                            opacity: processing[booking.bookingId] ? 0.7 : 1,
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            if (!processing[booking.bookingId]) e.target.style.backgroundColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            if (!processing[booking.bookingId]) e.target.style.backgroundColor = '#10b981';
                          }}
                        >
                          {processing[booking.bookingId] ? '⏳' : '✓'} Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking.bookingId)}
                          disabled={processing[booking.bookingId]}
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: processing[booking.bookingId] ? 'not-allowed' : 'pointer',
                            opacity: processing[booking.bookingId] ? 0.7 : 1,
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            if (!processing[booking.bookingId]) e.target.style.backgroundColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            if (!processing[booking.bookingId]) e.target.style.backgroundColor = '#ef4444';
                          }}
                        >
                          {processing[booking.bookingId] ? '⏳' : '✕'} Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#6b7280',
                          color: '#fff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#4b5563')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#6b7280')}
                      >
                        📖 View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CSS Animation */}
          <style>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default AdminBookingsPage;