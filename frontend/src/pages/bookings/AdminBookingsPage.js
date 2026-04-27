import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/BookingService';
import AdminLayout from '../../components/layout/AdminLayout';
import RejectionModal from './components/RejectionModal'; 
import BookingDetailsModal from './components/BookingDetailsModal'; 
import toast from 'react-hot-toast';

const AdminBookingsPage = () => {
  const navigate = useNavigate();
  
  // State Management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Keep for initial load errors
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('PENDING'); 
  const [processing, setProcessing] = useState({});
  
  // Rejection Modal State
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBookingCode, setSelectedBookingCode] = useState('');

  // View Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch all bookings on component mount
  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingService.getAllBookings();
      
      // Handle different response formats safely
      const data = Array.isArray(response) 
        ? response 
        : response?.data 
          ? response.data 
          : [];
          
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load bookings.';
      setError(errorMsg);
      toast.error(errorMsg); 
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Approve Booking
  const handleApprove = async (bookingId) => {
    try {
      setProcessing((prev) => ({ ...prev, [bookingId]: true }));
      await bookingService.approveBooking(bookingId);
      await fetchAllBookings(); // Refresh list
      
      toast.success('Booking approved successfully!');
      
    } catch (err) {
      console.error('Error approving booking:', err);
      const errorMsg = err.response?.data?.message || 'Failed to approve booking.';
      
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  // Open Rejection Modal
  const openRejectionModal = (bookingId, bookingCode) => {
    setSelectedBookingId(bookingId);
    setSelectedBookingCode(bookingCode || 'N/A');
    setShowRejectionModal(true);
  };

  // Handle Rejection with Reason (Called by Modal)
  const handleRejectWithReason = async (rejectionReason) => {
    if (!selectedBookingId) return;

    try {
      setProcessing((prev) => ({ ...prev, [selectedBookingId]: true }));
      
      // Pass the reason to the service
      await bookingService.rejectBooking(selectedBookingId, rejectionReason);
      
      await fetchAllBookings(); 
      
      // Close modal and reset state
      setShowRejectionModal(false);
      setSelectedBookingId(null);
      setSelectedBookingCode('');
      
      toast.success('Booking rejected successfully.');
      
    } catch (err) {
      console.error('Error rejecting booking:', err);
      const errorMsg = err.response?.data?.message || 'Failed to reject booking.';
      toast.error(errorMsg);
      throw new Error(errorMsg); 
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedBookingId]: false }));
    }
  };

  // Open View Details Modal
  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const doBookingsOverlap = (bookingA, bookingB) => {
    if (!bookingA?.startTime || !bookingA?.endTime || !bookingB?.startTime || !bookingB?.endTime) {
      return false;
    }

    const startA = new Date(bookingA.startTime).getTime();
    const endA = new Date(bookingA.endTime).getTime();
    const startB = new Date(bookingB.startTime).getTime();
    const endB = new Date(bookingB.endTime).getTime();

    return startA < endB && endA > startB;
  };

  const hasPendingOverlap = (currentBooking, allBookings) => {
    if (!currentBooking.startTime || !currentBooking.endTime) return false;

    const pendingBookings = allBookings.filter(
      (b) =>
        b.status === 'PENDING' &&
        b.bookingId !== currentBooking.bookingId &&
        b.resourcesId === currentBooking.resourcesId
    );

    return pendingBookings.some((other) => doBookingsOverlap(currentBooking, other));
  };

  const hasApprovedOverlap = (currentBooking, allBookings) => {
    if (!currentBooking.startTime || !currentBooking.endTime) return false;

    const approvedBookings = allBookings.filter(
      (b) =>
        b.status === 'APPROVED' &&
        b.bookingId !== currentBooking.bookingId &&
        b.resourcesId === currentBooking.resourcesId
    );

    return approvedBookings.some((other) => doBookingsOverlap(currentBooking, other));
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
        const startTime = booking.startTime ? new Date(booking.startTime).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).toLowerCase() : '';
        const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).toLowerCase() : '';
        const schedule = `${startTime} ${endTime}`.trim();
        return (
          bookingId.includes(query) ||
          resourceName.includes(query) ||
          userName.includes(query) ||
          purpose.includes(query) ||
          schedule.includes(query)
        );
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

  // Helper: Status Color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Helper: Format Date/Time
  const formatDateTime = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    try {
      const start = new Date(startTime);
      const formattedDate = start.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const formattedTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      if (endTime) {
        const end = new Date(endTime);
        const endFormattedTime = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${formattedDate} | ${formattedTime} - ${endFormattedTime}`;
      }
      return `${formattedDate} | ${formattedTime}`;
    } catch (e) {
      return startTime;
    }
  };

  const currentBookings = filteredBookings();

  return (
    <AdminLayout highlightBookings={true}>
      {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#fff' }}>
              All Bookings
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
              Review and manage booking requests
            </p>
          </div>

          {/* Error Message (Only for initial load failures) */}
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button 
                onClick={() => setError('')} 
                style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div style={{
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '16px',
            alignItems: 'center',
          }}>
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
                  border: '1px solid #374151',
                  fontSize: '14px',
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '16px',
              }}>
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
                border: '1px solid #374151',
                fontSize: '14px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option>All Roles</option>
              <option>STUDENT</option>
              <option>LECTURER</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #374151',
                fontSize: '14px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option>All Status</option>
              <option>PENDING</option>
              <option>APPROVED</option>
              <option>REJECTED</option>
            </select>
          </div>

          {/* Booking Count */}
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#9ca3af' }}>
            Showing {currentBookings.length} booking{currentBookings.length !== 1 ? 's' : ''}
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid #374151',
                borderTop: '4px solid #BF932A',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ marginTop: '12px' }}>Loading bookings...</p>
            </div>
          ) : currentBookings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1f2937',
              color: '#9ca3af',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>No bookings found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {currentBookings.map((booking) => {
                const pendingOverlap = booking.status === 'PENDING' && hasPendingOverlap(booking, bookings);
                const approvedOverlap = booking.status === 'PENDING' && hasApprovedOverlap(booking, bookings);
                const hasOverlap = pendingOverlap || approvedOverlap;
                const disableApprove = processing[booking.bookingId] || approvedOverlap;

                return (
                  <div
                    key={booking.bookingId || booking.id}
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: '12px',
                      border: hasOverlap ? '2px solid #7f1d1d' : '2px solid #1f2937',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '20px',
                      transition: 'box-shadow 0.2s',
                      boxShadow: hasOverlap ? '0 0 0 1px #7f1d1d' : 'none'
                    }}
                  >
                    {/* Icon */}
                    <div style={{ fontSize: '32px', color: '#BF932A', minWidth: '40px', textAlign: 'center', marginTop: '4px' }}>
                      📅
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>
                            Code: {booking.bookingCode || 'N/A'}
                          </h3>
                          <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#10b981' }}>{booking.resourceName || 'Unknown Resource'}</span>
                            
                            {/* ✅ NEW: Show Warning Icon if Overlap Exists */}
                            {hasOverlap && (
                              <span 
                                title={approvedOverlap ? '⛔ This slot is already booked by an approved booking.' : '⚠️ Conflict: another booking overlaps this time slot.'}
                                style={{ 
                                  marginLeft: '8px', 
                                  color: '#ef4444', 
                                  fontSize: '18px',
                                  cursor: 'help',
                                  lineHeight: 1
                                }}
                              >
                                ⚠️
                              </span>
                            )}
                          </h2>
                        </div>
                        
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: getStatusColor(booking.status),
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}>
                          {booking.status || 'PENDING'}
                        </span>
                        
                        {/* Optional: Show 'First Requested' badge if it's the older one */}
                        {booking.status === 'PENDING' && !hasOverlap && (
                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600', backgroundColor: '#1f2937', padding: '2px 8px', borderRadius: '10px', border: '1px solid #374151' }}>
                            ✅ No Conflicts
                          </span>
                        )}
                        {approvedOverlap && (
                          <span style={{ fontSize: '10px', color: '#fda4af', fontWeight: '600', backgroundColor: '#111827', padding: '2px 8px', borderRadius: '10px', border: '1px solid #7f1d1d' }}>
                            ⛔ Already booked by approved slot
                          </span>
                        )}
                        {pendingOverlap && !approvedOverlap && (
                          <span style={{ fontSize: '10px', color: '#fde68a', fontWeight: '600', backgroundColor: '#111827', padding: '2px 8px', borderRadius: '10px', border: '1px solid #f59e0b' }}>
                            ⚠️ Pending conflict exists
                          </span>
                        )}
                      </div>

                      {/* Purpose */}
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        {booking.purpose || 'No description provided'}
                      </p>

                      {/* Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: '#9ca3af', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: '#e5e7eb' }}>Requested by:</span> {booking.userName || 'Unknown'}
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#e5e7eb' }}>Schedule:</span> {formatDateTime(booking.startTime, booking.endTime)}
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#e5e7eb' }}>Count:</span> {booking.expectedAttendees || booking.quantityRequested || 0}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', minWidth: '240px', justifyContent: 'flex-end', flexShrink: 0 }}>
                      {booking.status?.toUpperCase() === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApprove(booking.bookingId)}
                            disabled={disableApprove}
                            title={approvedOverlap ? 'This booking overlaps an already approved booking and cannot be approved.' : undefined}
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              backgroundColor: disableApprove ? '#6b7280' : '#BF932A',
                              color: disableApprove ? '#e5e7eb' : '#111827',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: disableApprove ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {processing[booking.bookingId] ? '⏳' : '✓'} Approve
                          </button>
                          <button
                            onClick={() => openRejectionModal(booking.bookingId, booking.bookingCode)}
                            disabled={processing[booking.bookingId]}
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              backgroundColor: processing[booking.bookingId] ? '#6b7280' : '#dc2626',
                              color: '#fff',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: processing[booking.bookingId] ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {processing[booking.bookingId] ? '⏳' : '✕'} Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openDetailsModal(booking)} 
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            backgroundColor: '#374151',
                            color: '#e5e7eb',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          📖 View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejection Modal Component */}
          <RejectionModal
            isOpen={showRejectionModal}
            onClose={() => {
              setShowRejectionModal(false);
              setSelectedBookingId(null);
              setSelectedBookingCode('');
            }}
            onConfirm={handleRejectWithReason}
            bookingCode={selectedBookingCode}
            isProcessing={selectedBookingId ? processing[selectedBookingId] : false}
          />

          {/* Booking Details Modal */}
          <BookingDetailsModal
            isOpen={showDetailsModal}
            onClose={() => { setShowDetailsModal(false); setSelectedBooking(null); }}
            booking={selectedBooking}
          />

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
    </AdminLayout>
  );
};

export default AdminBookingsPage;