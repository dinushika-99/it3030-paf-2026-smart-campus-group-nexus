package backend.controller;

import backend.model.Role;
import backend.model.User;
import backend.repository.UserRepository;
import backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public AdminNotificationController(NotificationService notificationService,
                                       UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
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

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcast(Authentication authentication,
                                          @RequestBody BroadcastRequest request) {
        User user = getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String type = request.type() == null || request.type().isBlank() ? "INFO" : request.type().toUpperCase(Locale.ROOT);
        String title = request.title();
        String message = request.message();
        String target = request.targetRole();

        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (target == null || target.isBlank() || target.equalsIgnoreCase("ALL")) {
            notificationService.broadcastToAll(type, title, message);
            return ResponseEntity.ok().build();
        }

        Role role;
        try {
            role = Role.valueOf(target.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        notificationService.broadcastToRole(role, type, title, message);
        return ResponseEntity.ok().build();
    }

    public record BroadcastRequest(String title, String message, String type, String targetRole) {
    }
}
