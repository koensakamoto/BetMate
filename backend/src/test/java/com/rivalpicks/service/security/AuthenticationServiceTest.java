package com.rivalpicks.service.security;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.AuthenticationException;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.validation.InputValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthenticationServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private InputValidator inputValidator;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User testUser;
    private static final String CURRENT_PASSWORD = "currentPassword123!";
    private static final String NEW_PASSWORD = "newPassword456!";
    private static final String HASHED_PASSWORD = "$2a$10$hashedPassword";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPasswordHash(HASHED_PASSWORD);
    }

    @Test
    @DisplayName("Should successfully change password with valid new password")
    void changePassword_ValidNewPassword_Success() {
        // Setup mocks
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(inputValidator.validatePassword(NEW_PASSWORD)).thenReturn(
            InputValidator.PasswordValidationResult.valid());
        when(passwordEncoder.matches(CURRENT_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        when(passwordEncoder.matches(NEW_PASSWORD, HASHED_PASSWORD)).thenReturn(false);
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("$2a$10$newHashedPassword");

        // Execute
        assertDoesNotThrow(() -> authenticationService.changePassword(1L, CURRENT_PASSWORD, NEW_PASSWORD));

        // Verify
        verify(userService).saveUser(testUser);
        verify(passwordEncoder).encode(NEW_PASSWORD);
    }

    @Test
    @DisplayName("Should throw exception when new password is same as current password")
    void changePassword_SameAsCurrentPassword_ThrowsException() {
        // Setup mocks - new password is same as current
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(inputValidator.validatePassword(CURRENT_PASSWORD)).thenReturn(
            InputValidator.PasswordValidationResult.valid());
        when(passwordEncoder.matches(CURRENT_PASSWORD, HASHED_PASSWORD)).thenReturn(true);

        // Execute & Assert
        AuthenticationException.InvalidCredentialsException exception = 
            assertThrows(AuthenticationException.InvalidCredentialsException.class, () -> 
                authenticationService.changePassword(1L, CURRENT_PASSWORD, CURRENT_PASSWORD));

        assertEquals("New password cannot be same as current password", exception.getMessage());
        
        // Verify password was not updated
        verify(userService, never()).saveUser(any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Should throw exception when current password is incorrect")
    void changePassword_IncorrectCurrentPassword_ThrowsException() {
        // Setup mocks
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(inputValidator.validatePassword(NEW_PASSWORD)).thenReturn(
            InputValidator.PasswordValidationResult.valid());
        when(passwordEncoder.matches("wrongPassword", HASHED_PASSWORD)).thenReturn(false);

        // Execute & Assert
        AuthenticationException.InvalidCredentialsException exception = 
            assertThrows(AuthenticationException.InvalidCredentialsException.class, () -> 
                authenticationService.changePassword(1L, "wrongPassword", NEW_PASSWORD));

        assertEquals("Current password is incorrect", exception.getMessage());
        
        // Verify password was not updated
        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when new password is invalid")
    void changePassword_InvalidNewPassword_ThrowsException() {
        // Setup mocks
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(inputValidator.validatePassword("weak")).thenReturn(
            InputValidator.PasswordValidationResult.invalid("Password too weak"));

        // Execute & Assert
        AuthenticationException.InvalidCredentialsException exception = 
            assertThrows(AuthenticationException.InvalidCredentialsException.class, () -> 
                authenticationService.changePassword(1L, CURRENT_PASSWORD, "weak"));

        assertEquals("Password too weak", exception.getMessage());
        
        // Verify password was not updated
        verify(userService, never()).saveUser(any(User.class));
    }
}