import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/bookings/all');
      const data = response.data?.data || response.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, {
        status: 'APPROVED'
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.patch(`/api/bookings/${bookingId}/status`, {
        status: 'REJECTED',
        rejectionReason: reason
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const currentUser = {
    name: 'Admin User',
    role: 'ADMIN',
    avatar: 'A'
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <div style={styles.logoTitle}>SMART CAMPUS</div>
            <div style={styles.logoSubtitle}>Smart Operations</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={styles.navSection}>
          <div style={styles.navCategory}>ADMINISTRATION</div>
          
          <button 
            onClick={() => navigate('/admin')}
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>📊</span>
            Admin Dashboard
          </button>

          <button 
            style={{...styles.navButton, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderLeft: '3px solid #3B82F6'}}
          >
            <span style={styles.navIcon}>📋</span>
            All Bookings
          </button>

          <button 
            onClick={() => navigate('/admin/tickets')}
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>🎫</span>
            All Tickets
          </button>

          <button 
            onClick={() => navigate('/admin/resources')}
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>📦</span>
            Resources
          </button>

          <button 
            onClick={() => navigate('/admin/users')}
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>👥</span>
            Users
          </button>

          <button 
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>🔔</span>
            Notifications
          </button>

          <button 
            onClick={() => navigate('/admin/profile')}
            style={{...styles.navButton, backgroundColor: 'transparent'}}
          >
            <span style={styles.navIcon}>👤</span>
            Profile
          </button>
        </div>

        {/* User Profile */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>{currentUser.avatar}</div>
            <div>
              <div style={styles.userName}>{currentUser.name}</div>
              <div style={styles.userRole}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>All Bookings</h1>
            <p style={styles.pageSubtitle}>Review and manage booking requests</p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.notificationBell}>
              🔔
              <span style={styles.notificationBadge}>4</span>
            </div>
            <div style={styles.userAvatarLarge}>{currentUser.avatar}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={styles.filtersSection}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by resource, user, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Booking Count */}
        <div style={styles.bookingCount}>
          {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div style={styles.loadingState}>Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <p>No bookings found</p>
          </div>
        ) : (
          <div style={styles.bookingsList}>
            {filteredBookings.map((booking) => (
              <div key={booking.bookingId} style={styles.bookingCard}>
                <div style={styles.bookingHeader}>
                  <div style={styles.bookingIcon}>📅</div>
                  <div style={styles.bookingTitleSection}>
                    <div style={styles.bookingCode}>
                      #{booking.bookingCode?.substring(0, 8).toUpperCase() || 'N/A'} — {booking.resourceName || 'Resource'}
                    </div>
                    <div style={styles.bookingBadges}>
                      <span style={{...styles.statusBadge, className: getStatusColor(booking.status)}}>
                        {booking.status || 'PENDING'}
                      </span>
                      <span style={styles.userBadge}>👤 User</span>
                    </div>
                  </div>
                  {booking.status === 'PENDING' && (
                    <div style={styles.actionButtons}>
                      <button 
                        onClick={() => handleApprove(booking.bookingId)}
                        style={styles.approveButton}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleReject(booking.bookingId)}
                        style={styles.rejectButton}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>

                <div style={styles.bookingDescription}>
                  {booking.purpose || 'No description provided'}
                </div>

                <div style={styles.bookingFooter}>
                  <span style={styles.footerItem}>
                    By: {booking.createdByUserName || booking.user?.name || 'Unknown'}
                  </span>
                  <span style={styles.footerItem}>
                    🕐 {booking.startTime ? new Date(booking.startTime).toLocaleString() : 'N/A'}
                    {booking.endTime && ` - ${new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  </span>
                  <span style={styles.footerItem}>
                    👥 {booking.expectedAttendees || booking.quantityRequested || 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1e293b',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px 30px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '20px',
  },
  logoIcon: {
    fontSize: '32px',
    width: '40px',
    height: '40px',
    backgroundColor: '#3B82F6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  navSection: {
    flex: 1,
    padding: '0 12px',
  },
  navCategory: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '0 12px 8px 12px',
  },
  navButton: {
    width: '100%',
    padding: '12px',
    marginBottom: '4px',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s',
  },
  navIcon: {
    fontSize: '18px',
    width: '20px',
  },
  userSection: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#ec4899',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  mainContent: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  notificationBell: {
    position: 'relative',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarLarge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ec4899',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
  },
  filtersSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: 1,
    minWidth: '300px',
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  bookingCount: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '16px',
  },
  errorMessage: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
  },
  loadingState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
    fontSize: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5,
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  bookingHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '12px',
  },
  bookingIcon: {
    fontSize: '32px',
    width: '48px',
    height: '48px',
    backgroundColor: '#dbeafe',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bookingTitleSection: {
    flex: 1,
  },
  bookingCode: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '6px',
  },
  bookingBadges: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    border: '1px solid',
  },
  userBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  approveButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  bookingDescription: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  bookingFooter: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#64748b',
    flexWrap: 'wrap',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};