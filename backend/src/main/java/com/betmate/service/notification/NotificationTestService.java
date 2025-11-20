package com.betmate.service.notification;

import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationType;
import com.betmate.entity.messaging.Notification.NotificationPriority;
import com.betmate.entity.user.User;
import com.betmate.repository.messaging.NotificationRepository;
import com.betmate.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for creating test notifications during development.
 */
@Service
public class NotificationTestService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationTestService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates test notifications of all types for a user.
     */
    @Transactional
    public void testAllNotificationTypes(Long userId, String username) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;

        User user = userOpt.get();

        // Betting notifications
        createTestNotification(user, "🎯 Bet Won!", "You won 100 credits on 'Lakers vs Warriors'!",
                              NotificationType.BET_RESULT, NotificationPriority.HIGH, "/bets/123", 123L, "BET");

        createTestNotification(user, "🎲 New Bet Created", "John created a new bet in Basketball Fans group",
                              NotificationType.BET_CREATED, NotificationPriority.NORMAL, "/bets/124", 124L, "BET");

        // Social notifications
        createTestNotification(user, "👋 Friend Request", "Sarah wants to be your friend!",
                              NotificationType.FRIEND_REQUEST, NotificationPriority.NORMAL, "/friends/requests", 456L, "USER");

        createTestNotification(user, "Group Invitation", "Mike invited you to join Fantasy Football",
                              NotificationType.GROUP_INVITE, NotificationPriority.NORMAL, "/groups/789", 789L, "GROUP");

        // Achievement notifications
        createTestNotification(user, "Achievement Unlocked", "You've earned the 'Hot Streak' badge!",
                              NotificationType.ACHIEVEMENT_UNLOCKED, NotificationPriority.HIGH, "/achievements", null, null);

        createTestNotification(user, "📈 Level Up!", "Congratulations! You've reached level 5!",
                              NotificationType.ACHIEVEMENT_UNLOCKED, NotificationPriority.HIGH, "/profile", null, null);

        // Financial notifications
        createTestNotification(user, "Credits Received", "You received 50 credits as a daily bonus!",
                              NotificationType.CREDITS_RECEIVED, NotificationPriority.NORMAL, "/wallet", null, null);

        // Message notifications
        createTestNotification(user, "💬 Mentioned in Message", "Alex mentioned you in Basketball Fans",
                              NotificationType.MESSAGE, NotificationPriority.NORMAL, "/groups/789/messages", 999L, "MESSAGE");

        // System notifications
        createTestNotification(user, "System Update", "New features available! Check out the updated betting interface.",
                              NotificationType.SYSTEM_ANNOUNCEMENT, NotificationPriority.LOW, "/updates", null, null);
    }

    /**
     * Creates a test bet resolved notification.
     */
    @Transactional
    public void testBetResolvedNotification(List<Long> winnerIds, List<Long> loserIds) {
        for (Long winnerId : winnerIds) {
            Optional<User> user = userRepository.findById(winnerId);
            if (user.isPresent()) {
                createTestNotification(user.get(), "🎯 Bet Won!",
                                     "Congratulations! You won 50 credits on 'Test Bet'!",
                                     NotificationType.BET_RESULT, NotificationPriority.HIGH,
                                     "/bets/123", 123L, "BET");
            }
        }

        for (Long loserId : loserIds) {
            Optional<User> user = userRepository.findById(loserId);
            if (user.isPresent()) {
                createTestNotification(user.get(), "😞 Bet Lost",
                                     "Better luck next time! You lost 25 credits on 'Test Bet'.",
                                     NotificationType.BET_RESULT, NotificationPriority.NORMAL,
                                     "/bets/123", 123L, "BET");
            }
        }
    }

    /**
     * Creates a test bet created notification.
     */
    @Transactional
    public void testBetCreatedNotification(Long groupId, String groupName, Long creatorId, String creatorName) {
        // This would typically notify all group members, but for testing we'll just log
        System.out.println("Test bet created notification for group: " + groupName + " by " + creatorName);
    }

    /**
     * Creates a test friend request notification.
     */
    @Transactional
    public void testFriendRequestNotification(Long senderId, String senderName, Long receiverId) {
        Optional<User> receiver = userRepository.findById(receiverId);
        if (receiver.isPresent()) {
            createTestNotification(receiver.get(), "👋 Friend Request",
                                 senderName + " wants to be your friend!",
                                 NotificationType.FRIEND_REQUEST, NotificationPriority.NORMAL,
                                 "/friends/requests", senderId, "USER");
        }
    }

    /**
     * Creates a test group invitation notification.
     */
    @Transactional
    public void testGroupInvitationNotification(Long groupId, String groupName, Long inviterId, String inviterName, Long inviteeId) {
        Optional<User> invitee = userRepository.findById(inviteeId);
        if (invitee.isPresent()) {
            createTestNotification(invitee.get(), "Group Invitation",
                                 inviterName + " invited you to join " + groupName,
                                 NotificationType.GROUP_INVITE, NotificationPriority.NORMAL,
                                 "/groups/" + groupId, groupId, "GROUP");
        }
    }

    /**
     * Creates a test message mention notification.
     */
    @Transactional
    public void testMessageMentionNotification(Long senderId, String senderName, Long groupId, String groupName) {
        System.out.println("Test message mention notification from " + senderName + " in " + groupName);
    }

    /**
     * Helper method to create a test notification.
     */
    private void createTestNotification(User user, String title, String message,
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

        notificationRepository.save(notification);
    }
}