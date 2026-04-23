package backend.booking.dto;

import jakarta.validation.constraints.NotNull;

public class StatusUpdateDTO {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    private String rejectionReason;

    // Default constructor
    public StatusUpdateDTO() {
    }

    // Getters and Setters

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    //Nested enum for BookingStatus
    public enum BookingStatus {
        APPROVED,
        REJECTED,
        CANCELLED
    }


}
