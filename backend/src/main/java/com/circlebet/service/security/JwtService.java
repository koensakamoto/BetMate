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
import java.util.Map;

/**
 * JWT token operations service: generation, validation, extraction.
 * Focused purely on tokens (no user domain dependency).
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final String jwtSecret;
    private final long jwtExpiration;
    private final long refreshTokenExpiration;

    private static final String CLAIM_USER_ID = "userId";

    public JwtService(@Value("${spring.security.jwt.secret}") String jwtSecret,
                      @Value("${spring.security.jwt.expiration}") long jwtExpiration,
                      @Value("${spring.security.jwt.refresh-expiration:604800000}") long refreshTokenExpiration) {
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // -------------------- Token Generation --------------------

    public String generateAccessToken(UserDetails userDetails, Long userId) {
        JwtClaims claims = JwtClaims.forAccessToken(userId);
        return createToken(claims.toClaimsMap(), userDetails.getUsername(), jwtExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails, Long userId) {
        JwtClaims claims = JwtClaims.forRefreshToken(userId);
        return createToken(claims.toClaimsMap(), userDetails.getUsername(), refreshTokenExpiration);
    }

    // -------------------- Token Validation --------------------

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            JwtClaims claims = extractJwtClaims(token);
            if (claims.isRefreshToken()) {
                log.warn("Refresh token used as access token for user: {}", userDetails.getUsername());
                return false;
            }
            return userDetails.getUsername().equals(extractUsername(token)) && !isTokenExpired(token);
        } catch (JwtException e) {
            log.warn("Access token validation failed for user {}: {}", userDetails.getUsername(), e.getMessage());
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            JwtClaims claims = extractJwtClaims(token);
            return claims.isRefreshToken() && !isTokenExpired(token);
        } catch (JwtException e) {
            log.warn("Refresh token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(Date.from(Instant.now()));
        } catch (JwtException e) {
            return true; // treat invalid tokens as expired
        }
    }

    // -------------------- Token Extraction --------------------

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object value = extractAllClaims(token).get(CLAIM_USER_ID);
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof Long) return (Long) value;
        throw new JwtException.InvalidTokenException("User ID claim is invalid");
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    public JwtClaims extractJwtClaims(String token) {
        Claims claims = extractAllClaims(token);
        return JwtClaims.fromClaimsMap(claims);
    }

    // -------------------- Internal Helpers --------------------

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
            throw new JwtException.ExpiredTokenException("JWT token has expired", e);
        } catch (UnsupportedJwtException e) {
            throw new JwtException.UnsupportedTokenException("JWT token is unsupported", e);
        } catch (MalformedJwtException e) {
            throw new JwtException.MalformedTokenException("JWT token is malformed", e);
        } catch (SecurityException e) {
            throw new JwtException.InvalidSignatureException("JWT signature validation failed", e);
        } catch (IllegalArgumentException e) {
            throw new JwtException.InvalidTokenException("JWT token is invalid", e);
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        if (keyBytes.length < 32)
            throw new JwtException.InvalidTokenException("JWT secret key must be at least 256 bits");
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public long getJwtExpiration() { return jwtExpiration; }
    public long getRefreshTokenExpiration() { return refreshTokenExpiration; }
}