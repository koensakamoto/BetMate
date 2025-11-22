package com.rivalpicks.service.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.rivalpicks.dto.auth.request.ChangePasswordRequestDto;
import com.rivalpicks.dto.auth.request.GoogleAuthRequestDto;
import com.rivalpicks.dto.auth.request.LoginRequestDto;
import com.rivalpicks.dto.auth.request.RefreshTokenRequestDto;
import com.rivalpicks.dto.auth.response.LoginResponseDto;
import com.rivalpicks.dto.auth.response.TokenResponseDto;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.AuthenticationException;
import com.rivalpicks.service.security.AuthenticationService;
import com.rivalpicks.service.security.JwtService;
import com.rivalpicks.service.security.UserDetailsServiceImpl;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.service.user.DailyLoginRewardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.rivalpicks.util.SecurityContextUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for handling authentication business logic.
 * Centralizes all authentication operations including login, token refresh,
 * password management, and user session handling.
 */
@Slf4j
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final DailyLoginRewardService dailyLoginRewardService;

    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
                      JwtService jwtService,
                      AuthenticationService authenticationService,
                      UserService userService,
                      DailyLoginRewardService dailyLoginRewardService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
        this.userService = userService;
        this.dailyLoginRewardService = dailyLoginRewardService;
        log.info("AuthService initialized with all dependencies");
    }

    /**
     * Authenticates user credentials and returns login response with tokens.
     */
    public LoginResponseDto login(LoginRequestDto loginRequest) {
        log.debug("Processing login request for: {}", loginRequest.usernameOrEmail());

        // Authenticate the user
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.usernameOrEmail(),
                loginRequest.password()
            )
        );

        UserDetailsServiceImpl.UserPrincipal userPrincipal =
            (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();

        User user = userPrincipal.getUser();
        log.info("=== LOGIN SUCCESSFUL === User: {}, Username: {}", user.getId(), user.getUsername());

        // Update last login timestamp and handle successful login
        log.info("=== UPDATING LOGIN TIMESTAMP === User: {}", user.getId());
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userService.saveUser(user);
        log.info("User saved after login - User: {}, LastLoginAt: {}", savedUser.getId(), savedUser.getLastLoginAt());

        // Award daily login reward if eligible
        log.info("=== ATTEMPTING DAILY LOGIN REWARD === User: {}", savedUser.getId());
        try {
            DailyLoginRewardService.DailyRewardResult result = dailyLoginRewardService.checkAndAwardDailyReward(savedUser);
            log.info("=== DAILY LOGIN REWARD RESULT === User: {}, WasAwarded: {}, Amount: {}, ClaimedAt: {}",
                savedUser.getId(), result.wasAwarded(), result.amountAwarded(), result.claimedAt());

            // Refresh user to get updated credit balance
            if (result.wasAwarded()) {
                savedUser = userService.getUserById(savedUser.getId());
                log.info("User refreshed with new credit balance: {}", savedUser.getCreditBalance());
            }
        } catch (Exception e) {
            log.error("=== DAILY LOGIN REWARD FAILED === User: {}, Error: {}", savedUser.getId(), e.getMessage(), e);
        }
        log.info("=== LOGIN HANDLER END === User: {}", savedUser.getId());

        // Set the authentication in the security context for the current session
        SecurityContextUtil.setAuthentication(authentication);
        log.debug("Authentication set in SecurityContextHolder for user: {}", savedUser.getUsername());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(userPrincipal, savedUser.getId());
        String refreshToken = jwtService.generateRefreshToken(userPrincipal, savedUser.getId());

        // Create response with user info (using savedUser with potentially updated credits)
        UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(savedUser);

        log.debug("Login tokens generated for user: {}", savedUser.getUsername());
        return new LoginResponseDto(
            accessToken,
            refreshToken,
            jwtService.getJwtExpiration() / 1000, // Convert to seconds
            userResponse
        );
    }

    /**
     * Refreshes JWT access token using a valid refresh token.
     * Coordinates between JwtService and UserService to handle domain logic.
     */
    public TokenResponseDto refreshToken(RefreshTokenRequestDto refreshRequest) {
        log.debug("Processing token refresh request");
        
        // Validate refresh token
        if (!jwtService.validateRefreshToken(refreshRequest.refreshToken())) {
            log.warn("Invalid refresh token provided");
            throw new AuthenticationException.InvalidCredentialsException("Invalid refresh token");
        }
        
        // Extract user information from refresh token
        String username = jwtService.extractUsername(refreshRequest.refreshToken());
        Long userId = jwtService.extractUserId(refreshRequest.refreshToken());
        
        log.debug("Processing token refresh for user: {}", username);
        
        // Get user from database
        User user = getUserByUsername(username);
        UserDetailsServiceImpl.UserPrincipal userPrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(user);
        
        // Generate new tokens using pure JwtService
        String newAccessToken = jwtService.generateAccessToken(userPrincipal, userId);
        String newRefreshToken = jwtService.generateRefreshToken(userPrincipal, userId);
        TokenResponseDto tokenResponse = new TokenResponseDto(
            newAccessToken,
            newRefreshToken,
            jwtService.getJwtExpiration() / 1000 // Convert to seconds
        );
        
        // Set authentication in security context for token refresh
        SecurityContextUtil.setAuthentication(userPrincipal);
        log.debug("Authentication set in SecurityContextHolder for token refresh, user: {}", username);
        
        log.info("Token refresh completed successfully for user: {}", username);
        return tokenResponse;
    }

    /**
     * Changes password for the currently authenticated user.
     */
    public void changePassword(ChangePasswordRequestDto changePasswordRequest) {
        log.debug("Processing password change request");
        
        // Get current user from security context
        UserDetailsServiceImpl.UserPrincipal userPrincipal = SecurityContextUtil.getCurrentUserPrincipal()
            .orElseThrow(() -> {
                log.warn("Password change attempted without valid authentication");
                return new AuthenticationException.InvalidCredentialsException("User not authenticated");
            });

        // Change password using authentication service
        authenticationService.changePassword(
            userPrincipal.getUserId(),
            changePasswordRequest.currentPassword(),
            changePasswordRequest.newPassword()
        );
        
        log.info("Password changed successfully for user: {}", userPrincipal.getUsername());
    }

    /**
     * Gets the current authenticated user's profile information.
     */
    public UserProfileResponseDto getCurrentUserProfile() {
        log.debug("Getting current user profile");
        
        User user = SecurityContextUtil.getCurrentUser()
            .orElseThrow(() -> {
                log.warn("Profile access attempted without valid authentication");
                return new AuthenticationException.InvalidCredentialsException("User not authenticated");
            });

        log.debug("Returning profile for user: {}", user.getUsername());
        return UserProfileResponseDto.fromUser(user);
    }


    /**
     * Authenticates user via Google OAuth and returns login response with tokens.
     * Creates a new user account if one doesn't exist for this Google account.
     */
    public LoginResponseDto loginWithGoogle(GoogleAuthRequestDto googleAuthRequest) {
        log.debug("Processing Google login request for email: {}", googleAuthRequest.email());

        // Verify the Google ID token with Firebase
        FirebaseToken decodedToken;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(googleAuthRequest.idToken());
            log.debug("Google ID token verified successfully for: {}", decodedToken.getEmail());
        } catch (FirebaseAuthException e) {
            log.error("Failed to verify Google ID token: {}", e.getMessage());
            throw new AuthenticationException.InvalidCredentialsException("Invalid Google token");
        }

        // Verify email matches
        String tokenEmail = decodedToken.getEmail();
        if (tokenEmail == null || !tokenEmail.equalsIgnoreCase(googleAuthRequest.email())) {
            log.warn("Email mismatch: token={}, request={}", tokenEmail, googleAuthRequest.email());
            throw new AuthenticationException.InvalidCredentialsException("Email mismatch");
        }

        // Find or create user
        Optional<User> existingUser = userService.getUserByEmail(googleAuthRequest.email());
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("Existing user found for Google login: {}", user.getUsername());

            // Update profile image if provided and user doesn't have one
            if (googleAuthRequest.profileImageUrl() != null && user.getProfileImageUrl() == null) {
                user.setProfileImageUrl(googleAuthRequest.profileImageUrl());
            }
        } else {
            // Create new user from Google account
            log.info("Creating new user from Google account: {}", googleAuthRequest.email());
            user = new User();
            user.setEmail(googleAuthRequest.email());
            user.setFirstName(googleAuthRequest.firstName());
            user.setLastName(googleAuthRequest.lastName());
            user.setProfileImageUrl(googleAuthRequest.profileImageUrl());
            user.setEmailVerified(true); // Google accounts are verified
            user.setIsActive(true);

            // Generate unique username from email
            String baseUsername = googleAuthRequest.email().split("@")[0]
                .toLowerCase()
                .replaceAll("[^a-z0-9_]", "");
            String username = baseUsername;
            int suffix = 1;
            while (userService.getUserByUsername(username).isPresent()) {
                username = baseUsername + suffix++;
            }
            user.setUsername(username);

            // Set a random password (user can't login with password, only Google)
            user.setPasswordHash(UUID.randomUUID().toString());
        }

        // Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userService.saveUser(user);
        log.info("User saved after Google login - User: {}, Username: {}", savedUser.getId(), savedUser.getUsername());

        // Award daily login reward if eligible
        try {
            DailyLoginRewardService.DailyRewardResult result = dailyLoginRewardService.checkAndAwardDailyReward(savedUser);
            if (result.wasAwarded()) {
                savedUser = userService.getUserById(savedUser.getId());
                log.info("Daily reward awarded for Google login user: {}", savedUser.getId());
            }
        } catch (Exception e) {
            log.error("Daily login reward failed for Google user: {}", savedUser.getId(), e);
        }

        // Create UserPrincipal and generate tokens
        UserDetailsServiceImpl.UserPrincipal userPrincipal = new UserDetailsServiceImpl.UserPrincipal(savedUser);
        String accessToken = jwtService.generateAccessToken(userPrincipal, savedUser.getId());
        String refreshToken = jwtService.generateRefreshToken(userPrincipal, savedUser.getId());

        // Set authentication in security context
        SecurityContextUtil.setAuthentication(userPrincipal);

        // Create response
        UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(savedUser);

        log.info("Google login successful for user: {}", savedUser.getUsername());
        return new LoginResponseDto(
            accessToken,
            refreshToken,
            jwtService.getJwtExpiration() / 1000,
            userResponse
        );
    }

    /**
     * Helper method to get user by username with proper exception handling.
     */
    private User getUserByUsername(String username) {
        return userService.getUserByUsername(username)
            .orElseThrow(() -> new com.rivalpicks.exception.user.UserNotFoundException("User not found: " + username));
    }
}