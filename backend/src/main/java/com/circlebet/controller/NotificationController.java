package com.circlebet.controller;

import com.circlebet.entity.messaging.Notification;
import com.circlebet.entity.messaging.Notification.NotificationType;
import com.circlebet.entity.messaging.Notification.NotificationPriority;
import com.circlebet.entity.user.User;
import com.circlebet.repository.messaging.NotificationRepository;
import com.circlebet.service.notification.NotificationService;
import com.circlebet.service.notification.NotificationTestService;
import com.circlebet.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Notification management and retrieval")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationTestService notificationTestService;

    /**
     * Gets paginated notifications for the current user.
     */
    @GetMapping
    @Operation(summary = "Get user notifications",
               description = "Retrieves paginated notifications for the authenticated user")
    public ResponseEntity<Page<Notification>> getUserNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationRepository.findUnreadByUserId(user.getId(), pageable);
        } else {
            notifications = notificationRepository.findByUserId(user.getId(), pageable);
        }

        return ResponseEntity.ok(notifications);
    }

    /**
     * Gets the count of unread notifications for the current user.
     */
    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count",
               description = "Returns the number of unread notifications for the authenticated user")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        long unreadCount = notificationService.getUnreadCount(user.getId());

        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    /**
     * Marks a specific notification as read.
     */
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read",
               description = "Marks a specific notification as read for the authenticated user")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.markAsRead(notificationId, user.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * Marks all notifications as read for the current user.
     */
    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read",
               description = "Marks all notifications as read for the authenticated user")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.markAllAsRead(user.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * Creates a test notification for the current user (for development/testing).
     */
    @PostMapping("/test")
    @Operation(summary = "Create test notification",
               description = "Creates a test notification for the authenticated user (development only)")
    public ResponseEntity<Map<String, String>> createTestNotification(
            Authentication authentication,
            @RequestParam(defaultValue = "This is a test notification") String message) {

        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.createTestNotification(user.getId(), message);

        return ResponseEntity.ok(Map.of("message", "Test notification created successfully"));
    }

    /**
     * Gets notification statistics for the current user.
     */
    @GetMapping("/stats")
    @Operation(summary = "Get notification statistics",
               description = "Returns notification statistics for the authenticated user")
    public ResponseEntity<NotificationStats> getNotificationStats(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        long totalNotifications = notificationRepository.countByUserId(user.getId());
        long unreadNotifications = notificationRepository.countUnreadByUserId(user.getId());
        long todayNotifications = notificationRepository.countTodayNotificationsByUserId(user.getId(), LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0));

        NotificationStats stats = new NotificationStats(
            totalNotifications,
            unreadNotifications,
            todayNotifications
        );

        return ResponseEntity.ok(stats);
    }

    /**
     * Tests all notification types for the current user (development only).
     */
    @PostMapping("/test-all")
    @Operation(summary = "Test all notification types",
               description = "Creates test notifications of all types for the authenticated user (development only)")
    public ResponseEntity<Map<String, String>> testAllNotifications(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        notificationTestService.testAllNotificationTypes(user.getId(), user.getUsername());

        return ResponseEntity.ok(Map.of("message", "All test notifications created successfully"));
    }

    /**
     * Tests bet notifications for the current user (development only).
     */
    @PostMapping("/test-bet")
    @Operation(summary = "Test bet notifications",
               description = "Creates test bet notifications for the authenticated user (development only)")
    public ResponseEntity<Map<String, String>> testBetNotifications(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Test bet created
        notificationTestService.testBetCreatedNotification(123L, "Test Group", 456L, "Creator User");

        // Test bet resolved (user wins)
        notificationTestService.testBetResolvedNotification(List.of(user.getId()), List.of(456L));

        return ResponseEntity.ok(Map.of("message", "Bet test notifications created successfully"));
    }

    /**
     * Tests social notifications for the current user (development only).
     */
    @PostMapping("/test-social")
    @Operation(summary = "Test social notifications",
               description = "Creates test social notifications for the authenticated user (development only)")
    public ResponseEntity<Map<String, String>> testSocialNotifications(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Test friend request
        notificationTestService.testFriendRequestNotification(456L, "Friend User", user.getId());

        // Test group invitation
        notificationTestService.testGroupInvitationNotification(123L, "Test Group", 456L, "Inviter User", user.getId());

        return ResponseEntity.ok(Map.of("message", "Social test notifications created successfully"));
    }

    /**
     * Tests message notifications for the current user (development only).
     */
    @PostMapping("/test-message")
    @Operation(summary = "Test message notifications",
               description = "Creates test message notifications for the authenticated user (development only)")
    public ResponseEntity<Map<String, String>> testMessageNotifications(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Test message mention
        notificationTestService.testMessageMentionNotification(456L, "Message Sender", 123L, "Test Group");

        return ResponseEntity.ok(Map.of("message", "Message test notifications created successfully"));
    }

    // DTO for notification statistics
    public record NotificationStats(
        long totalNotifications,
        long unreadNotifications,
        long todayNotifications
    ) {}
}