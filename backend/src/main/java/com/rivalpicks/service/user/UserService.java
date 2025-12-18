package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.entity.user.User.DevicePlatform;
import com.rivalpicks.entity.user.UserSettings;
import com.rivalpicks.entity.user.UserSettings.ProfileVisibility;
import com.rivalpicks.exception.user.UserNotFoundException;
import com.rivalpicks.repository.user.UserRepository;
import com.rivalpicks.repository.user.UserSettingsRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Core user management service handling CRUD operations and basic user data.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    @Autowired
    public UserService(UserRepository userRepository, UserSettingsRepository userSettingsRepository) {
        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
    }

    /**
     * Retrieves a user by ID.
     */
    public User getUserById(@NotNull Long userId) {
        return userRepository.findById(userId)
            .filter(user -> !user.isDeleted())
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
    }

    /**
     * Retrieves a user by username (case-insensitive).
     */
    public Optional<User> getUserByUsername(@NotNull String username) {
        return userRepository.findByUsernameIgnoreCase(username)
            .filter(user -> !user.isDeleted());
    }

    /**
     * Retrieves a user by email (case-insensitive).
     */
    public Optional<User> getUserByEmail(@NotNull String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .filter(user -> !user.isDeleted());
    }

    /**
     * Retrieves a user by Apple user ID.
     */
    public Optional<User> getUserByAppleUserId(@NotNull String appleUserId) {
        return userRepository.findByAppleUserId(appleUserId)
            .filter(user -> !user.isDeleted());
    }

    /**
     * Optimized method to retrieve a user by username OR email in a single database query.
     * This is more efficient than calling getUserByUsername().or(() -> getUserByEmail()).
     */
    public Optional<User> getUserByUsernameOrEmail(@NotNull String usernameOrEmail) {
        return userRepository.findByUsernameOrEmailIgnoreCase(usernameOrEmail);
    }

    /**
     * Searches users by name, excluding the current user.
     */
    public List<User> searchUsers(@NotNull String searchTerm, @NotNull Long currentUserId) {
        if (searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return userRepository.searchUsersByName(searchTerm.trim(), currentUserId);
    }

    /**
     * Retrieves all active users.
     */
    public List<User> getActiveUsers() {
        return userRepository.findByIsActiveTrueAndDeletedAtIsNull();
    }

    /**
     * Updates user profile information.
     */
    @Transactional
    public User updateProfile(@NotNull Long userId, String firstName, String lastName, String bio) {
        User user = getUserById(userId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setBio(bio);
        return userRepository.save(user);
    }

    /**
     * Changes a user's username.
     *
     * @param userId      the user's ID
     * @param newUsername the new username
     * @return the updated user
     * @throws IllegalArgumentException if username is invalid or already taken
     */
    @Transactional
    public User changeUsername(@NotNull Long userId, @NotNull String newUsername) {
        User user = getUserById(userId);

        // Check if new username is same as current (case-insensitive)
        if (newUsername.equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("New username is the same as your current username");
        }

        // Check if username is already taken
        if (existsByUsername(newUsername)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        user.setUsername(newUsername);
        return userRepository.save(user);
    }

    /**
     * Update user's profile picture URL
     */
    @Transactional
    public User updateProfilePicture(@NotNull Long userId, String profileImageUrl) {
        User user = getUserById(userId);
        user.setProfileImageUrl(profileImageUrl);
        return userRepository.save(user);
    }

    /**
     * Checks if username exists.
     */
    public boolean existsByUsername(@NotNull String username) {
        return userRepository.existsByUsernameIgnoreCase(username);
    }

    /**
     * Checks if email exists.
     */
    public boolean existsByEmail(@NotNull String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }


    /**
     * Soft deletes a user.
     */
    @Transactional
    public void deleteUser(@NotNull Long userId) {
        User user = getUserById(userId);
        user.setIsActive(false);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Internal method for other services to save user updates.
     */
    @Transactional
    public User saveUser(@Valid User user) {
        return userRepository.save(user);
    }

    /**
     * Gets the profile visibility setting for a user.
     */
    public ProfileVisibility getProfileVisibility(@NotNull Long userId) {
        return userSettingsRepository.findByUserId(userId)
            .map(UserSettings::getProfileVisibility)
            .orElse(ProfileVisibility.PUBLIC);
    }

    /**
     * Updates the profile visibility setting for a user.
     * Creates settings if they don't exist.
     */
    @Transactional
    public ProfileVisibility updateProfileVisibility(@NotNull Long userId, @NotNull ProfileVisibility visibility) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
            .orElseGet(() -> {
                // Create default settings if they don't exist
                User user = getUserById(userId);
                UserSettings newSettings = UserSettings.createDefaultSettings(user);
                return userSettingsRepository.save(newSettings);
            });
        settings.setProfileVisibility(visibility);
        userSettingsRepository.save(settings);
        return settings.getProfileVisibility();
    }

    // ==========================================
    // PUSH NOTIFICATION TOKEN MANAGEMENT
    // ==========================================

    /**
     * Registers or updates a user's push notification token.
     *
     * @param userId the user ID
     * @param token the Expo push token
     * @param platform the device platform (IOS, ANDROID, WEB)
     */
    @Transactional
    public void registerPushToken(@NotNull Long userId, @NotNull String token, @NotNull DevicePlatform platform) {
        User user = getUserById(userId);
        user.registerPushToken(token, platform);
        userRepository.save(user);
    }

    /**
     * Clears a user's push notification token (e.g., on logout).
     *
     * @param userId the user ID
     */
    @Transactional
    public void clearPushToken(@NotNull Long userId) {
        User user = getUserById(userId);
        user.clearPushToken();
        userRepository.save(user);
    }

    /**
     * Gets all users with valid push tokens.
     *
     * @return list of users with push tokens
     */
    public List<User> getUsersWithPushTokens() {
        return userRepository.findByExpoPushTokenIsNotNullAndIsActiveTrueAndDeletedAtIsNull();
    }

}