package com.rivalpicks.service.security;

import com.rivalpicks.exception.JwtException;
import com.rivalpicks.service.security.JwtClaims;
import com.rivalpicks.service.security.JwtService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;
    
    // Test configuration values
    private static final String TEST_SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci1qd3QtdG9rZW4tZ2VuZXJhdGlvbi10ZXN0aW5nLXB1cnBvc2VzLW9ubHktbXVzdC1iZS0yNTYtYml0cw=="; // 256-bit Base64 key
    private static final long TEST_EXPIRATION = 3600000L; // 1 hour
    private static final long TEST_REFRESH_EXPIRATION = 86400000L; // 1 day
    private static final String TEST_USERNAME = "testuser";
    private static final Long TEST_USER_ID = 123L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, TEST_EXPIRATION, TEST_REFRESH_EXPIRATION);
        
        // Create concrete UserDetails implementation instead of mocking
        userDetails = User.withUsername(TEST_USERNAME)
            .password("password") // Required but not used in JWT tests
            .authorities("USER")  // Required but not used in JWT tests
            .build();
    }

    // ==================== Token Generation Tests ====================

    @Test
    @DisplayName("Should generate valid access token")
    void should_GenerateValidAccessToken_When_ValidInputProvided() {
        // When
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // Then
        assertThat(token).isNotNull().isNotBlank();
        
        // Verify token structure (JWT has 3 parts separated by dots)
        String[] tokenParts = token.split("\\.");
        assertThat(tokenParts).hasSize(3);
        
        // Verify claims
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_USERNAME);
        assertThat(jwtService.extractUserId(token)).isEqualTo(TEST_USER_ID);
        
        JwtClaims claims = jwtService.extractJwtClaims(token);
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.isRefreshToken()).isFalse();
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void should_GenerateValidRefreshToken_When_ValidInputProvided() {
        // When
        String token = jwtService.generateRefreshToken(userDetails, TEST_USER_ID);
        
        // Then
        assertThat(token).isNotNull().isNotBlank();
        
        // Verify claims
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_USERNAME);
        assertThat(jwtService.extractUserId(token)).isEqualTo(TEST_USER_ID);
        
        JwtClaims claims = jwtService.extractJwtClaims(token);
        assertThat(claims.isAccessToken()).isFalse();
        assertThat(claims.isRefreshToken()).isTrue();
    }

    @Test
    @DisplayName("Should generate tokens with different expiration times")
    void should_GenerateDifferentExpirationTimes_When_AccessVsRefreshToken() {
        // When
        String accessToken = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        String refreshToken = jwtService.generateRefreshToken(userDetails, TEST_USER_ID);
        
        // Then
        Date accessExpiration = jwtService.extractExpiration(accessToken);
        Date refreshExpiration = jwtService.extractExpiration(refreshToken);
        
        // Refresh token should expire later than access token
        assertThat(refreshExpiration).isAfter(accessExpiration);
        
        // Verify expiration times are approximately correct (allowing for small timing differences)
        Instant now = Instant.now();
        long expectedAccessExp = now.toEpochMilli() + TEST_EXPIRATION;
        long expectedRefreshExp = now.toEpochMilli() + TEST_REFRESH_EXPIRATION;
        
        assertThat(accessExpiration.getTime()).isBetween(expectedAccessExp - 1000, expectedAccessExp + 1000);
        assertThat(refreshExpiration.getTime()).isBetween(expectedRefreshExp - 1000, expectedRefreshExp + 1000);
    }

    // ==================== Token Validation Tests ====================

    @Test
    @DisplayName("Should validate correct access token")
    void should_ReturnTrue_When_ValidAccessToken() {
        // Given
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        boolean isValid = jwtService.validateToken(token, userDetails);
        
        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject refresh token used as access token")
    void should_ReturnFalse_When_RefreshTokenUsedAsAccessToken() {
        // Given
        String refreshToken = jwtService.generateRefreshToken(userDetails, TEST_USER_ID);
        
        // When
        boolean isValid = jwtService.validateToken(refreshToken, userDetails);
        
        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject token with wrong username")
    void should_ReturnFalse_When_TokenUsernameDoesNotMatch() {
        // Given
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        UserDetails differentUser = User.withUsername("differentuser")
            .password("password")
            .authorities("USER")
            .build();
        
        // When
        boolean isValid = jwtService.validateToken(token, differentUser);
        
        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should validate correct refresh token")
    void should_ReturnTrue_When_ValidRefreshToken() {
        // Given
        String token = jwtService.generateRefreshToken(userDetails, TEST_USER_ID);
        
        // When
        boolean isValid = jwtService.validateRefreshToken(token);
        
        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject access token used as refresh token")
    void should_ReturnFalse_When_AccessTokenUsedAsRefreshToken() {
        // Given
        String accessToken = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        boolean isValid = jwtService.validateRefreshToken(accessToken);
        
        // Then
        assertThat(isValid).isFalse();
    }

    // ==================== Token Extraction Tests ====================

    @Test
    @DisplayName("Should extract username correctly")
    void should_ExtractUsername_When_ValidToken() {
        // Given
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        String extractedUsername = jwtService.extractUsername(token);
        
        // Then
        assertThat(extractedUsername).isEqualTo(TEST_USERNAME);
    }

    @Test
    @DisplayName("Should extract user ID correctly")
    void should_ExtractUserId_When_ValidToken() {
        // Given
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        Long extractedUserId = jwtService.extractUserId(token);
        
        // Then
        assertThat(extractedUserId).isEqualTo(TEST_USER_ID);
    }

    @Test
    @DisplayName("Should extract expiration date correctly")
    void should_ExtractExpiration_When_ValidToken() {
        // Given
        Instant beforeGeneration = Instant.now();
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        Instant afterGeneration = Instant.now();
        
        // When
        Date extractedExpiration = jwtService.extractExpiration(token);
        
        // Then - Allow for reasonable timing variance (±5 seconds)
        long expectedExpiration = beforeGeneration.toEpochMilli() + TEST_EXPIRATION;
        long maxExpectedExpiration = afterGeneration.toEpochMilli() + TEST_EXPIRATION;
        
        assertThat(extractedExpiration.getTime())
            .isBetween(expectedExpiration - 5000, maxExpectedExpiration + 5000);
    }

    @Test
    @DisplayName("Should extract JWT claims correctly")
    void should_ExtractJwtClaims_When_ValidToken() {
        // Given
        String accessToken = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        String refreshToken = jwtService.generateRefreshToken(userDetails, TEST_USER_ID);
        
        // When
        JwtClaims accessClaims = jwtService.extractJwtClaims(accessToken);
        JwtClaims refreshClaims = jwtService.extractJwtClaims(refreshToken);
        
        // Then
        assertThat(accessClaims.userId()).isEqualTo(TEST_USER_ID);
        assertThat(accessClaims.isAccessToken()).isTrue();
        assertThat(accessClaims.isRefreshToken()).isFalse();
        
        assertThat(refreshClaims.userId()).isEqualTo(TEST_USER_ID);
        assertThat(refreshClaims.isAccessToken()).isFalse();
        assertThat(refreshClaims.isRefreshToken()).isTrue();
    }

    // ==================== Token Expiration Tests ====================

    @Test
    @DisplayName("Should identify non-expired token")
    void should_ReturnFalse_When_TokenIsNotExpired() {
        // Given
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        boolean isExpired = jwtService.isTokenExpired(token);
        
        // Then
        assertThat(isExpired).isFalse();
    }

    @Test
    @DisplayName("Should identify expired token")
    void should_ReturnTrue_When_TokenIsExpired() {
        // Given - Create JWT service with very short expiration
        JwtService shortExpirationService = new JwtService(TEST_SECRET, 1L, TEST_REFRESH_EXPIRATION); // 1ms expiration
        String token = shortExpirationService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // Wait for token to expire
        try {
            Thread.sleep(10); // Wait 10ms to ensure expiration
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // When
        boolean isExpired = jwtService.isTokenExpired(token);
        
        // Then
        assertThat(isExpired).isTrue();
    }

    // ==================== Error Handling Tests ====================

    @Test
    @DisplayName("Should throw exception for invalid token format")
    void should_ThrowException_When_InvalidTokenFormat() {
        // Given
        String invalidToken = "invalid.token.format";
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(invalidToken))
            .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Should throw exception for malformed token")
    void should_ThrowException_When_MalformedToken() {
        // Given
        String malformedToken = "not.a.jwt";
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(malformedToken))
            .isInstanceOf(JwtException.MalformedTokenException.class);
    }

    @Test
    @DisplayName("Should throw exception for token with invalid signature")
    void should_ThrowException_When_InvalidSignature() {
        // Given - Create token with different secret
        JwtService differentSecretService = new JwtService(
            Base64.getEncoder().encodeToString("different-secret-key-256-bits-long-enough-for-hs256-algorithm".getBytes()),
            TEST_EXPIRATION,
            TEST_REFRESH_EXPIRATION
        );
        String tokenWithDifferentSignature = differentSecretService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(tokenWithDifferentSignature))
            .satisfiesAnyOf(
                throwable -> assertThat(throwable).isInstanceOf(JwtException.class),
                throwable -> assertThat(throwable).isInstanceOf(io.jsonwebtoken.security.SignatureException.class)
            );
    }

    @Test
    @DisplayName("Should handle Integer userId in claims correctly")
    void should_HandleIntegerUserId_When_ExtractingUserId() {
        // Given - Create a token and manually parse it to simulate Integer userId
        String token = jwtService.generateAccessToken(userDetails, TEST_USER_ID);
        
        // When
        Long extractedUserId = jwtService.extractUserId(token);
        
        // Then
        assertThat(extractedUserId).isEqualTo(TEST_USER_ID);
    }

    @Test
    @DisplayName("Should throw exception for invalid userId type")
    void should_ThrowException_When_UserIdIsInvalidType() {
        // Given - Create a custom JWT with string userId
        SecretKey key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(TEST_SECRET));
        String invalidToken = Jwts.builder()
            .claim("userId", "not-a-number")
            .setSubject(TEST_USERNAME)
            .setIssuedAt(Date.from(Instant.now()))
            .setExpiration(Date.from(Instant.now().plusMillis(TEST_EXPIRATION)))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUserId(invalidToken))
            .isInstanceOf(JwtException.InvalidTokenException.class)
            .hasMessageContaining("User ID claim is invalid");
    }

    // ==================== Configuration Tests ====================

    @Test
    @DisplayName("Should return correct expiration times")
    void should_ReturnCorrectExpirationTimes_When_Queried() {
        // When & Then
        assertThat(jwtService.getJwtExpiration()).isEqualTo(TEST_EXPIRATION);
        assertThat(jwtService.getRefreshTokenExpiration()).isEqualTo(TEST_REFRESH_EXPIRATION);
    }

    @Test
    @DisplayName("Should reject short secret key")
    void should_ThrowException_When_SecretKeyTooShort() {
        // Given - Short key (less than 256 bits)
        String shortKey = Base64.getEncoder().encodeToString("short".getBytes());
        JwtService serviceWithShortKey = new JwtService(shortKey, TEST_EXPIRATION, TEST_REFRESH_EXPIRATION);
        
        // When & Then
        assertThatThrownBy(() -> serviceWithShortKey.generateAccessToken(userDetails, TEST_USER_ID))
            .isInstanceOf(JwtException.InvalidTokenException.class)
            .hasMessageContaining("JWT secret key must be at least 256 bits");
    }

    @Test
    @DisplayName("Should reject invalid Base64 secret key")
    void should_ThrowException_When_InvalidBase64SecretKey() {
        // Given - Invalid Base64
        String invalidBase64Key = "not-valid-base64!@#$%";
        JwtService serviceWithInvalidKey = new JwtService(invalidBase64Key, TEST_EXPIRATION, TEST_REFRESH_EXPIRATION);
        
        // When & Then
        assertThatThrownBy(() -> serviceWithInvalidKey.generateAccessToken(userDetails, TEST_USER_ID))
            .isInstanceOf(IllegalArgumentException.class);
    }

    // ==================== Edge Cases ====================

    @Test
    @DisplayName("Should handle null or empty token input")
    void should_ThrowException_When_TokenIsNullOrEmpty() {
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(null))
            .isInstanceOf(JwtException.InvalidTokenException.class);
            
        assertThatThrownBy(() -> jwtService.extractUsername(""))
            .isInstanceOf(JwtException.InvalidTokenException.class);
            
        assertThatThrownBy(() -> jwtService.extractUsername("   "))
            .isInstanceOf(JwtException.InvalidTokenException.class);
    }

    @Test
    @DisplayName("Should return true for expired token on error")
    void should_ReturnTrue_When_TokenExpirationCheckFails() {
        // Given
        String invalidToken = "invalid.token.format";
        
        // When
        boolean isExpired = jwtService.isTokenExpired(invalidToken);
        
        // Then
        assertThat(isExpired).isTrue(); // Should treat invalid tokens as expired for security
    }

    @Test
    @DisplayName("Should handle validation with invalid tokens gracefully")
    void should_ReturnFalse_When_ValidationWithInvalidToken() {
        // Given
        String invalidToken = "invalid.token.format";
        
        // When
        boolean accessValid = jwtService.validateToken(invalidToken, userDetails);
        boolean refreshValid = jwtService.validateRefreshToken(invalidToken);
        
        // Then
        assertThat(accessValid).isFalse();
        assertThat(refreshValid).isFalse();
    }
}