package com.circlebet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/notifications")
public class SimpleNotificationController {

    /**
     * Simple test endpoint that returns empty data to unblock frontend
     */
    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        // Return empty page structure
        return ResponseEntity.ok(Map.of(
            "content", Collections.emptyList(),
            "totalElements", 0,
            "totalPages", 0,
            "size", size,
            "number", page,
            "numberOfElements", 0,
            "first", true,
            "last", true,
            "empty", true
        ));
    }

    /**
     * Simple unread count endpoint
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("unreadCount", 0L));
    }

    /**
     * Simple stats endpoint
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getNotificationStats() {
        return ResponseEntity.ok(Map.of(
            "totalNotifications", 0L,
            "unreadNotifications", 0L,
            "todayNotifications", 0L
        ));
    }

    /**
     * Simple mark as read endpoint
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        // Just return OK for now
        return ResponseEntity.ok().build();
    }

    /**
     * Simple mark all as read endpoint
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        // Just return OK for now
        return ResponseEntity.ok().build();
    }

    /**
     * Simple test notification endpoint
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> createTestNotification(
            @RequestParam(defaultValue = "This is a test notification") String message) {
        return ResponseEntity.ok(Map.of("message", "Test notification created successfully"));
    }
}