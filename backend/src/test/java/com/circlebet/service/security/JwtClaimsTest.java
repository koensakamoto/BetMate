package com.circlebet.service.security;

import com.circlebet.service.security.JwtClaims;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtClaims Unit Tests")
class JwtClaimsTest {

    @Test
    @DisplayName("Should create access token claims correctly")
    void should_CreateAccessTokenClaims_When_ForAccessTokenCalled() {
        // Given
        Long userId = 123L;
        
        // When
        JwtClaims claims = JwtClaims.forAccessToken(userId);
        
        // Then
        assertThat(claims.userId()).isEqualTo(userId);
        assertThat(claims.type()).isNull();
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should create refresh token claims correctly")
    void should_CreateRefreshTokenClaims_When_ForRefreshTokenCalled() {
        // Given
        Long userId = 456L;
        
        // When
        JwtClaims claims = JwtClaims.forRefreshToken(userId);
        
        // Then
        assertThat(claims.userId()).isEqualTo(userId);
        assertThat(claims.type()).isEqualTo("refresh");
        assertThat(claims.isAccessToken()).isFalse();
        assertThat(claims.isRefreshToken()).isTrue();
    }

    @Test
    @DisplayName("Should convert to claims map correctly for access token")
    void should_ConvertToClaimsMap_When_AccessToken() {
        // Given
        JwtClaims claims = JwtClaims.forAccessToken(789L);
        
        // When
        Map<String, Object> claimsMap = claims.toClaimsMap();
        
        // Then
        assertThat(claimsMap).hasSize(1);
        assertThat(claimsMap.get("userId")).isEqualTo(789L);
        assertThat(claimsMap.get("type")).isNull();
    }

    @Test
    @DisplayName("Should convert to claims map correctly for refresh token")
    void should_ConvertToClaimsMap_When_RefreshToken() {
        // Given
        JwtClaims claims = JwtClaims.forRefreshToken(101L);
        
        // When
        Map<String, Object> claimsMap = claims.toClaimsMap();
        
        // Then
        assertThat(claimsMap).hasSize(2);
        assertThat(claimsMap.get("userId")).isEqualTo(101L);
        assertThat(claimsMap.get("type")).isEqualTo("refresh");
    }

    @Test
    @DisplayName("Should create from claims map correctly with Long userId")
    void should_CreateFromClaimsMap_When_UserIdIsLong() {
        // Given
        Map<String, Object> claimsMap = Map.of(
            "userId", 202L,
            "type", "refresh"
        );
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isEqualTo(202L);
        assertThat(claims.type()).isEqualTo("refresh");
        assertThat(claims.isRefreshToken()).isTrue();
    }

    @Test
    @DisplayName("Should create from claims map correctly with Integer userId")
    void should_CreateFromClaimsMap_When_UserIdIsInteger() {
        // Given - JWT parsing often returns Integer instead of Long
        Map<String, Object> claimsMap = Map.of(
            "userId", 303,
            "type", "refresh"
        );
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isEqualTo(303L);
        assertThat(claims.type()).isEqualTo("refresh");
    }

    @Test
    @DisplayName("Should handle empty claims map")
    void should_HandleEmptyClaimsMap_When_NoClaimsProvided() {
        // Given
        Map<String, Object> claimsMap = Map.of();
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isNull();
        assertThat(claims.type()).isNull();
        assertThat(claims.isAccessToken()).isTrue(); // null type means access token
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should handle access token without type claim")
    void should_HandleAccessToken_When_NoTypeClaim() {
        // Given
        Map<String, Object> claimsMap = Map.of("userId", 404L);
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isEqualTo(404L);
        assertThat(claims.type()).isNull();
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should round trip through map conversion correctly")
    void should_RoundTripCorrectly_When_ConvertingToAndFromMap() {
        // Given
        JwtClaims originalClaims = JwtClaims.forRefreshToken(505L);
        
        // When - round trip conversion
        Map<String, Object> claimsMap = originalClaims.toClaimsMap();
        JwtClaims reconstructedClaims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(reconstructedClaims).isEqualTo(originalClaims);
    }

    @Test
    @DisplayName("Should handle null userId in claims map")
    void should_HandleNullUserId_When_UserIdIsNull() {
        // Given
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("userId", null);
        claimsMap.put("type", "refresh");
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isNull();
        assertThat(claims.type()).isEqualTo("refresh");
        assertThat(claims.isRefreshToken()).isTrue();
    }

    @Test
    @DisplayName("Should handle null type in claims map")
    void should_HandleNullType_When_TypeIsNull() {
        // Given
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("userId", 606L);
        claimsMap.put("type", null);
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isEqualTo(606L);
        assertThat(claims.type()).isNull();
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should handle invalid type values")
    void should_HandleInvalidType_When_TypeIsNotString() {
        // Given
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("userId", 707L);
        claimsMap.put("type", 123); // Non-string type
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isEqualTo(707L);
        assertThat(claims.type()).isNull(); // Non-string types are ignored
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should handle invalid userId types")
    void should_HandleInvalidUserId_When_UserIdIsNotNumeric() {
        // Given
        Map<String, Object> claimsMap = Map.of(
            "userId", "not-a-number",
            "type", "refresh"
        );
        
        // When
        JwtClaims claims = JwtClaims.fromClaimsMap(claimsMap);
        
        // Then
        assertThat(claims.userId()).isNull(); // Non-numeric userIds are ignored
        assertThat(claims.type()).isEqualTo("refresh");
        assertThat(claims.isRefreshToken()).isTrue();
    }

    @Test
    @DisplayName("Should handle toClaimsMap with null userId")
    void should_HandleToClaimsMap_When_UserIdIsNull() {
        // Given
        JwtClaims claims = new JwtClaims(null, "refresh");
        
        // When
        Map<String, Object> claimsMap = claims.toClaimsMap();
        
        // Then
        assertThat(claimsMap).hasSize(1); // Only type should be included
        assertThat(claimsMap.get("type")).isEqualTo("refresh");
        assertThat(claimsMap.containsKey("userId")).isFalse();
    }

    @Test
    @DisplayName("Should handle toClaimsMap with null type")
    void should_HandleToClaimsMap_When_TypeIsNull() {
        // Given
        JwtClaims claims = new JwtClaims(808L, null);
        
        // When
        Map<String, Object> claimsMap = claims.toClaimsMap();
        
        // Then
        assertThat(claimsMap).hasSize(1); // Only userId should be included
        assertThat(claimsMap.get("userId")).isEqualTo(808L);
        assertThat(claimsMap.containsKey("type")).isFalse();
    }

    @Test
    @DisplayName("Should handle toClaimsMap with both null values")
    void should_HandleToClaimsMap_When_BothValuesAreNull() {
        // Given
        JwtClaims claims = new JwtClaims(null, null);
        
        // When
        Map<String, Object> claimsMap = claims.toClaimsMap();
        
        // Then
        assertThat(claimsMap).isEmpty(); // No claims should be included
    }

    @Test
    @DisplayName("Should correctly identify custom token types")
    void should_IdentifyCustomTokenTypes_When_TypeIsCustom() {
        // Given
        JwtClaims claims = new JwtClaims(909L, "custom");
        
        // When & Then
        assertThat(claims.isAccessToken()).isTrue(); // Only "refresh" is not an access token
        assertThat(claims.isRefreshToken()).isFalse(); // Only "refresh" is a refresh token
    }

    @Test
    @DisplayName("Should maintain constants values")
    void should_MaintainConstantValues_When_CheckingTokenTypes() {
        // Then
        assertThat(JwtClaims.ACCESS_TOKEN_TYPE).isNull();
        assertThat(JwtClaims.REFRESH_TOKEN_TYPE).isEqualTo("refresh");
    }
}