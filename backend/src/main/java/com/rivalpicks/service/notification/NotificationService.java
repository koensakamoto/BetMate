package com.rivalpicks.service.notification;

import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.messaging.NotificationRepository;
import com.rivalpicks.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing notifications.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, @Lazy PushNotificationService pushNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    /**
     * Gets paginated notifications for a user.
     */
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    /**
     * Gets unread notifications for a user.
     */
    public Page<Notification> getUnreadNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findUnreadByUserId(userId, pageable);
    }

    /**
     * Gets count of unread notifications for a user.
 */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    /**
     * Marks a notification as read.
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);
        if (notification.isPresent() && notification.get().getUser().getId().equals(userId)) {
            notification.get().markAsRead();
            notificationRepository.save(notification.get());
        }
    }

    /**
     * Marks all notifications as read for a user.
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseAndDeletedAtIsNull(user.get());
            notifications.forEach(Notification::markAsRead);
            notificationRepository.saveAll(notifications);
        }
    }

    /**
     * Creates a test notification for development purposes.
     */
    @Transactional
    public void createTestNotification(Long userId, String message) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            Notification notification = new Notification();
            notification.setUser(user.get());
            notification.setTitle("🧪 Test Notification");
            notification.setMessage(message);
            notification.setNotificationType(NotificationType.SYSTEM_ANNOUNCEMENT);
            notification.setPriority(NotificationPriority.NORMAL);

            notificationRepository.save(notification);
        }
    }

    /**
     * Creates a notification for a user.
     */
    @Transactional
    public Notification createNotification(User user, String title, String message,
                                         NotificationType type, NotificationPriority priority,
                                         String actionUrl, Long relatedEntityId, String relatedEntityType) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setPriority(priority);
        notification.setActionUrl(actionUrl);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);

        return notificationRepository.save(notification);
    }

    /**
     * Creates a friend request notification.
     */
    @Transactional
    public void createFriendRequestNotification(User requester, User accepter, Long friendshipId) {
        try {
            Notification notification = createNotification(
                accepter,
                "👋 New Friend Request",
                requester.getDisplayName() + " wants to be your friend!",
                NotificationType.FRIEND_REQUEST,
                NotificationPriority.NORMAL,
                "/friends/requests",
                friendshipId,
                "FRIENDSHIP"
            );

            // Send push notification
            pushNotificationService.sendPushNotification(accepter, notification);
        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * Creates a notification when a friend request is accepted.
     */
    @Transactional
    public void createFriendRequestAcceptedNotification(User accepter, User requester) {
        try {
            Notification notification = createNotification(
                requester,
                "Friend Request Accepted",
                accepter.getDisplayName() + " accepted your friend request!",
                NotificationType.FRIEND_ACCEPTED,
                NotificationPriority.NORMAL,
                "/friends",
                accepter.getId(),
                "USER"
            );

            // Send push notification
            pushNotificationService.sendPushNotification(requester, notification);
        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * Deletes friend request notifications for a specific friendship.
     */
    @Transactional
    public void deleteFriendRequestNotification(Long friendshipId) {
        try {
            List<Notification> notifications = notificationRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndNotificationType(
                    friendshipId, "FRIENDSHIP", NotificationType.FRIEND_REQUEST);

            if (!notifications.isEmpty()) {
                notificationRepository.deleteAll(notifications);
            }
        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * Deletes group join request notifications for a specific membership request.
     * This is called when a join request is approved or denied to remove the notification
     * from all admins/officers who received it.
     */
    @Transactional
    public void deleteGroupJoinRequestNotification(Long membershipId) {
        try {
            List<Notification> notifications = notificationRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndNotificationType(
                    membershipId, "GROUP_MEMBERSHIP", NotificationType.GROUP_JOIN_REQUEST);

            if (!notifications.isEmpty()) {
                notificationRepository.deleteAll(notifications);
            }
        } catch (Exception e) {
            throw e;
        }
    }
}