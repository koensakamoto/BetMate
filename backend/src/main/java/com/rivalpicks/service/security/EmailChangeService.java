package com.rivalpicks.service.security;

import com.rivalpicks.entity.security.EmailChangeToken;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.AuthenticationException;
import com.rivalpicks.repository.security.EmailChangeTokenRepository;
import com.rivalpicks.service.email.EmailService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.validation.InputValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * Service for handling email change operations.
 * Manages token generation, validation, and email change verification flow.
 */
@Slf4j
@Service
@Transactional
public class EmailChangeService {

    private final EmailChangeTokenRepository tokenRepository;
    private final UserService userService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final InputValidator inputValidator;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Autowired
    public EmailChangeService(
            EmailChangeTokenRepository tokenRepository,
            UserService userService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            InputValidator inputValidator) {
        this.tokenRepository = tokenRepository;
        this.userService = userService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.inputValidator = inputValidator;
        log.info("EmailChangeService initialized");
    }

    /**
     * Initiates the email change flow for a user.
     * Validates the new email and current password, then sends verification email.
     *
     * @param userId          the user's ID
     * @param newEmail        the new email address
     * @param currentPassword the user's current password for verification
     * @throws AuthenticationException.InvalidCredentialsException if password is incorrect
     * @throws IllegalArgumentException                            if email is invalid or already in use
     */
    public void requestEmailChange(Long userId, String newEmail, String currentPassword) {
        log.debug("Email change requested for user ID: {}", userId);

        User user = userService.getUserById(userId);

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            log.warn("Email change failed: incorrect password for user: {}", user.getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Current password is incorrect");
        }

        // Validate new email format
        InputValidator.InputValidationResult emailValidation = inputValidator.validateEmail(newEmail);
        if (!emailValidation.isValid()) {
            log.warn("Email change failed: invalid email format for user: {}", user.getUsername());
            throw new IllegalArgumentException(emailValidation.getErrorMessage());
        }

        String sanitizedEmail = emailValidation.getSanitizedValue();

        // Check if new email is same as current
        if (sanitizedEmail.equalsIgnoreCase(user.getEmail())) {
            log.warn("Email change failed: new email same as current for user: {}", user.getUsername());
            throw new IllegalArgumentException("New email is the same as your current email");
        }

        // Check if new email is already in use
        if (userService.existsByEmail(sanitizedEmail)) {
            log.warn("Email change failed: email already in use for user: {}", user.getUsername());
            throw new IllegalArgumentException("This email address is already in use");
        }

        // Check if there's already a pending verification for this email
        if (tokenRepository.existsPendingTokenForEmail(sanitizedEmail, LocalDateTime.now(ZoneOffset.UTC))) {
            log.warn("Email change failed: pending verification exists for email: {}", sanitizedEmail);
            throw new IllegalArgumentException("A verification is already pending for this email address");
        }

        // Invalidate any existing tokens for this user
        int invalidated = tokenRepository.invalidateAllTokensForUser(user);
        if (invalidated > 0) {
            log.debug("Invalidated {} existing email change tokens for user: {}", invalidated, user.getUsername());
        }

        // Create new token
        EmailChangeToken token = new EmailChangeToken(user, sanitizedEmail);
        tokenRepository.save(token);
        log.info("Email change token created for user: {}", user.getUsername());

        // Send verification email to the NEW email address
        try {
            emailService.sendEmailChangeVerificationEmail(user, sanitizedEmail, token.getToken(), frontendUrl);
            log.info("Email change verification sent to new email for user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Failed to send email change verification for user: {}", user.getUsername(), e);
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }

        // Optionally notify the OLD email about the change request
        try {
            emailService.sendEmailChangeNotificationToOldEmail(user, sanitizedEmail);
            log.info("Email change notification sent to old email for user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Failed to send notification to old email for user: {}", user.getUsername(), e);
            // Don't fail the request - the verification email was already sent
        }
    }

    /**
     * Validates an email change token.
     *
     * @param token the token string to validate
     * @return true if the token is valid, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Optional<EmailChangeToken> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.map(EmailChangeToken::isValid).orElse(false);
    }

    /**
     * Gets the pending new email for a token (for display purposes).
     *
     * @param token the token string
     * @return the new email if token is valid, empty otherwise
     */
    @Transactional(readOnly = true)
    public Optional<String> getPendingEmailForToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return tokenRepository.findByToken(token)
                .filter(EmailChangeToken::isValid)
                .map(EmailChangeToken::getNewEmail);
    }

    /**
     * Confirms the email change using the verification token.
     *
     * @param token the verification token
     * @return the updated User with new email
     * @throws AuthenticationException.InvalidCredentialsException if token is invalid or expired
     */
    public User confirmEmailChange(String token) {
        log.debug("Processing email change confirmation with token");

        if (token == null || token.isBlank()) {
            log.warn("Email change confirmation attempted with empty token");
            throw new AuthenticationException.InvalidCredentialsException("Invalid or expired verification token");
        }

        // Find and validate token
        EmailChangeToken emailToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Email change confirmation attempted with non-existent token");
                    return new AuthenticationException.InvalidCredentialsException("Invalid or expired verification token");
                });

        if (!emailToken.isValid()) {
            log.warn("Email change confirmation attempted with invalid/expired token for user: {}",
                    emailToken.getUser().getUsername());
            throw new AuthenticationException.InvalidCredentialsException("Invalid or expired verification token");
        }

        String newEmail = emailToken.getNewEmail();
        User user = emailToken.getUser();

        // Double-check the new email isn't taken (could have been registered since token creation)
        if (userService.existsByEmail(newEmail)) {
            log.warn("Email change failed at confirmation: email now in use for user: {}", user.getUsername());
            emailToken.markAsUsed();
            tokenRepository.save(emailToken);
            throw new IllegalArgumentException("This email address is now in use by another account");
        }

        // Update user's email
        String oldEmail = user.getEmail();
        user.setEmail(newEmail);
        user.setEmailVerified(true); // Mark as verified since they confirmed via email
        User savedUser = userService.saveUser(user);

        // Mark token as used
        emailToken.markAsUsed();
        tokenRepository.save(emailToken);

        // Invalidate any other tokens for this user
        tokenRepository.invalidateAllTokensForUser(user);

        log.info("Email successfully changed for user: {} from {} to {}", user.getUsername(), oldEmail, newEmail);

        return savedUser;
    }

    /**
     * Scheduled job to clean up expired tokens.
     * Runs daily at 3:30 AM.
     */
    @Scheduled(cron = "0 30 3 * * *")
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(7);
        int deleted = tokenRepository.deleteExpiredTokens(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} expired email change tokens", deleted);
        }
    }
}
