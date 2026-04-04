package backend.controller;

import backend.model.Role;
import backend.model.User;
import backend.repository.UserRepository;
import backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    private User getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return null;
        }
        String email = principal.getAttribute("email");
        if (email == null) {
            return null;
        }
        return userRepository.findByEmail(email).orElse(null);
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcast(@AuthenticationPrincipal OAuth2User principal,
                                          @RequestBody BroadcastRequest request) {
        User user = getCurrentUser(principal);
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
