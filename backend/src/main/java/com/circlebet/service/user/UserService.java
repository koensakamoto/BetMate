package com.circlebet.service.user;

import com.circlebet.entity.user.User;
import com.circlebet.repository.user.UserRepository;
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
 * Does NOT handle authentication, security, or financial operations.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
     * Searches users by name.
     */
    public List<User> searchUsers(@NotNull String searchTerm) {
        if (searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return userRepository.searchUsersByName(searchTerm.trim());
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
    public User updateProfile(@NotNull Long userId, String firstName, String lastName) {
        User user = getUserById(userId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
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
     * Gets user statistics.
     */
    public UserStats getUserStats(@NotNull Long userId) {
        User user = getUserById(userId);
        return new UserStats(
            user.getWinCount(),
            user.getLossCount(),
            user.getCurrentStreak(),
            user.getLongestStreak(),
            user.getActiveBets(),
            user.getWinRate()
        );
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

    // DTO for user statistics
    public record UserStats(
        int winCount,
        int lossCount,
        int currentStreak,
        int longestStreak,
        int activeBets,
        double winRate
    ) {}

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }
}