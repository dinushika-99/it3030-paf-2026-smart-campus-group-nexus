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
import backend.notifications.model.Notification;
import backend.notifications.repository.NotificationRepository;
import backend.booking.dto.BookingStatusHistoryDTO;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@Transactional
public class BookingServiceImpl implements BookingServices {
    
    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationRepository notificationRepository; 
    
    private static final Pattern PURPOSE_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s,.'-]+$");
    
    public BookingServiceImpl(BookingRepository bookingRepository, 
                              BookingHistoryRepository bookingHistoryRepository,
                              UserRepository userRepository,
                              ResourceRepository resourceRepository,
                              NotificationRepository notificationRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingHistoryRepository = bookingHistoryRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String currentUserId) {
        
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));
        
        if (!isValidCreatorRole(user.getRole())) {
            throw new AccessDeniedException("Only Students and Lecturers can create bookings");
        }
        
        Resource resource = resourceRepository.findById(requestDTO.getResourcesId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + requestDTO.getResourcesId()));
        
        validateTimeRange(requestDTO.getStartTime(), requestDTO.getEndTime());
        validateWithinAvailableHours(requestDTO, resource);
        validateMaxBookingDuration(requestDTO, resource);
        validatePurpose(requestDTO.getPurpose());
        validateResourceTypeAndFields(requestDTO, resource);
        
        int overlappingCount = bookingRepository.countOverlappingBookings(
            requestDTO.getResourcesId(),
            requestDTO.getStartTime(),
            requestDTO.getEndTime()
        );
        
        if (overlappingCount > 0) {
            throw new BookingConflictException("This resource is already booked for the selected time range");
        }
        
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
        recordStatusHistory(savedBooking.getBookingId(), null, "PENDING", currentUserId, "Booking created");
        
        return mapToResponseDTO(savedBooking);
    }

    @Override
    public BookingResponseDTO updateBookingStatus(String bookingId, StatusUpdateDTO statusUpdateDTO, String currentUserId, boolean isAdmin) {
        
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        String oldStatus = booking.getStatus().name();
        String newStatus = statusUpdateDTO.getStatus().name();

        validateStatusTransition(booking.getStatus(), statusUpdateDTO.getStatus(), isAdmin);

        switch (statusUpdateDTO.getStatus()) {
            case APPROVED:
                if (!isAdmin) throw new AccessDeniedException("Only admins can approve bookings");
                booking.setStatus(Booking.BookingStatus.APPROVED);
                booking.setApprovedByUserId(currentUserId);
                booking.setApprovedAt(LocalDateTime.now());
                booking.setRejectionReason(null);
                sendApprovalNotification(booking);
                break;

            case REJECTED:
                if (!isAdmin) throw new AccessDeniedException("Only admins can reject bookings");
                if (statusUpdateDTO.getRejectionReason() == null || statusUpdateDTO.getRejectionReason().trim().isEmpty()) {
                    throw new IllegalArgumentException("Rejection reason is required");
                }
                booking.setStatus(Booking.BookingStatus.REJECTED);
                booking.setRejectionReason(statusUpdateDTO.getRejectionReason().trim());
                booking.setApprovedByUserId(currentUserId);
                booking.setApprovedAt(LocalDateTime.now());
                sendRejectionNotification(booking, statusUpdateDTO.getRejectionReason().trim());
                break;

            case CANCELLED:
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
                throw new IllegalArgumentException("Invalid status update: " + statusUpdateDTO.getStatus());
        }

        Booking updatedBooking = bookingRepository.save(booking);
        recordStatusHistory(bookingId, oldStatus, newStatus, currentUserId, statusUpdateDTO.getRejectionReason());
        return mapToResponseDTO(updatedBooking);
    }

    // ==================== ✅ SINGLE cancelBooking METHOD (FIXED) ====================

    @Override
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        // ✅ Cannot cancel already terminal states
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || 
            booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new IllegalStateException("Cannot cancel a booking that is already " + booking.getStatus());
        }

        // ✅ Only owner or admin can cancel
        boolean isOwner = booking.getUserId().equals(currentUserId);
        boolean isAdmin = false;
        
        if (!isOwner) {
            User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));
            isAdmin = currentUser.getRole() == Role.ADMIN;
        }
        
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the booking owner or an admin can cancel this booking");
        }

        // ✅ Only PENDING or APPROVED can be cancelled
        if (booking.getStatus() != Booking.BookingStatus.PENDING && 
            booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new IllegalStateException(
                "Cannot cancel booking with status: " + booking.getStatus() + 
                ". Only PENDING and APPROVED bookings can be cancelled."
            );
        }

        // ✅ 24-hour restriction for APPROVED bookings
        if (booking.getStatus() == Booking.BookingStatus.APPROVED) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime bookingStart = booking.getStartTime();
            long hoursUntilBooking = Duration.between(now, bookingStart).toHours();
            
            if (hoursUntilBooking < 24) {
                throw new IllegalStateException(
                    "Cannot cancel approved booking less than 24 hours before the scheduled time."
                );
            }
        }

        // ✅ Capture old status BEFORE update for accurate history
        String oldStatus = booking.getStatus().name();
        
        // ✅ Update booking
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledByUserId(currentUserId);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRejectionReason(null);

        bookingRepository.save(booking);

        // ✅ Record accurate status history
        recordStatusHistory(
            bookingId, 
            oldStatus,  // ✅ Dynamic old status, not hardcoded
            "CANCELLED", 
            currentUserId, 
            "Booking cancelled by " + (isAdmin ? "admin" : "user")
        );

        // ✅ Send cancellation notification (fail-safe)
        sendCancellationNotification(booking, currentUserId);
    }

    // ==================== UPDATE BOOKING (Pending Only) ====================

    @Override
    public BookingResponseDTO updateBooking(String bookingId, BookingRequestDTO updateDTO, String currentUserId) {
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        if (!isValidCreatorRole(user.getRole())) {
            throw new AccessDeniedException("Only Students and Lecturers can update bookings");
        }
        
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only update your own bookings");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException(
                "Cannot update booking with status: " + booking.getStatus() + 
                ". Only PENDING bookings can be updated."
            );
        }

        Resource resource = resourceRepository.findById(updateDTO.getResourcesId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + updateDTO.getResourcesId()));
        
        validateTimeRange(updateDTO.getStartTime(), updateDTO.getEndTime());
        validateWithinAvailableHours(updateDTO, resource);
        validateMaxBookingDuration(updateDTO, resource);
        validatePurpose(updateDTO.getPurpose());
        validateResourceTypeAndFields(updateDTO, resource);

        int overlappingCount = bookingRepository.countOverlappingBookingsExcluding(
            updateDTO.getResourcesId(),
            updateDTO.getStartTime(),
            updateDTO.getEndTime(),
            bookingId
        );
        
        if (overlappingCount > 0) {
            throw new BookingConflictException("This resource is already booked for the selected time range");
        }

        booking.setResourcesId(updateDTO.getResourcesId());
        booking.setStartTime(updateDTO.getStartTime());
        booking.setEndTime(updateDTO.getEndTime());
        booking.setPurpose(updateDTO.getPurpose());
        booking.setExpectedAttendees(updateDTO.getExpectedAttendees());
        booking.setQuantityRequested(updateDTO.getQuantityRequested());

        Booking updatedBooking = bookingRepository.save(booking);
        recordStatusHistory(bookingId, "PENDING", "PENDING", currentUserId, "Booking details updated by user");
        return mapToResponseDTO(updatedBooking);
    }

    // ==================== NOTIFICATION HELPERS ====================

    private void sendApprovalNotification(Booking booking) {
        try {
            String userName = fetchUserName(booking.getUserId());
            String resourceName = fetchResourceName(booking.getResourcesId());
            String title = "Booking Request Approved";
            String message = String.format(
                "Great news! Your booking request for %s has been approved.\n\n" +
                "Booking Code: %s\nDate: %s\nTime: %s - %s\n\n" +
                "Please arrive on time. If you need to cancel, please do so at least 24 hours in advance.",
                resourceName, booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(), booking.getEndTime().toLocalTime()
            );
            saveNotification(booking.getUserId(), title, message, "BOOKING_APPROVED", booking.getBookingId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send approval notification: " + e.getMessage());
        }
    }

    private void sendRejectionNotification(Booking booking, String rejectionReason) {
        try {
            String userName = fetchUserName(booking.getUserId());
            String resourceName = fetchResourceName(booking.getResourcesId());
            String title = "Booking Request Rejected";
            String message = String.format(
                "Your booking request for %s has been rejected.\n\n" +
                "Booking Code: %s\nDate: %s\nTime: %s - %s\n\n" +
                "Rejection Reason:\n%s\n\nPlease contact administration if you have questions.",
                resourceName, booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(), booking.getEndTime().toLocalTime(),
                rejectionReason
            );
            saveNotification(booking.getUserId(), title, message, "BOOKING_REJECTED", booking.getBookingId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send rejection notification: " + e.getMessage());
        }
    }

    private void sendCancellationNotification(Booking booking, String cancelledByUserId) {
        try {
            String userName = fetchUserName(booking.getUserId());
            String resourceName = fetchResourceName(booking.getResourcesId());
            String cancelledBy = fetchUserName(cancelledByUserId);
            String title = "Booking Cancelled";
            String message = String.format(
                "Your booking for %s has been cancelled.\n\n" +
                "Booking Code: %s\nDate: %s\nTime: %s - %s\n\n" +
                "Cancelled by: %s\nIf you believe this was an error, please contact administration.",
                resourceName, booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(), booking.getEndTime().toLocalTime(),
                cancelledBy
            );
            saveNotification(booking.getUserId(), title, message, "BOOKING_CANCELLED", booking.getBookingId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send cancellation notification: " + e.getMessage());
        }
    }

    private void saveNotification(String userId, String title, String message, String type, String referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedEntityType("BOOKING");
        notification.setRelatedEntityId(referenceId);
        notificationRepository.save(notification);
    }

    private String fetchUserName(String userId) {
        if (userId == null) return "User";
        return userRepository.findById(userId)
            .map(user -> {
                if (user.getName() != null && !user.getName().trim().isEmpty()) return user.getName();
                if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) return user.getEmail();
                return "User";
            }).orElse("User");
    }

    private String fetchResourceName(Long resourceId) {
        if (resourceId == null) return "Resource";
        return resourceRepository.findById(resourceId)
            .map(resource -> {
                if (resource.getName() != null && !resource.getName().trim().isEmpty()) return resource.getName();
                return "Resource";
            }).orElse("Resource");
    }

    // ==================== VALIDATION METHODS ====================

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private void validateWithinAvailableHours(BookingRequestDTO requestDTO, Resource resource) {
        LocalTime bookingStartTime = requestDTO.getStartTime().toLocalTime();
        LocalTime bookingEndTime = requestDTO.getEndTime().toLocalTime();
        LocalTime resourceOpenTime = resource.getDailyOpenTime();
        LocalTime resourceCloseTime = resource.getDailyCloseTime();
        
        if (bookingStartTime.isBefore(resourceOpenTime)) {
            throw new IllegalArgumentException("Booking start time is before resource opening time.");
        }
        if (bookingEndTime.isAfter(resourceCloseTime)) {
            throw new IllegalArgumentException("Booking end time is after resource closing time.");
        }
    }

    private void validateMaxBookingDuration(BookingRequestDTO requestDTO, Resource resource) {
        LocalDateTime startTime = requestDTO.getStartTime();
        LocalDateTime endTime = requestDTO.getEndTime();
        long bookingDurationHours = Duration.between(startTime, endTime).toHours();
        int maxDurationHours = resource.getMaxBookingDurationHours();
        
        if (bookingDurationHours > maxDurationHours) {
            throw new IllegalArgumentException("Booking duration exceeds maximum allowed duration.");
        }
        if (bookingDurationHours <= 0) {
            throw new IllegalArgumentException("Booking duration must be at least 1 hour");
        }
    }

    private void validatePurpose(String purpose) {
        if (purpose == null || purpose.trim().isEmpty()) {
            throw new IllegalArgumentException("Purpose is required");
        }
        if (purpose.trim().length() < 10) {
            throw new IllegalArgumentException("Purpose must be at least 10 characters long.");
        }
        if (purpose.trim().length() > 255) {
            throw new IllegalArgumentException("Purpose must not exceed 255 characters");
        }
        if (!PURPOSE_PATTERN.matcher(purpose).matches()) {
            throw new IllegalArgumentException("Purpose contains invalid characters.");
        }
        if (purpose.trim().matches("^(.)\\1+$")) {
            throw new IllegalArgumentException("Purpose must be meaningful, not repeated characters");
        }
        String[] words = purpose.trim().split("\\s+");
        if (words.length < 3) {
            throw new IllegalArgumentException("Purpose must be at least 3 words long.");
        }
    }

    private void validateResourceTypeAndFields(BookingRequestDTO requestDTO, Resource resource) {
        String resourceType = resource.getType();
        if (isEquipmentType(resourceType)) {
            if (requestDTO.getQuantityRequested() == null || requestDTO.getQuantityRequested() < 1) {
                throw new IllegalArgumentException("Equipment resources require quantityRequested (minimum 1)");
            }
            if (requestDTO.getExpectedAttendees() != null) {
                throw new IllegalArgumentException("Equipment resources do not use expectedAttendees.");
            }
            if (requestDTO.getQuantityRequested() > resource.getMaxQuantity()) {
                throw new IllegalArgumentException("Requested quantity exceeds maximum allowed.");
            }
        } else {
            if (requestDTO.getExpectedAttendees() == null || requestDTO.getExpectedAttendees() < 1) {
                throw new IllegalArgumentException("Non-equipment resources require expectedAttendees (minimum 1)");
            }
            if (requestDTO.getQuantityRequested() != null) {
                throw new IllegalArgumentException("Non-equipment resources do not use quantityRequested.");
            }
            if (requestDTO.getExpectedAttendees() > resource.getCapacity()) {
                throw new IllegalArgumentException("Expected attendees exceeds resource capacity.");
            }
        }
    }
    
    private boolean isEquipmentType(String type) {
        return type != null && Arrays.asList(
            "PROJECTOR", "PRINTER", "SPEAKER", "SPORT_MATERIAL", "VR_HEADSET_SET", "VR"
        ).contains(type);
    }

    private boolean isValidCreatorRole(Role role) {
        return role == Role.STUDENT || role == Role.LECTURER;
    }

    private String generateBookingCode() {
        return "BK-" + String.valueOf(System.currentTimeMillis()).substring(6);
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
                if (!isAdmin) throw new AccessDeniedException("Only admins can change pending booking status");
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
        history.setChangeNote(changeNote != null ? changeNote : "Status updated");
        history.setChangedAt(LocalDateTime.now());
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
        
        // User info
        try {
            String lookupUserId = booking.getUserId() != null ? booking.getUserId() : booking.getCreatedByUserId();
            if (lookupUserId != null) {
                userRepository.findById(lookupUserId).ifPresent(user -> {
                    String name = user.getName();
                    if (name == null || name.trim().isEmpty()) name = user.getEmail();
                    response.setUserName(name != null && !name.trim().isEmpty() ? name : "Unknown User");
                    response.setUserRole(user.getRole() != null ? user.getRole().name() : "UNKNOWN");
                });
            }
        } catch (Exception e) {
            response.setUserName("Unknown User");
            response.setUserRole("UNKNOWN");
        }

        // Resource info
        try {
            if (booking.getResourcesId() != null) {
                resourceRepository.findById(booking.getResourcesId()).ifPresent(resource -> {
                    String resourceName = resource.getName();
                    if (resourceName == null || resourceName.trim().isEmpty()) resourceName = resource.getRoomNumber();
                    response.setResourceName(resourceName != null && !resourceName.trim().isEmpty() ? resourceName : "Resource #" + booking.getResourcesId());
                    response.setResourceCategory(resource.getCategory() != null ? resource.getCategory().name() : "N/A");
                });
            }
        } catch (Exception e) {
            response.setResourceName("Resource #" + booking.getResourcesId());
        }

        // Approved/Canceled by names
        if (booking.getApprovedByUserId() != null) {
            userRepository.findById(booking.getApprovedByUserId()).ifPresent(u -> {
                String name = u.getName();
                if (name == null || name.trim().isEmpty()) name = u.getEmail();
                response.setApprovedByUserName(name != null && !name.trim().isEmpty() ? name : "Unknown Admin");
            });
        }
        if (booking.getCancelledByUserId() != null) {
            userRepository.findById(booking.getCancelledByUserId()).ifPresent(u -> {
                String name = u.getName();
                if (name == null || name.trim().isEmpty()) name = u.getEmail();
                response.setCancelledByUserName(name != null && !name.trim().isEmpty() ? name : "Unknown Admin");
            });
        }
        
        // Status history
        try {
            List<BookingStatusHistory> historyList = bookingHistoryRepository.findByBookingIdOrderByChangedAtAsc(booking.getBookingId());
            List<BookingStatusHistoryDTO> historyDTOs = historyList.stream().map(h -> {
                BookingStatusHistoryDTO dto = new BookingStatusHistoryDTO();
                dto.setOldStatus(h.getOldStatus());
                dto.setNewStatus(h.getNewStatus());
                dto.setChangeNote(h.getChangeNote());
                dto.setChangedAt(h.getChangedAt());
                if (h.getChangedByUserId() != null) {
                    userRepository.findById(h.getChangedByUserId()).ifPresent(u -> dto.setChangedByUserName(u.getName()));
                }
                return dto;
            }).collect(Collectors.toList());
            response.setStatusHistory(historyDTOs);
        } catch (Exception e) {
            response.setStatusHistory(new ArrayList<>());
        }
        return response;
    }

    // ==================== READ-ONLY METHODS ====================
    
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
            .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getPendingBookings() {
        return bookingRepository.findByStatusOrderByCreatedAtDesc(Booking.BookingStatus.PENDING)
            .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookedSlotsByResourceId(Long resourceId) {
        return bookingRepository
            .findByResourcesIdAndStatusInOrderByStartTimeAsc(
                resourceId,
                Arrays.asList(Booking.BookingStatus.APPROVED)
            )
            .stream()
            .map(this::mapToSlotResponseDTO)
            .collect(Collectors.toList());
    }

    private BookingResponseDTO mapToSlotResponseDTO(Booking booking) {
        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(booking.getBookingId());
        response.setResourcesId(booking.getResourcesId());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus() != null ? booking.getStatus().name() : "PENDING");
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsById(String bookingId) {
        return bookingRepository.existsById(bookingId);
    }

    // ==================== CUSTOM EXCEPTIONS ====================
    public static class BookingConflictException extends RuntimeException {
        public BookingConflictException(String message) { super(message); }
    }
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) { super(message); }
    }
    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) { super(message); }
    }
}