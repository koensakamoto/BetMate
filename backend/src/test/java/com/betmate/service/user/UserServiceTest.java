package com.betmate.service.user;

import com.betmate.entity.user.User;
import com.betmate.repository.user.UserRepository;
import com.betmate.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    private UserService userService;
    
    @Mock
    private UserRepository userRepository;
    
    // Test data constants
    private static final Long TEST_USER_ID = 123L;
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_FIRST_NAME = "Test";
    private static final String TEST_LAST_NAME = "User";
    private static final String TEST_PASSWORD_HASH = "hashedpassword";
    
    private User testUser;
    private User deletedUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository);
        
        // Create test user
        testUser = createTestUser(TEST_USER_ID, TEST_USERNAME, TEST_EMAIL, false);
        
        // Create deleted user
        deletedUser = createTestUser(2L, "deleteduser", "deleted@example.com", true);
        deletedUser.setDeletedAt(LocalDateTime.now());
    }

    private User createTestUser(Long id, String username, String email, boolean deleted) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(TEST_PASSWORD_HASH);
        user.setFirstName(TEST_FIRST_NAME);
        user.setLastName(TEST_LAST_NAME);
        user.setIsActive(true);
        user.setEmailVerified(true);
        user.setWinCount(5);
        user.setLossCount(3);
        user.setCurrentStreak(2);
        user.setLongestStreak(4);
        user.setActiveBets(1);
        user.setCreditBalance(BigDecimal.valueOf(100.50));
        
        if (deleted) {
            user.setDeletedAt(LocalDateTime.now());
        }
        
        return user;
    }

    // ==================== getUserById Tests ====================

    @Test
    @DisplayName("Should return user when found by ID and not deleted")
    void should_ReturnUser_When_FoundByIdAndNotDeleted() {
        // Given
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        
        // When
        User result = userService.getUserById(TEST_USER_ID);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(TEST_USER_ID);
        assertThat(result.getUsername()).isEqualTo(TEST_USERNAME);
        verify(userRepository).findById(TEST_USER_ID);
    }

    @Test
    @DisplayName("Should throw UserNotFoundException when user not found by ID")
    void should_ThrowException_When_UserNotFoundById() {
        // Given
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> userService.getUserById(TEST_USER_ID))
            .isInstanceOf(com.betmate.exception.user.UserNotFoundException.class)
            .hasMessageContaining("User not found: " + TEST_USER_ID);
        
        verify(userRepository).findById(TEST_USER_ID);
    }

    @Test
    @DisplayName("Should throw UserNotFoundException when user is deleted")
    void should_ThrowException_When_UserIsDeleted() {
        // Given
        when(userRepository.findById(deletedUser.getId())).thenReturn(Optional.of(deletedUser));
        
        // When & Then
        assertThatThrownBy(() -> userService.getUserById(deletedUser.getId()))
            .isInstanceOf(com.betmate.exception.user.UserNotFoundException.class)
            .hasMessageContaining("User not found: " + deletedUser.getId());
        
        verify(userRepository).findById(deletedUser.getId());
    }

    // ==================== getUserByUsername Tests ====================

    @Test
    @DisplayName("Should return user when found by username and not deleted")
    void should_ReturnUser_When_FoundByUsernameAndNotDeleted() {
        // Given
        when(userRepository.findByUsernameIgnoreCase(TEST_USERNAME)).thenReturn(Optional.of(testUser));
        
        // When
        Optional<User> result = userService.getUserByUsername(TEST_USERNAME);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo(TEST_USERNAME);
        verify(userRepository).findByUsernameIgnoreCase(TEST_USERNAME);
    }

    @Test
    @DisplayName("Should return empty when user not found by username")
    void should_ReturnEmpty_When_UserNotFoundByUsername() {
        // Given
        when(userRepository.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());
        
        // When
        Optional<User> result = userService.getUserByUsername("nonexistent");
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByUsernameIgnoreCase("nonexistent");
    }

    @Test
    @DisplayName("Should return empty when user found by username but is deleted")
    void should_ReturnEmpty_When_UserFoundByUsernameButDeleted() {
        // Given
        when(userRepository.findByUsernameIgnoreCase(deletedUser.getUsername())).thenReturn(Optional.of(deletedUser));
        
        // When
        Optional<User> result = userService.getUserByUsername(deletedUser.getUsername());
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByUsernameIgnoreCase(deletedUser.getUsername());
    }

    // ==================== getUserByEmail Tests ====================

    @Test
    @DisplayName("Should return user when found by email and not deleted")
    void should_ReturnUser_When_FoundByEmailAndNotDeleted() {
        // Given
        when(userRepository.findByEmailIgnoreCase(TEST_EMAIL)).thenReturn(Optional.of(testUser));
        
        // When
        Optional<User> result = userService.getUserByEmail(TEST_EMAIL);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo(TEST_EMAIL);
        verify(userRepository).findByEmailIgnoreCase(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should return empty when user not found by email")
    void should_ReturnEmpty_When_UserNotFoundByEmail() {
        // Given
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());
        
        // When
        Optional<User> result = userService.getUserByEmail("nonexistent@example.com");
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmailIgnoreCase("nonexistent@example.com");
    }

    @Test
    @DisplayName("Should return empty when user found by email but is deleted")
    void should_ReturnEmpty_When_UserFoundByEmailButDeleted() {
        // Given
        when(userRepository.findByEmailIgnoreCase(deletedUser.getEmail())).thenReturn(Optional.of(deletedUser));
        
        // When
        Optional<User> result = userService.getUserByEmail(deletedUser.getEmail());
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmailIgnoreCase(deletedUser.getEmail());
    }

    // ==================== getUserByUsernameOrEmail Tests ====================

    @Test
    @DisplayName("Should return user when found by username or email")
    void should_ReturnUser_When_FoundByUsernameOrEmail() {
        // Given
        when(userRepository.findByUsernameOrEmailIgnoreCase(TEST_USERNAME)).thenReturn(Optional.of(testUser));
        
        // When
        Optional<User> result = userService.getUserByUsernameOrEmail(TEST_USERNAME);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo(TEST_USERNAME);
        verify(userRepository).findByUsernameOrEmailIgnoreCase(TEST_USERNAME);
    }

    @Test
    @DisplayName("Should return empty when user not found by username or email")
    void should_ReturnEmpty_When_UserNotFoundByUsernameOrEmail() {
        // Given
        when(userRepository.findByUsernameOrEmailIgnoreCase("nonexistent")).thenReturn(Optional.empty());
        
        // When
        Optional<User> result = userService.getUserByUsernameOrEmail("nonexistent");
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findByUsernameOrEmailIgnoreCase("nonexistent");
    }

    // ==================== searchUsers Tests ====================

    @Test
    @DisplayName("Should return users when search term matches")
    void should_ReturnUsers_When_SearchTermMatches() {
        // Given
        String searchTerm = "Test";
        List<User> expectedUsers = List.of(testUser);
        when(userRepository.searchUsersByName(searchTerm)).thenReturn(expectedUsers);
        
        // When
        List<User> result = userService.searchUsers(searchTerm);
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result).containsExactly(testUser);
        verify(userRepository).searchUsersByName(searchTerm);
    }

    @Test
    @DisplayName("Should return empty list when search term is empty or blank")
    void should_ReturnEmptyList_When_SearchTermIsBlank() {
        // When
        List<User> emptyResult = userService.searchUsers("");
        List<User> blankResult = userService.searchUsers("   ");
        
        // Then
        assertThat(emptyResult).isEmpty();
        assertThat(blankResult).isEmpty();
        verify(userRepository, never()).searchUsersByName(anyString());
    }

    @Test
    @DisplayName("Should return empty list when no users match search term")
    void should_ReturnEmptyList_When_NoUsersMatchSearchTerm() {
        // Given
        String searchTerm = "NonExistent";
        when(userRepository.searchUsersByName(searchTerm)).thenReturn(List.of());
        
        // When
        List<User> result = userService.searchUsers(searchTerm);
        
        // Then
        assertThat(result).isEmpty();
        verify(userRepository).searchUsersByName(searchTerm);
    }

    // ==================== getActiveUsers Tests ====================

    @Test
    @DisplayName("Should return all active users")
    void should_ReturnActiveUsers_When_Called() {
        // Given
        List<User> activeUsers = List.of(testUser);
        when(userRepository.findByIsActiveTrueAndDeletedAtIsNull()).thenReturn(activeUsers);
        
        // When
        List<User> result = userService.getActiveUsers();
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result).containsExactly(testUser);
        verify(userRepository).findByIsActiveTrueAndDeletedAtIsNull();
    }

    // ==================== updateProfile Tests ====================

    @Test
    @DisplayName("Should update user profile successfully")
    void should_UpdateUserProfile_When_UserExists() {
        // Given
        String newFirstName = "Updated";
        String newLastName = "Name";
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        
        // When
        User result = userService.updateProfile(TEST_USER_ID, newFirstName, newLastName, "Test bio");
        
        // Then
        assertThat(result.getFirstName()).isEqualTo(newFirstName);
        assertThat(result.getLastName()).isEqualTo(newLastName);
        verify(userRepository).findById(TEST_USER_ID);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw UserNotFoundException when updating profile of non-existent user")
    void should_ThrowException_When_UpdatingProfileOfNonExistentUser() {
        // Given
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> userService.updateProfile(TEST_USER_ID, "New", "Name", "Test bio"))
            .isInstanceOf(com.betmate.exception.user.UserNotFoundException.class)
            .hasMessageContaining("User not found: " + TEST_USER_ID);
        
        verify(userRepository).findById(TEST_USER_ID);
        verify(userRepository, never()).save(any());
    }

    // ==================== existsByUsername and existsByEmail Tests ====================

    @Test
    @DisplayName("Should return true when username exists")
    void should_ReturnTrue_When_UsernameExists() {
        // Given
        when(userRepository.existsByUsernameIgnoreCase(TEST_USERNAME)).thenReturn(true);
        
        // When
        boolean result = userService.existsByUsername(TEST_USERNAME);
        
        // Then
        assertThat(result).isTrue();
        verify(userRepository).existsByUsernameIgnoreCase(TEST_USERNAME);
    }

    @Test
    @DisplayName("Should return false when username does not exist")
    void should_ReturnFalse_When_UsernameDoesNotExist() {
        // Given
        when(userRepository.existsByUsernameIgnoreCase("nonexistent")).thenReturn(false);
        
        // When
        boolean result = userService.existsByUsername("nonexistent");
        
        // Then
        assertThat(result).isFalse();
        verify(userRepository).existsByUsernameIgnoreCase("nonexistent");
    }

    @Test
    @DisplayName("Should return true when email exists")
    void should_ReturnTrue_When_EmailExists() {
        // Given
        when(userRepository.existsByEmailIgnoreCase(TEST_EMAIL)).thenReturn(true);
        
        // When
        boolean result = userService.existsByEmail(TEST_EMAIL);
        
        // Then
        assertThat(result).isTrue();
        verify(userRepository).existsByEmailIgnoreCase(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should return false when email does not exist")
    void should_ReturnFalse_When_EmailDoesNotExist() {
        // Given
        when(userRepository.existsByEmailIgnoreCase("nonexistent@example.com")).thenReturn(false);
        
        // When
        boolean result = userService.existsByEmail("nonexistent@example.com");
        
        // Then
        assertThat(result).isFalse();
        verify(userRepository).existsByEmailIgnoreCase("nonexistent@example.com");
    }


    // ==================== deleteUser Tests ====================

    @Test
    @DisplayName("Should soft delete user successfully")
    void should_SoftDeleteUser_When_UserExists() {
        // Given
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        
        // When
        userService.deleteUser(TEST_USER_ID);
        
        // Then
        assertThat(testUser.getIsActive()).isFalse();
        assertThat(testUser.getDeletedAt()).isNotNull();
        verify(userRepository).findById(TEST_USER_ID);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw UserNotFoundException when deleting non-existent user")
    void should_ThrowException_When_DeletingNonExistentUser() {
        // Given
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> userService.deleteUser(TEST_USER_ID))
            .isInstanceOf(com.betmate.exception.user.UserNotFoundException.class)
            .hasMessageContaining("User not found: " + TEST_USER_ID);
        
        verify(userRepository).findById(TEST_USER_ID);
        verify(userRepository, never()).save(any());
    }

    // ==================== saveUser Tests ====================

    @Test
    @DisplayName("Should save user successfully")
    void should_SaveUser_When_ValidUser() {
        // Given
        when(userRepository.save(testUser)).thenReturn(testUser);
        
        // When
        User result = userService.saveUser(testUser);
        
        // Then
        assertThat(result).isEqualTo(testUser);
        verify(userRepository).save(testUser);
    }

    // ==================== Edge Cases and Validation Tests ====================

    @Test
    @DisplayName("Should handle null user ID parameter appropriately")
    void should_HandleNullUserId_When_GetUserByIdCalled() {
        // When & Then - UserService doesn't explicitly validate nulls, it passes them to repository
        // The actual validation would happen at the Bean Validation level in a real Spring context
        assertThatThrownBy(() -> userService.getUserById(null))
            .isInstanceOf(com.betmate.exception.user.UserNotFoundException.class)
            .hasMessageContaining("User not found: null");
    }

    @Test
    @DisplayName("Should trim search terms properly")
    void should_TrimSearchTerms_When_SearchingUsers() {
        // Given
        String paddedSearchTerm = "  TestUser  ";
        List<User> expectedUsers = List.of(testUser);
        when(userRepository.searchUsersByName("TestUser")).thenReturn(expectedUsers);
        
        // When
        List<User> result = userService.searchUsers(paddedSearchTerm);
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result).containsExactly(testUser);
        verify(userRepository).searchUsersByName("TestUser"); // Verify trimmed
    }
}