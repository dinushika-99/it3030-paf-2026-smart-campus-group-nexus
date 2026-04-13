package backend.booking.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.booking.dto.BookingRequestDTO;
import backend.booking.dto.BookingResponseDTO;
import backend.booking.dto.StatusUpdateDTO;
import backend.booking.services.BookingServices;
import jakarta.validation.Valid;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*") 
public class BookingController {

    private final BookingServices bookingService;

    public BookingController(BookingServices bookingService) {
        this.bookingService = bookingService;
    }

    //Create a new booking request
    @PostMapping
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            Principal principal) {
        
        try {
            String userId = getCurrentUserId(principal);
            BookingResponseDTO response = bookingService.createBooking(requestDTO, userId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(
                createSuccessResponse("Booking request created successfully", response)
            );
        } catch (BookingService.BookingConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // Get all bookings for current user
     @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(Principal principal) {
        String userId = getCurrentUserId(principal);
        List<BookingResponseDTO> bookings = bookingService.getMyBookings(userId);
        
        return ResponseEntity.ok(
            createSuccessResponse("Bookings retrieved successfully", bookings)
        );
    }

    //Get booking by ID
    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(@PathVariable String bookingId) {
        try {
            BookingResponseDTO booking = bookingService.getBookingById(bookingId);
            return ResponseEntity.ok(
                createSuccessResponse("Booking retrieved successfully", booking)
            );
        } catch (BookingService.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // Get all bookings (Admin only)
     @GetMapping("/all")
    public ResponseEntity<?> getAllBookings() {
        List<BookingResponseDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(
            createSuccessResponse("All bookings retrieved successfully", bookings)
        );
    }

    //Update booking status (Approve/Reject/Cancel)
    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody StatusUpdateDTO statusUpdateDTO,
            Principal principal) {
        
        try {
            String currentUserId = getCurrentUserId(principal);
            boolean isAdmin = checkIfAdmin(principal);
            
            BookingResponseDTO response = bookingService.updateBookingStatus(
                bookingId, statusUpdateDTO, currentUserId, isAdmin
            );
            
            return ResponseEntity.ok(
                createSuccessResponse("Booking status updated successfully", response)
            );
        } catch (BookingService.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        } catch (BookingService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    


    // ==================== HELPER METHODS ====================

    private String getCurrentUserId(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        if (principal instanceof OAuth2User) {
            OAuth2User oAuth2User = (OAuth2User) principal;
            return oAuth2User.getAttribute("sub"); // Google OAuth2 user ID
        }
        
        return principal.getName();
    }

    private boolean checkIfAdmin(Principal principal) {
        // TODO: Implement role checking from database or OAuth2 attributes
        // For now, return false - implement based on your security configuration
        return false;
    }

    private Map<String, Object> createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }
}
