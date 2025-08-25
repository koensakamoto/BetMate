package com.circlebet.util;

import com.circlebet.entity.user.User;
import com.circlebet.service.security.UserDetailsServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Utility class for centralized SecurityContext operations.
 * Provides consistent methods for getting/setting authentication across the application.
 */
@Slf4j
public final class SecurityContextUtil {

    // Private constructor to prevent instantiation
    private SecurityContextUtil() {
        throw new UnsupportedOperationException("SecurityContextUtil is a utility class and cannot be instantiated");
    }

    /**
     * Gets the currently authenticated user principal from the security context.
     * 
     * @return Optional containing UserPrincipal if authenticated, empty otherwise
     */
    public static Optional<UserDetailsServiceImpl.UserPrincipal> getCurrentUserPrincipal() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && 
                authentication.isAuthenticated() && 
                authentication.getPrincipal() instanceof UserDetailsServiceImpl.UserPrincipal) {
                
                UserDetailsServiceImpl.UserPrincipal userPrincipal = 
                    (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
                
                log.debug("Retrieved current user principal: {}", userPrincipal.getUsername());
                return Optional.of(userPrincipal);
            }
            
            log.debug("No authenticated user principal found in security context");
            return Optional.empty();
            
        } catch (Exception e) {
            log.warn("Error retrieving user principal from security context: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Gets the currently authenticated user from the security context.
     * 
     * @return Optional containing User if authenticated, empty otherwise
     */
    public static Optional<User> getCurrentUser() {
        return getCurrentUserPrincipal()
            .map(UserDetailsServiceImpl.UserPrincipal::getUser);
    }

    /**
     * Gets the currently authenticated user's ID from the security context.
     * 
     * @return Optional containing user ID if authenticated, empty otherwise
     */
    public static Optional<Long> getCurrentUserId() {
        return getCurrentUserPrincipal()
            .map(UserDetailsServiceImpl.UserPrincipal::getUserId);
    }

    /**
     * Gets the currently authenticated username from the security context.
     * 
     * @return Optional containing username if authenticated, empty otherwise
     */
    public static Optional<String> getCurrentUsername() {
        return getCurrentUserPrincipal()
            .map(UserDetailsServiceImpl.UserPrincipal::getUsername);
    }

    /**
     * Checks if there is currently an authenticated user in the security context.
     * 
     * @return true if user is authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        return getCurrentUserPrincipal().isPresent();
    }

    /**
     * Sets authentication in the security context.
     * 
     * @param userPrincipal the user principal to authenticate
     */
    public static void setAuthentication(UserDetailsServiceImpl.UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            log.warn("Attempted to set null user principal in security context");
            return;
        }

        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(
                userPrincipal, 
                null, 
                userPrincipal.getAuthorities()
            );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("Authentication set in SecurityContextHolder for user: {}", userPrincipal.getUsername());
    }

    /**
     * Sets authentication in the security context using an existing Authentication object.
     * 
     * @param authentication the authentication object to set
     */
    public static void setAuthentication(Authentication authentication) {
        if (authentication == null) {
            log.warn("Attempted to set null authentication in security context");
            return;
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String username = authentication.getName();
        log.debug("Authentication set in SecurityContextHolder for user: {}", username);
    }

    /**
     * Clears the current authentication from the security context.
     */
    public static void clearAuthentication() {
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        String username = currentAuth != null ? currentAuth.getName() : "unknown";
        
        SecurityContextHolder.clearContext();
        log.debug("Security context cleared for user: {}", username);
    }

    /**
     * Gets the current Authentication object from the security context.
     * 
     * @return Optional containing Authentication if present, empty otherwise
     */
    public static Optional<Authentication> getCurrentAuthentication() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return Optional.ofNullable(authentication);
        } catch (Exception e) {
            log.warn("Error retrieving authentication from security context: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Checks if the current user has a specific authority.
     * 
     * @param authority the authority to check
     * @return true if user has the authority, false otherwise
     */
    public static boolean hasAuthority(String authority) {
        return getCurrentAuthentication()
            .map(auth -> auth.getAuthorities().stream()
                .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals(authority)))
            .orElse(false);
    }

    /**
     * Checks if the current user has any of the specified authorities.
     * 
     * @param authorities the authorities to check
     * @return true if user has any of the authorities, false otherwise
     */
    public static boolean hasAnyAuthority(String... authorities) {
        if (authorities == null || authorities.length == 0) {
            return false;
        }

        return getCurrentAuthentication()
            .map(auth -> {
                for (String authority : authorities) {
                    if (auth.getAuthorities().stream()
                        .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals(authority))) {
                        return true;
                    }
                }
                return false;
            })
            .orElse(false);
    }
}