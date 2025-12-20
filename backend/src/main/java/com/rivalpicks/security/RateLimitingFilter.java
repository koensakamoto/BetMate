package com.rivalpicks.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rivalpicks.config.RateLimitConfig;
import com.rivalpicks.service.security.RateLimitingService;
import com.rivalpicks.service.security.RateLimitingService.RateLimitResult;
import com.rivalpicks.service.security.RateLimitingService.RateLimitType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitConfig.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        RateLimitType type = determineRateLimitType(path, method);
        if (type == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Determine the rate limit key based on type
        String key = getRateLimitKey(request, type);
        if (key == null) {
            // For DEFAULT type, if no user is authenticated, skip rate limiting
            // (JWT filter will handle auth, or it's a public endpoint)
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitResult result = rateLimitingService.tryConsume(key, type);

        // Add rate limit headers
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remainingTokens()));

        if (!result.allowed()) {
            log.warn("Rate limit exceeded for key: {} on endpoint: {}", key, path);
            response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds()));
            sendErrorResponse(response, result.retryAfterSeconds());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitType determineRateLimitType(String path, String method) {
        // Sensitive endpoints - only POST requests
        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals("/api/auth/login") ||
                path.equals("/api/auth/google") ||
                path.equals("/api/auth/apple")) {
                return RateLimitType.LOGIN;
            }

            if (path.equals("/api/users/register")) {
                return RateLimitType.REGISTER;
            }

            if (path.equals("/api/auth/forgot-password")) {
                return RateLimitType.FORGOT_PASSWORD;
            }

            if (path.equals("/api/auth/reset-password")) {
                return RateLimitType.RESET_PASSWORD;
            }

            // File upload endpoints
            if (path.equals("/api/users/profile-picture") ||
                path.matches("/api/groups/[^/]+/picture") ||
                path.matches("/api/bets/[^/]+/fulfillment/upload-proof")) {
                return RateLimitType.FILE_UPLOAD;
            }
        }

        // Default rate limiting for all /api/** endpoints (any method)
        if (path.startsWith("/api/")) {
            return RateLimitType.DEFAULT;
        }

        return null;
    }

    private String getRateLimitKey(HttpServletRequest request, RateLimitType type) {
        if (type == RateLimitType.DEFAULT) {
            // For authenticated endpoints, use userId
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return "user:" + auth.getName();
            }
            // Not authenticated - skip rate limiting (auth will be handled by JWT filter)
            return null;
        }

        // For sensitive endpoints (login, register, etc.), use IP address
        return "ip:" + getClientIp(request);
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for forwarded headers (when behind a proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in the chain (original client)
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    private void sendErrorResponse(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("status", 429);
        errorBody.put("error", "Too Many Requests");
        errorBody.put("message", String.format("Rate limit exceeded. Try again in %d seconds.", retryAfterSeconds));
        errorBody.put("retryAfter", retryAfterSeconds);

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
