package com.betmate.websocket;

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

    @Autowired
    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getUsernameFromSession(headerAccessor);
        
        if (username != null) {
            logger.info("User {} connected to WebSocket", username);
            
            // Broadcast user online status
            MessageWebSocketController.UserPresenceDto presence = new MessageWebSocketController.UserPresenceDto();
            presence.setUsername(username);
            presence.setStatus(MessageWebSocketController.UserPresenceDto.PresenceStatus.ONLINE);
            
            messagingTemplate.convertAndSend("/topic/presence", presence);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getUsernameFromSession(headerAccessor);
        
        if (username != null) {
            logger.info("User {} disconnected from WebSocket", username);
            
            // Broadcast user offline status
            MessageWebSocketController.UserPresenceDto presence = new MessageWebSocketController.UserPresenceDto();
            presence.setUsername(username);
            presence.setStatus(MessageWebSocketController.UserPresenceDto.PresenceStatus.OFFLINE);
            presence.setLastSeen(java.time.LocalDateTime.now().toString());
            
            messagingTemplate.convertAndSend("/topic/presence", presence);
        }
    }

    private String getUsernameFromSession(StompHeaderAccessor headerAccessor) {
        if (headerAccessor.getUser() != null) {
            return headerAccessor.getUser().getName();
        }
        return null;
    }
}