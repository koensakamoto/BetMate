package com.rivalpicks.controller;

import com.rivalpicks.dto.auth.request.AppleAuthRequestDto;
import com.rivalpicks.dto.auth.request.ChangePasswordRequestDto;
import com.rivalpicks.dto.auth.request.ForgotPasswordRequestDto;
import com.rivalpicks.dto.auth.request.GoogleAuthRequestDto;
import com.rivalpicks.dto.auth.request.LoginRequestDto;
import com.rivalpicks.dto.auth.request.RefreshTokenRequestDto;
import com.rivalpicks.dto.auth.request.ResetPasswordRequestDto;
import com.rivalpicks.dto.auth.response.LoginResponseDto;
import com.rivalpicks.dto.auth.response.TokenResponseDto;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;
import com.rivalpicks.service.auth.AuthService;
import com.rivalpicks.service.security.PasswordResetService;
import com.rivalpicks.service.security.RateLimitingService;
import com.rivalpicks.service.security.RateLimitingService.RateLimitResult;
import com.rivalpicks.service.security.RateLimitingService.RateLimitType;
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
    private final PasswordResetService passwordResetService;
    private final RateLimitingService rateLimitingService;

    @Autowired
    public AuthController(AuthService authService, PasswordResetService passwordResetService,
                          RateLimitingService rateLimitingService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.rateLimitingService = rateLimitingService;
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

    /**
     * Authenticate user via Apple Sign-In.
     */
    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<LoginResponseDto>> loginWithApple(@Valid @RequestBody AppleAuthRequestDto appleAuthRequest) {
        LoginResponseDto loginResponse = authService.loginWithApple(appleAuthRequest);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(loginResponse, "Apple login successful");
        return ResponseEntity.ok(response);
    }

    /**
     * Request password reset email.
     * Always returns success to prevent email enumeration.
     * Rate limited by email address (in addition to IP-based rate limiting from filter).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto forgotPasswordRequest) {
        // Additional rate limiting by email address to prevent abuse from multiple IPs
        String email = forgotPasswordRequest.email().toLowerCase().trim();
        RateLimitResult result = rateLimitingService.tryConsume("email:" + email, RateLimitType.FORGOT_PASSWORD);

        if (!result.allowed()) {
            // Still return success message to prevent email enumeration,
            // but don't actually send the email
            ApiResponse<Void> response = ApiResponse.success("If an account exists with this email, you will receive a password reset link shortly.");
            return ResponseEntity.ok(response);
        }

        passwordResetService.requestPasswordReset(email);
        ApiResponse<Void> response = ApiResponse.success("If an account exists with this email, you will receive a password reset link shortly.");
        return ResponseEntity.ok(response);
    }

    /**
     * Reset password using a valid reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDto resetPasswordRequest) {
        passwordResetService.resetPassword(resetPasswordRequest.token(), resetPasswordRequest.newPassword());
        ApiResponse<Void> response = ApiResponse.success("Password has been reset successfully. You can now log in with your new password.");
        return ResponseEntity.ok(response);
    }

    /**
     * Validate a password reset token.
     * Used by frontend to check if token is valid before showing reset form.
     */
    @GetMapping("/reset-password/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.validateToken(token);
        ApiResponse<Boolean> response = ApiResponse.success(isValid, isValid ? "Token is valid" : "Token is invalid or expired");
        return ResponseEntity.ok(response);
    }

}