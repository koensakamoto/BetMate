package com.betmate.dto.export;

import com.betmate.entity.user.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for exporting user profile data.
 */
public record ProfileExportDto(
    Long id,
    String username,
    String email,
    String firstName,
    String lastName,
    String bio,
    String profileImageUrl,
    String authProvider,
    Boolean emailVerified,
    Integer winCount,
    Integer lossCount,
    BigDecimal creditBalance,
    Integer currentStreak,
    Integer longestStreak,
    Integer activeBets,
    LocalDateTime lastLoginAt,
    LocalDateTime createdAt
) {
    public static ProfileExportDto fromUser(User user) {
        return new ProfileExportDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getBio(),
            user.getProfileImageUrl(),
            user.getAuthProvider() != null ? user.getAuthProvider().name() : null,
            user.getEmailVerified(),
            user.getWinCount(),
            user.getLossCount(),
            user.getCreditBalance(),
            user.getCurrentStreak(),
            user.getLongestStreak(),
            user.getActiveBets(),
            user.getLastLoginAt(),
            user.getCreatedAt()
        );
    }
}
