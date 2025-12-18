package com.rivalpicks.service.security;

import com.rivalpicks.entity.security.PasswordResetToken;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.AuthenticationException;
import com.rivalpicks.repository.security.PasswordResetTokenRepository;
import com.rivalpicks.service.email.EmailService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.validation.InputValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * Service for handling password reset operations.
 * Manages token generation, validation, and password reset flow.
 */
@Slf4j
@Service
@Transactional
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserService userService;
    private final EmailService emailService;
    private final AuthenticationService authenticationService;
    private final InputValidator inputValidator;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Autowired
    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            UserService userService,
            EmailService emailService,
            AuthenticationService authenticationService,
            InputValidator inputValidator) {
        this.tokenRepository = tokenRepository;
        this.userService = userService;
        this.emailService = emailService;
        this.authenticationService = authenticationService;
        this.inputValidator = inputValidator;
        log.info("PasswordResetService initialized");
    }

    /**
     * Initiates the password reset flow for a given email.
     * Always returns successfully to prevent email enumeration attacks.
     *
     * @param email the email address to send reset link to
     */
    public void requestPasswordReset(String email) {
        log.debug("Password reset requested for email: {}", email);

        // Validate email format
        InputValidator.InputValidationResult emailValidation = inputValidator.validateEmail(email);
        if (!emailValidation.isValid()) {
            log.warn("Invalid email format in password reset request: {}", email);
            // Still return success to prevent enumeration
            return;
        }

        String sanitizedEmail = emailValidation.getSanitizedValue();
        Optional<User> userOpt = userService.getUserByEmail(sanitizedEmail);

        if (userOpt.isEmpty()) {
            log.debug("Password reset requested for non-existent email: {}", sanitizedEmail);
            // Return silently - don't reveal if email exists
            return;
        }

        User user = userOpt.get();

        // Check if user is active
        if (!user.isActiveUser()) {
            log.warn("Password reset requested for inactive user: {}", user.getUsername());
            // Return silently - don't reveal account status
            return;
        }

        // Invalidate any existing tokens for this user
        int invalidated = tokenRepository.invalidateAllTokensForUser(user);
        if (invalidated > 0) {
            log.debug("Invalidated {} existing password reset tokens for user: {}", invalidated, user.getUsername());
        }

        // Create new token
        PasswordResetToken token = new PasswordResetToken(user);
        tokenRepository.save(token);
        log.info("Password reset token created for user: {}", user.getUsername());

        // Send reset email
        try {
            emailService.sendPasswordResetEmail(user, token.getToken(), frontendUrl);
            log.info("Password reset email sent to user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Failed to send password reset email for user: {}", user.getUsername(), e);
            // Don't fail the request - token is still created and could be resent
        }
    }

    /**
     * Validates a password reset token.
     *
     * @param token the token string to validate
     * @return true if the token is valid, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.map(PasswordResetToken::isValid).orElse(false);
    }

    /**
     * Resets the user's password using the provided token.
     *
     * @param token       the reset token
     * @param newPassword the new password
     * @throws AuthenticationException.InvalidCredentialsException if token is invalid or expired
     */
    public void resetPassword(String token, String newPassword) {
        log.debug("Processing password reset with token");

        if (token == null || token.isBlank()) {
            log.warn("Password reset attempted with empty token");
            throw new AuthenticationException.InvalidCredentialsException("Invalid or expired reset token");
        }

        // Find and validate token
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Password reset attempted with non-existent token");
                    return new AuthenticationException.InvalidCredentialsException("Invalid or expired reset token");
                });

        // Check if token is locked out due to too many failed attempts
        if (resetToken.isLockedOut()) {
            log.warn("Password reset attempted with locked out token for user: {}",
                    resetToken.getUser().getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Token has been invalidated due to too many failed attempts. Please request a new password reset.");
        }

        if (!resetToken.isValid()) {
            log.warn("Password reset attempted with invalid/expired token for user: {}",
                    resetToken.getUser().getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Invalid or expired reset token");
        }

        // Validate new password strength
        InputValidator.PasswordValidationResult passwordValidation = inputValidator.validatePassword(newPassword);
        if (!passwordValidation.isValid()) {
            // Increment failed attempts on password validation failure
            boolean lockedOut = resetToken.incrementFailedAttempts();
            tokenRepository.save(resetToken);

            if (lockedOut) {
                log.warn("Token locked out after {} failed attempts for user: {}",
                        resetToken.getFailedAttempts(), resetToken.getUser().getUsername());
                throw new AuthenticationException.InvalidCredentialsException(
                        "Token has been invalidated due to too many failed attempts. Please request a new password reset.");
            }

            log.warn("Password reset failed: weak password for user: {} (attempt {}/5)",
                    resetToken.getUser().getUsername(), resetToken.getFailedAttempts());
            throw new AuthenticationException.InvalidCredentialsException(passwordValidation.getErrorMessage());
        }

        User user = resetToken.getUser();

        // Reset the password using AuthenticationService
        authenticationService.resetPassword(user.getId(), newPassword);

        // Mark token as used
        resetToken.markAsUsed();
        tokenRepository.save(resetToken);

        // Invalidate any other tokens for this user
        tokenRepository.invalidateAllTokensForUser(user);

        log.info("Password successfully reset for user: {}", user.getUsername());
    }

    /**
     * Scheduled job to clean up expired tokens.
     * Runs daily at 3 AM.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(7);
        int deleted = tokenRepository.deleteExpiredTokens(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} expired password reset tokens", deleted);
        }
    }
}
