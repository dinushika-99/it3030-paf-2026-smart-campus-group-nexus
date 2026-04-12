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
    private Integer expectedAttendees = 1;

    @Column(name = "quantity_requested", nullable = false)
    private Integer quantityRequested = 1;

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

   
}
