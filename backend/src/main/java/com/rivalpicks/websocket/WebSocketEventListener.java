package com.rivalpicks.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket event listener to handle connection and disconnection events.
 * Manages user presence and cleanup when users connect/disconnect.
 */
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessageSendingOperations messagingTemplate;
    private final WebSocketSessionRegistry sessionRegistry;

    @Autowired
    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate,
                                  WebSocketSessionRegistry sessionRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.sessionRegistry = sessionRegistry;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getUsernameFromSession(headerAccessor);
        String sessionId = headerAccessor.getSessionId();

        if (username != null && sessionId != null) {
            // Register user session in the registry
            sessionRegistry.userConnected(username, sessionId);

            logger.info("User {} connected to WebSocket (session: {})", username, sessionId);

            // Broadcast user online status
            MessageWebSocketController.UserPresenceDto presence = new MessageWebSocketController.UserPresenceDto();
            presence.setUsername(username);
            presence.setStatus(MessageWebSocketController.UserPresenceDto.PresenceStatus.ONLINE);

            messagingTemplate.convertAndSend("/topic/presence", presence);

            // TEST: Send a test notification directly to the topic (bypassing user destination)
            new Thread(() -> {
                try {
                    Thread.sleep(2000); // Wait 2 seconds for subscription to be ready
                    String testDestination = "/topic/test-notifications-" + username;
                    logger.info(">>> TEST: Sending welcome notification to '{}' via {}", username, testDestination);
                    messagingTemplate.convertAndSend(
                        testDestination,
                        java.util.Map.of(
                            "id", 99999,
                            "type", "TEST",
                            "title", "Welcome!",
                            "content", "WebSocket notification test - if you see this, notifications work!",
                            "read", false,
                            "createdAt", java.time.Instant.now().toString()
                        )
                    );
                    logger.info(">>> TEST: Welcome notification sent to '{}' via topic", username);
                } catch (Exception e) {
                    logger.error(">>> TEST: Failed to send welcome notification: {}", e.getMessage());
                }
            }).start();
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getUsernameFromSession(headerAccessor);
        String sessionId = headerAccessor.getSessionId();

        if (username != null && sessionId != null) {
            // Unregister user session from the registry
            sessionRegistry.userDisconnected(username, sessionId);

            logger.info("User {} disconnected from WebSocket (session: {})", username, sessionId);

            // Only broadcast offline status if user has no remaining sessions
            if (!sessionRegistry.isOnline(username)) {
                MessageWebSocketController.UserPresenceDto presence = new MessageWebSocketController.UserPresenceDto();
                presence.setUsername(username);
                presence.setStatus(MessageWebSocketController.UserPresenceDto.PresenceStatus.OFFLINE);
                presence.setLastSeen(java.time.LocalDateTime.now().toString());

                messagingTemplate.convertAndSend("/topic/presence", presence);
            }
        }
    }

    private String getUsernameFromSession(StompHeaderAccessor headerAccessor) {
        if (headerAccessor.getUser() != null) {
            return headerAccessor.getUser().getName();
        }
        return null;
    }
}