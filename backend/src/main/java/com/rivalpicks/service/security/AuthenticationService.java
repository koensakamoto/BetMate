package com.rivalpicks.service.security;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.AuthenticationException;
import com.rivalpicks.service.user.DailyLoginRewardService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.validation.InputValidator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);
    
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final InputValidator inputValidator;
    private final DailyLoginRewardService dailyLoginRewardService;

    // Configurable security settings
    @Value("${security.auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.auth.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    @Autowired
    public AuthenticationService(UserService userService, PasswordEncoder passwordEncoder,
                                 InputValidator inputValidator, DailyLoginRewardService dailyLoginRewardService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.inputValidator = inputValidator;
        this.dailyLoginRewardService = dailyLoginRewardService;
    }

    /**
     * Authenticates a user with username/email and password.
     * @throws AuthenticationException.InvalidCredentialsException when user not found or password invalid
     * @throws AuthenticationException.AccountLockedException when account is locked
     * @throws AuthenticationException.InactiveAccountException when account is inactive
     */
    public AuthenticationResult authenticate(@NotBlank String usernameOrEmail, @NotBlank String password) {
        log.debug("Authentication attempt for: {}", usernameOrEmail);
        
        // Validate and sanitize inputs
        InputValidator.InputValidationResult usernameValidation = 
            usernameOrEmail.contains("@") ? 
                inputValidator.validateEmail(usernameOrEmail) : 
                inputValidator.validateUsername(usernameOrEmail);
                
        if (!usernameValidation.isValid()) {
            log.warn("Authentication failed: Invalid username/email format: {}", usernameValidation.getErrorMessage());
            throw new AuthenticationException.InvalidCredentialsException("Invalid credentials");
        }
        
        // Use sanitized input for authentication
        String sanitizedUsernameOrEmail = usernameValidation.getSanitizedValue();
        Optional<User> userOpt = findUserForAuthentication(sanitizedUsernameOrEmail);
        
        if (userOpt.isEmpty()) {
            log.warn("Authentication failed: User not found for: {}", usernameOrEmail);
            throw new AuthenticationException.InvalidCredentialsException("Invalid credentials");
        }
        
        User user = userOpt.get();
        
        // Check account status with specific exceptions
        if (user.isAccountLocked()) {
            log.warn("Authentication blocked: Account locked for user: {}", user.getUsername());
            throw new AuthenticationException.AccountLockedException("Account is temporarily locked due to multiple failed login attempts");
        }
        
        if (!user.isActiveUser()) {
            log.warn("Authentication blocked: Inactive account for user: {}", user.getUsername());
            throw new AuthenticationException.InactiveAccountException("Account is inactive or has been deactivated");
        }
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleFailedLogin(user);
            log.warn("Authentication failed: Invalid password for user: {}", user.getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Invalid credentials");
        }
        
        handleSuccessfulLogin(user);
        log.info("Authentication successful for user: {}", user.getUsername());
        return AuthenticationResult.success(user);
    }

    /**
     * Changes a user's password.
     * @throws AuthenticationException.InvalidCredentialsException when current password is incorrect
     */
    public void changePassword(@NotNull Long userId, @NotBlank String currentPassword, @NotBlank String newPassword) {
        User user = userService.getUserById(userId);
        
        // Validate new password strength
        InputValidator.PasswordValidationResult passwordValidation = inputValidator.validatePassword(newPassword);
        if (!passwordValidation.isValid()) {
            log.warn("Password change failed: Password validation failed for user: {} - {}", 
                user.getUsername(), passwordValidation.getErrorMessage());
            throw new AuthenticationException.InvalidCredentialsException(passwordValidation.getErrorMessage());
        }
        
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            log.warn("Password change failed: Incorrect current password for user: {}", user.getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Current password is incorrect");
        }
        
        // Check if new password is the same as current password
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            log.warn("Password change failed: New password same as current for user: {}", user.getUsername());
            throw new AuthenticationException.InvalidCredentialsException("New password cannot be same as current password");
        }
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        log.info("Password changed successfully for user: {}", user.getUsername());
        userService.saveUser(user);
    }

    /**
     * Resets password (for admin or forgot password flow).
     */
    public void resetPassword(@NotNull Long userId, @NotBlank String newPassword) {
        User user = userService.getUserById(userId);
        
        // Validate new password strength even for admin resets
        InputValidator.PasswordValidationResult passwordValidation = inputValidator.validatePassword(newPassword);
        if (!passwordValidation.isValid()) {
            log.warn("Password reset failed: Password validation failed for user: {} - {}", 
                user.getUsername(), passwordValidation.getErrorMessage());
            throw new AuthenticationException.InvalidCredentialsException(passwordValidation.getErrorMessage());
        }
        
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
        // Use optimized single query method
        return userService.getUserByUsernameOrEmail(usernameOrEmail);
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        
        log.debug("Failed login attempt {} for user: {}", attempts, user.getUsername());
        
        // Lock account if max attempts reached
        if (attempts >= maxFailedAttempts) {
            user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
            log.warn("Account locked for user: {} after {} failed attempts", user.getUsername(), attempts);
        }
        
        userService.saveUser(user);
    }

    private void handleSuccessfulLogin(User user) {
        log.info("=== SUCCESSFUL LOGIN HANDLER START === User: {}, Username: {}", user.getId(), user.getUsername());
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userService.saveUser(user);
        log.info("User saved after login - User: {}, LastLoginAt: {}", savedUser.getId(), savedUser.getLastLoginAt());

        // Award daily login reward if eligible
        log.info("=== ATTEMPTING DAILY LOGIN REWARD === User: {}", savedUser.getId());
        try {
            DailyLoginRewardService.DailyRewardResult result = dailyLoginRewardService.checkAndAwardDailyReward(savedUser);
            log.info("=== DAILY LOGIN REWARD RESULT === User: {}, WasAwarded: {}, Amount: {}, ClaimedAt: {}",
                savedUser.getId(), result.wasAwarded(), result.amountAwarded(), result.claimedAt());
        } catch (Exception e) {
            // Log error but don't fail login if reward fails
            log.error("=== DAILY LOGIN REWARD FAILED === User: {}, Error: {}", savedUser.getId(), e.getMessage(), e);
        }
        log.info("=== SUCCESSFUL LOGIN HANDLER END === User: {}", savedUser.getId());
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
}