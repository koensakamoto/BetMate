package com.rivalpicks.controller;

import com.rivalpicks.dto.NotificationDTO;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.messaging.NotificationRepository;
import com.rivalpicks.service.notification.NotificationService;
import com.rivalpicks.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
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

    /**
     * Gets paginated notifications for the current user.
     */
    @GetMapping
    @Operation(summary = "Get user notifications",
               description = "Retrieves paginated notifications for the authenticated user")
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
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

        // Convert to DTOs to prevent circular reference
        List<NotificationDTO> dtos = notifications.getContent().stream()
            .map(NotificationDTO::new)
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(new PageImpl<>(dtos, pageable, notifications.getTotalElements()));
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

    // DTO for notification statistics
    public record NotificationStats(
        long totalNotifications,
        long unreadNotifications,
        long todayNotifications
    ) {}
}