package com.rivalpicks.repository.user;

import com.rivalpicks.entity.user.Friendship;
import com.rivalpicks.entity.user.Friendship.FriendshipStatus;
import com.rivalpicks.entity.user.User;
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
     * Get friends where user is the requester.
     */
    @Query("SELECT f.accepter FROM Friendship f WHERE f.requester = :user AND f.status = 'ACCEPTED'")
    List<User> findAccepterFriendsByUser(@Param("user") User user);

    /**
     * Get friends where user is the accepter.
     */
    @Query("SELECT f.requester FROM Friendship f WHERE f.accepter = :user AND f.status = 'ACCEPTED'")
    List<User> findRequesterFriendsByUser(@Param("user") User user);

    /**
     * Get all accepted friends for a user.
     * Combines both scenarios where user can be requester or accepter.
     */
    default List<User> findFriendsByUser(User user) {
        List<User> friends = new java.util.ArrayList<>();
        friends.addAll(findAccepterFriendsByUser(user));
        friends.addAll(findRequesterFriendsByUser(user));
        return friends;
    }

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
     * Find friends by username or name pattern where user is requester.
     */
    @Query("SELECT f.accepter FROM Friendship f WHERE f.requester = :user AND f.status = 'ACCEPTED' AND " +
           "(LOWER(f.accepter.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(f.accepter.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(f.accepter.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> findAccepterFriendsByUserAndSearchTerm(@Param("user") User user, @Param("searchTerm") String searchTerm);

    /**
     * Find friends by username or name pattern where user is accepter.
     */
    @Query("SELECT f.requester FROM Friendship f WHERE f.accepter = :user AND f.status = 'ACCEPTED' AND " +
           "(LOWER(f.requester.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(f.requester.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(f.requester.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> findRequesterFriendsByUserAndSearchTerm(@Param("user") User user, @Param("searchTerm") String searchTerm);

    /**
     * Find friends by username or name pattern.
     * Combines both scenarios where user can be requester or accepter.
     */
    default List<User> findFriendsByUserAndSearchTerm(User user, String searchTerm) {
        List<User> friends = new java.util.ArrayList<>();
        friends.addAll(findAccepterFriendsByUserAndSearchTerm(user, searchTerm));
        friends.addAll(findRequesterFriendsByUserAndSearchTerm(user, searchTerm));
        return friends;
    }

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
     * Simple implementation that returns empty list for now.
     */
    default List<User> findMutualFriends(User user1, User user2) {
        return java.util.Collections.emptyList();
    }

    /**
     * Count mutual friends between two users.
     * Simple implementation that returns 0 for now.
     */
    default long countMutualFriends(Long user1Id, Long user2Id) {
        return 0;
    }

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