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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingServices bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingServices bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    // ✅ POST /api/bookings - Create booking (STUDENT, LECTURER, MANAGER only)
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
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        } catch (BookingConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                createErrorResponse(e.getMessage())
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        } catch (Exception e) {
            e.printStackTrace();  
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                createErrorResponse("Server error: " + e.getMessage())
            );
        }
    } // ✅ Closing brace for createBooking method

    // ✅ PATCH /api/bookings/{bookingId} - Update booking details (Owner only, PENDING status)
    @PatchMapping("/{bookingId}")
    public ResponseEntity<?> updateBooking(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingRequestDTO updateDTO,
            Principal principal) {
        
        try {
            String userId = getCurrentUserId(principal);
            BookingResponseDTO response = bookingService.updateBooking(bookingId, updateDTO, userId);
            
            return ResponseEntity.ok(
                createSuccessResponse("Booking updated successfully", response)
            );
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        } catch (BookingConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                createErrorResponse(e.getMessage())
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                createErrorResponse("Server error: " + e.getMessage())
            );
        }
    } // ✅ Closing brace for updateBooking method

    // ✅ GET /api/bookings/my - Get current user's bookings
    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(Principal principal) {
        try {
            String userId = getCurrentUserId(principal);
            List<BookingResponseDTO> bookings = bookingService.getMyBookings(userId);
            
            return ResponseEntity.ok(
                createSuccessResponse("Bookings retrieved successfully", bookings)
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                createErrorResponse(e.getMessage())
            );
        }
    } // ✅ Closing brace for getMyBookings method

    // ✅ GET /api/bookings/{bookingId} - Get booking by ID
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
    } // ✅ Closing brace for getBookingById method

    // ✅ GET /api/bookings/all - Get all bookings (ADMIN only)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookings() {
        try {
            List<BookingResponseDTO> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(
                createSuccessResponse("All bookings retrieved successfully", bookings)
            );
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse("Only admins can view all bookings")
            );
        }
    } // ✅ Closing brace for getAllBookings method

    // ✅ GET /api/bookings/pending - View pending bookings (ADMIN only)
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingBookings() {
        try {
            List<BookingResponseDTO> pendingBookings = bookingService.getPendingBookings();
            return ResponseEntity.ok(
                createSuccessResponse("Pending bookings retrieved", pendingBookings)
            );
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                createErrorResponse("Only admins can view pending bookings")
            );
        }
    } // ✅ Closing brace for getPendingBookings method

    // ✅ GET /api/bookings/resource/{resourceId}/slots - View booked slots for a resource
    @GetMapping("/resource/{resourceId}/slots")
    public ResponseEntity<?> getBookedSlotsByResource(@PathVariable Long resourceId) {
        try {
            List<BookingResponseDTO> slots = bookingService.getBookedSlotsByResourceId(resourceId);
            return ResponseEntity.ok(
                createSuccessResponse("Booked slots retrieved successfully", slots)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    }

    // ✅ PATCH /api/bookings/{bookingId}/status - Approve/Reject (ADMIN only)
    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody StatusUpdateDTO statusUpdateDTO,
            Principal principal) {
        
        try {
            String adminUserId = getCurrentUserId(principal);
            BookingResponseDTO response = bookingService.updateBookingStatus(
                bookingId, statusUpdateDTO, adminUserId, true
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
                createErrorResponse("Only admins can approve/reject bookings")
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                createErrorResponse(e.getMessage())
            );
        }
    } // ✅ Closing brace for updateBookingStatus method

    // ✅ DELETE /api/bookings/{bookingId} - Cancel booking (Owner or Admin)
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable String bookingId,
            Principal principal) {
        
        try {
            String userId = getCurrentUserId(principal);
            bookingService.cancelBooking(bookingId, userId);
            
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
    } // ✅ Closing brace for cancelBooking method

    // ==================== HELPER METHODS ====================

    private String getCurrentUserId(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email;
        
        if (principal instanceof OAuth2User oAuth2User) {
            String oauthEmail = oAuth2User.getAttribute("email");
            email = oauthEmail != null ? oauthEmail : oAuth2User.getAttribute("sub");
        } else {
            email = principal.getName();
        }
        
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email not found in authentication");
        }
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        return user.getId();
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
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
} 