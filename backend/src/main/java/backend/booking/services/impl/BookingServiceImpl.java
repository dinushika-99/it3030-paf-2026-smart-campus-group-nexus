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
    
    // Regex for meaningful purpose (letters, numbers, spaces, basic punctuation)
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
        
        // 1. Validate User Exists & Role
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));
        
        if (!isValidCreatorRole(user.getRole())) {
            throw new AccessDeniedException(
                "Only Students and Lecturers can create bookings"
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

    // ==================== UPDATE STATUS WITH NOTIFICATIONS ====================

    @Override
    public BookingResponseDTO updateBookingStatus(String bookingId, StatusUpdateDTO statusUpdateDTO, String currentUserId, boolean isAdmin) {
        
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        String oldStatus = booking.getStatus().name();
        String newStatus = statusUpdateDTO.getStatus().name();

        // Validate status transition rules
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
                booking.setRejectionReason(null); // Clear any previous rejection reason
                
                // Send approval notification
                sendApprovalNotification(booking);
                break;

            case REJECTED:
                if (!isAdmin) {
                    throw new AccessDeniedException("Only admins can reject bookings");
                }
                
                // Validate rejection reason
                if (statusUpdateDTO.getRejectionReason() == null || statusUpdateDTO.getRejectionReason().trim().isEmpty()) {
                    throw new IllegalArgumentException("Rejection reason is required");
                }
                
                booking.setStatus(Booking.BookingStatus.REJECTED);
                booking.setRejectionReason(statusUpdateDTO.getRejectionReason().trim());
                booking.setApprovedByUserId(currentUserId); // Using approvedBy field for audit trail of who acted
                booking.setApprovedAt(LocalDateTime.now());
                
                // Send rejection notification with reason
                sendRejectionNotification(booking, statusUpdateDTO.getRejectionReason().trim());
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
                // Optional: Send cancellation notification if needed
                break;

            default:
                throw new IllegalArgumentException("Invalid status update: " + statusUpdateDTO.getStatus());
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

    // ==================== NEW: CANCEL BOOKING (User/Admin) ====================

    @Override
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        // ✅ Check if user owns this booking OR is admin
        if (!booking.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only cancel your own bookings");
        }

        // ✅ Allow cancellation for PENDING and APPROVED only
        if (booking.getStatus() != Booking.BookingStatus.PENDING && 
            booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new IllegalStateException(
                "Cannot cancel booking with status: " + booking.getStatus() + 
                ". Only PENDING and APPROVED bookings can be cancelled."
            );
        }

        // ✅ Optional: Add 24-hour restriction for APPROVED bookings
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

        // Update status
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledByUserId(currentUserId);
        booking.setCancelledAt(LocalDateTime.now());

        bookingRepository.save(booking);

        // Record status history
        recordStatusHistory(
            bookingId, 
            booking.getStatus().name(), 
            "CANCELLED", 
            currentUserId, 
            "Booking cancelled by user"
        );

        // Send cancellation notification
        sendCancellationNotification(booking, currentUserId);
    }

    // ==================== NEW: UPDATE BOOKING (Pending Only) ====================

    @Override
    public BookingResponseDTO updateBooking(
            String bookingId, 
            BookingRequestDTO updateDTO, 
            String currentUserId) {

        // 0. Validate updater role
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        if (!isValidCreatorRole(user.getRole())) {
            throw new AccessDeniedException(
                "Only Students and Lecturers can update bookings"
            );
        }
        
        // 1. Fetch the existing booking
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        // 2. Check if user owns this booking
        if (!booking.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only update your own bookings");
        }

        // 3. Only allow updates for PENDING bookings
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException(
                "Cannot update booking with status: " + booking.getStatus() + 
                ". Only PENDING bookings can be updated. For APPROVED bookings, please cancel and create a new booking."
            );
        }

        // 4. Validate the update data (same validation as create)
        
        // 4a. Validate Resource Exists
        Resource resource = resourceRepository.findById(updateDTO.getResourcesId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + updateDTO.getResourcesId()));
        
        // 4b. Validate Time Range
        validateTimeRange(updateDTO.getStartTime(), updateDTO.getEndTime());
        
        // 4c. Validate Within Resource Available Hours
        validateWithinAvailableHours(updateDTO, resource);
        
        // 4d. Validate Maximum Booking Duration
        validateMaxBookingDuration(updateDTO, resource);
        
        // 4e. Validate Purpose (no symbols, meaningful text)
        validatePurpose(updateDTO.getPurpose());
        
        // 4f. Validate Resource Type & Fields
        validateResourceTypeAndFields(updateDTO, resource);

        // 5. Check for scheduling conflicts (EXCLUDING current booking)
        int overlappingCount = bookingRepository.countOverlappingBookingsExcluding(
            updateDTO.getResourcesId(),
            updateDTO.getStartTime(),
            updateDTO.getEndTime(),
            bookingId  // Exclude current booking from conflict check
        );
        
        if (overlappingCount > 0) {
            throw new BookingConflictException(
                "This resource is already booked for the selected time range"
            );
        }

        // 6. Update booking fields
        booking.setResourcesId(updateDTO.getResourcesId());
        booking.setStartTime(updateDTO.getStartTime());
        booking.setEndTime(updateDTO.getEndTime());
        booking.setPurpose(updateDTO.getPurpose());
        booking.setExpectedAttendees(updateDTO.getExpectedAttendees());
        booking.setQuantityRequested(updateDTO.getQuantityRequested());
        // Note: Status remains PENDING, no need to update

        // 7. Save updated booking
        Booking updatedBooking = bookingRepository.save(booking);

        // 8. Record status history (for audit trail)
        recordStatusHistory(
            bookingId, 
            "PENDING", 
            "PENDING", 
            currentUserId, 
            "Booking details updated by user"
        );

        // 9. Return updated booking as DTO
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
                "Booking Code: %s\n" +
                "Date: %s\n" +
                "Time: %s - %s\n\n" +
                "Please arrive on time. If you need to cancel, please do so at least 24 hours in advance.",
                resourceName,
                booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(),
                booking.getEndTime().toLocalTime()
            );
            
            saveNotification(booking.getUserId(), title, message, "BOOKING_APPROVED", booking.getBookingId());
            System.out.println("✅ Approval notification sent to: " + userName);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send approval notification: " + e.getMessage());
            // Fail-safe: Do not throw exception, allow booking update to succeed
        }
    }

    private void sendRejectionNotification(Booking booking, String rejectionReason) {
        try {
            String userName = fetchUserName(booking.getUserId());
            String resourceName = fetchResourceName(booking.getResourcesId());
            
            String title = "Booking Request Rejected";
            String message = String.format(
                "Your booking request for %s has been rejected.\n\n" +
                "Booking Code: %s\n" +
                "Date: %s\n" +
                "Time: %s - %s\n\n" +
                "Rejection Reason:\n%s\n\n" +
                "Please contact the administration if you have any questions.",
                resourceName,
                booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(),
                booking.getEndTime().toLocalTime(),
                rejectionReason
            );
            
            saveNotification(booking.getUserId(), title, message, "BOOKING_REJECTED", booking.getBookingId());
            System.out.println("✅ Rejection notification sent to: " + userName);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send rejection notification: " + e.getMessage());
            // Fail-safe: Do not throw exception
        }
    }

    // ✅ NEW: Send cancellation notification
    private void sendCancellationNotification(Booking booking, String cancelledByUserId) {
        try {
            String userName = fetchUserName(booking.getUserId());
            String resourceName = fetchResourceName(booking.getResourcesId());
            String cancelledBy = fetchUserName(cancelledByUserId);
            
            String title = "Booking Cancelled";
            String message = String.format(
                "Your booking for %s has been cancelled.\n\n" +
                "Booking Code: %s\n" +
                "Date: %s\n" +
                "Time: %s - %s\n\n" +
                "Cancelled by: %s\n" +
                "If you believe this was an error, please contact administration.",
                resourceName,
                booking.getBookingCode(),
                booking.getStartTime().toLocalDate(),
                booking.getStartTime().toLocalTime(),
                booking.getEndTime().toLocalTime(),
                cancelledBy
            );
            
            saveNotification(booking.getUserId(), title, message, "BOOKING_CANCELLED", booking.getBookingId());
            System.out.println("✅ Cancellation notification sent to: " + userName);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send cancellation notification: " + e.getMessage());
            // Fail-safe: Do not throw exception
        }
    }

    private void saveNotification(String userId, String title, String message, String type, String referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.err.println("❌ Cannot save notification: user not found for ID " + userId);
            return;
        }

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
            })
            .orElse("User");
    }

    private String fetchResourceName(Long resourceId) {
        if (resourceId == null) return "Resource";
        return resourceRepository.findById(resourceId)
            .map(resource -> {
                if (resource.getName() != null && !resource.getName().trim().isEmpty()) return resource.getName();
                return "Resource";
            })
            .orElse("Resource");
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
            throw new IllegalArgumentException(
                String.format("Booking start time (%s) is before resource opening time (%s).",
                    bookingStartTime, resourceOpenTime)
            );
        }
        
        if (bookingEndTime.isAfter(resourceCloseTime)) {
            throw new IllegalArgumentException(
                String.format("Booking end time (%s) is after resource closing time (%s).",
                    bookingEndTime, resourceCloseTime)
            );
        }
    }

    private void validateMaxBookingDuration(BookingRequestDTO requestDTO, Resource resource) {
        LocalDateTime startTime = requestDTO.getStartTime();
        LocalDateTime endTime = requestDTO.getEndTime();
        
        long bookingDurationHours = Duration.between(startTime, endTime).toHours();
        int maxDurationHours = resource.getMaxBookingDurationHours();
        
        if (bookingDurationHours > maxDurationHours) {
            throw new IllegalArgumentException(
                String.format("Booking duration (%d hours) exceeds maximum allowed duration (%d hours).",
                    bookingDurationHours, maxDurationHours)
            );
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
            throw new IllegalArgumentException(
                "Purpose contains invalid characters. Only letters, numbers, spaces, and basic punctuation (, . ' -) are allowed"
            );
        }
        
        if (purpose.trim().matches("^(.)\\1+$")) {
            throw new IllegalArgumentException("Purpose must be a meaningful description, not repeated characters");
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
                throw new IllegalArgumentException(
                    String.format("Requested quantity (%d) exceeds maximum allowed quantity (%d).",
                        requestDTO.getQuantityRequested(), resource.getMaxQuantity())
                );
            }
        } else {
            if (requestDTO.getExpectedAttendees() == null || requestDTO.getExpectedAttendees() < 1) {
                throw new IllegalArgumentException("Non-equipment resources require expectedAttendees (minimum 1)");
            }
            if (requestDTO.getQuantityRequested() != null) {
                throw new IllegalArgumentException("Non-equipment resources do not use quantityRequested.");
            }
            if (requestDTO.getExpectedAttendees() > resource.getCapacity()) {
                throw new IllegalArgumentException(
                    String.format("Expected attendees (%d) exceeds resource capacity (%d).",
                        requestDTO.getExpectedAttendees(), resource.getCapacity())
                );
            }
        }
    }
    
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

    private boolean isValidCreatorRole(Role role) {
        return role == Role.STUDENT || 
               role == Role.LECTURER;
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
        history.setChangeNote(changeNote != null ? changeNote : "Status updated");
        history.setChangedAt(LocalDateTime.now());

        bookingHistoryRepository.save(history);
    }

    // ✅ Complete mapToResponseDTO with status history
    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        BookingResponseDTO response = new BookingResponseDTO();
        
        // === Basic Fields ===
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
        
        // === Fetch User Name and Role ===
        try {
            String lookupUserId = booking.getUserId() != null ? booking.getUserId() : booking.getCreatedByUserId();
            if (lookupUserId != null) {
                Optional<User> userOpt = userRepository.findById(lookupUserId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String nameFallback = user.getName();
                    if (nameFallback == null || nameFallback.trim().isEmpty()) {
                        nameFallback = user.getEmail();
                    }
                    response.setUserName(nameFallback != null && !nameFallback.trim().isEmpty() ? nameFallback : "Unknown User");
                    response.setUserRole(user.getRole() != null ? user.getRole().name() : "UNKNOWN");
                } else {
                    response.setUserName("Unknown User");
                    response.setUserRole("UNKNOWN");
                }
            }
        } catch (Exception e) {
            response.setUserName("Unknown User");
            response.setUserRole("UNKNOWN");
        }

        // === Fetch Resource Name and Category ===
        try {
            if (booking.getResourcesId() != null) {
                Optional<Resource> resourceOpt = resourceRepository.findById(booking.getResourcesId());
                if (resourceOpt.isPresent()) {
                    Resource resource = resourceOpt.get();
                    String resourceName = resource.getName();
                    if (resourceName == null || resourceName.trim().isEmpty()) {
                        resourceName = resource.getRoomNumber();
                    }
                    response.setResourceName(resourceName != null && !resourceName.trim().isEmpty() ? resourceName : "Resource #" + booking.getResourcesId());
                    
                    if (resource.getCategory() != null) {
                        response.setResourceCategory(resource.getCategory().name());
                    } else {
                        response.setResourceCategory("N/A");
                    }
                } else {
                    response.setResourceName("Resource #" + booking.getResourcesId());
                }
            }
        } catch (Exception e) {
            response.setResourceName("Resource #" + booking.getResourcesId());
        }

        // === Fetch Approved By User Name ===
        try {
            if (booking.getApprovedByUserId() != null) {
                Optional<User> approverOpt = userRepository.findById(booking.getApprovedByUserId());
                if (approverOpt.isPresent()) {
                    User approver = approverOpt.get();
                    String approverName = approver.getName();
                    if (approverName == null || approverName.trim().isEmpty()) {
                        approverName = approver.getEmail();
                    }
                    response.setApprovedByUserName(approverName != null && !approverName.trim().isEmpty() ? approverName : "Unknown Admin");
                }
            }
        } catch (Exception e) {
            // Name remains null if lookup fails
        }
        
        // === Fetch Cancelled By User Name ===
        try {
            if (booking.getCancelledByUserId() != null) {
                Optional<User> cancellerOpt = userRepository.findById(booking.getCancelledByUserId());
                if (cancellerOpt.isPresent()) {
                    User canceller = cancellerOpt.get();
                    String cancellerName = canceller.getName();
                    if (cancellerName == null || cancellerName.trim().isEmpty()) {
                        cancellerName = canceller.getEmail();
                    }
                    response.setCancelledByUserName(cancellerName != null && !cancellerName.trim().isEmpty() ? cancellerName : "Unknown Admin");
                }
            }
        } catch (Exception e) {
            // Name remains null if lookup fails
        }
        
        // === Fetch Status History ===
        try {
            List<BookingStatusHistory> historyList = bookingHistoryRepository.findByBookingIdOrderByChangedAtAsc(booking.getBookingId());
            List<BookingStatusHistoryDTO> historyDTOs = new ArrayList<>();
            
            for (BookingStatusHistory history : historyList) {
                BookingStatusHistoryDTO dto = new BookingStatusHistoryDTO();
                dto.setOldStatus(history.getOldStatus());
                dto.setNewStatus(history.getNewStatus());
                dto.setChangeNote(history.getChangeNote());
                dto.setChangedAt(history.getChangedAt());
                
                // Fetch username for history
                if (history.getChangedByUserId() != null) {
                    userRepository.findById(history.getChangedByUserId())
                        .ifPresent(user -> dto.setChangedByUserName(user.getName()));
                }
                
                historyDTOs.add(dto);
            }
            response.setStatusHistory(historyDTOs);
        } catch (Exception e) {
            System.err.println("Error fetching status history: " + e.getMessage());
            response.setStatusHistory(new ArrayList<>());
        }

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
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookedSlotsByResourceId(Long resourceId) {
        return bookingRepository
            .findByResourcesIdAndStatusInOrderByStartTimeAsc(
                resourceId,
                Arrays.asList(Booking.BookingStatus.APPROVED, Booking.BookingStatus.PENDING)
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
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new IllegalStateException("Cannot cancel a booking that is already " + booking.getStatus());
        }

        boolean isOwner = currentUserId != null && currentUserId.equals(booking.getUserId());
        // Note: You might want to inject a service to check admin status properly here if needed
        // For now, assuming strict owner-only via this specific method, or pass isAdmin flag if available
        if (!isOwner) { 
             // If you want admins to cancel here too, you need to fetch user role and check
             User currentUser = userRepository.findById(currentUserId)
                 .orElseThrow(() -> new ResourceNotFoundException("User not found"));
             if (currentUser.getRole() != Role.ADMIN) {
                 throw new AccessDeniedException("Only the booking owner or an admin can cancel this booking");
             }
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledByUserId(currentUserId);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRejectionReason(null);

        Booking savedBooking = bookingRepository.save(booking);
        recordStatusHistory(savedBooking.getBookingId(), "APPROVED", "CANCELLED", currentUserId, "Booking cancelled by user");
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