package com.rivalpicks.websocket;

import com.rivalpicks.config.RateLimitConfig;
import com.rivalpicks.service.security.RateLimitingService;
import com.rivalpicks.service.security.RateLimitingService.RateLimitResult;
import com.rivalpicks.service.security.RateLimitingService.RateLimitType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket rate limiting interceptor.
 * Applies rate limits to WebSocket connections and messages.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketRateLimitInterceptor implements ChannelInterceptor {

    private final RateLimitingService rateLimitingService;
    private final RateLimitConfig rateLimitConfig;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        if (!rateLimitConfig.isEnabled()) {
            return message;
        }

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        switch (command) {
            case CONNECT -> handleConnectRateLimit(accessor);
            case SEND -> handleMessageRateLimit(accessor);
            default -> { /* No rate limiting for other commands */ }
        }

        return message;
    }

    private void handleConnectRateLimit(StompHeaderAccessor accessor) {
        // For connections, rate limit by session ID (before auth is established)
        // We use the native headers to get the IP if available, otherwise session ID
        String sessionId = accessor.getSessionId();
        String key = "ws_connect:session:" + sessionId;

        RateLimitResult result = rateLimitingService.tryConsume(key, RateLimitType.WEBSOCKET_CONNECT);

        if (!result.allowed()) {
            log.warn("WebSocket connection rate limit exceeded for session: {}", sessionId);
            throw new MessageDeliveryException(
                String.format("Connection rate limit exceeded. Try again in %d seconds.", result.retryAfterSeconds())
            );
        }
    }

    private void handleMessageRateLimit(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            // User not authenticated - this shouldn't happen as auth interceptor runs first
            return;
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        // Only rate limit message sending endpoints
        if (destination.startsWith("/app/group/") && destination.endsWith("/send")) {
            String username = principal.getName();
            String key = "ws_message:user:" + username;

            RateLimitResult result = rateLimitingService.tryConsume(key, RateLimitType.WEBSOCKET_MESSAGE);

            if (!result.allowed()) {
                log.warn("WebSocket message rate limit exceeded for user: {} on destination: {}", username, destination);
                throw new MessageDeliveryException(
                    String.format("Message rate limit exceeded. Try again in %d seconds.", result.retryAfterSeconds())
                );
            }

            log.debug("WebSocket message allowed for user: {}, remaining: {}", username, result.remainingTokens());
        }
    }
}
