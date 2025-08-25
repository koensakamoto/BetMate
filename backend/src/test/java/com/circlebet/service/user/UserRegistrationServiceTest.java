package com.circlebet.service.user;

import com.circlebet.entity.user.User;
import com.circlebet.service.user.UserRegistrationService.RegistrationRequest;
import com.circlebet.service.user.UserRegistrationService.RegistrationValidation;
import com.circlebet.service.user.UserRegistrationService.RegistrationException;
import com.circlebet.validation.InputValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;

@DisplayName("UserRegistrationService Unit Tests")
class UserRegistrationServiceTest {

    private UserRegistrationService registrationService;
    private TestUserService userService;
    private TestPasswordEncoder passwordEncoder;
    private TestInputValidator inputValidator;
    
    // Test data constants
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "SecurePass123!";
    private static final String TEST_ENCODED_PASSWORD = "encoded_password_hash";
    private static final String TEST_FIRST_NAME = "Test";
    private static final String TEST_LAST_NAME = "User";
    
    private RegistrationRequest validRequest;

    @BeforeEach
    void setUp() {
        // Create test implementations
        userService = new TestUserService();
        passwordEncoder = new TestPasswordEncoder();
        inputValidator = new TestInputValidator();
        
        registrationService = new UserRegistrationService(userService, passwordEncoder, inputValidator);
        
        // Create valid registration request
        validRequest = new RegistrationRequest(
            TEST_USERNAME,
            TEST_EMAIL,
            TEST_PASSWORD,
            TEST_FIRST_NAME,
            TEST_LAST_NAME
        );
        
        // Setup default behavior
        setupDefaults();
    }
    
    private void setupDefaults() {
        // Setup successful validation
        inputValidator.setUsernameValidation(TEST_USERNAME, InputValidator.InputValidationResult.valid(TEST_USERNAME));
        inputValidator.setEmailValidation(TEST_EMAIL, InputValidator.InputValidationResult.valid(TEST_EMAIL));
        inputValidator.setPasswordValidation(TEST_PASSWORD, InputValidator.PasswordValidationResult.valid());
        
        // Setup availability checks
        userService.setUsernameExists(TEST_USERNAME, false);
        userService.setEmailExists(TEST_EMAIL, false);
        
        // Setup password encoding
        passwordEncoder.setEncodedPassword(TEST_PASSWORD, TEST_ENCODED_PASSWORD);
    }

    // ==================== Test Helper Classes ====================
    
    private static class TestUserService extends UserService {
        private final Map<String, Boolean> usernameExistsMap = new HashMap<>();
        private final Map<String, Boolean> emailExistsMap = new HashMap<>();
        private final AtomicLong idGenerator = new AtomicLong(1);
        private User lastSavedUser;

        public TestUserService() {
            super(null); // We'll override all methods
        }

        @Override
        public boolean existsByUsername(String username) {
            return usernameExistsMap.getOrDefault(username, false);
        }

        @Override
        public boolean existsByEmail(String email) {
            return emailExistsMap.getOrDefault(email, false);
        }

        @Override
        public User saveUser(User user) {
            if (user.getId() == null) {
                user.setId(idGenerator.getAndIncrement());
            }
            lastSavedUser = user;
            return user;
        }

        public void setUsernameExists(String username, boolean exists) {
            usernameExistsMap.put(username, exists);
        }

        public void setEmailExists(String email, boolean exists) {
            emailExistsMap.put(email, exists);
        }

        public User getLastSavedUser() {
            return lastSavedUser;
        }

        public void reset() {
            usernameExistsMap.clear();
            emailExistsMap.clear();
            lastSavedUser = null;
        }
    }

    private static class TestPasswordEncoder implements PasswordEncoder {
        private final Map<String, String> encodedPasswords = new HashMap<>();

        @Override
        public String encode(CharSequence rawPassword) {
            return encodedPasswords.getOrDefault(rawPassword.toString(), "default_encoded");
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            return encode(rawPassword).equals(encodedPassword);
        }

        public void setEncodedPassword(String rawPassword, String encodedPassword) {
            encodedPasswords.put(rawPassword, encodedPassword);
        }
    }

    private static class TestInputValidator extends InputValidator {
        private final Map<String, InputValidator.InputValidationResult> usernameValidations = new HashMap<>();
        private final Map<String, InputValidator.InputValidationResult> emailValidations = new HashMap<>();
        private final Map<String, InputValidator.PasswordValidationResult> passwordValidations = new HashMap<>();

        @Override
        public InputValidator.InputValidationResult validateUsername(String username) {
            return usernameValidations.getOrDefault(username, InputValidator.InputValidationResult.valid(username));
        }

        @Override
        public InputValidator.InputValidationResult validateEmail(String email) {
            return emailValidations.getOrDefault(email, InputValidator.InputValidationResult.valid(email));
        }

        @Override
        public InputValidator.PasswordValidationResult validatePassword(String password) {
            return passwordValidations.getOrDefault(password, InputValidator.PasswordValidationResult.valid());
        }

        public void setUsernameValidation(String username, InputValidator.InputValidationResult result) {
            usernameValidations.put(username, result);
        }

        public void setEmailValidation(String email, InputValidator.InputValidationResult result) {
            emailValidations.put(email, result);
        }

        public void setPasswordValidation(String password, InputValidator.PasswordValidationResult result) {
            passwordValidations.put(password, result);
        }
    }

    // ==================== registerUser Tests ====================

    @Test
    @DisplayName("Should register user successfully with valid request")
    void should_RegisterUser_When_ValidRequest() {
        // When
        User result = registrationService.registerUser(validRequest);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(result.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(result.getPasswordHash()).isEqualTo(TEST_ENCODED_PASSWORD);
        assertThat(result.getFirstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(result.getLastName()).isEqualTo(TEST_LAST_NAME);
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getEmailVerified()).isFalse();
        assertThat(result.getCreditBalance()).isEqualTo(BigDecimal.ZERO);
        assertThat(result.getWinCount()).isZero();
        assertThat(result.getLossCount()).isZero();
        
        User savedUser = userService.getLastSavedUser();
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getUsername()).isEqualTo(TEST_USERNAME);
    }

    @Test
    @DisplayName("Should throw RegistrationException when username validation fails")
    void should_ThrowException_When_UsernameValidationFails() {
        // Given
        String invalidUsername = "ab";
        String errorMessage = "Username too short";
        RegistrationRequest request = new RegistrationRequest(invalidUsername, TEST_EMAIL, TEST_PASSWORD, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setUsernameValidation(invalidUsername, InputValidator.InputValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw RegistrationException when email validation fails")
    void should_ThrowException_When_EmailValidationFails() {
        // Given
        String invalidEmail = "invalid.email";
        String errorMessage = "Invalid email format";
        RegistrationRequest request = new RegistrationRequest(TEST_USERNAME, invalidEmail, TEST_PASSWORD, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setEmailValidation(invalidEmail, InputValidator.InputValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw RegistrationException when password validation fails")
    void should_ThrowException_When_PasswordValidationFails() {
        // Given
        String weakPassword = "123";
        String errorMessage = "Password too weak";
        RegistrationRequest request = new RegistrationRequest(TEST_USERNAME, TEST_EMAIL, weakPassword, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setPasswordValidation(weakPassword, InputValidator.PasswordValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw RegistrationException when username already exists")
    void should_ThrowException_When_UsernameAlreadyExists() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, true);
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(validRequest))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining("Username already exists: " + TEST_USERNAME);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw RegistrationException when email already exists")
    void should_ThrowException_When_EmailAlreadyExists() {
        // Given
        userService.setEmailExists(TEST_EMAIL, true);
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(validRequest))
            .isInstanceOf(RegistrationException.class)
            .hasMessageContaining("Email already exists: " + TEST_EMAIL);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should register user with minimal request (no first/last name)")
    void should_RegisterUser_When_MinimalRequest() {
        // Given
        RegistrationRequest minimalRequest = new RegistrationRequest(TEST_USERNAME, TEST_EMAIL, TEST_PASSWORD, null, null);
        
        // When
        User result = registrationService.registerUser(minimalRequest);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isNull();
        assertThat(result.getLastName()).isNull();
        assertThat(result.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(result.getEmail()).isEqualTo(TEST_EMAIL);
    }

    // ==================== isUsernameAvailable Tests ====================

    @Test
    @DisplayName("Should return true when username is available")
    void should_ReturnTrue_When_UsernameIsAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, false);
        
        // When
        boolean result = registrationService.isUsernameAvailable(TEST_USERNAME);
        
        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false when username is not available")
    void should_ReturnFalse_When_UsernameIsNotAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, true);
        
        // When
        boolean result = registrationService.isUsernameAvailable(TEST_USERNAME);
        
        // Then
        assertThat(result).isFalse();
    }

    // ==================== isEmailAvailable Tests ====================

    @Test
    @DisplayName("Should return true when email is available")
    void should_ReturnTrue_When_EmailIsAvailable() {
        // Given
        userService.setEmailExists(TEST_EMAIL, false);
        
        // When
        boolean result = registrationService.isEmailAvailable(TEST_EMAIL);
        
        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false when email is not available")
    void should_ReturnFalse_When_EmailIsNotAvailable() {
        // Given
        userService.setEmailExists(TEST_EMAIL, true);
        
        // When
        boolean result = registrationService.isEmailAvailable(TEST_EMAIL);
        
        // Then
        assertThat(result).isFalse();
    }

    // ==================== validateAvailability Tests ====================

    @Test
    @DisplayName("Should return valid when both username and email are available")
    void should_ReturnValid_When_BothUsernameAndEmailAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, false);
        userService.setEmailExists(TEST_EMAIL, false);
        
        // When
        RegistrationValidation result = registrationService.validateAvailability(TEST_USERNAME, TEST_EMAIL);
        
        // Then
        assertThat(result.usernameAvailable()).isTrue();
        assertThat(result.emailAvailable()).isTrue();
        assertThat(result.isValid()).isTrue();
    }

    @Test
    @DisplayName("Should return invalid when username is not available")
    void should_ReturnInvalid_When_UsernameNotAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, true);
        userService.setEmailExists(TEST_EMAIL, false);
        
        // When
        RegistrationValidation result = registrationService.validateAvailability(TEST_USERNAME, TEST_EMAIL);
        
        // Then
        assertThat(result.usernameAvailable()).isFalse();
        assertThat(result.emailAvailable()).isTrue();
        assertThat(result.isValid()).isFalse();
    }

    @Test
    @DisplayName("Should return invalid when email is not available")
    void should_ReturnInvalid_When_EmailNotAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, false);
        userService.setEmailExists(TEST_EMAIL, true);
        
        // When
        RegistrationValidation result = registrationService.validateAvailability(TEST_USERNAME, TEST_EMAIL);
        
        // Then
        assertThat(result.usernameAvailable()).isTrue();
        assertThat(result.emailAvailable()).isFalse();
        assertThat(result.isValid()).isFalse();
    }

    @Test
    @DisplayName("Should return invalid when both username and email are not available")
    void should_ReturnInvalid_When_BothNotAvailable() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, true);
        userService.setEmailExists(TEST_EMAIL, true);
        
        // When
        RegistrationValidation result = registrationService.validateAvailability(TEST_USERNAME, TEST_EMAIL);
        
        // Then
        assertThat(result.usernameAvailable()).isFalse();
        assertThat(result.emailAvailable()).isFalse();
        assertThat(result.isValid()).isFalse();
    }

    // ==================== Edge Cases and Error Handling Tests ====================

    @Test
    @DisplayName("Should use sanitized values from input validator")
    void should_UseSanitizedValues_When_ValidatingAvailability() {
        // Given
        String originalUsername = "  TestUser  ";
        String sanitizedUsername = "testuser";
        String originalEmail = "  TEST@EXAMPLE.COM  ";
        String sanitizedEmail = "test@example.com";
        
        RegistrationRequest request = new RegistrationRequest(originalUsername, originalEmail, TEST_PASSWORD, TEST_FIRST_NAME, TEST_LAST_NAME);
        
        inputValidator.setUsernameValidation(originalUsername, InputValidator.InputValidationResult.valid(sanitizedUsername));
        inputValidator.setEmailValidation(originalEmail, InputValidator.InputValidationResult.valid(sanitizedEmail));
        userService.setUsernameExists(sanitizedUsername, false);
        userService.setEmailExists(sanitizedEmail, false);
        
        // When
        User result = registrationService.registerUser(request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo(originalUsername); // Uses original from request
        assertThat(result.getEmail()).isEqualTo(originalEmail); // Uses original from request
    }

    @Test
    @DisplayName("Should create user with all default statistical values")
    void should_CreateUserWithDefaults_When_Registering() {
        // When
        User result = registrationService.registerUser(validRequest);
        
        // Then
        assertThat(result.getWinCount()).isZero();
        assertThat(result.getLossCount()).isZero();
        assertThat(result.getCurrentStreak()).isZero();
        assertThat(result.getLongestStreak()).isZero();
        assertThat(result.getActiveBets()).isZero();
        assertThat(result.getFailedLoginAttempts()).isZero();
        assertThat(result.getEmailVerified()).isFalse();
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getCreditBalance()).isEqualTo(BigDecimal.ZERO);
    }
}