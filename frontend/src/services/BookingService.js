import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Include cookies for session auth
});

export const bookingService = {
  // Get all available resources
  getResources: async () => {
    const response = await axiosClient.get('/resources');
    return response.data;
  },

  // Get single resource by ID
  getResourceById: async (resourceId) => {
    const response = await axiosClient.get(`/resources/${resourceId}`);
    return response.data;
  },

  // Create a new booking
  createBooking: async (bookingData) => {
    const response = await axiosClient.post('/bookings', bookingData);
    return response.data;
  },

  // Get current user's bookings
  getMyBookings: async () => {
    const response = await axiosClient.get('/bookings/my');
    return response.data?.data || [];
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await axiosClient.get(`/bookings/${bookingId}`);
    return response.data?.data || response.data;
  },

  // Update existing booking (owner only, PENDING status)
  updateBooking: async (bookingId, bookingData) => {
    const response = await axiosClient.patch(`/bookings/${bookingId}`, bookingData);
    return response.data?.data || response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const response = await axiosClient.delete(`/bookings/${bookingId}`);
    return response.data;
  },

  // Get all bookings (admin only)
  getAllBookings: async () => {
    const response = await axiosClient.get('/bookings/all');
    return response.data?.data || [];
  },

  // Approve booking (admin only)
  approveBooking: async (bookingId) => {
    const response = await axiosClient.patch(`/bookings/${bookingId}/status`, {
      status: 'APPROVED'
    });
    return response.data;
  },

  // Reject booking (admin only)
  rejectBooking: async (bookingId, reason = '') => {
    const response = await axiosClient.patch(`/bookings/${bookingId}/status`, {
      status: 'REJECTED',
      rejectionReason: reason
    });
    return response.data;
  }
};

export default axiosClient;