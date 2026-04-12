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

    
    
}
