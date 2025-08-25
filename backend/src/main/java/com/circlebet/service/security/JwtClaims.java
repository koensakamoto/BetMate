package com.circlebet.service.security;

import java.util.Map;

/**
 * Value object for JWT claims to provide type safety and reduce "stringly typed" errors.
 * This record encapsulates the custom claims we add to JWT tokens.
 */
public record JwtClaims(
    Long userId,
    String type
) {
    
    // Constants for token types
    public static final String ACCESS_TOKEN_TYPE = null; // Access tokens don't have a type claim
    public static final String REFRESH_TOKEN_TYPE = "refresh";
    
    /**
     * Creates claims for an access token (no type claim).
     */
    public static JwtClaims forAccessToken(Long userId) {
        return new JwtClaims(userId, ACCESS_TOKEN_TYPE);
    }
    
    /**
     * Creates claims for a refresh token.
     */
    public static JwtClaims forRefreshToken(Long userId) {
        return new JwtClaims(userId, REFRESH_TOKEN_TYPE);
    }
    
    /**
     * Converts this record to a Map for JWT library compatibility.
     * Only includes non-null values to avoid unnecessary claims.
     */
    public Map<String, Object> toClaimsMap() {
        Map<String, Object> claims = new java.util.HashMap<>();
        
        if (userId != null) {
            claims.put("userId", userId);
        }
        
        if (type != null) {
            claims.put("type", type);
        }
        
        return claims;
    }
    
    /**
     * Creates JwtClaims from a claims map (for token parsing).
     */
    public static JwtClaims fromClaimsMap(Map<String, Object> claimsMap) {
        Long userId = null;
        String type = null;
        
        if (claimsMap.get("userId") instanceof Long userIdValue) {
            userId = userIdValue;
        } else if (claimsMap.get("userId") instanceof Integer userIdInt) {
            // Handle case where userId comes back as Integer from JWT parsing
            userId = userIdInt.longValue();
        }
        
        if (claimsMap.get("type") instanceof String typeValue) {
            type = typeValue;
        }
        
        return new JwtClaims(userId, type);
    }
    
    /**
     * Checks if this represents an access token.
     */
    public boolean isAccessToken() {
        return type == null || !REFRESH_TOKEN_TYPE.equals(type);
    }
    
    /**
     * Checks if this represents a refresh token.
     */
    public boolean isRefreshToken() {
        return REFRESH_TOKEN_TYPE.equals(type);
    }
}