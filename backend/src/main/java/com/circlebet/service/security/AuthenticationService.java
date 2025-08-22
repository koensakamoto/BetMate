package com.circlebet.service.security;

import com.circlebet.entity.user.User;
import com.circlebet.service.user.UserService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service dedicated to authentication and security operations.
 * Handles login, password management, account locking, and security validations.
 */
@Service
@Validated
@Transactional
public class AuthenticationService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    
    // Security configuration
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    @Autowired
    public AuthenticationService(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Authenticates a user with username/email and password.
     */
    public AuthenticationResult authenticate(@NotBlank String usernameOrEmail, @NotBlank String password) {
        Optional<User> userOpt = findUserForAuthentication(usernameOrEmail);
        
        if (userOpt.isEmpty()) {
            return AuthenticationResult.failed("Invalid credentials");
        }
        
        User user = userOpt.get();
        
        // Check account status
        if (user.isAccountLocked()) {
            return AuthenticationResult.failed("Account is temporarily locked");
        }
        
        if (!user.isActiveUser()) {
            return AuthenticationResult.failed("Account is inactive or deleted");
        }
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleFailedLogin(user);
            return AuthenticationResult.failed("Invalid credentials");
        }
        
        handleSuccessfulLogin(user);
        return AuthenticationResult.success(user);
    }

    /**
     * Changes a user's password.
     */
    public void changePassword(@NotNull Long userId, @NotBlank String currentPassword, @NotBlank String newPassword) {
        User user = userService.getUserById(userId);
        
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new InvalidPasswordException("Current password is incorrect");
        }
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userService.saveUser(user);
    }

    /**
     * Resets password (for admin or forgot password flow).
     */
    public void resetPassword(@NotNull Long userId, @NotBlank String newPassword) {
        User user = userService.getUserById(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userService.saveUser(user);
    }

    /**
     * Verifies user's email address.
     */
    public void verifyEmail(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        user.setEmailVerified(true);
        userService.saveUser(user);
    }

    /**
     * Unlocks a user account manually (admin action).
     */
    public void unlockAccount(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userService.saveUser(user);
    }

    /**
     * Checks if a user account is locked.
     */
    @Transactional(readOnly = true)
    public boolean isAccountLocked(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return user.isAccountLocked();
    }

    private Optional<User> findUserForAuthentication(String usernameOrEmail) {
        Optional<User> user = userService.getUserByUsername(usernameOrEmail);
        if (user.isEmpty()) {
            user = userService.getUserByEmail(usernameOrEmail);
        }
        return user;
    }

    private void handleFailedLogin(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        
        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
        }
        
        userService.saveUser(user);
    }

    private void handleSuccessfulLogin(User user) {
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userService.saveUser(user);
    }

    // Result object for authentication attempts
    public static class AuthenticationResult {
        private final boolean successful;
        private final String errorMessage;
        private final User user;

        private AuthenticationResult(boolean successful, String errorMessage, User user) {
            this.successful = successful;
            this.errorMessage = errorMessage;
            this.user = user;
        }

        public static AuthenticationResult success(User user) {
            return new AuthenticationResult(true, null, user);
        }

        public static AuthenticationResult failed(String errorMessage) {
            return new AuthenticationResult(false, errorMessage, null);
        }

        public boolean isSuccessful() { return successful; }
        public String getErrorMessage() { return errorMessage; }
        public User getUser() { return user; }
    }

    public static class InvalidPasswordException extends RuntimeException {
        public InvalidPasswordException(String message) {
            super(message);
        }
    }
}