package com.rivalpicks.controller;

import com.rivalpicks.dto.presence.PresenceInfo;
import com.rivalpicks.dto.presence.PresenceUpdateRequest;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.presence.PresenceService;
import com.rivalpicks.service.user.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for managing user presence state.
 * Mobile clients call these endpoints to report app state and send heartbeats.
 */
@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private static final Logger logger = LoggerFactory.getLogger(PresenceController.class);

    private final PresenceService presenceService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public PresenceController(PresenceService presenceService, UserService userService,
                              SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Updates the user's app state.
     * Called when the app transitions between foreground/background/inactive.
     *
     * @param request the presence update request
     * @param userDetails the authenticated user
     * @return success response
     */
    @PostMapping("/state")
    public ResponseEntity<Map<String, String>> updateState(
            @Valid @RequestBody PresenceUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        presenceService.updatePresence(
                user.getId(),
                request.getState(),
                request.getScreen(),
                request.getChatId()
        );

        logger.debug("User {} updated state to: {}", user.getId(), request.getState());

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /**
     * Heartbeat endpoint to keep presence alive and update context.
     * Should be called every 30 seconds while app is active.
     *
     * @param request the presence update request with current context
     * @param userDetails the authenticated user
     * @return success response
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, String>> heartbeat(
            @Valid @RequestBody PresenceUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        presenceService.updatePresence(
                user.getId(),
                request.getState(),
                request.getScreen(),
                request.getChatId()
        );

        logger.trace("Heartbeat from user {}: screen={}, chatId={}",
                user.getId(), request.getScreen(), request.getChatId());

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /**
     * Gets the current presence info for the authenticated user.
     * Useful for debugging.
     *
     * @param userDetails the authenticated user
     * @return the presence info
     */
    @GetMapping("/me")
    public ResponseEntity<PresenceInfo> getMyPresence(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        PresenceInfo presence = presenceService.getPresence(user.getId());

        if (presence == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(presence);
    }

    /**
     * TEST ENDPOINT: Send a test notification to the current user via WebSocket.
     * Used to verify the notification subscription works.
     */
    @PostMapping("/test-notification")
    public ResponseEntity<Map<String, String>> testNotification(
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails.getUsername();

        Map<String, Object> testPayload = Map.of(
            "id", 99999,
            "type", "TEST",
            "title", "Test Notification",
            "content", "This is a test notification sent at " + System.currentTimeMillis(),
            "read", false,
            "createdAt", java.time.Instant.now().toString()
        );

        logger.info(">>> TEST: Sending test notification to user '{}' via /user/{}/queue/notifications",
                   username, username);

        messagingTemplate.convertAndSendToUser(
            username,
            "/queue/notifications",
            testPayload
        );

        logger.info(">>> TEST: Notification sent successfully to '{}'", username);

        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "message", "Test notification sent to " + username
        ));
    }
}
