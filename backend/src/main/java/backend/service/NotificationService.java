package backend.service;

import backend.model.Notification;
import backend.model.Role;
import backend.model.User;
import backend.repository.NotificationRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(User user, String type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public void broadcastToAll(String type, String title, String message) {
        List<User> users = userRepository.findAll();
        users.forEach(user -> createNotification(user, type, title, message));
    }

    public void broadcastToRole(Role role, String type, String title, String message) {
        List<User> users = userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .toList();
        users.forEach(user -> createNotification(user, type, title, message));
    }

    public List<Notification> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public void markAsRead(Notification notification) {
        notification.setReadFlag(true);
        notificationRepository.save(notification);
    }
}
