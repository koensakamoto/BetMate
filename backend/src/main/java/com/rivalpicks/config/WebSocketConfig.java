package com.rivalpicks.config;

import com.rivalpicks.websocket.WebSocketAuthenticationInterceptor;
import com.rivalpicks.websocket.WebSocketRateLimitInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time messaging.
 * Configures STOMP over WebSocket for group chat functionality.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthenticationInterceptor authenticationInterceptor;
    private final WebSocketRateLimitInterceptor rateLimitInterceptor;

    @Autowired
    public WebSocketConfig(WebSocketAuthenticationInterceptor authenticationInterceptor,
                          WebSocketRateLimitInterceptor rateLimitInterceptor) {
        this.authenticationInterceptor = authenticationInterceptor;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker for subscriptions and broadcasts
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Set application destination prefix for messages that are bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix for targeted messages to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint for WebSocket connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // Configure for your frontend domain in production
                // Remove SockJS for now to use pure WebSocket
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add interceptors for WebSocket connections
        // Order matters: authentication first, then rate limiting
        registration.interceptors(authenticationInterceptor, rateLimitInterceptor);
    }
}