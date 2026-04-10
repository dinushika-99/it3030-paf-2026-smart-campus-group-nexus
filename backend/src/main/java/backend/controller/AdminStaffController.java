package backend.controller;

import backend.model.AuthProvider;
import backend.model.Notification;
import backend.model.Role;
import backend.model.User;
import backend.repository.NotificationRepository;
import backend.repository.UserRepository;
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
@RequestMapping("/api/admin")
public class AdminStaffController {

    private static final Set<Role> STAFF_CREATION_ROLES = Set.of(Role.MANAGER, Role.TECHNICIAN);
    private static final Set<Role> MANAGEABLE_ROLES = Set.of(Role.MANAGER, Role.TECHNICIAN, Role.LECTURER, Role.STUDENT);
    private static final String DEFAULT_TEMP_PASSWORD = "SmartCampus2026!";

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffController(UserRepository userRepository,
                                NotificationRepository notificationRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/staff")
    public ResponseEntity<?> listStaff(Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized: Only admins can perform this action"));
        }

        List<Map<String, Object>> staff = userRepository.findAll().stream()
                .filter(user -> user.getRole() != Role.ADMIN)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "createdAt", user.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(staff);
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

    @PatchMapping("/staff/{id}/role")
    public ResponseEntity<?> updateStaffRole(@PathVariable Long id,
                                             @RequestBody UpdateRoleRequest request,
                                             Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized: Only admins can perform this action"));
        }

        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        if (target.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot modify admin role"));
        }

        if (request.newRole() == null || request.newRole().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        Role newRole;
        try {
            newRole = Role.valueOf(request.newRole().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        if (!MANAGEABLE_ROLES.contains(newRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role assignment"));
        }

        target.setRole(newRole);
        userRepository.save(target);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Role updated successfully"
        ));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id, Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized: Only admins can perform this action"));
        }

        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        if (target.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete admin account"));
        }

        userRepository.delete(target);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(Authentication authentication) {
        User requester = getCurrentUser(authentication);
        if (requester == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        if (requester.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized: Only admins can perform this action"));
        }

        List<User> users = userRepository.findAll();
        List<Notification> notifications = notificationRepository.findAll();

        long totalUsers = users.size();
        long totalStaff = users.stream().filter(u -> u.getRole() == Role.MANAGER || u.getRole() == Role.TECHNICIAN || u.getRole() == Role.LECTURER).count();
        long students = users.stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long managers = users.stream().filter(u -> u.getRole() == Role.MANAGER).count();
        long technicians = users.stream().filter(u -> u.getRole() == Role.TECHNICIAN).count();
        long lecturers = users.stream().filter(u -> u.getRole() == Role.LECTURER).count();
        long totalNotifications = notifications.size();
        long unreadNotifications = notifications.stream().filter(n -> !n.isReadFlag()).count();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalStaff", totalStaff,
                "students", students,
                "lecturers", lecturers,
                "technicians", technicians,
                "managers", managers,
                "totalNotifications", totalNotifications,
                "unreadNotifications", unreadNotifications
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

    public record UpdateRoleRequest(String newRole) {
    }
}
