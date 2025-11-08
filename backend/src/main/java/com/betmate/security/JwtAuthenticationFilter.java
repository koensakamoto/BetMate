package com.betmate.security;

import com.betmate.service.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import com.betmate.exception.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.util.AntPathMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * JWT Authentication Filter that processes JWT tokens from requests.
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Public endpoints that don't require JWT authentication
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/change-password",
        "/api/auth/logout",
        // Note: /api/auth/me requires authentication and is NOT in this list
        "/api/users/register",
        "/api/users/availability/**",
        "/api/files/**",
        "/actuator/health",
        "/actuator/info",
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/error",
        "/ws/**"
    );

    @Autowired
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        log.info("JwtAuthenticationFilter initialized with {} public endpoints configured for skipping", 
                PUBLIC_ENDPOINTS.size());
        log.debug("Public endpoints: {}", PUBLIC_ENDPOINTS);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        log.debug("Processing JWT authentication for protected endpoint: {}", request.getRequestURI());
        
        try {
            // Extract JWT token from request
            final String jwt = extractJwtFromRequest(request);
            if (jwt == null) {
                log.warn("No JWT token found in Authorization header for protected endpoint: {}", request.getRequestURI());
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Access token is required", request.getRequestURI());
                return;
            }

            // Extract username from token
            final String username = jwtService.extractUsername(jwt);

            // If username is present and no authentication is set in SecurityContext
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Validate token and create authentication
                if (jwtService.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = createAuthenticationToken(userDetails, request);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("Successfully authenticated user: {} for request: {}", username, request.getRequestURI());
                } else {
                    log.warn("JWT token validation failed for user: {} on request: {}", username, request.getRequestURI());
                }
            }
        } catch (JwtException.ExpiredTokenException e) {
            log.warn("JWT token expired for request: {} - {}", request.getRequestURI(), e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "JWT token has expired", request.getRequestURI());
            return;
        } catch (JwtException.InvalidSignatureException e) {
            log.warn("JWT token has invalid signature for request: {} - {}", request.getRequestURI(), e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "JWT token signature is invalid", request.getRequestURI());
            return;
        } catch (JwtException.MalformedTokenException e) {
            log.warn("Malformed JWT token for request: {} - {}", request.getRequestURI(), e.getMessage());
            sendErrorResponse(response, HttpStatus.BAD_REQUEST, "JWT token is malformed", request.getRequestURI());
            return;
        } catch (UsernameNotFoundException e) {
            log.warn("User not found during JWT authentication for request: {} - {}", request.getRequestURI(), e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Authentication failed", request.getRequestURI());
            return;
        } catch (Exception e) {
            log.error("Unexpected error during JWT authentication for request: {} - {}", request.getRequestURI(), e.getMessage());
            sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, "Internal authentication error", request.getRequestURI());
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Determines if this filter should be skipped for the current request.
     * Skips JWT processing for public endpoints to improve performance.
     * 
     * @param request HTTP request
     * @return true if filter should be skipped, false otherwise
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestPath = request.getRequestURI();
        
        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream()
            .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
            
        if (isPublicEndpoint) {
            log.debug("Skipping JWT authentication for public endpoint: {}", requestPath);
        }
        
        return isPublicEndpoint;
    }

    /**
     * Extracts JWT token from the Authorization header.
     * @param request HTTP request
     * @return JWT token string or null if not present/invalid
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No valid Authorization header found for request: {}", request.getRequestURI());
            return null;
        }
        
        String token = authHeader.substring(7);
        log.debug("JWT token extracted from Authorization header for request: {}", request.getRequestURI());
        return token;
    }

    /**
     * Creates and configures an authentication token.
     * @param userDetails User details
     * @param request HTTP request for authentication details
     * @return Configured authentication token
     */
    private UsernamePasswordAuthenticationToken createAuthenticationToken(
            UserDetails userDetails, HttpServletRequest request) {
        
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        log.debug("Authentication token created for user: {}", userDetails.getUsername());
        return authToken;
    }

    /**
     * Sends an error response to the client with proper HTTP status and JSON body.
     * @param response HTTP response
     * @param status HTTP status code
     * @param message Error message
     * @param path Request path
     * @throws IOException if writing response fails
     */
    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, 
                                 String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        ErrorResponse errorResponse = new ErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            message,
            path,
            System.currentTimeMillis()
        );
        
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }

    /**
     * Error response DTO for JSON serialization.
     */
    public static class ErrorResponse {
        public final int status;
        public final String error;
        public final String message;
        public final String path;
        public final long timestamp;

        public ErrorResponse(int status, String error, String message, String path, long timestamp) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.path = path;
            this.timestamp = timestamp;
        }
    }
}