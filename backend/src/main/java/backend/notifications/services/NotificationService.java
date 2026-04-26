package backend.notifications.service;

import backend.auth.model.Role;
import backend.auth.model.User;
import backend.notifications.model.Notification;
import backend.notifications.repository.NotificationRepository;
import backend.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }


     //Create a generic notification
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

    
     //Broadcast notification to all users
    public void broadcastToAll(String type, String title, String message) {
        List<User> users = userRepository.findAll();
        users.forEach(user -> createNotification(user, type, title, message));
    }

    
     // Broadcast notification to users with specific role
    public void broadcastToRole(Role role, String type, String title, String message) {
        List<User> users = userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .toList();
        users.forEach(user -> createNotification(user, type, title, message));
    }

    
     // Get notifications for a user (by User entity)
    public List<Notification> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    
     // Mark a single notification as read
    public void markAsRead(Notification notification) {
        notification.setReadFlag(true);
        notificationRepository.save(notification);
    }


     // Create notification for booking rejection with reason
    public Notification createBookingRejectionNotification(User user, String bookingCode, String rejectionReason) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType("BOOKING_REJECTED");
        notification.setTitle("Booking Request Rejected");
        notification.setMessage(
            String.format("Your booking request (%s) has been rejected.\n\nReason: %s", 
                bookingCode, rejectionReason)
        );
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedEntityType("BOOKING");
        notification.setRelatedEntityId(bookingCode);
        
        return notificationRepository.save(notification);
    }

     // Create notification for booking approval
    public Notification createBookingApprovalNotification(User user, String bookingCode) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType("BOOKING_APPROVED");
        notification.setTitle("Booking Request Approved");
        notification.setMessage(
            String.format("Your booking request (%s) has been approved.", bookingCode)
        );
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedEntityType("BOOKING");
        notification.setRelatedEntityId(bookingCode);
        
        return notificationRepository.save(notification);
    }


    
     // Get all notifications for a user (by userId)
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    
     // Get unread notifications for a user (by userId)
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndReadFlagOrderByCreatedAtDesc(userId, false);
    }

    
     // Count unread notifications for a user (by userId)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndReadFlag(userId, false);
    }

    
     // Mark notification as read by ID
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    
     //Mark all notifications as read for a user (by userId)
     
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }


    
     //Get notifications for a user (by userId) - alternative to getNotifications(User)
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    
     // Get unread notifications for a user (by User entity)
    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndReadFlagOrderByCreatedAtDesc(user, false);
    }

    
     //Count unread notifications for a user (by User entity)
    public long countUnreadNotifications(User user) {
        return notificationRepository.countByUserAndReadFlag(user, false);
    }

    
     //Mark all notifications as read for a user (by User entity)
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUser(user);
    }

    
     //Get notifications related to a specific entity (e.g., booking, ticket)
    public List<Notification> getNotificationsByRelatedEntity(String entityType, String entityId) {
        return notificationRepository.findByRelatedEntityTypeAndRelatedEntityId(entityType, entityId);
    }

     // Create a generic notification with related entity reference
    public Notification createNotificationWithReference(User user, String type, String title, String message, 
                                                        String relatedEntityType, String relatedEntityId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        
        return notificationRepository.save(notification);
    }
}