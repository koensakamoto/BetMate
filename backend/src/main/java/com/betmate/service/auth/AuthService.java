package com.betmate.service.auth;

import com.betmate.dto.auth.request.ChangePasswordRequestDto;
import com.betmate.dto.auth.request.LoginRequestDto;
import com.betmate.dto.auth.request.RefreshTokenRequestDto;
import com.betmate.dto.auth.response.LoginResponseDto;
import com.betmate.dto.auth.response.TokenResponseDto;
import com.betmate.dto.user.response.UserProfileResponseDto;
import com.betmate.entity.user.User;
import com.betmate.exception.AuthenticationException;
import com.betmate.service.security.AuthenticationService;
import com.betmate.service.security.JwtService;
import com.betmate.service.security.UserDetailsServiceImpl;
import com.betmate.service.user.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.betmate.util.SecurityContextUtil;
import org.springframework.stereotype.Service;

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

    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
                      JwtService jwtService,
                      AuthenticationService authenticationService,
                      UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
        this.userService = userService;
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
        log.info("User authenticated successfully: {}", user.getUsername());

        // Set the authentication in the security context for the current session
        SecurityContextUtil.setAuthentication(authentication);
        log.debug("Authentication set in SecurityContextHolder for user: {}", user.getUsername());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(userPrincipal, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userPrincipal, user.getId());

        // Create response with user info
        UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(user);
        
        log.debug("Login tokens generated for user: {}", user.getUsername());
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
     * Helper method to get user by username with proper exception handling.
     */
    private User getUserByUsername(String username) {
        return userService.getUserByUsername(username)
            .orElseThrow(() -> new com.betmate.exception.user.UserNotFoundException("User not found: " + username));
    }
}