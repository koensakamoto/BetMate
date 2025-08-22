package com.circlebet.service.user;

import com.circlebet.entity.user.User;
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

    @Autowired
    public UserRegistrationService(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user with validation and uniqueness checks.
     */
    public User registerUser(@Valid RegistrationRequest request) {
        validateRegistrationRequest(request);
        
        User user = createUserFromRequest(request);
        return userService.saveUser(user);
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
        if (!isUsernameAvailable(request.username())) {
            throw new RegistrationException("Username already exists: " + request.username());
        }
        
        if (!isEmailAvailable(request.email())) {
            throw new RegistrationException("Email already exists: " + request.email());
        }
        
        validatePasswordStrength(request.password());
    }

    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new RegistrationException("Password must be at least 8 characters long");
        }
        
        if (!password.matches(".*[A-Z].*")) {
            throw new RegistrationException("Password must contain at least one uppercase letter");
        }
        
        if (!password.matches(".*[a-z].*")) {
            throw new RegistrationException("Password must contain at least one lowercase letter");
        }
        
        if (!password.matches(".*\\d.*")) {
            throw new RegistrationException("Password must contain at least one number");
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

    public static class RegistrationException extends RuntimeException {
        public RegistrationException(String message) {
            super(message);
        }
    }
}