package backend.booking.services.impl;

import backend.booking.dto.BookingRequestDTO;
import backend.booking.dto.BookingResponseDTO;
import backend.booking.dto.StatusUpdateDTO;
import backend.booking.model.Booking;
import backend.booking.model.BookingStatusHistory;
import backend.booking.repository.BookingHistoryRepository;
import backend.booking.repository.BookingRepository;
import backend.booking.services.BookingServices;
import backend.auth.model.User;
import backend.auth.model.Role;
import backend.auth.repository.UserRepository;
import backend.modulea.model.Resource;
import backend.modulea.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.Pattern;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingServiceImpl implements BookingServices {
    
    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    
    // Regex for meaningful purpose (letters, numbers, spaces, basic punctuation)
    private static final Pattern PURPOSE_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s,.'-]+$");
    
    public BookingServiceImpl(BookingRepository bookingRepository, 
                              BookingHistoryRepository bookingHistoryRepository,
                              UserRepository userRepository,
                              ResourceRepository resourceRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingHistoryRepository = bookingHistoryRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String currentUserId) {
        
        // 1. Validate User Exists & Role
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));
        
        if (!isValidCreatorRole(user.getRole())) {
            throw new AccessDeniedException(
                "Only Students, Lecturers, and Managers can create bookings"
            );
        }
        
        // 2. Validate Resource Exists
        Resource resource = resourceRepository.findById(requestDTO.getResourcesId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + requestDTO.getResourcesId()));
        
        // 3. Validate Time Range
        validateTimeRange(requestDTO.getStartTime(), requestDTO.getEndTime());
        
        // 4. Validate Within Resource Available Hours
        validateWithinAvailableHours(requestDTO, resource);
        
        // 5. Validate Maximum Booking Duration
        validateMaxBookingDuration(requestDTO, resource);
        
        // 6. Validate Purpose (no symbols, meaningful text)
        validatePurpose(requestDTO.getPurpose());
        
        // 7. Validate Resource Type & Fields
        validateResourceTypeAndFields(requestDTO, resource);
        
        // 8. Check Scheduling Conflicts
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
        
        // 9. Create Booking Entity
        Booking booking = new Booking();
        booking.setBookingId(UUID.randomUUID().toString());
        booking.setBookingCode(generateBookingCode());
        booking.setUserId(currentUserId);
        booking.setResourcesId(requestDTO.getResourcesId());
        booking.setStartTime(requestDTO.getStartTime());
        booking.setEndTime(requestDTO.getEndTime());
        booking.setPurpose(requestDTO.getPurpose());
        booking.setExpectedAttendees(requestDTO.getExpectedAttendees());
        booking.setQuantityRequested(requestDTO.getQuantityRequested());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setCreatedByUserId(currentUserId);
        booking.setCreatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // 10. Record Status History
        recordStatusHistory(savedBooking.getBookingId(), null, "PENDING", currentUserId, "Booking created");
        
        return mapToResponseDTO(savedBooking);
    }

    // ==================== VALIDATION METHODS ====================

    /**
     * Validate that end time is after start time
     */
    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    /**
     * Validate booking is within resource's available hours
     */
    private void validateWithinAvailableHours(BookingRequestDTO requestDTO, Resource resource) {
        LocalTime bookingStartTime = requestDTO.getStartTime().toLocalTime();
        LocalTime bookingEndTime = requestDTO.getEndTime().toLocalTime();
        
        LocalTime resourceOpenTime = resource.getDailyOpenTime();
        LocalTime resourceCloseTime = resource.getDailyCloseTime();
        
        // Check if booking starts before resource opens
        if (bookingStartTime.isBefore(resourceOpenTime)) {
            throw new IllegalArgumentException(
                String.format("Booking start time (%s) is before resource opening time (%s). " +
                            "Resource is available from %s to %s",
                    bookingStartTime, resourceOpenTime, resourceOpenTime, resourceCloseTime)
            );
        }
        
        // Check if booking ends after resource closes
        if (bookingEndTime.isAfter(resourceCloseTime)) {
            throw new IllegalArgumentException(
                String.format("Booking end time (%s) is after resource closing time (%s). " +
                            "Resource is available from %s to %s",
                    bookingEndTime, resourceCloseTime, resourceOpenTime, resourceCloseTime)
            );
        }
    }

    /**
     * Validate booking duration doesn't exceed resource's maximum booking duration
     */
    private void validateMaxBookingDuration(BookingRequestDTO requestDTO, Resource resource) {
        LocalDateTime startTime = requestDTO.getStartTime();
        LocalDateTime endTime = requestDTO.getEndTime();
        
        long bookingDurationHours = Duration.between(startTime, endTime).toHours();
        int maxDurationHours = resource.getMaxBookingDurationHours();
        
        if (bookingDurationHours > maxDurationHours) {
            throw new IllegalArgumentException(
                String.format("Booking duration (%d hours) exceeds maximum allowed duration (%d hours) for this resource",
                    bookingDurationHours, maxDurationHours)
            );
        }
        
        if (bookingDurationHours <= 0) {
            throw new IllegalArgumentException("Booking duration must be at least 1 hour");
        }
    }

    /**
     * Validate purpose is meaningful text without symbols
     */
    private void validatePurpose(String purpose) {
        if (purpose == null || purpose.trim().isEmpty()) {
            throw new IllegalArgumentException("Purpose is required");
        }
        
        if (purpose.trim().length() < 10) {
            throw new IllegalArgumentException("Purpose must be at least 10 characters long and provide meaningful information");
        }
        
        if (purpose.trim().length() > 255) {
            throw new IllegalArgumentException("Purpose must not exceed 255 characters");
        }
        
        // Check for symbols (allow only letters, numbers, spaces, and basic punctuation)
        if (!PURPOSE_PATTERN.matcher(purpose).matches()) {
            throw new IllegalArgumentException(
                "Purpose contains invalid characters. Only letters, numbers, spaces, and basic punctuation (, . ' -) are allowed"
            );
        }
        
        // Check if it's just repeated characters or meaningless
        if (purpose.trim().matches("^(.)\\1+$")) {
            throw new IllegalArgumentException("Purpose must be a meaningful description, not repeated characters");
        }
        
        // Check for minimum word count
        String[] words = purpose.trim().split("\\s+");
        if (words.length < 3) {
            throw new IllegalArgumentException("Purpose must be at least 3 words long and provide meaningful information");
        }
    }

    /**
     * Validate resource type-specific fields and capacity/quantity limits
     */
    private void validateResourceTypeAndFields(BookingRequestDTO requestDTO, Resource resource) {
        
        String resourceType = resource.getType();
        
        // EQUIPMENT types
        if (isEquipmentType(resourceType)) {
            // Must have quantityRequested (minimum 1)
            if (requestDTO.getQuantityRequested() == null || requestDTO.getQuantityRequested() < 1) {
                throw new IllegalArgumentException(
                    "Equipment resources require quantityRequested (minimum 1)"
                );
            }
            
            // Should NOT have expectedAttendees
            if (requestDTO.getExpectedAttendees() != null) {
                throw new IllegalArgumentException(
                    "Equipment resources do not use expectedAttendees. Use quantityRequested instead."
                );
            }
            
            // Validate against max_quantity
            if (requestDTO.getQuantityRequested() > resource.getMaxQuantity()) {
                throw new IllegalArgumentException(
                    String.format("Requested quantity (%d) exceeds maximum allowed quantity (%d) for this resource",
                        requestDTO.getQuantityRequested(), resource.getMaxQuantity())
                );
            }
        } else {
            // ACADEMIC, SPORTS, COMMON, ADMINISTRATIVE resources
            // Must have expectedAttendees (minimum 1)
            if (requestDTO.getExpectedAttendees() == null || requestDTO.getExpectedAttendees() < 1) {
                throw new IllegalArgumentException(
                    "Non-equipment resources require expectedAttendees (minimum 1)"
                );
            }
            
            // Should NOT have quantityRequested
            if (requestDTO.getQuantityRequested() != null) {
                throw new IllegalArgumentException(
                    "Non-equipment resources do not use quantityRequested. Use expectedAttendees instead."
                );
            }
            
            // Validate against resource capacity
            if (requestDTO.getExpectedAttendees() > resource.getCapacity()) {
                throw new IllegalArgumentException(
                    String.format("Expected attendees (%d) exceeds resource capacity (%d)",
                        requestDTO.getExpectedAttendees(), resource.getCapacity())
                );
            }
        }
    }
    
    /**
     * Check if resource is EQUIPMENT type
     */
    private boolean isEquipmentType(String type) {
        return type != null && (
            type.equals("PROJECTOR") || 
            type.equals("PRINTER") || 
            type.equals("SPEAKER") || 
            type.equals("SPORT_MATERIAL") || 
            type.equals("VR_HEADSET_SET") ||
            type.equals("VR")
        );
    }

    // Helper: Validate Creator Role
    private boolean isValidCreatorRole(Role role) {
        return role == Role.STUDENT || 
               role == Role.LECTURER || 
               role == Role.MANAGER;
    }

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
        BookingStatusHistory history = new BookingStatusHistory();
        history.setBookingId(bookingId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedByUserId(changedByUserId);
        history.setChangeNote(changeNote);

        bookingHistoryRepository.save(history);
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking) {
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

    // ==================== OTHER REQUIRED METHODS ====================
    
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
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getPendingBookings() {
        return bookingRepository.findByStatusOrderByCreatedAtDesc(Booking.BookingStatus.PENDING)
            .stream()
            .map(this::mapToResponseDTO)
            .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO updateBookingStatus(String bookingId, StatusUpdateDTO statusUpdateDTO, String currentUserId, boolean isAdmin) {
        // ... (keep existing implementation)
        return null;
    }
    
    @Override
    public void cancelBooking(String bookingId, String currentUserId) {
        // ... (keep existing implementation)
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(String bookingId) {
        return bookingRepository.existsById(bookingId);
    }

    // ==================== CUSTOM EXCEPTIONS ====================

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