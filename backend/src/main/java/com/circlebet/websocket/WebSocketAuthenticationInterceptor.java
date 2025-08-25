package com.circlebet.websocket;

import com.circlebet.service.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * WebSocket authentication interceptor to validate JWT tokens for WebSocket connections.
 * Ensures that only authenticated users can establish WebSocket connections.
 */
@Component
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Autowired
    public WebSocketAuthenticationInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract Authorization header from WebSocket connection
            String authToken = accessor.getFirstNativeHeader("Authorization");
            
            if (authToken != null && authToken.startsWith("Bearer ")) {
                String token = authToken.substring(7);
                
                try {
                    String username = jwtService.extractUsername(token);
                    
                    if (username != null && !username.isEmpty()) {
                        // Create authentication object with basic authorities
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                            username, null, Collections.emptyList());
                        
                        // Set authentication in accessor for this WebSocket session
                        accessor.setUser(authentication);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } else {
                        throw new IllegalArgumentException("Invalid JWT token - no username found");
                    }
                } catch (Exception e) {
                    throw new IllegalArgumentException("Failed to authenticate WebSocket connection: " + e.getMessage());
                }
            } else {
                throw new IllegalArgumentException("No valid Authorization header found for WebSocket connection");
            }
        }
        
        return message;
    }
}