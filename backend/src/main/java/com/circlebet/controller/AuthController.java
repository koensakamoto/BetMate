package com.circlebet.controller;

import com.circlebet.dto.auth.request.ChangePasswordRequestDto;
import com.circlebet.dto.auth.request.LoginRequestDto;
import com.circlebet.dto.auth.request.RefreshTokenRequestDto;
import com.circlebet.dto.auth.response.LoginResponseDto;
import com.circlebet.dto.auth.response.TokenResponseDto;
import com.circlebet.dto.user.response.UserProfileResponseDto;
import com.circlebet.entity.user.User;
import com.circlebet.service.security.AuthenticationService;
import com.circlebet.service.security.JwtService;
import com.circlebet.service.security.UserDetailsServiceImpl;
import com.circlebet.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations.
 * Handles login, logout, token refresh, and password management.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;
    private final UserService userService;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, 
                         JwtService jwtService,
                         AuthenticationService authenticationService,
                         UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
        this.userService = userService;
    }

    /**
     * Authenticate user and return JWT tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        try {
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

            // Generate tokens
            String accessToken = jwtService.generateAccessToken(userPrincipal, user.getId());
            String refreshToken = jwtService.generateRefreshToken(userPrincipal, user.getId());

            // Create response with user info
            UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(user);
            LoginResponseDto response = new LoginResponseDto(
                accessToken,
                refreshToken,
                jwtService.getJwtExpiration() / 1000, // Convert to seconds
                userResponse
            );

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Authentication failed"));
        }
    }

    /**
     * Refresh JWT access token using refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequestDto refreshRequest) {
        try {
            String refreshToken = refreshRequest.refreshToken();

            // Validate refresh token
            if (!jwtService.validateRefreshToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid refresh token"));
            }

            // Extract user information from refresh token
            String username = jwtService.extractUsername(refreshToken);
            Long userId = jwtService.extractUserId(refreshToken);

            // Generate new tokens
            UserDetailsServiceImpl.UserPrincipal userPrincipal = 
                new UserDetailsServiceImpl.UserPrincipal(getUserByUsername(username));
            
            String newAccessToken = jwtService.generateAccessToken(userPrincipal, userId);
            String newRefreshToken = jwtService.generateRefreshToken(userPrincipal, userId);

            TokenResponseDto response = new TokenResponseDto(
                newAccessToken,
                newRefreshToken,
                jwtService.getJwtExpiration() / 1000
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Token refresh failed"));
        }
    }

    /**
     * Change user password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequestDto changePasswordRequest) {
        try {
            // Get current user from security context
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("User not authenticated"));
            }

            // Change password using authentication service
            authenticationService.changePassword(
                userPrincipal.getUserId(),
                changePasswordRequest.currentPassword(),
                changePasswordRequest.newPassword()
            );

            return ResponseEntity.ok(new SuccessResponse("Password changed successfully"));

        } catch (AuthenticationService.InvalidPasswordException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Current password is incorrect"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Password change failed"));
        }
    }

    /**
     * Logout user (client-side token removal).
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // In a stateless JWT setup, logout is typically handled client-side
        // by removing the token from storage
        return ResponseEntity.ok(new SuccessResponse("Logged out successfully"));
    }

    /**
     * Get current authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserInfo() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("User not authenticated"));
            }

            UserProfileResponseDto userResponse = UserProfileResponseDto.fromUser(userPrincipal.getUser());
            return ResponseEntity.ok(userResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get user information"));
        }
    }

    // Helper methods
    private UserDetailsServiceImpl.UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsServiceImpl.UserPrincipal) {
            return (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
        }
        return null;
    }

    private User getUserByUsername(String username) {
        return userService.getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    // Response DTOs
    public record ErrorResponse(String message) {}
    public record SuccessResponse(String message) {}
}