package com.betmate.service.user;

import com.betmate.entity.user.User;
import com.betmate.exception.user.UserNotFoundException;
import com.betmate.repository.user.UserRepository;
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
     * Optimized method to retrieve a user by username OR email in a single database query.
     * This is more efficient than calling getUserByUsername().or(() -> getUserByEmail()).
     */
    public Optional<User> getUserByUsernameOrEmail(@NotNull String usernameOrEmail) {
        return userRepository.findByUsernameOrEmailIgnoreCase(usernameOrEmail);
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
    public User updateProfile(@NotNull Long userId, String firstName, String lastName, String bio) {
        User user = getUserById(userId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setBio(bio);
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


}