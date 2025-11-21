package com.rivalpicks.dto.auth.response;

import com.rivalpicks.dto.user.response.UserProfileResponseDto;

/**
 * Response DTO for successful login.
 * Contains JWT tokens and user information.
 */
public class LoginResponseDto {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserProfileResponseDto user;

    public LoginResponseDto(String accessToken, String refreshToken, long expiresIn, UserProfileResponseDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    // Getters
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getTokenType() { return tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public UserProfileResponseDto getUser() { return user; }
}