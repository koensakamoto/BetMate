package com.circlebet.service.security;

import com.circlebet.exception.JwtException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service for handling JWT token operations including generation, validation, and extraction.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final String jwtSecret;
    private final long jwtExpiration;

    // Constants for claim keys
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_TYPE = "type";
    private static final String REFRESH_TOKEN_TYPE = "refresh";
    private static final long REFRESH_TOKEN_EXPIRATION = 604800000; // 7 days

    public JwtService(@Value("${spring.security.jwt.secret}") String jwtSecret,
                      @Value("${spring.security.jwt.expiration}") long jwtExpiration) {
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    /**
     * Extracts username from JWT token.
     */
    public String extractUsername(String token) {
        validateTokenInput(token);
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (JwtException e) {
            throw e; // Re-throw custom exceptions
        } catch (Exception e) {
            log.debug("Failed to extract username from token: {}", e.getMessage());
            throw new JwtException.InvalidTokenException("Failed to extract username from token", e);
        }
    }

    /**
     * Extracts user ID from JWT token.
     */
    public Long extractUserId(String token) {
        validateTokenInput(token);
        try {
            return extractClaim(token, claims -> claims.get(CLAIM_USER_ID, Long.class));
        } catch (JwtException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Failed to extract user ID from token: {}", e.getMessage());
            throw new JwtException.InvalidTokenException("Failed to extract user ID from token", e);
        }
    }

    /**
     * Extracts expiration date from JWT token.
     */
    public Date extractExpiration(String token) {
        validateTokenInput(token);
        try {
            return extractClaim(token, Claims::getExpiration);
        } catch (JwtException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Failed to extract expiration from token: {}", e.getMessage());
            throw new JwtException.InvalidTokenException("Failed to extract expiration from token", e);
        }
    }

    /**
     * Extracts a specific claim from JWT token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Generates JWT access token for user.
     */
    public String generateAccessToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_USER_ID, userId);
        String token = createToken(claims, userDetails.getUsername(), jwtExpiration);
        log.debug("Generated access token for user: {}", userDetails.getUsername());
        return token;
    }

    /**
     * Generates JWT refresh token for user.
     */
    public String generateRefreshToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_USER_ID, userId);
        claims.put(CLAIM_TYPE, REFRESH_TOKEN_TYPE);
        String token = createToken(claims, userDetails.getUsername(), REFRESH_TOKEN_EXPIRATION);
        log.debug("Generated refresh token for user: {}", userDetails.getUsername());
        return token;
    }

    /**
     * Validates JWT token against user details and ensures it's an access token.
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        validateTokenInput(token);
        try {
            // Extract token type to ensure this is not a refresh token being used as access token
            Claims claims = extractAllClaims(token);
            String tokenType = claims.get(CLAIM_TYPE, String.class);
            
            // Reject refresh tokens being used for access
            if (REFRESH_TOKEN_TYPE.equals(tokenType)) {
                log.warn("Attempted to use refresh token as access token for user: {}", userDetails.getUsername());
                return false;
            }
            
            final String username = extractUsername(token);
            boolean isValid = username.equals(userDetails.getUsername()) && !isTokenExpired(token);
            
            if (isValid) {
                log.debug("Access token validation successful for user: {}", userDetails.getUsername());
            } else {
                log.debug("Access token validation failed for user: {} (username mismatch or expired)", userDetails.getUsername());
            }
            return isValid;
        } catch (JwtException e) {
            log.warn("Token validation failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return false;
        }
    }
 
    /**
     * Checks if JWT token is expired.
     */
    public boolean isTokenExpired(String token) {
        validateTokenInput(token);
        try {
            return extractExpiration(token).before(Date.from(Instant.now()));
        } catch (JwtException e) {
            log.debug("Failed to check token expiration: {}", e.getMessage());
            // If we can't extract expiration, consider it expired for security
            return true;
        }
    }

    /**
     * Validates refresh token and ensures it's actually a refresh token.
     */
    public boolean validateRefreshToken(String token) {
        validateTokenInput(token);
        try {
            Claims claims = extractAllClaims(token);
            String tokenType = claims.get(CLAIM_TYPE, String.class);
            
            // Ensure this is actually a refresh token
            if (!REFRESH_TOKEN_TYPE.equals(tokenType)) {
                log.warn("Attempted to validate non-refresh token as refresh token");
                return false;
            }
            
            boolean isValid = !isTokenExpired(token);
            if (isValid) {
                log.debug("Refresh token validation successful");
            } else {
                log.debug("Refresh token validation failed: expired");
            }
            return isValid;
        } catch (JwtException e) {
            log.warn("Refresh token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Gets JWT expiration time in milliseconds.
     */
    public long getJwtExpiration() {
        return jwtExpiration;
    }

    /**
     * Gets refresh token expiration time in milliseconds.
     */
    public long getRefreshTokenExpiration() {
        return REFRESH_TOKEN_EXPIRATION;
    }

    private String createToken(Map<String, Object> claims, String subject, long expiration) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(expiration)))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            throw new JwtException.ExpiredTokenException("JWT token has expired", e);
        } catch (UnsupportedJwtException e) {
            log.debug("JWT token unsupported: {}", e.getMessage());
            throw new JwtException.UnsupportedTokenException("JWT token is unsupported", e);
        } catch (MalformedJwtException e) {
            log.debug("JWT token malformed: {}", e.getMessage());
            throw new JwtException.MalformedTokenException("JWT token is malformed", e);
        } catch (SecurityException e) {
            log.debug("JWT signature validation failed: {}", e.getMessage());
            throw new JwtException.InvalidSignatureException("JWT signature validation failed", e);
        } catch (IllegalArgumentException e) {
            log.debug("JWT token invalid: {}", e.getMessage());
            throw new JwtException.InvalidTokenException("JWT token is invalid", e);
        }
    }

    private SecretKey getSigningKey() {
        try {
            // Decode Base64-encoded secret key for consistent byte representation
            byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
            
            // Ensure key is at least 256 bits (32 bytes) for HS256
            if (keyBytes.length < 32) {
                throw new JwtException.InvalidTokenException(
                    "JWT secret key must be at least 256 bits (32 bytes) long for HS256. Current key length: " + keyBytes.length + " bytes");
            }
            
            // Basic entropy validation - ensure key isn't all zeros or repeated patterns
            if (isWeakKey(keyBytes)) {
                throw new JwtException.InvalidTokenException("JWT secret key appears to have weak entropy");
            }
            
            log.debug("Successfully loaded JWT signing key with {} bytes", keyBytes.length);
            return Keys.hmacShaKeyFor(keyBytes);
            
        } catch (IllegalArgumentException e) {
            log.error("Failed to decode JWT secret key: {}", e.getMessage());
            throw new JwtException.InvalidTokenException(
                "JWT secret key must be a valid Base64-encoded string", e);
        }
    }
    
    /**
     * Performs basic validation to detect weak keys with poor entropy.
     */
    private boolean isWeakKey(byte[] keyBytes) {
        // Check for all zeros
        boolean allZeros = true;
        for (byte b : keyBytes) {
            if (b != 0) {
                allZeros = false;
                break;
            }
        }
        if (allZeros) {
            return true;
        }
        
        // Check for repeated patterns (first 4 bytes repeated)
        if (keyBytes.length >= 8) {
            boolean isRepeated = true;
            for (int i = 4; i < Math.min(keyBytes.length, 16); i++) {
                if (keyBytes[i] != keyBytes[i % 4]) {
                    isRepeated = false;
                    break;
                }
            }
            if (isRepeated) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Validates token input to prevent null/empty tokens.
     */
    private void validateTokenInput(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new JwtException.InvalidTokenException("Token cannot be null or empty");
        }
    }
}