package backend.notifications.repository;

import backend.notifications.model.Notification;
import backend.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find all notifications for a user (by User entity) - KEEP THIS
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Find all notifications for a user (by userId) - for flexibility
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Find unread notifications for a user (by User entity)
    List<Notification> findByUserAndReadFlagOrderByCreatedAtDesc(User user, boolean readFlag);

    // Find unread notifications for a user (by userId)
    List<Notification> findByUserIdAndReadFlagOrderByCreatedAtDesc(Long userId, boolean readFlag);

    // Count unread notifications for a user (by User entity)
    long countByUserAndReadFlag(User user, boolean readFlag);

    // Count unread notifications for a user (by userId)
    long countByUserIdAndReadFlag(Long userId, boolean readFlag);

    // Find notifications by related entity type and ID
    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String entityType, String entityId);

    // Find notifications by user and related entity
    List<Notification> findByUserAndRelatedEntityTypeAndRelatedEntityId(User user, String entityType, String entityId);

    // Mark all notifications as read for a user (by User entity)
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readFlag = true WHERE n.user = :user AND n.readFlag = false")
    void markAllAsReadByUser(@Param("user") User user);

    // Mark all notifications as read for a user (by userId)
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readFlag = true WHERE n.user.id = :userId AND n.readFlag = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    // Mark notification as read by ID
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readFlag = true WHERE n.id = :notificationId")
    void markAsRead(@Param("notificationId") Long notificationId);

    // Delete notifications by related entity (for cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.relatedEntityType = :entityType AND n.relatedEntityId = :entityId")
    void deleteByRelatedEntity(@Param("entityType") String entityType, @Param("entityId") String entityId);
}