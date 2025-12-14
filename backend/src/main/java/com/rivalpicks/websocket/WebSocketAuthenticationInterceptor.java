package com.rivalpicks.websocket;

import com.rivalpicks.exception.JwtException;
import com.rivalpicks.service.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
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
 *
 * Security: Rejects connections without valid JWT tokens to prevent unauthorized access.
 */
@Slf4j
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

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        // Only validate authentication on CONNECT
        if (StompCommand.CONNECT.equals(command)) {
            String authToken = accessor.getFirstNativeHeader("Authorization");

            // Security: Require Authorization header for WebSocket connections
            if (authToken == null || !authToken.startsWith("Bearer ")) {
                log.warn("WebSocket connection rejected: Missing or invalid Authorization header");
                throw new MessageDeliveryException("Authentication required for WebSocket connection");
            }

            String token = authToken.substring(7);

            try {
                // Validate token is not expired
                if (jwtService.isTokenExpired(token)) {
                    log.warn("WebSocket connection rejected: JWT token has expired");
                    throw new MessageDeliveryException("JWT token has expired");
                }

                String username = jwtService.extractUsername(token);

                if (username == null || username.isEmpty()) {
                    log.warn("WebSocket connection rejected: Could not extract username from token");
                    throw new MessageDeliveryException("Invalid JWT token");
                }

                // Create authentication object
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                    username, null, Collections.emptyList());

                // Set authentication in accessor for this WebSocket session
                accessor.setUser(authentication);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("WebSocket connection authenticated for user: {}", username);

            } catch (JwtException e) {
                log.warn("WebSocket connection rejected: JWT validation failed - {}", e.getMessage());
                throw new MessageDeliveryException("Invalid JWT token: " + e.getMessage());
            } catch (MessageDeliveryException e) {
                // Re-throw MessageDeliveryException as-is
                throw e;
            } catch (Exception e) {
                log.error("WebSocket connection rejected: Unexpected error during authentication", e);
                throw new MessageDeliveryException("Authentication failed");
            }
        }

        return message;
    }
}