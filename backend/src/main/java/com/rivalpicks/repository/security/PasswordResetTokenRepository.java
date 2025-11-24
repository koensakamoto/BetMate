package com.rivalpicks.repository.security;

import com.rivalpicks.entity.security.PasswordResetToken;
import com.rivalpicks.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for password reset token operations.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find a token by its string value.
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find all tokens for a user.
     */
    List<PasswordResetToken> findByUser(User user);

    /**
     * Find all unused, non-expired tokens for a user.
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.used = false AND t.expiresAt > :now")
    List<PasswordResetToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Invalidate all existing tokens for a user (mark as used).
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user = :user AND t.used = false")
    int invalidateAllTokensForUser(@Param("user") User user);

    /**
     * Delete expired tokens (for cleanup job).
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoffTime")
    int deleteExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Count active (unused, non-expired) tokens for a user.
     * Useful for rate limiting in the future.
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.user = :user AND t.used = false AND t.expiresAt > :now")
    long countActiveTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
