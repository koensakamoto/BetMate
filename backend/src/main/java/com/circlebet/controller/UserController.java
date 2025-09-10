package com.circlebet.controller;

import com.circlebet.dto.user.request.UserAvailabilityCheckRequestDto;
import com.circlebet.dto.user.request.UserProfileUpdateRequestDto;
import com.circlebet.dto.user.request.UserRegistrationRequestDto;
import com.circlebet.dto.user.response.UserAvailabilityResponseDto;
import com.circlebet.dto.user.response.UserProfileResponseDto;
import com.circlebet.dto.user.response.UserSearchResultResponseDto;
import com.circlebet.entity.user.User;
import com.circlebet.service.security.UserDetailsServiceImpl;
import com.circlebet.service.user.UserRegistrationService;
import com.circlebet.service.user.UserService;
import com.circlebet.service.user.UserStatisticsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for user management operations.
 * Handles user registration, profile management, search, and user data retrieval.
 */
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {

    private final UserService userService;
    private final UserRegistrationService userRegistrationService;
    private final UserStatisticsService userStatisticsService;

    @Autowired
    public UserController(UserService userService, UserRegistrationService userRegistrationService,
                         UserStatisticsService userStatisticsService) {
        this.userService = userService;
        this.userRegistrationService = userRegistrationService;
        this.userStatisticsService = userStatisticsService;
    }

    // ==========================================
    // USER REGISTRATION
    // ==========================================

    /**
     * Register a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<UserProfileResponseDto> registerUser(@Valid @RequestBody UserRegistrationRequestDto request) {
        try {
            System.out.println("=== REGISTRATION DEBUG START ===");
            System.out.println("Raw request received: " + request);
            System.out.println("Username: '" + request.username() + "'");
            System.out.println("Email: '" + request.email() + "'");
            System.out.println("Password length: " + (request.password() != null ? request.password().length() : "null"));
            System.out.println("FirstName: '" + request.firstName() + "'");
            System.out.println("LastName: '" + request.lastName() + "'");
            System.out.println("=== VALIDATION PASSED ===");
            
            // Convert DTO to service request
            UserRegistrationService.RegistrationRequest serviceRequest = 
                new UserRegistrationService.RegistrationRequest(
                    request.username(),
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName()
                ); 
            User user = userRegistrationService.registerUser(serviceRequest);
            System.out.println("=== USER CREATED SUCCESSFULLY ===");
            return ResponseEntity.status(HttpStatus.CREATED).body(UserProfileResponseDto.fromUser(user));
        } catch (com.circlebet.exception.user.UserRegistrationException e) {
            System.err.println("=== REGISTRATION EXCEPTION ===");
            System.err.println("Registration exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("=== UNEXPECTED EXCEPTION ===");
            System.err.println("Unexpected exception during registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check if username is available.
     */
    @GetMapping("/availability/username/{username}")
    public ResponseEntity<UserAvailabilityResponseDto> checkUsernameAvailability(
            @PathVariable @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$") String username) {
        boolean available = userRegistrationService.isUsernameAvailable(username);
        return ResponseEntity.ok(new UserAvailabilityResponseDto(available, available ? null : "Username already taken"));
    }

    /**
     * Check if email is available.
     */
    @GetMapping("/availability/email/{email}")
    public ResponseEntity<UserAvailabilityResponseDto> checkEmailAvailability(
            @PathVariable @NotBlank @Email String email) {
        boolean available = userRegistrationService.isEmailAvailable(email);
        return ResponseEntity.ok(new UserAvailabilityResponseDto(available, available ? null : "Email already registered"));
    }

    /**
     * Validate both username and email availability.
     */
    @PostMapping("/availability/validate")
    public ResponseEntity<UserRegistrationService.RegistrationValidation> validateAvailability(
            @Valid @RequestBody UserAvailabilityCheckRequestDto request) {
        UserRegistrationService.RegistrationValidation validation = 
            userRegistrationService.validateAvailability(request.username(), request.email());
        return ResponseEntity.ok(validation);
    }

    // ==========================================
    // USER PROFILE MANAGEMENT
    // ==========================================

    /**
     * Get current user's profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponseDto> getCurrentUserProfile() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            User user = userPrincipal.getUser();
            return ResponseEntity.ok(UserProfileResponseDto.fromUser(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update current user's profile.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponseDto> updateCurrentUserProfile(@Valid @RequestBody UserProfileUpdateRequestDto request) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            User updatedUser = userService.updateProfile(
                userPrincipal.getUserId(),
                request.firstName(),
                request.lastName()
            );
            
            return ResponseEntity.ok(UserProfileResponseDto.fromUser(updatedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete current user's account (soft delete).
     */
    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteCurrentUserProfile() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            userService.deleteUser(userPrincipal.getUserId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==========================================
    // USER DATA RETRIEVAL
    // ==========================================

    /**
     * Get user by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponseDto> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(UserProfileResponseDto.fromUser(user));
        } catch (com.circlebet.exception.user.UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search users by name.
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResultResponseDto>> searchUsers(
            @RequestParam @NotBlank String q) {
        List<User> users = userService.searchUsers(q);
        List<UserSearchResultResponseDto> results = users.stream()
            .map(UserSearchResultResponseDto::fromUser)
            .toList();
        return ResponseEntity.ok(results);
    }

    /**
     * Get user statistics.
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<UserStatisticsService.UserStatistics> getUserStats(@PathVariable Long id) {
        try {
            UserStatisticsService.UserStatistics stats = userStatisticsService.getUserStatistics(id);
            return ResponseEntity.ok(stats);
        } catch (com.circlebet.exception.user.UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all active users (admin/debugging endpoint).
     */
    @GetMapping("/active")
    public ResponseEntity<List<UserSearchResultResponseDto>> getActiveUsers() {
        List<User> users = userService.getActiveUsers();
        List<UserSearchResultResponseDto> results = users.stream()
            .map(UserSearchResultResponseDto::fromUser)
            .toList();
        return ResponseEntity.ok(results);
    }

    // Helper method
    private UserDetailsServiceImpl.UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsServiceImpl.UserPrincipal) {
            return (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
        }
        return null;
    }

}