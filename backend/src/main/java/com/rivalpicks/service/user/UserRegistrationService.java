package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.entity.user.UserSettings;
import com.rivalpicks.exception.user.UserRegistrationException;
import com.rivalpicks.repository.user.UserSettingsRepository;
import com.rivalpicks.validation.InputValidator;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

/**
 * Service dedicated to user registration and account creation.
 * Handles validation, uniqueness checks, and initial user setup.
 */
@Service
@Validated
@Transactional
public class UserRegistrationService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final InputValidator inputValidator;
    private final UserSettingsRepository userSettingsRepository;
    private final EntityManager entityManager;

    @Autowired
    public UserRegistrationService(
            UserService userService,
            PasswordEncoder passwordEncoder,
            InputValidator inputValidator,
            UserSettingsRepository userSettingsRepository,
            EntityManager entityManager) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.inputValidator = inputValidator;
        this.userSettingsRepository = userSettingsRepository;
        this.entityManager = entityManager;
    }

    /**
     * Registers a new user with validation and uniqueness checks.
     * Also creates default UserSettings with PUBLIC profile visibility.
     */
    public User registerUser(@Valid RegistrationRequest request) {
        validateRegistrationRequest(request);

        User user = createUserFromRequest(request);
        User savedUser = userService.saveUser(user);

        // Flush to ensure the User ID is generated before creating UserSettings
        entityManager.flush();

        // Create default settings for the new user with PUBLIC profile
        UserSettings settings = UserSettings.createDefaultSettings(savedUser);

        UserSettings savedSettings = userSettingsRepository.save(settings);

        return savedUser;
    }

    /**
     * Checks if username is available.
     */
    public boolean isUsernameAvailable(@NotBlank String username) {
        return !userService.existsByUsername(username);
    }

    /**
     * Checks if email is available.
     */
    public boolean isEmailAvailable(@NotBlank @Email String email) {
        return !userService.existsByEmail(email);
    }

    /**
     * Validates both username and email availability.
     */
    public RegistrationValidation validateAvailability(@NotBlank String username, @NotBlank @Email String email) {
        boolean usernameAvailable = isUsernameAvailable(username);
        boolean emailAvailable = isEmailAvailable(email);
        
        return new RegistrationValidation(usernameAvailable, emailAvailable);
    }

    private void validateRegistrationRequest(RegistrationRequest request) {
        // Validate and sanitize username
        InputValidator.InputValidationResult usernameValidation = inputValidator.validateUsername(request.username());
        if (!usernameValidation.isValid()) {
            throw new UserRegistrationException(
                usernameValidation.getErrorMessage(),
                UserRegistrationException.ErrorCode.USERNAME_INVALID_FORMAT
            );
        }

        // Validate and sanitize email
        InputValidator.InputValidationResult emailValidation = inputValidator.validateEmail(request.email());
        if (!emailValidation.isValid()) {
            throw new UserRegistrationException(
                emailValidation.getErrorMessage(),
                UserRegistrationException.ErrorCode.EMAIL_INVALID_FORMAT
            );
        }

        // Check availability with sanitized values
        if (!isUsernameAvailable(usernameValidation.getSanitizedValue())) {
            throw new UserRegistrationException(
                "This username is already taken",
                UserRegistrationException.ErrorCode.USERNAME_TAKEN
            );
        }

        if (!isEmailAvailable(emailValidation.getSanitizedValue())) {
            throw new UserRegistrationException(
                "An account with this email already exists",
                UserRegistrationException.ErrorCode.EMAIL_ALREADY_EXISTS
            );
        }

        // Validate password strength (including check against username/email)
        InputValidator.PasswordValidationResult passwordValidation = inputValidator.validatePassword(
            request.password(),
            request.username(),
            request.email()
        );
        if (!passwordValidation.isValid()) {
            throw new UserRegistrationException(
                passwordValidation.getErrorMessage(),
                UserRegistrationException.ErrorCode.PASSWORD_TOO_WEAK
            );
        }
    }

    private User createUserFromRequest(RegistrationRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        
        // Set defaults
        user.setEmailVerified(false);
        user.setIsActive(true);
        user.setCreditBalance(BigDecimal.ZERO);
        user.setFailedLoginAttempts(0);
        user.setWinCount(0);
        user.setLossCount(0);
        user.setCurrentStreak(0);
        user.setLongestStreak(0);
        user.setActiveBets(0);
        
        return user;
    }

    // Registration request DTO
    public record RegistrationRequest(
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 characters, alphanumeric and underscore only")
        String username,
        
        @NotBlank @Email
        String email,
        
        @NotBlank
        String password,
        
        String firstName,
        String lastName
    ) {}

    // Registration validation result
    public record RegistrationValidation(
        boolean usernameAvailable,
        boolean emailAvailable
    ) {
        public boolean isValid() {
            return usernameAvailable && emailAvailable;
        }
    }

}