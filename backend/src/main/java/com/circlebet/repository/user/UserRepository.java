package com.circlebet.repository.user;

import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Authentication queries
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    
    // Optimized authentication query - single DB call for username OR email
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.username) = LOWER(:usernameOrEmail) OR LOWER(u.email) = LOWER(:usernameOrEmail))")
    Optional<User> findByUsernameOrEmailIgnoreCase(@Param("usernameOrEmail") String usernameOrEmail);
    
    // User status queries
    List<User> findByIsActiveTrueAndDeletedAtIsNull();
    List<User> findByEmailVerifiedFalse();
    
    // Balance queries
    List<User> findByCreditBalanceGreaterThan(BigDecimal minBalance);
    
    // Betting statistics
    List<User> findByWinCountGreaterThan(Integer minWins);
    List<User> findByCurrentStreakGreaterThanEqual(Integer minStreak);
    
    // Activity queries
    List<User> findByLastLoginAtAfter(LocalDateTime since);
    List<User> findByCreatedAtAfter(LocalDateTime since);
    
    // Search functionality
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> searchUsersByName(@Param("searchTerm") String searchTerm);
    
    // Admin queries
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.deletedAt IS NULL")
    Long countActiveUsers();
}