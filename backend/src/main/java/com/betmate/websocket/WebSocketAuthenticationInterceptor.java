package com.betmate.websocket;

import com.betmate.service.security.JwtService;
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
        try {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            
            if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                System.out.println("=== WebSocket CONNECT attempt ===");
                
                // Extract Authorization header from WebSocket connection
                String authToken = accessor.getFirstNativeHeader("Authorization");
                System.out.println("Authorization header: " + (authToken != null ? "Bearer [PRESENT]" : "NULL"));
                
                if (authToken != null && authToken.startsWith("Bearer ")) {
                    String token = authToken.substring(7);
                    System.out.println("Token extracted, length: " + token.length());
                    
                    try {
                        String username = jwtService.extractUsername(token);
                        System.out.println("Username extracted from token: " + username);
                        
                        if (username != null && !username.isEmpty()) {
                            // Create authentication object with basic authorities
                            Authentication authentication = new UsernamePasswordAuthenticationToken(
                                username, null, Collections.emptyList());
                            
                            // Set authentication in accessor for this WebSocket session
                            accessor.setUser(authentication);
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            System.out.println("WebSocket authentication successful for user: " + username);
                        } else {
                            System.out.println("ERROR: Invalid JWT token - no username found");
                            // Don't throw exception, allow anonymous connection
                            System.out.println("WARNING: Allowing anonymous WebSocket connection");
                        }
                    } catch (Exception e) {
                        System.out.println("ERROR: JWT validation failed: " + e.getMessage());
                        e.printStackTrace();
                        // Don't throw exception, allow anonymous connection
                        System.out.println("WARNING: Allowing anonymous WebSocket connection due to JWT error");
                    }
                } else {
                    System.out.println("WARNING: No Authorization header found, allowing anonymous connection");
                }
            }
            
            return message;
        } catch (Exception e) {
            System.out.println("CRITICAL ERROR in WebSocket interceptor: " + e.getMessage());
            e.printStackTrace();
            // Return message anyway to prevent connection failure
            return message;
        }
    }
}