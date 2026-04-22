package backend.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings",
        indexes = {
            @Index(name = "idx_booking_user", columnList = "user_id, status"),
            @Index(name = "idx_booking_resource_time", columnList = "resources_id, start_time, end_time, status"),
            @Index(name = "idx_booking_status", columnList = "status"),
            @Index(name = "idx_booking_code", columnList = "booking_code")
        })
public class Booking {

    @Id
    @Column(name = "booking_id", length = 255)
    private String bookingId;

    @Column(name = "booking_code", length = 50, unique = true, nullable = false)
    private String bookingCode;

    @Column(name = "user_id", length = 255, nullable = false)
    private String userId;

    @Column(name = "resources_id", nullable = false)
    private Long resourcesId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "purpose", length = 255, nullable = false)
    private String purpose;

    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    @Column(name = "quantity_requested")
    private Integer quantityRequested;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_by_user_id", length = 255, nullable = false)
    private String createdByUserId;

    @Column(name = "approved_by_user_id", length = 255)
    private String approvedByUserId;

    @Column(name = "cancelled_by_user_id", length = 255)
    private String cancelledByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    // Default Constructor
    public Booking() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = BookingStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==================== GETTERS AND SETTERS ====================
    
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getBookingCode() { return bookingCode; }
    public void setBookingCode(String bookingCode) { this.bookingCode = bookingCode; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getResourcesId() { return resourcesId; }
    public void setResourcesId(Long resourcesId) { this.resourcesId = resourcesId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }

    public Integer getQuantityRequested() { return quantityRequested; }
    public void setQuantityRequested(Integer quantityRequested) { this.quantityRequested = quantityRequested; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId) { this.createdByUserId = createdByUserId; }

    public String getApprovedByUserId() { return approvedByUserId; }
    public void setApprovedByUserId(String approvedByUserId) { this.approvedByUserId = approvedByUserId; }

    public String getCancelledByUserId() { return cancelledByUserId; }
    public void setCancelledByUserId(String cancelledByUserId) { this.cancelledByUserId = cancelledByUserId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public enum BookingStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }
}