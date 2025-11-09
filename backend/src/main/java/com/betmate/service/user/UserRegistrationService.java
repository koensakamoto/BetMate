package com.betmate.service.user;

import com.betmate.entity.user.User;
import com.betmate.entity.user.UserSettings;
import com.betmate.exception.user.UserRegistrationException;
import com.betmate.repository.user.UserSettingsRepository;
import com.betmate.validation.InputValidator;
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

    @Autowired
    public UserRegistrationService(
            UserService userService,
            PasswordEncoder passwordEncoder,
            InputValidator inputValidator,
            UserSettingsRepository userSettingsRepository) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.inputValidator = inputValidator;
        this.userSettingsRepository = userSettingsRepository;
    }

    /**
     * Registers a new user with validation and uniqueness checks.
     * Also creates default UserSettings with PUBLIC profile visibility.
     */
    public User registerUser(@Valid RegistrationRequest request) {
        validateRegistrationRequest(request);

        User user = createUserFromRequest(request);
        User savedUser = userService.saveUser(user);

        // Create default settings for the new user with PUBLIC profile
        UserSettings settings = UserSettings.createDefaultSettings(savedUser);
        userSettingsRepository.save(settings);

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
            throw new UserRegistrationException(usernameValidation.getErrorMessage());
        }
        
        // Validate and sanitize email
        InputValidator.InputValidationResult emailValidation = inputValidator.validateEmail(request.email());
        if (!emailValidation.isValid()) {
            throw new UserRegistrationException(emailValidation.getErrorMessage());
        }
        
        // Check availability with sanitized values
        if (!isUsernameAvailable(usernameValidation.getSanitizedValue())) {
            throw new UserRegistrationException("Username already exists: " + request.username());
        }
        
        if (!isEmailAvailable(emailValidation.getSanitizedValue())) {
            throw new UserRegistrationException("Email already exists: " + request.email());
        }
        
        // Validate password strength
        // TODO: Re-enable password validation later
        // InputValidator.PasswordValidationResult passwordValidation = inputValidator.validatePassword(request.password());
        // if (!passwordValidation.isValid()) {
        //     throw new UserRegistrationException(passwordValidation.getErrorMessage());
        // }
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