package com.rivalpicks.repository.security;

import com.rivalpicks.entity.security.EmailChangeToken;
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
 * Repository for email change token operations.
 */
@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {

    /**
     * Find a token by its string value.
     */
    Optional<EmailChangeToken> findByToken(String token);

    /**
     * Find all tokens for a user.
     */
    List<EmailChangeToken> findByUser(User user);

    /**
     * Find all unused, non-expired tokens for a user.
     */
    @Query("SELECT t FROM EmailChangeToken t WHERE t.user = :user AND t.used = false AND t.expiresAt > :now")
    List<EmailChangeToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Check if a new email already has a pending verification.
     */
    @Query("SELECT COUNT(t) > 0 FROM EmailChangeToken t WHERE t.newEmail = :email AND t.used = false AND t.expiresAt > :now")
    boolean existsPendingTokenForEmail(@Param("email") String email, @Param("now") LocalDateTime now);

    /**
     * Invalidate all existing tokens for a user (mark as used).
     */
    @Modifying
    @Query("UPDATE EmailChangeToken t SET t.used = true WHERE t.user = :user AND t.used = false")
    int invalidateAllTokensForUser(@Param("user") User user);

    /**
     * Delete expired tokens (for cleanup job).
     */
    @Modifying
    @Query("DELETE FROM EmailChangeToken t WHERE t.expiresAt < :cutoffTime")
    int deleteExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Count active (unused, non-expired) tokens for a user.
     */
    @Query("SELECT COUNT(t) FROM EmailChangeToken t WHERE t.user = :user AND t.used = false AND t.expiresAt > :now")
    long countActiveTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Find the most recent token for a user (for rate limiting).
     */
    @Query("SELECT t FROM EmailChangeToken t WHERE t.user = :user ORDER BY t.createdAt DESC LIMIT 1")
    Optional<EmailChangeToken> findMostRecentTokenForUser(@Param("user") User user);

    /**
     * Find pending token for a specific email (to check which user owns it).
     */
    @Query("SELECT t FROM EmailChangeToken t WHERE t.newEmail = :email AND t.used = false AND t.expiresAt > :now")
    Optional<EmailChangeToken> findPendingTokenForEmail(@Param("email") String email, @Param("now") LocalDateTime now);
}
