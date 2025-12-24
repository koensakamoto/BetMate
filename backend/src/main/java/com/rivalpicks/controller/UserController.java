package com.rivalpicks.controller;

import com.rivalpicks.dto.common.ErrorResponseDto;
import com.rivalpicks.dto.common.PagedResponseDto;
import com.rivalpicks.dto.user.request.EmailChangeConfirmRequestDto;
import com.rivalpicks.dto.user.request.EmailChangeRequestDto;
import com.rivalpicks.dto.user.request.UserAvailabilityCheckRequestDto;
import com.rivalpicks.dto.user.request.UserProfileUpdateRequestDto;
import com.rivalpicks.dto.user.request.UserRegistrationRequestDto;
import com.rivalpicks.dto.user.request.UsernameChangeRequestDto;
import com.rivalpicks.dto.user.response.EmailChangeResponseDto;
import com.rivalpicks.dto.user.response.LimitedUserProfileResponseDto;
import com.rivalpicks.dto.user.response.UserAvailabilityResponseDto;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;
import com.rivalpicks.dto.user.response.UserSearchResultResponseDto;
import com.rivalpicks.dto.user.response.TransactionResponseDto;
import com.rivalpicks.dto.user.response.UsernameChangeResponseDto;
import com.rivalpicks.dto.user.NotificationPreferencesDto;
import com.rivalpicks.entity.user.UserSettings.ProfileVisibility;
import com.rivalpicks.service.user.FriendshipService;
import com.rivalpicks.entity.user.Transaction;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.storage.StorageService;
import com.rivalpicks.service.security.EmailChangeService;
import com.rivalpicks.service.security.JwtService;
import com.rivalpicks.service.security.UserDetailsServiceImpl;
import com.rivalpicks.service.user.DailyLoginRewardService;
import com.rivalpicks.service.user.TransactionService;
import com.rivalpicks.service.user.UserRegistrationService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.service.user.UserStatisticsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for user management operations.
 * Handles user registration, profile management, search, and user data retrieval.
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {

    private final UserService userService;
    private final UserRegistrationService userRegistrationService;
    private final UserStatisticsService userStatisticsService;
    private final StorageService storageService;
    private final TransactionService transactionService;
    private final DailyLoginRewardService dailyLoginRewardService;
    private final FriendshipService friendshipService;
    private final EmailChangeService emailChangeService;
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Autowired
    public UserController(UserService userService, UserRegistrationService userRegistrationService,
                         UserStatisticsService userStatisticsService, StorageService storageService,
                         TransactionService transactionService, DailyLoginRewardService dailyLoginRewardService,
                         FriendshipService friendshipService, EmailChangeService emailChangeService,
                         JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.userService = userService;
        this.userRegistrationService = userRegistrationService;
        this.userStatisticsService = userStatisticsService;
        this.storageService = storageService;
        this.transactionService = transactionService;
        this.dailyLoginRewardService = dailyLoginRewardService;
        this.friendshipService = friendshipService;
        this.emailChangeService = emailChangeService;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    // ==========================================
    // USER REGISTRATION
    // ==========================================

    /**
     * Register a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequestDto request) {
        try {
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
            return ResponseEntity.status(HttpStatus.CREATED).body(UserProfileResponseDto.fromUser(user));
        } catch (com.rivalpicks.exception.user.UserRegistrationException e) {
            return ResponseEntity.badRequest().body(new ErrorResponseDto(e.getMessage(), e.getErrorCode().name()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDto("An unexpected error occurred", "INTERNAL_ERROR"));
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
                request.lastName(),
                request.bio()
            );

            return ResponseEntity.ok(UserProfileResponseDto.fromUser(updatedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload profile picture for the currently authenticated user.
     * @param file The image file to upload (max 5MB, JPG/PNG/GIF/WebP)
     * @return Updated user profile with new profile picture URL
     */
    @PostMapping("/profile/picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            // Get authenticated user
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not authenticated");
            }

            // Get current user to check for existing profile picture
            User currentUser = userService.getUserById(userPrincipal.getUserId());
            String oldProfileImageUrl = currentUser.getProfileImageUrl();

            // Upload to public storage (profile pictures are always public)
            var uploadResult = storageService.uploadPublicFile(file, "profiles", userPrincipal.getUserId());

            // Update user's profile picture URL with the stored value
            User updatedUser = userService.updateProfilePicture(userPrincipal.getUserId(), uploadResult.storedValue());

            // Delete old profile picture if it exists
            if (oldProfileImageUrl != null && !oldProfileImageUrl.isEmpty()) {
                storageService.deleteFile(oldProfileImageUrl);
            }

            return ResponseEntity.ok(UserProfileResponseDto.fromUser(updatedUser));
        } catch (IllegalArgumentException e) {
            // Validation errors (file too large, wrong type, etc.)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to upload profile picture", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to upload profile picture");
        }
    }

    /**
     * Get current user's profile visibility setting.
     */
    @GetMapping("/profile/visibility")
    public ResponseEntity<?> getProfileVisibility() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            ProfileVisibility visibility = userService.getProfileVisibility(userPrincipal.getUserId());
            return ResponseEntity.ok(java.util.Map.of("visibility", visibility.name()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update current user's profile visibility setting.
     */
    @PutMapping("/profile/visibility")
    public ResponseEntity<?> updateProfileVisibility(@RequestBody java.util.Map<String, String> request) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String visibilityStr = request.get("visibility");
            if (visibilityStr == null || visibilityStr.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Visibility is required"));
            }

            ProfileVisibility visibility;
            try {
                visibility = ProfileVisibility.valueOf(visibilityStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "error", "Invalid visibility. Must be one of: PUBLIC, PRIVATE"));
            }

            ProfileVisibility updated = userService.updateProfileVisibility(userPrincipal.getUserId(), visibility);
            return ResponseEntity.ok(java.util.Map.of("visibility", updated.name()));
        } catch (Exception e) {
            log.error("Failed to update profile visibility", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get current user's notification preferences.
     */
    @GetMapping("/notification-preferences")
    public ResponseEntity<NotificationPreferencesDto> getNotificationPreferences() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            NotificationPreferencesDto preferences = userService.getNotificationPreferences(userPrincipal.getUserId());
            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            log.error("Failed to get notification preferences", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update current user's notification preferences.
     */
    @PutMapping("/notification-preferences")
    public ResponseEntity<NotificationPreferencesDto> updateNotificationPreferences(
            @RequestBody NotificationPreferencesDto preferences) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            NotificationPreferencesDto updated = userService.updateNotificationPreferences(
                userPrincipal.getUserId(), preferences);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Failed to update notification preferences", e);
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
    // USERNAME & EMAIL CHANGES
    // ==========================================

    /**
     * Change current user's username.
     * Returns new JWT tokens since username is embedded in the token subject.
     */
    @PutMapping("/profile/username")
    public ResponseEntity<?> changeUsername(@Valid @RequestBody UsernameChangeRequestDto request) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User updatedUser = userService.changeUsername(userPrincipal.getUserId(), request.newUsername());

            // Generate new tokens with the updated username
            UserDetails userDetails = userDetailsService.loadUserByUsername(updatedUser.getUsername());
            String newAccessToken = jwtService.generateAccessToken(userDetails, updatedUser.getId());
            String newRefreshToken = jwtService.generateRefreshToken(userDetails, updatedUser.getId());

            return ResponseEntity.ok(new UsernameChangeResponseDto(
                true,
                "Username changed successfully",
                updatedUser.getUsername(),
                newAccessToken,
                newRefreshToken
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UsernameChangeResponseDto(
                false,
                e.getMessage(),
                null,
                null,
                null
            ));
        } catch (Exception e) {
            log.error("Failed to change username", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new UsernameChangeResponseDto(false, "Failed to change username", null, null, null));
        }
    }

    /**
     * Request email change - sends verification email to new address.
     * Requires current password for security.
     */
    @PostMapping("/profile/email/request")
    public ResponseEntity<?> requestEmailChange(@Valid @RequestBody EmailChangeRequestDto request) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            emailChangeService.requestEmailChange(
                userPrincipal.getUserId(),
                request.newEmail(),
                request.currentPassword()
            );

            return ResponseEntity.ok(new EmailChangeResponseDto(
                true,
                "Verification email sent to " + request.newEmail() + ". Please check your inbox.",
                request.newEmail()
            ));
        } catch (com.rivalpicks.exception.AuthenticationException.InvalidCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new EmailChangeResponseDto(false, e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new EmailChangeResponseDto(false, e.getMessage(), null));
        } catch (Exception e) {
            log.error("Failed to request email change", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new EmailChangeResponseDto(false, "Failed to request email change", null));
        }
    }

    /**
     * Confirm email change with verification token.
     */
    @PostMapping("/profile/email/confirm")
    public ResponseEntity<?> confirmEmailChange(@Valid @RequestBody EmailChangeConfirmRequestDto request) {
        try {
            User updatedUser = emailChangeService.confirmEmailChange(request.token());
            return ResponseEntity.ok(new EmailChangeResponseDto(
                true,
                "Email changed successfully",
                updatedUser.getEmail()
            ));
        } catch (com.rivalpicks.exception.AuthenticationException.InvalidCredentialsException e) {
            return ResponseEntity.badRequest()
                .body(new EmailChangeResponseDto(false, e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new EmailChangeResponseDto(false, e.getMessage(), null));
        } catch (Exception e) {
            log.error("Failed to confirm email change", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new EmailChangeResponseDto(false, "Failed to confirm email change", null));
        }
    }

    /**
     * Validate email change token (for frontend to check before showing confirm screen).
     */
    @GetMapping("/profile/email/validate")
    public ResponseEntity<?> validateEmailChangeToken(@RequestParam String token) {
        try {
            boolean valid = emailChangeService.validateToken(token);
            if (valid) {
                String pendingEmail = emailChangeService.getPendingEmailForToken(token).orElse(null);
                return ResponseEntity.ok(java.util.Map.of(
                    "valid", true,
                    "pendingEmail", pendingEmail != null ? pendingEmail : ""
                ));
            } else {
                return ResponseEntity.ok(java.util.Map.of(
                    "valid", false,
                    "message", "Token is invalid or expired"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Map.of(
                "valid", false,
                "message", "Failed to validate token"
            ));
        }
    }

    // ==========================================
    // USER DATA RETRIEVAL
    // ==========================================

    /**
     * Get user by ID.
     * Returns full profile if:
     * - Viewer is the profile owner
     * - Profile is PUBLIC
     * - Profile is FRIENDS and viewer is a friend
     * Returns limited profile otherwise.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            Long viewerId = userPrincipal != null ? userPrincipal.getUserId() : null;

            User user = userService.getUserById(id);

            // Owner always sees full profile
            if (viewerId != null && viewerId.equals(id)) {
                return ResponseEntity.ok(UserProfileResponseDto.fromUser(user));
            }

            // Check profile visibility
            ProfileVisibility visibility = userService.getProfileVisibility(id);

            switch (visibility) {
                case PUBLIC:
                    return ResponseEntity.ok(UserProfileResponseDto.fromUser(user));

                case PRIVATE:
                default:
                    // PRIVATE means friends-only: friends can see full profile
                    if (viewerId != null && friendshipService.areFriends(viewerId, id)) {
                        return ResponseEntity.ok(UserProfileResponseDto.fromUser(user));
                    }
                    return ResponseEntity.ok(LimitedUserProfileResponseDto.fromUser(user,
                        "Add as friend to view full profile"));
            }
        } catch (com.rivalpicks.exception.user.UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search users by name with pagination.
     */
    @GetMapping("/search")
    public ResponseEntity<PagedResponseDto<UserSearchResultResponseDto>> searchUsers(
            @RequestParam @NotBlank String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "username"));
        Page<User> usersPage = userService.searchUsersPaginated(q, userPrincipal.getUserId(), pageable);

        List<UserSearchResultResponseDto> results = usersPage.getContent().stream()
            .map(UserSearchResultResponseDto::fromUser)
            .toList();

        return ResponseEntity.ok(new PagedResponseDto<>(
            results,
            usersPage.getNumber(),
            usersPage.getSize(),
            usersPage.getTotalElements()
        ));
    }

    /**
     * Get user statistics.
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<UserStatisticsService.UserStatistics> getUserStats(@PathVariable Long id) {
        try {
            UserStatisticsService.UserStatistics stats = userStatisticsService.getUserStatistics(id);
            return ResponseEntity.ok(stats);
        } catch (com.rivalpicks.exception.user.UserNotFoundException e) {
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

    /**
     * Get transaction history for the current user.
     * @param page Page number (0-indexed, default: 0)
     * @param size Page size (default: 20)
     * @return Paginated list of transactions
     */
    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionResponseDto>> getUserTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User user = userService.getUserById(userPrincipal.getUserId());
            Page<Transaction> transactions = transactionService.getUserTransactions(user, page, size);
            Page<TransactionResponseDto> transactionDtos = transactions.map(TransactionResponseDto::fromTransaction);

            return ResponseEntity.ok(transactionDtos);
        } catch (Exception e) {
            log.error("Failed to get transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get daily reward status for current user.
     */
    @GetMapping("/daily-reward-status")
    public ResponseEntity<?> getDailyRewardStatus() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User user = userService.getUserById(userPrincipal.getUserId());
            DailyLoginRewardService.DailyRewardStatus status = dailyLoginRewardService.getDailyRewardStatus(user);

            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to get daily reward status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==========================================
    // PUSH NOTIFICATIONS
    // ==========================================

    /**
     * Register or update push notification token for the current user.
     */
    @PostMapping("/push-token")
    public ResponseEntity<?> registerPushToken(@RequestBody java.util.Map<String, String> request) {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = request.get("token");
            String platformStr = request.get("platform");

            if (token == null || token.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Push token is required"));
            }

            User.DevicePlatform platform = User.DevicePlatform.IOS; // Default
            if (platformStr != null) {
                try {
                    platform = User.DevicePlatform.valueOf(platformStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                        .body(java.util.Map.of("error", "Invalid platform. Must be IOS, ANDROID, or WEB"));
                }
            }

            userService.registerPushToken(userPrincipal.getUserId(), token, platform);
            return ResponseEntity.ok(java.util.Map.of("message", "Push token registered successfully"));
        } catch (Exception e) {
            log.error("Failed to register push token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error", "Failed to register push token"));
        }
    }

    /**
     * Remove push notification token for the current user (e.g., on logout).
     */
    @DeleteMapping("/push-token")
    public ResponseEntity<?> removePushToken() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            userService.clearPushToken(userPrincipal.getUserId());
            return ResponseEntity.ok(java.util.Map.of("message", "Push token removed successfully"));
        } catch (Exception e) {
            log.error("Failed to remove push token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error", "Failed to remove push token"));
        }
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