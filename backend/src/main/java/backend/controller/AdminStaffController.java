package backend.controller;

import backend.model.AuthProvider;
import backend.model.Role;
import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
public class AdminStaffController {

    private static final Set<Role> STAFF_CREATION_ROLES = Set.of(Role.MANAGER, Role.TECHNICIAN);
    private static final String DEFAULT_TEMP_PASSWORD = "SmartCampus2026!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/create-staff")
    public ResponseEntity<?> createStaff(@RequestBody CreateStaffRequest request, Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized: Only admins can perform this action"));
        }

        if (request.name() == null || request.name().isBlank() || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and email are required"));
        }

        Role requestedRole;
        try {
            requestedRole = Role.valueOf(request.newRole().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        if (!STAFF_CREATION_ROLES.contains(requestedRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRole(requestedRole);
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_TEMP_PASSWORD));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", requestedRole.name().toLowerCase(Locale.ROOT) + " account created successfully!",
                "defaultPassword", DEFAULT_TEMP_PASSWORD
        ));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        String email = null;

        if (principal instanceof OAuth2User oauth2User) {
            email = oauth2User.getAttribute("email");
        } else if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalText && !"anonymousUser".equals(principalText)) {
            email = principalText;
        }

        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }

    public record CreateStaffRequest(String name, String email, String newRole) {
    }
}
