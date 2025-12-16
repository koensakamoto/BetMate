package com.rivalpicks.service.notification;

import com.rivalpicks.dto.presence.PresenceInfo;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.messaging.NotificationRepository;
import com.rivalpicks.repository.user.UserRepository;
import com.rivalpicks.service.messaging.MessageNotificationService;
import com.rivalpicks.service.presence.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing notifications.
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;
    private final PresenceService presenceService;
    private final MessageNotificationService messageNotificationService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               @Lazy PushNotificationService pushNotificationService,
                               PresenceService presenceService,
                               @Lazy MessageNotificationService messageNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
        this.presenceService = presenceService;
        this.messageNotificationService = messageNotificationService;
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

            // Send via WebSocket if online, otherwise push notification
            sendNotificationToUser(accepter, notification);
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

            // Send via WebSocket if online, otherwise push notification
            sendNotificationToUser(requester, notification);
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

    /**
     * Sends a notification to a user via the appropriate channel.
     * Uses Redis-backed presence to determine delivery method:
     * - User offline/background → Push notification (FCM)
     * - User active + viewing related chat → Skip (they see it already)
     * - User active + elsewhere → WebSocket (in-app notification)
     *
     * @param user the user to send the notification to
     * @param notification the notification to send
     */
    public void sendNotificationToUser(User user, Notification notification) {
        Long userId = user.getId();
        PresenceInfo presence = presenceService.getPresence(userId);

        // User is offline or in background → send push notification
        if (presence == null || !presence.isActive()) {
            logger.debug("User {} is offline/background, sending push notification", userId);
            pushNotificationService.sendPushNotification(user, notification);
            return;
        }

        // User is active - check if they're viewing the related screen
        if (isViewingRelatedScreen(presence, notification)) {
            logger.debug("User {} is viewing related screen, skipping notification", userId);
            return;
        }

        // User is active but not viewing related content → send via WebSocket
        logger.debug("User {} is active, sending notification via WebSocket", userId);
        messageNotificationService.sendNotificationToUser(userId, notification);
    }

    /**
     * Checks if the user is currently viewing a screen related to the notification.
     * Currently only suppresses notifications for group chats when viewing that chat.
     *
     * @param presence the user's current presence info
     * @param notification the notification being sent
     * @return true if notification should be suppressed
     */
    private boolean isViewingRelatedScreen(PresenceInfo presence, Notification notification) {
        // Only suppress for group-related notifications when viewing that specific chat
        if ("chat".equals(presence.getScreen()) && presence.getChatId() != null) {
            // Check if notification is for a group message in the chat they're viewing
            if ("GROUP".equals(notification.getRelatedEntityType()) ||
                "GROUP_MESSAGE".equals(notification.getRelatedEntityType())) {
                return presence.getChatId().equals(notification.getRelatedEntityId());
            }
        }
        return false;
    }

    /**
     * Checks if a user is currently active (app in foreground).
     *
     * @param userId the user's ID
     * @return true if the user is active
     */
    public boolean isUserActive(Long userId) {
        return presenceService.isActive(userId);
    }
}