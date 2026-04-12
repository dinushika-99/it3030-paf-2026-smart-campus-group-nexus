package backend.booking.services.impl;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import backend.booking.dto.BookingRequestDTO;
import backend.booking.dto.BookingResponseDTO;
import backend.booking.dto.StatusUpdateDTO;
import backend.booking.model.Booking;
import backend.booking.model.BookingStatusHistory;
import backend.booking.repository.BookingHistoryRepository;
import backend.booking.repository.BookingRepository;
import backend.booking.services.BookingServices;


@Service
@Transactional
public class BookingServiceImpl implements BookingServices{

   private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;

    // Manual Constructor Injection
    public BookingServiceImpl(BookingRepository bookingRepository, 
                              BookingHistoryRepository bookingHistoryRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingHistoryRepository = bookingHistoryRepository;
    } 

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String currentUserId) {
        
        // 1. Validate time range
        if (requestDTO.getEndTime().isBefore(requestDTO.getStartTime()) ||
            requestDTO.getEndTime().isEqual(requestDTO.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        // 2. Check for scheduling conflicts
        int overlappingCount = bookingRepository.countOverlappingBookings(
            requestDTO.getResourcesId(),
            requestDTO.getStartTime(),
            requestDTO.getEndTime()
        );

        if (overlappingCount > 0) {
            throw new BookingConflictException(
                "This resource is already booked for the selected time range"
            );
        }

        // 3. Generate unique booking ID and code
        String bookingId = UUID.randomUUID().toString();
        String bookingCode = generateBookingCode();

        // 4. Create booking entity (using manual setters instead of builder)
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setBookingCode(bookingCode);
        booking.setUserId(currentUserId);
        booking.setResourcesId(requestDTO.getResourcesId());
        booking.setStartTime(requestDTO.getStartTime());
        booking.setEndTime(requestDTO.getEndTime());
        booking.setPurpose(requestDTO.getPurpose());
        booking.setExpectedAttendees(requestDTO.getExpectedAttendees());
        booking.setQuantityRequested(requestDTO.getQuantityRequested());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setCreatedByUserId(currentUserId);

        Booking savedBooking = bookingRepository.save(booking);

        // 5. Record status history
        recordStatusHistory(savedBooking.getBookingId(), null, "PENDING", currentUserId, "Booking created");

        return mapToResponseDTO(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));
        
        return mapToResponseDTO(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::mapToResponseDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::mapToResponseDTO)
            .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO updateBookingStatus(String bookingId, StatusUpdateDTO statusUpdateDTO, String currentUserId, boolean isAdmin) {
        
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        String oldStatus = booking.getStatus().name();
        String newStatus = statusUpdateDTO.getStatus().name();

        // Validate status transition
        validateStatusTransition(booking.getStatus(), statusUpdateDTO.getStatus(), isAdmin);

        // Update status based on action
        switch (statusUpdateDTO.getStatus()) {
            case APPROVED:
                if (!isAdmin) {
                    throw new AccessDeniedException("Only admins can approve bookings");
                }
                booking.setStatus(Booking.BookingStatus.APPROVED);
                booking.setApprovedByUserId(currentUserId);
                booking.setApprovedAt(LocalDateTime.now());
                break;

            case REJECTED:
                if (!isAdmin) {
                    throw new AccessDeniedException("Only admins can reject bookings");
                }
                booking.setStatus(Booking.BookingStatus.REJECTED);
                booking.setRejectionReason(statusUpdateDTO.getRejectionReason());
                booking.setApprovedByUserId(currentUserId);
                booking.setApprovedAt(LocalDateTime.now());
                break;

            case CANCELLED:
                // Only booking owner or admin can cancel
                if (!booking.getUserId().equals(currentUserId) && !isAdmin) {
                    throw new AccessDeniedException("Only booking owner or admin can cancel");
                }
                if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
                    throw new IllegalStateException("Only approved bookings can be cancelled");
                }
                booking.setStatus(Booking.BookingStatus.CANCELLED);
                booking.setCancelledByUserId(currentUserId);
                booking.setCancelledAt(LocalDateTime.now());
                break;

            default:
                throw new IllegalArgumentException("Invalid status update");
        }

        Booking updatedBooking = bookingRepository.save(booking);

        // Record status history
        recordStatusHistory(
            bookingId,
            oldStatus,
            newStatus,
            currentUserId,
            statusUpdateDTO.getRejectionReason()
        );

        return mapToResponseDTO(updatedBooking);
    }
    
    @Override
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new IllegalStateException("Only approved bookings can be cancelled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledByUserId(currentUserId);
        booking.setCancelledAt(LocalDateTime.now());

        bookingRepository.save(booking);

        recordStatusHistory(bookingId, "APPROVED", "CANCELLED", currentUserId, "Booking cancelled by user");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(String bookingId) {
        return bookingRepository.existsById(bookingId);
    }

    //PRIVATE HELPER METHODS

    private String generateBookingCode() {
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(6);
        return "BK-" + timestamp;
    }

    private void validateStatusTransition(Booking.BookingStatus currentStatus, 
                                          StatusUpdateDTO.BookingStatus newStatus,
                                          boolean isAdmin) {
        switch (currentStatus) {
            case PENDING:
                if (newStatus != StatusUpdateDTO.BookingStatus.APPROVED && 
                    newStatus != StatusUpdateDTO.BookingStatus.REJECTED) {
                    throw new IllegalStateException("Pending bookings can only be approved or rejected");
                }
                if (!isAdmin) {
                    throw new AccessDeniedException("Only admins can change pending booking status");
                }
                break;

            case APPROVED:
                if (newStatus != StatusUpdateDTO.BookingStatus.CANCELLED) {
                    throw new IllegalStateException("Approved bookings can only be cancelled");
                }
                break;

            case REJECTED:
            case CANCELLED:
                throw new IllegalStateException("Cannot change status of " + currentStatus + " booking");
        }
    }

    private void recordStatusHistory(String bookingId, String oldStatus, String newStatus, 
                                     String changedByUserId, String changeNote) {
        // Manual object creation instead of builder
        BookingStatusHistory history = new BookingStatusHistory();
        history.setBookingId(bookingId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedByUserId(changedByUserId);
        history.setChangeNote(changeNote);

        bookingHistoryRepository.save(history);
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        // Manual object creation instead of builder
        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(booking.getBookingId());
        response.setBookingCode(booking.getBookingCode());
        response.setUserId(booking.getUserId());
        response.setResourcesId(booking.getResourcesId());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setExpectedAttendees(booking.getExpectedAttendees());
        response.setQuantityRequested(booking.getQuantityRequested());
        response.setStatus(booking.getStatus().name());
        response.setRejectionReason(booking.getRejectionReason());
        response.setCreatedByUserId(booking.getCreatedByUserId());
        response.setApprovedByUserId(booking.getApprovedByUserId());
        response.setCreatedAt(booking.getCreatedAt());
        response.setApprovedAt(booking.getApprovedAt());
        response.setCancelledAt(booking.getCancelledAt());
        return response;
    }

    //CUSTOM EXCEPTIONS

    public static class BookingConflictException extends RuntimeException {
        public BookingConflictException(String message) {
            super(message);
        }
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) {
            super(message);
        }
    }
}
