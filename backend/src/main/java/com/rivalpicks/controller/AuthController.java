package com.rivalpicks.controller;

import com.rivalpicks.dto.auth.request.ChangePasswordRequestDto;
import com.rivalpicks.dto.auth.request.GoogleAuthRequestDto;
import com.rivalpicks.dto.auth.request.LoginRequestDto;
import com.rivalpicks.dto.auth.request.RefreshTokenRequestDto;
import com.rivalpicks.dto.auth.response.LoginResponseDto;
import com.rivalpicks.dto.auth.response.TokenResponseDto;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;
import com.rivalpicks.service.auth.AuthService;
import com.rivalpicks.dto.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations.
 * Delegates all business logic to AuthService and handles only HTTP concerns.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticate user and return JWT tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        LoginResponseDto loginResponse = authService.login(loginRequest);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(loginResponse, "Login successful");
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh JWT access token using refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponseDto>> refreshToken(@Valid @RequestBody RefreshTokenRequestDto refreshRequest) {
        TokenResponseDto tokenResponse = authService.refreshToken(refreshRequest);
        ApiResponse<TokenResponseDto> response = ApiResponse.success(tokenResponse, "Token refreshed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Change user password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequestDto changePasswordRequest) {
        authService.changePassword(changePasswordRequest);
        ApiResponse<Void> response = ApiResponse.success("Password changed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Logout user (client-side token removal).
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // In a stateless JWT setup, logout is typically handled client-side
        // by removing the token from storage
        ApiResponse<Void> response = ApiResponse.success("Logged out successfully");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get current authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getCurrentUserInfo() {
        UserProfileResponseDto userProfile = authService.getCurrentUserProfile();
        ApiResponse<UserProfileResponseDto> response = ApiResponse.success(userProfile, "User profile retrieved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Authenticate user via Google OAuth.
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponseDto>> loginWithGoogle(@Valid @RequestBody GoogleAuthRequestDto googleAuthRequest) {
        LoginResponseDto loginResponse = authService.loginWithGoogle(googleAuthRequest);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(loginResponse, "Google login successful");
        return ResponseEntity.ok(response);
    }

}