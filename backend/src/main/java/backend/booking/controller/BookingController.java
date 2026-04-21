package backend.booking.controller;

import backend.auth.model.User;
import backend.auth.repository.UserRepository;
import backend.booking.dto.BookingRequestDTO;
import backend.booking.dto.BookingResponseDTO;
import backend.booking.dto.StatusUpdateDTO;
import backend.booking.exception.AccessDeniedException;
import backend.booking.exception.BookingConflictException;
import backend.booking.exception.ResourceNotFoundException;
import backend.booking.services.BookingServices;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingServices bookingService;
    private final UserRepository userRepository;  // ✅ Inject UserRepository

    public BookingController(BookingServices bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    // ✅ Create a new booking request
    @PostMapping
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            Principal principal) {
        
        try {
            // ✅ Extract user ID properly (lookup by email to get UUID)
            String userId = getCurrentUserId(principal);
            
            BookingResponseDTO response = bookingService.createBooking(requestDTO, userId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(
                createSuccessResponse("Booking request created successfully", response)
            );
        } catch (BookingConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // ✅ Get all bookings for current user
    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(Principal principal) {
        String userId = getCurrentUserId(principal);
        List<BookingResponseDTO> bookings = bookingService.getMyBookings(userId);
        
        return ResponseEntity.ok(
            createSuccessResponse("Bookings retrieved successfully", bookings)
        );
    }

    // ✅ Get booking by ID
    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(@PathVariable String bookingId) {
        try {
            BookingResponseDTO booking = bookingService.getBookingById(bookingId);
            return ResponseEntity.ok(
                createSuccessResponse("Booking retrieved successfully", booking)
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // ✅ Get all bookings (Admin only)
    @GetMapping("/all")
    public ResponseEntity<?> getAllBookings() {
        List<BookingResponseDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(
            createSuccessResponse("All bookings retrieved successfully", bookings)
        );
    }

    // ✅ Update booking status (Approve/Reject/Cancel)
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
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // ✅ Cancel booking
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable String bookingId,
            Principal principal) {
        
        try {
            String currentUserId = getCurrentUserId(principal);
            bookingService.cancelBooking(bookingId, currentUserId);
            
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        } catch (AccessDeniedException e) {
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

    // ✅ FIXED: Properly extract user ID by looking up User entity
    private String getCurrentUserId(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email;
        
        // Handle OAuth2 authentication
        if (principal instanceof OAuth2User oAuth2User) {
            String oauthEmail = oAuth2User.getAttribute("email");
            email = oauthEmail != null ? oauthEmail : oAuth2User.getAttribute("sub");
        } 
        // Handle standard authentication (email as principal name)
        else {
            email = principal.getName();
        }
        
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email not found in authentication");
        }
        
        // ✅ Lookup user by email to get the actual UUID user_id
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        return user.getId();  // ✅ Return the UUID user_id
    }

    // ✅ Check if user is admin (implement based on your security config)
    private boolean checkIfAdmin(Principal principal) {
        if (principal == null) {
            return false;
        }
        
        // For OAuth2: Check roles from attributes
        if (principal instanceof OAuth2User oAuth2User) {
            // Google OAuth2 doesn't include roles by default - you'd need to store role in DB
            // For now, lookup user and check role
            String email = oAuth2User.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                    .map(user -> user.getRole() == backend.auth.model.Role.ADMIN)
                    .orElse(false);
            }
        }
        
        // For local auth: Lookup user and check role
        String email = principal.getName();
        return userRepository.findByEmail(email)
            .map(user -> user.getRole() == backend.auth.model.Role.ADMIN)
            .orElse(false);
    }

    // ✅ Success response formatter
    private Map<String, Object> createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    // ✅ Error response formatter
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }
}