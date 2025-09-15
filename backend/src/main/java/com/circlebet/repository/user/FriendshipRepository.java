package com.circlebet.repository.user;

import com.circlebet.entity.user.Friendship;
import com.circlebet.entity.user.Friendship.FriendshipStatus;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // ==========================================
    // BASIC FRIENDSHIP QUERIES
    // ==========================================

    /**
     * Find friendship between two users (in either direction).
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requester = :user1 AND f.accepter = :user2) OR " +
           "(f.requester = :user2 AND f.accepter = :user1)")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Check if friendship exists between two users with specific status.
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f WHERE " +
           "((f.requester = :user1 AND f.accepter = :user2) OR " +
           "(f.requester = :user2 AND f.accepter = :user1)) AND f.status = :status")
    boolean existsFriendshipWithStatus(@Param("user1") User user1, @Param("user2") User user2, @Param("status") FriendshipStatus status);

    /**
     * Check if two users are friends (accepted friendship).
     */
    default boolean areFriends(User user1, User user2) {
        return existsFriendshipWithStatus(user1, user2, FriendshipStatus.ACCEPTED);
    }

    /**
     * Check if there's a pending friend request between users.
     */
    default boolean hasPendingRequest(User user1, User user2) {
        return existsFriendshipWithStatus(user1, user2, FriendshipStatus.PENDING);
    }

    // ==========================================
    // USER'S FRIENDS QUERIES
    // ==========================================

    /**
     * Get all accepted friends for a user.
     */
    @Query("SELECT CASE WHEN f.requester = :user THEN f.accepter ELSE f.requester END " +
           "FROM Friendship f WHERE " +
           "(f.requester = :user OR f.accepter = :user) AND f.status = 'ACCEPTED'")
    List<User> findFriendsByUser(@Param("user") User user);

    /**
     * Get all accepted friendships for a user.
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requester = :user OR f.accepter = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendshipsByUser(@Param("user") User user);

    /**
     * Count total friends for a user.
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE " +
           "(f.requester = :user OR f.accepter = :user) AND f.status = 'ACCEPTED'")
    long countFriendsByUser(@Param("user") User user);

    // ==========================================
    // FRIEND REQUESTS QUERIES
    // ==========================================

    /**
     * Get pending friend requests sent by a user.
     */
    @Query("SELECT f FROM Friendship f WHERE f.requester = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsSentByUser(@Param("user") User user);

    /**
     * Get pending friend requests received by a user.
     */
    @Query("SELECT f FROM Friendship f WHERE f.accepter = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsReceivedByUser(@Param("user") User user);

    /**
     * Count pending friend requests received by a user.
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.accepter = :user AND f.status = 'PENDING'")
    long countPendingRequestsReceivedByUser(@Param("user") User user);

    /**
     * Count pending friend requests sent by a user.
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.requester = :user AND f.status = 'PENDING'")
    long countPendingRequestsSentByUser(@Param("user") User user);

    // ==========================================
    // SEARCH AND FILTERING
    // ==========================================

    /**
     * Find friends by username or name pattern.
     */
    @Query("SELECT CASE WHEN f.requester = :user THEN f.accepter ELSE f.requester END " +
           "FROM Friendship f WHERE " +
           "(f.requester = :user OR f.accepter = :user) AND f.status = 'ACCEPTED' AND " +
           "(LOWER(CASE WHEN f.requester = :user THEN f.accepter.username ELSE f.requester.username END) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(CASE WHEN f.requester = :user THEN f.accepter.firstName ELSE f.requester.firstName END) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(CASE WHEN f.requester = :user THEN f.accepter.lastName ELSE f.requester.lastName END) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> findFriendsByUserAndSearchTerm(@Param("user") User user, @Param("searchTerm") String searchTerm);

    /**
     * Get recent friendships (last 30 days).
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requester = :user OR f.accepter = :user) AND f.status = 'ACCEPTED' AND " +
           "f.acceptedAt >= :since ORDER BY f.acceptedAt DESC")
    List<Friendship> findRecentFriendshipsByUser(@Param("user") User user, @Param("since") java.time.LocalDateTime since);

    // ==========================================
    // MUTUAL FRIENDS
    // ==========================================

    /**
     * Find mutual friends between two users.
     */
    @Query("SELECT u FROM User u WHERE u IN (" +
           "SELECT CASE WHEN f1.requester = :user1 THEN f1.accepter ELSE f1.requester END " +
           "FROM Friendship f1 WHERE (f1.requester = :user1 OR f1.accepter = :user1) AND f1.status = 'ACCEPTED'" +
           ") AND u IN (" +
           "SELECT CASE WHEN f2.requester = :user2 THEN f2.accepter ELSE f2.requester END " +
           "FROM Friendship f2 WHERE (f2.requester = :user2 OR f2.accepter = :user2) AND f2.status = 'ACCEPTED'" +
           ")")
    List<User> findMutualFriends(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Count mutual friends between two users.
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u IN (" +
           "SELECT CASE WHEN f1.requester = :user1 THEN f1.accepter ELSE f1.requester END " +
           "FROM Friendship f1 WHERE (f1.requester = :user1 OR f1.accepter = :user1) AND f1.status = 'ACCEPTED'" +
           ") AND u IN (" +
           "SELECT CASE WHEN f2.requester = :user2 THEN f2.accepter ELSE f2.requester END " +
           "FROM Friendship f2 WHERE (f2.requester = :user2 OR f2.accepter = :user2) AND f2.status = 'ACCEPTED'" +
           ")")
    long countMutualFriends(@Param("user1") User user1, @Param("user2") User user2);

    // ==========================================
    // CLEANUP QUERIES
    // ==========================================

    /**
     * Delete all rejected friendships older than specified date.
     */
    @Query("DELETE FROM Friendship f WHERE f.status = 'REJECTED' AND f.updatedAt < :before")
    void deleteRejectedFriendshipsOlderThan(@Param("before") java.time.LocalDateTime before);

    /**
     * Find all friendships involving a specific user.
     */
    @Query("SELECT f FROM Friendship f WHERE f.requester = :user OR f.accepter = :user")
    List<Friendship> findAllFriendshipsByUser(@Param("user") User user);
}