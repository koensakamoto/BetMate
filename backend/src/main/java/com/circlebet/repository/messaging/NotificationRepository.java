package com.circlebet.repository.messaging;

import com.circlebet.entity.messaging.Notification;
import com.circlebet.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // User notifications
    List<Notification> findByUser(User user);
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // User notifications by userId with pagination
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findUnreadByUserId(@Param("userId") Long userId, Pageable pageable);

    // Count methods by userId
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.deletedAt IS NULL")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    Long countUnreadByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.createdAt >= :todayStart AND n.deletedAt IS NULL")
    Long countTodayNotificationsByUserId(@Param("userId") Long userId, @Param("todayStart") LocalDateTime todayStart);
    
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findActiveNotificationsByUser(@Param("user") User user);
    
    // Read/unread notifications
    List<Notification> findByUserAndIsRead(User user, Boolean isRead);
    List<Notification> findByUserAndIsReadFalseAndDeletedAtIsNull(User user);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false AND n.deletedAt IS NULL")
    Long countUnreadNotifications(@Param("user") User user);
    
    // Notification types
    List<Notification> findByNotificationType(Notification.NotificationType notificationType);
    List<Notification> findByUserAndNotificationType(User user, Notification.NotificationType notificationType);
    
    // Priority notifications
    List<Notification> findByPriority(Notification.NotificationPriority priority);
    List<Notification> findByUserAndPriority(User user, Notification.NotificationPriority priority);
    
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.priority IN ('HIGH', 'URGENT') AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findHighPriorityNotifications(@Param("user") User user);
    
    // Related entity notifications
    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String entityType, Long entityId);
    List<Notification> findByUserAndRelatedEntityTypeAndRelatedEntityId(User user, String entityType, Long entityId);
    
    // Delivery tracking
    List<Notification> findByPushSent(Boolean pushSent);
    List<Notification> findByEmailSent(Boolean emailSent);
    List<Notification> findByPushSentFalseAndEmailSentFalse();
    
    @Query("SELECT n FROM Notification n WHERE n.pushSent = false AND n.deletedAt IS NULL")
    List<Notification> findUnsentPushNotifications();
    
    @Query("SELECT n FROM Notification n WHERE n.emailSent = false AND n.deletedAt IS NULL")
    List<Notification> findUnsentEmailNotifications();
    
    // Time-based queries
    List<Notification> findByCreatedAtAfter(LocalDateTime since);
    List<Notification> findByUserAndCreatedAtAfter(User user, LocalDateTime since);
    List<Notification> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Old notifications cleanup
    @Query("SELECT n FROM Notification n WHERE n.createdAt < :cutoffDate AND n.deletedAt IS NULL")
    List<Notification> findOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    @Query("SELECT n FROM Notification n WHERE n.isRead = true AND n.createdAt < :cutoffDate AND n.deletedAt IS NULL")
    List<Notification> findOldReadNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // User activity insights
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.createdAt >= :start AND n.createdAt < :end")
    Long countNotificationsByUserBetween(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT n.notificationType, COUNT(n) FROM Notification n WHERE n.user = :user AND n.deletedAt IS NULL GROUP BY n.notificationType")
    List<Object[]> getNotificationTypeDistributionByUser(@Param("user") User user);
    
    // System analytics
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.createdAt >= :todayStart")
    Long countNotificationsToday(@Param("todayStart") LocalDateTime todayStart);
    
    @Query("SELECT n.notificationType, COUNT(n) FROM Notification n WHERE n.deletedAt IS NULL GROUP BY n.notificationType ORDER BY COUNT(n) DESC")
    List<Object[]> getNotificationTypeStatistics();
    
    @Query("SELECT DATE(n.createdAt), COUNT(n) FROM Notification n WHERE n.createdAt >= :start GROUP BY DATE(n.createdAt)")
    List<Object[]> getNotificationVolumeByDay(@Param("start") LocalDateTime start);
    
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.createdAt < :before AND n.isRead = true AND n.deletedAt IS NULL")
    List<Notification> findOldReadNotificationsByUser(@Param("user") User user, @Param("before") LocalDateTime before);
    
    // Notification preferences validation
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.notificationType = :type AND n.createdAt >= :since")
    Long countRecentNotificationsByType(@Param("user") User user, @Param("type") Notification.NotificationType type, @Param("since") LocalDateTime since);
}