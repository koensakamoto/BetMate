package com.betmate.service.user;

import com.betmate.entity.user.User;
import com.betmate.entity.user.UserSettings;
import com.betmate.repository.user.UserSettingsRepository;
import com.betmate.service.user.UserRegistrationService.RegistrationRequest;
import com.betmate.service.user.UserRegistrationService.RegistrationValidation;
import com.betmate.exception.user.UserRegistrationException;
import com.betmate.validation.InputValidator;
import jakarta.persistence.EntityManager;
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
    private TestUserSettingsRepository userSettingsRepository;
    private TestEntityManager entityManager;

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
        userSettingsRepository = new TestUserSettingsRepository();
        entityManager = new TestEntityManager();

        registrationService = new UserRegistrationService(userService, passwordEncoder, inputValidator, userSettingsRepository, entityManager);
        
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

    private static class TestUserSettingsRepository implements UserSettingsRepository {
        private UserSettings lastSavedSettings;
        private final AtomicLong idGenerator = new AtomicLong(1);

        @Override
        public UserSettings save(UserSettings settings) {
            // UserSettings uses userId as the ID (1:1 with User)
            // No need to set ID here - it's set by User relationship
            lastSavedSettings = settings;
            return settings;
        }

        @Override
        public Optional<UserSettings> findByUserId(Long userId) {
            return Optional.empty();
        }

        @Override
        public boolean existsByUserId(Long userId) {
            return false;
        }

        @Override
        public Optional<UserSettings> findById(Long id) {
            return Optional.empty();
        }

        @Override
        public boolean existsById(Long id) {
            return false;
        }

        @Override
        public List<UserSettings> findAll() {
            return List.of();
        }

        @Override
        public List<UserSettings> findAllById(Iterable<Long> ids) {
            return List.of();
        }

        @Override
        public <S extends UserSettings> List<S> saveAll(Iterable<S> entities) {
            return List.of();
        }

        @Override
        public long count() {
            return 0;
        }

        @Override
        public void deleteById(Long id) {
        }

        @Override
        public void delete(UserSettings entity) {
        }

        @Override
        public void deleteAllById(Iterable<? extends Long> ids) {
        }

        @Override
        public void deleteAll(Iterable<? extends UserSettings> entities) {
        }

        @Override
        public void deleteAll() {
        }

        @Override
        public void flush() {
        }

        @Override
        public <S extends UserSettings> S saveAndFlush(S entity) {
            return entity;
        }

        @Override
        public <S extends UserSettings> List<S> saveAllAndFlush(Iterable<S> entities) {
            return List.of();
        }

        @Override
        public void deleteAllInBatch(Iterable<UserSettings> entities) {
        }

        @Override
        public void deleteAllByIdInBatch(Iterable<Long> ids) {
        }

        @Override
        public void deleteAllInBatch() {
        }

        @Override
        public UserSettings getOne(Long id) {
            return null;
        }

        @Override
        public UserSettings getById(Long id) {
            return null;
        }

        @Override
        public UserSettings getReferenceById(Long id) {
            return null;
        }

        @Override
        public <S extends UserSettings> Optional<S> findOne(org.springframework.data.domain.Example<S> example) {
            return Optional.empty();
        }

        @Override
        public <S extends UserSettings> List<S> findAll(org.springframework.data.domain.Example<S> example) {
            return List.of();
        }

        @Override
        public <S extends UserSettings> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) {
            return List.of();
        }

        @Override
        public <S extends UserSettings> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) {
            return org.springframework.data.domain.Page.empty();
        }

        @Override
        public <S extends UserSettings> long count(org.springframework.data.domain.Example<S> example) {
            return 0;
        }

        @Override
        public <S extends UserSettings> boolean exists(org.springframework.data.domain.Example<S> example) {
            return false;
        }

        @Override
        public <S extends UserSettings, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) {
            return null;
        }

        @Override
        public List<UserSettings> findAll(org.springframework.data.domain.Sort sort) {
            return List.of();
        }

        @Override
        public org.springframework.data.domain.Page<UserSettings> findAll(org.springframework.data.domain.Pageable pageable) {
            return org.springframework.data.domain.Page.empty();
        }

        public UserSettings getLastSavedSettings() {
            return lastSavedSettings;
        }

        public void reset() {
            lastSavedSettings = null;
        }
    }

    private static class TestEntityManager implements EntityManager {
        @Override
        public void flush() {
            // No-op for testing - the mock UserService already assigns IDs
        }

        // All other EntityManager methods are not used in tests, so we can leave them unimplemented or return null
        @Override public void persist(Object entity) {}
        @Override public <T> T merge(T entity) { return null; }
        @Override public void remove(Object entity) {}
        @Override public <T> T find(Class<T> entityClass, Object primaryKey) { return null; }
        @Override public <T> T find(Class<T> entityClass, Object primaryKey, java.util.Map<String, Object> properties) { return null; }
        @Override public <T> T find(Class<T> entityClass, Object primaryKey, jakarta.persistence.LockModeType lockMode) { return null; }
        @Override public <T> T find(Class<T> entityClass, Object primaryKey, jakarta.persistence.LockModeType lockMode, java.util.Map<String, Object> properties) { return null; }
        @Override public <T> T getReference(Class<T> entityClass, Object primaryKey) { return null; }
        @Override public void clear() {}
        @Override public void detach(Object entity) {}
        @Override public boolean contains(Object entity) { return false; }
        @Override public jakarta.persistence.LockModeType getLockMode(Object entity) { return null; }
        @Override public void setProperty(String propertyName, Object value) {}
        @Override public java.util.Map<String, Object> getProperties() { return null; }
        @Override public jakarta.persistence.Query createQuery(String qlString) { return null; }
        @Override public <T> jakarta.persistence.TypedQuery<T> createQuery(jakarta.persistence.criteria.CriteriaQuery<T> criteriaQuery) { return null; }
        @Override public jakarta.persistence.Query createQuery(jakarta.persistence.criteria.CriteriaUpdate updateQuery) { return null; }
        @Override public jakarta.persistence.Query createQuery(jakarta.persistence.criteria.CriteriaDelete deleteQuery) { return null; }
        @Override public <T> jakarta.persistence.TypedQuery<T> createQuery(String qlString, Class<T> resultClass) { return null; }
        @Override public jakarta.persistence.Query createNamedQuery(String name) { return null; }
        @Override public <T> jakarta.persistence.TypedQuery<T> createNamedQuery(String name, Class<T> resultClass) { return null; }
        @Override public jakarta.persistence.Query createNativeQuery(String sqlString) { return null; }
        @Override public jakarta.persistence.Query createNativeQuery(String sqlString, Class resultClass) { return null; }
        @Override public jakarta.persistence.Query createNativeQuery(String sqlString, String resultSetMapping) { return null; }
        @Override public jakarta.persistence.StoredProcedureQuery createNamedStoredProcedureQuery(String name) { return null; }
        @Override public jakarta.persistence.StoredProcedureQuery createStoredProcedureQuery(String procedureName) { return null; }
        @Override public jakarta.persistence.StoredProcedureQuery createStoredProcedureQuery(String procedureName, Class... resultClasses) { return null; }
        @Override public jakarta.persistence.StoredProcedureQuery createStoredProcedureQuery(String procedureName, String... resultSetMappings) { return null; }
        @Override public void joinTransaction() {}
        @Override public boolean isJoinedToTransaction() { return false; }
        @Override public <T> T unwrap(Class<T> cls) { return null; }
        @Override public Object getDelegate() { return null; }
        @Override public void close() {}
        @Override public boolean isOpen() { return true; }
        @Override public jakarta.persistence.EntityTransaction getTransaction() { return null; }
        @Override public jakarta.persistence.EntityManagerFactory getEntityManagerFactory() { return null; }
        @Override public jakarta.persistence.criteria.CriteriaBuilder getCriteriaBuilder() { return null; }
        @Override public jakarta.persistence.metamodel.Metamodel getMetamodel() { return null; }
        @Override public <T> jakarta.persistence.EntityGraph<T> createEntityGraph(Class<T> rootType) { return null; }
        @Override public jakarta.persistence.EntityGraph<?> createEntityGraph(String graphName) { return null; }
        @Override public jakarta.persistence.EntityGraph<?> getEntityGraph(String graphName) { return null; }
        @Override public <T> java.util.List<jakarta.persistence.EntityGraph<? super T>> getEntityGraphs(Class<T> entityClass) { return null; }
        @Override public void lock(Object entity, jakarta.persistence.LockModeType lockMode) {}
        @Override public void lock(Object entity, jakarta.persistence.LockModeType lockMode, java.util.Map<String, Object> properties) {}
        @Override public void refresh(Object entity) {}
        @Override public void refresh(Object entity, java.util.Map<String, Object> properties) {}
        @Override public void refresh(Object entity, jakarta.persistence.LockModeType lockMode) {}
        @Override public void refresh(Object entity, jakarta.persistence.LockModeType lockMode, java.util.Map<String, Object> properties) {}
        @Override public void setFlushMode(jakarta.persistence.FlushModeType flushMode) {}
        @Override public jakarta.persistence.FlushModeType getFlushMode() { return null; }
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
    @DisplayName("Should throw UserRegistrationException when username validation fails")
    void should_ThrowException_When_UsernameValidationFails() {
        // Given
        String invalidUsername = "ab";
        String errorMessage = "Username too short";
        RegistrationRequest request = new RegistrationRequest(invalidUsername, TEST_EMAIL, TEST_PASSWORD, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setUsernameValidation(invalidUsername, InputValidator.InputValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(UserRegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw UserRegistrationException when email validation fails")
    void should_ThrowException_When_EmailValidationFails() {
        // Given
        String invalidEmail = "invalid.email";
        String errorMessage = "Invalid email format";
        RegistrationRequest request = new RegistrationRequest(TEST_USERNAME, invalidEmail, TEST_PASSWORD, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setEmailValidation(invalidEmail, InputValidator.InputValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(UserRegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw UserRegistrationException when password validation fails")
    void should_ThrowException_When_PasswordValidationFails() {
        // Given
        String weakPassword = "123";
        String errorMessage = "Password too weak";
        RegistrationRequest request = new RegistrationRequest(TEST_USERNAME, TEST_EMAIL, weakPassword, TEST_FIRST_NAME, TEST_LAST_NAME);
        inputValidator.setPasswordValidation(weakPassword, InputValidator.PasswordValidationResult.invalid(errorMessage));
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(request))
            .isInstanceOf(UserRegistrationException.class)
            .hasMessageContaining(errorMessage);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw UserRegistrationException when username already exists")
    void should_ThrowException_When_UsernameAlreadyExists() {
        // Given
        userService.setUsernameExists(TEST_USERNAME, true);
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(validRequest))
            .isInstanceOf(UserRegistrationException.class)
            .hasMessageContaining("Username already exists: " + TEST_USERNAME);
        
        assertThat(userService.getLastSavedUser()).isNull();
    }

    @Test
    @DisplayName("Should throw UserRegistrationException when email already exists")
    void should_ThrowException_When_EmailAlreadyExists() {
        // Given
        userService.setEmailExists(TEST_EMAIL, true);
        
        // When & Then
        assertThatThrownBy(() -> registrationService.registerUser(validRequest))
            .isInstanceOf(UserRegistrationException.class)
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