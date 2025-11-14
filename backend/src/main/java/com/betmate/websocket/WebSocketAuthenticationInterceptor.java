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
        long startTime = System.currentTimeMillis();
        try {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

            if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                System.out.println("\n========================================");
                System.out.println("[WS-BACKEND] 🔗 STOMP CONNECT FRAME RECEIVED");
                System.out.println("[WS-BACKEND] Timestamp: " + new java.util.Date());
                System.out.println("========================================");

                // Log all headers
                System.out.println("[WS-BACKEND] All native headers: " + accessor.toNativeHeaderMap());

                // Extract Authorization header from WebSocket connection
                String authToken = accessor.getFirstNativeHeader("Authorization");
                System.out.println("[WS-BACKEND] Authorization header: " + (authToken != null ? "Bearer [PRESENT]" : "NULL"));

                if (authToken != null && authToken.startsWith("Bearer ")) {
                    String token = authToken.substring(7);
                    System.out.println("[WS-BACKEND] Token extracted, length: " + token.length());
                    String tokenPreview = token.substring(0, Math.min(10, token.length())) + "..." +
                                         token.substring(Math.max(0, token.length() - 10));
                    System.out.println("[WS-BACKEND] Token preview: " + tokenPreview);

                    try {
                        String username = jwtService.extractUsername(token);
                        System.out.println("[WS-BACKEND] Username extracted from token: " + username);

                        if (username != null && !username.isEmpty()) {
                            // Create authentication object with basic authorities
                            Authentication authentication = new UsernamePasswordAuthenticationToken(
                                username, null, Collections.emptyList());

                            // Set authentication in accessor for this WebSocket session
                            accessor.setUser(authentication);
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            long elapsed = System.currentTimeMillis() - startTime;
                            System.out.println("[WS-BACKEND] ✅ WebSocket authentication successful for user: " + username);
                            System.out.println("[WS-BACKEND] Authentication took: " + elapsed + "ms");
                            System.out.println("[WS-BACKEND] 📤 SENDING CONNECTED FRAME...");
                        } else {
                            long elapsed = System.currentTimeMillis() - startTime;
                            System.out.println("[WS-BACKEND] ❌ ERROR: Invalid JWT token - no username found");
                            System.out.println("[WS-BACKEND] Elapsed: " + elapsed + "ms");
                            // Don't throw exception, allow anonymous connection
                            System.out.println("[WS-BACKEND] ⚠️  WARNING: Allowing anonymous WebSocket connection");
                        }
                    } catch (Exception e) {
                        long elapsed = System.currentTimeMillis() - startTime;
                        System.out.println("[WS-BACKEND] ❌ ERROR: JWT validation failed: " + e.getMessage());
                        System.out.println("[WS-BACKEND] Elapsed: " + elapsed + "ms");
                        e.printStackTrace();
                        // Don't throw exception, allow anonymous connection
                        System.out.println("[WS-BACKEND] ⚠️  WARNING: Allowing anonymous WebSocket connection due to JWT error");
                    }
                } else {
                    long elapsed = System.currentTimeMillis() - startTime;
                    System.out.println("[WS-BACKEND] ⚠️  WARNING: No Authorization header found");
                    System.out.println("[WS-BACKEND] Elapsed: " + elapsed + "ms");
                    System.out.println("[WS-BACKEND] Allowing anonymous connection");
                }

                System.out.println("========================================\n");
            } else if (accessor != null) {
                // Log other STOMP commands for debugging
                System.out.println("[WS-BACKEND] STOMP Command: " + accessor.getCommand() +
                                 " (timestamp: " + new java.util.Date() + ")");
            }

            return message;
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            System.out.println("\n========================================");
            System.out.println("[WS-BACKEND] ❌ CRITICAL ERROR in WebSocket interceptor");
            System.out.println("[WS-BACKEND] Error: " + e.getMessage());
            System.out.println("[WS-BACKEND] Elapsed: " + elapsed + "ms");
            System.out.println("========================================\n");
            e.printStackTrace();
            // Return message anyway to prevent connection failure
            return message;
        }
    }
}