package com.rivalpicks.service.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.rivalpicks.dto.auth.request.AppleAuthRequestDto;
import com.rivalpicks.dto.auth.request.ChangePasswordRequestDto;
import com.rivalpicks.dto.auth.request.CreatePasswordRequestDto;
import com.rivalpicks.dto.auth.request.GoogleAuthRequestDto;
import com.rivalpicks.dto.auth.request.LoginRequestDto;
import com.rivalpicks.dto.auth.request.RefreshTokenRequestDto;
import org.jose4j.jwk.HttpsJwks;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.HttpsJwksVerificationKeyResolver;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.rivalpicks.util.SecurityContextUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
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
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    // Google OAuth Web Client ID - should match the one used in the mobile app
    private static final String GOOGLE_CLIENT_ID = "46395801472-bl69o6cbgtnek5e8uljom7bm02biqpt3.apps.googleusercontent.com";

    // Apple Sign-In configuration
    private static final String APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private static final String APPLE_BUNDLE_ID = "com.rivalpicks.app";

    private final HttpsJwksVerificationKeyResolver appleKeyResolver;

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

        // Initialize Google ID token verifier
        this.googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                .build();

        // Initialize Apple JWKS key resolver
        HttpsJwks appleJwks = new HttpsJwks(APPLE_JWKS_URL);
        this.appleKeyResolver = new HttpsJwksVerificationKeyResolver(appleJwks);

        log.info("AuthService initialized with all dependencies");
        log.info("Google OAuth configured with client ID: {}...", GOOGLE_CLIENT_ID.substring(0, 20));
        log.info("Apple Sign-In configured with bundle ID: {}", APPLE_BUNDLE_ID);
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
     * Creates a password for OAuth users who don't have one.
     */
    public void createPassword(CreatePasswordRequestDto createPasswordRequest) {
        log.debug("Processing create password request");

        // Get current user from security context
        UserDetailsServiceImpl.UserPrincipal userPrincipal = SecurityContextUtil.getCurrentUserPrincipal()
            .orElseThrow(() -> {
                log.warn("Create password attempted without valid authentication");
                return new AuthenticationException.InvalidCredentialsException("User not authenticated");
            });

        // Create password using authentication service
        authenticationService.createPassword(
            userPrincipal.getUserId(),
            createPasswordRequest.newPassword()
        );

        log.info("Password created successfully for user: {}", userPrincipal.getUsername());
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
     *
     * Note: Similar to Apple, we store the Google user ID (sub claim) to reliably
     * identify users even if they change their email address.
     */
    public LoginResponseDto loginWithGoogle(GoogleAuthRequestDto googleAuthRequest) {
        log.debug("Processing Google login request for email: {}", googleAuthRequest.email());

        // Verify the Google ID token using Google's API
        GoogleIdToken idToken;
        try {
            idToken = googleIdTokenVerifier.verify(googleAuthRequest.idToken());
            if (idToken == null) {
                log.error("Google ID token verification returned null - token is invalid");
                throw new AuthenticationException.InvalidCredentialsException("Invalid Google token");
            }
            log.debug("Google ID token verified successfully");
        } catch (Exception e) {
            log.error("Failed to verify Google ID token: {}", e.getMessage());
            throw new AuthenticationException.InvalidCredentialsException("Invalid Google token");
        }

        // Get payload from verified token
        GoogleIdToken.Payload payload = idToken.getPayload();
        String tokenEmail = payload.getEmail();
        String googleUserId = payload.getSubject(); // Google's unique user ID

        log.debug("Google token payload - email: {}, sub: {}", tokenEmail, googleUserId);

        // Verify email matches
        if (tokenEmail == null || !tokenEmail.equalsIgnoreCase(googleAuthRequest.email())) {
            log.warn("Email mismatch: token={}, request={}", tokenEmail, googleAuthRequest.email());
            throw new AuthenticationException.InvalidCredentialsException("Email mismatch");
        }

        // Verify email is verified by Google
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            log.warn("Google email not verified for: {}", tokenEmail);
            throw new AuthenticationException.InvalidCredentialsException("Google email not verified");
        }

        // Try to find existing user by Google user ID first (reliable for subsequent logins)
        User user;
        Optional<User> existingUser = userService.getUserByGoogleUserId(googleUserId);

        if (existingUser.isEmpty()) {
            // First sign-in or legacy user - check if user exists by email (for account linking)
            existingUser = userService.getUserByEmail(googleAuthRequest.email());
        }

        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Link Google user ID if not already set (first Google sign-in for existing account)
            if (user.getGoogleUserId() == null) {
                user.setGoogleUserId(googleUserId);
                log.info("Linked Google user ID {} to existing user: {}", googleUserId, user.getUsername());
            }
            log.info("Existing user found for Google login: {}", user.getUsername());
        } else {
            // Create new user from Google account
            log.info("Creating new user from Google account: {}", googleAuthRequest.email());
            user = new User();
            user.setGoogleUserId(googleUserId);
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            user.setEmail(googleAuthRequest.email());
            user.setFirstName(googleAuthRequest.firstName());
            user.setLastName(googleAuthRequest.lastName());
            // Note: Profile image is NOT set from Google - frontend will show initials
            // Users can upload their own profile image later
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
            user.setHasPassword(false);
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
     * Authenticates user via Apple Sign-In and returns login response with tokens.
     * Creates a new user account if one doesn't exist for this Apple account.
     *
     * Note: Apple only provides email and name on FIRST sign-in.
     * We must store this info and use the Apple user ID for subsequent lookups.
     */
    public LoginResponseDto loginWithApple(AppleAuthRequestDto appleAuthRequest) {
        log.info("Processing Apple login request for user ID: {}", appleAuthRequest.userId());
        log.debug("Apple auth request details - email: {}, firstName: {}, lastName: {}",
            appleAuthRequest.email(), appleAuthRequest.firstName(), appleAuthRequest.lastName());

        // Verify the Apple identity token
        JwtClaims claims;
        try {
            log.debug("Building JWT consumer with issuer: {} and audience: {}", APPLE_ISSUER, APPLE_BUNDLE_ID);
            JwtConsumer jwtConsumer = new JwtConsumerBuilder()
                    .setVerificationKeyResolver(appleKeyResolver)
                    .setExpectedIssuer(APPLE_ISSUER)
                    .setExpectedAudience(APPLE_BUNDLE_ID)
                    .setRequireExpirationTime()
                    .setRequireSubject()
                    .build();

            log.debug("Processing Apple identity token...");
            claims = jwtConsumer.processToClaims(appleAuthRequest.identityToken());
            log.info("Apple identity token verified successfully");
        } catch (Exception e) {
            log.error("Failed to verify Apple identity token. Error type: {}, Message: {}",
                e.getClass().getSimpleName(), e.getMessage(), e);
            throw new AuthenticationException.InvalidCredentialsException(
                "Invalid Apple token: " + e.getMessage()
            );
        }

        // Extract subject (Apple user ID) from token
        String tokenSubject;
        try {
            tokenSubject = claims.getSubject();
        } catch (MalformedClaimException e) {
            log.error("Failed to extract subject from Apple token: {}", e.getMessage());
            throw new AuthenticationException.InvalidCredentialsException("Invalid Apple token");
        }

        // Verify user ID matches
        if (!tokenSubject.equals(appleAuthRequest.userId())) {
            log.warn("Apple user ID mismatch: token={}, request={}", tokenSubject, appleAuthRequest.userId());
            throw new AuthenticationException.InvalidCredentialsException("Apple user ID mismatch");
        }

        // Try to find existing user by Apple user ID first (reliable for subsequent logins)
        User user;
        Optional<User> existingUser = userService.getUserByAppleUserId(appleAuthRequest.userId());

        if (existingUser.isEmpty() && appleAuthRequest.email() != null && !appleAuthRequest.email().isEmpty()) {
            // First sign-in with email provided - check if user exists by email (for account linking)
            existingUser = userService.getUserByEmail(appleAuthRequest.email());
        }

        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Link Apple user ID if not already set (first Apple sign-in for existing account)
            if (user.getAppleUserId() == null) {
                user.setAppleUserId(appleAuthRequest.userId());
                log.info("Linked Apple user ID {} to existing user: {}", appleAuthRequest.userId(), user.getUsername());
            }
            log.info("Existing user found for Apple login: {}", user.getUsername());
        } else {
            // Create new user from Apple account
            log.info("Creating new user from Apple account: {}", appleAuthRequest.userId());
            user = new User();
            user.setAppleUserId(appleAuthRequest.userId());
            user.setAuthProvider(User.AuthProvider.APPLE);

            // Set email - use provided email or generate placeholder
            String userEmail = (appleAuthRequest.email() != null && !appleAuthRequest.email().isEmpty())
                ? appleAuthRequest.email()
                : appleAuthRequest.userId() + "@privaterelay.appleid.com";
            user.setEmail(userEmail);

            // Apple only provides name on first sign-in
            if (appleAuthRequest.firstName() != null) {
                user.setFirstName(appleAuthRequest.firstName());
            }
            if (appleAuthRequest.lastName() != null) {
                user.setLastName(appleAuthRequest.lastName());
            }

            user.setEmailVerified(true); // Apple accounts are verified
            user.setIsActive(true);

            // Generate unique username
            String baseUsername;
            if (appleAuthRequest.firstName() != null && !appleAuthRequest.firstName().isEmpty()) {
                baseUsername = appleAuthRequest.firstName().toLowerCase().replaceAll("[^a-z0-9_]", "");
            } else {
                baseUsername = "user";
            }

            String username = baseUsername;
            int suffix = 1;
            while (userService.getUserByUsername(username).isPresent()) {
                username = baseUsername + suffix++;
            }
            user.setUsername(username);

            // Set a random password (user can't login with password, only Apple)
            user.setPasswordHash(UUID.randomUUID().toString());
            user.setHasPassword(false);
        }

        // Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userService.saveUser(user);
        log.info("User saved after Apple login - User: {}, Username: {}", savedUser.getId(), savedUser.getUsername());

        // Award daily login reward if eligible
        try {
            DailyLoginRewardService.DailyRewardResult result = dailyLoginRewardService.checkAndAwardDailyReward(savedUser);
            if (result.wasAwarded()) {
                savedUser = userService.getUserById(savedUser.getId());
                log.info("Daily reward awarded for Apple login user: {}", savedUser.getId());
            }
        } catch (Exception e) {
            log.error("Daily login reward failed for Apple user: {}", savedUser.getId(), e);
        }

        // Create UserPrincipal and generate tokens
        UserDetailsServiceImpl.UserPrincipal userPrincipal = new UserDetailsServiceImpl.UserPrincipal(savedUser);
        String accessToken = jwtService.generateAccessToken(userPrincipal, savedUser.getId());
        String refreshToken = jwtService.generateRefreshToken(userPrincipal, savedUser.getId());

        // Set authentication in security context
        SecurityContextUtil.setAuthentication(userPrincipal);

        // Create response
        UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(savedUser);

        log.info("Apple login successful for user: {}", savedUser.getUsername());
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