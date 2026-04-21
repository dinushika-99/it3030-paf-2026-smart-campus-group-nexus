package backend.auth.controller;

import backend.auth.model.AuthProvider;
import backend.auth.model.Role;
import backend.auth.model.User;
import backend.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Set<Role> STAFF_INVITE_ROLES = Set.of(Role.MANAGER, Role.TECHNICIAN, Role.LECTURER);
    private static final Set<Role> MANAGEABLE_ROLES = Set.of(Role.STUDENT, Role.LECTURER, Role.TECHNICIAN, Role.MANAGER);
    private static final String DEFAULT_TEMP_PASSWORD = "SmartCampus2026!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> getUsers(Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only admins can fetch users"));
        }

        List<Map<String, Object>> users = userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "createdAt", user.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @PostMapping("/invite")
    public ResponseEntity<?> inviteStaff(@RequestBody InviteRequest request, Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only admins can invite staff"));
        }

        if (request.name() == null || request.name().isBlank() || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and email are required"));
        }

        Role role;
        try {
            role = Role.valueOf(request.role().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        if (!STAFF_INVITE_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be MANAGER, TECHNICIAN, or LECTURER"));
        }

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_TEMP_PASSWORD));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "User invited successfully",
                "defaultPassword", DEFAULT_TEMP_PASSWORD
        ));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id,
                                        @RequestBody UpdateRoleRequest request,
                                        Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only admins can change roles"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot modify admin role"));
        }

        if (request.role() == null || request.role().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        Role role;
        try {
            role = Role.valueOf(request.role().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        if (!MANAGEABLE_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Role updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only admins can delete users"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete admin account"));
        }

        userRepository.delete(user);
        return ResponseEntity.noContent().build();
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

    public record InviteRequest(String name, String email, String role) {
    }

    public record UpdateRoleRequest(String role) {
    }
}

