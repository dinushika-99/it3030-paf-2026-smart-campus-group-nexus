package backend.booking.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class BookingRequestDTO {

    @NotNull(message = "Resource ID is required")
    private Long resourcesId;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 255, message = "Purpose must not exceed 255 characters")
    private String purpose;

    @Min(value = 1, message = "Expected attendees must be at least 1")
    private Integer expectedAttendees = 1;

    @Min(value = 1, message = "Quantity requested must be at least 1")
    private Integer quantityRequested = 1;

    // Default constructor

    public BookingRequestDTO() {
    }

    // Getters and Setters

    public Long getResourcesId() {
        return resourcesId;
    }   

    public void setResourcesId(Long resourcesId) {
        this.resourcesId = resourcesId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    public Integer getQuantityRequested() {
        return quantityRequested;
    }

    public void setQuantityRequested(Integer quantityRequested) {
        this.quantityRequested = quantityRequested;
    }

}
