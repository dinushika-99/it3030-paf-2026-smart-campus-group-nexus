package backend.booking.services;

import backend.booking.dto.BookingRequestDTO;
import backend.booking.dto.BookingResponseDTO;
import backend.booking.dto.StatusUpdateDTO;

import java.util.List;

public interface BookingServices {

    // Create a new booking request
    BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String currentUserId);

    // Get booking by ID
    BookingResponseDTO getBookingById(String bookingId);

    // Get all bookings for current user
    List<BookingResponseDTO> getMyBookings(String userId);

    // Get all bookings (Admin only)
    List<BookingResponseDTO> getAllBookings();

    // Update booking status (Approve/Reject/Cancel)
    BookingResponseDTO updateBookingStatus(String bookingId, StatusUpdateDTO statusUpdateDTO, String currentUserId, boolean isAdmin);

    // Delete/Cancel booking
    void cancelBooking(String bookingId, String currentUserId);

    // Check if booking exists
    boolean existsById(String bookingId);
    
}
