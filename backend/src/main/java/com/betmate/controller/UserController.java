package com.betmate.controller;

import com.betmate.dto.user.request.UserAvailabilityCheckRequestDto;
import com.betmate.dto.user.request.UserProfileUpdateRequestDto;
import com.betmate.dto.user.request.UserRegistrationRequestDto;
import com.betmate.dto.user.response.UserAvailabilityResponseDto;
import com.betmate.dto.user.response.UserProfileResponseDto;
import com.betmate.dto.user.response.UserSearchResultResponseDto;
import com.betmate.dto.user.response.TransactionResponseDto;
import com.betmate.entity.user.Transaction;
import com.betmate.entity.user.User;
import com.betmate.service.FileStorageService;
import com.betmate.service.security.UserDetailsServiceImpl;
import com.betmate.service.user.DailyLoginRewardService;
import com.betmate.service.user.TransactionService;
import com.betmate.service.user.UserRegistrationService;
import com.betmate.service.user.UserService;
import com.betmate.service.user.UserStatisticsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;
    private final TransactionService transactionService;
    private final DailyLoginRewardService dailyLoginRewardService;

    @Autowired
    public UserController(UserService userService, UserRegistrationService userRegistrationService,
                         UserStatisticsService userStatisticsService, FileStorageService fileStorageService,
                         TransactionService transactionService, DailyLoginRewardService dailyLoginRewardService) {
        this.userService = userService;
        this.userRegistrationService = userRegistrationService;
        this.userStatisticsService = userStatisticsService;
        this.fileStorageService = fileStorageService;
        this.transactionService = transactionService;
        this.dailyLoginRewardService = dailyLoginRewardService;
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
        } catch (com.betmate.exception.user.UserRegistrationException e) {
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
            System.out.println("=== PROFILE UPDATE DEBUG ===");
            System.out.println("firstName: " + request.firstName());
            System.out.println("lastName: " + request.lastName());
            System.out.println("bio: " + request.bio());
            
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
            
            System.out.println("Updated user bio: " + updatedUser.getBio());
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

            // Store the new file
            String fileName = fileStorageService.storeProfilePicture(file, userPrincipal.getUserId());

            // Generate the URL (relative path)
            String profileImageUrl = "/api/files/profile-pictures/" + fileName;

            // Update user's profile picture URL
            User updatedUser = userService.updateProfilePicture(userPrincipal.getUserId(), profileImageUrl);

            // Delete old profile picture if it exists
            if (oldProfileImageUrl != null && !oldProfileImageUrl.isEmpty()) {
                // Extract filename from URL
                String oldFileName = oldProfileImageUrl.substring(oldProfileImageUrl.lastIndexOf('/') + 1);
                fileStorageService.deleteFile(oldFileName);
            }

            return ResponseEntity.ok(UserProfileResponseDto.fromUser(updatedUser));
        } catch (IllegalArgumentException e) {
            // Validation errors (file too large, wrong type, etc.)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to upload profile picture: " + e.getMessage());
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
        } catch (com.betmate.exception.user.UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search users by name.
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResultResponseDto>> searchUsers(
            @RequestParam @NotBlank String q) {
        UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<User> users = userService.searchUsers(q, userPrincipal.getUserId());
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
        } catch (com.betmate.exception.user.UserNotFoundException e) {
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
            e.printStackTrace();
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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