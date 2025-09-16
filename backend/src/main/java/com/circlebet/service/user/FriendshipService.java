package com.circlebet.service.user;

import com.circlebet.entity.user.Friendship;
import com.circlebet.entity.user.Friendship.FriendshipStatus;
import com.circlebet.entity.user.User;
import com.circlebet.exception.user.UserNotFoundException;
import com.circlebet.repository.user.FriendshipRepository;
import com.circlebet.repository.user.UserRepository;
import com.circlebet.service.notification.NotificationService;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing user friendships and friend requests.
 *
 * Handles the complete friend system including sending requests,
 * accepting/rejecting requests, and managing friend relationships.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository, NotificationService notificationService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ==========================================
    // CORE FRIENDSHIP OPERATIONS
    // ==========================================

    /**
     * Send a friend request from one user to another.
     *
     * @param requesterId the ID of the user sending the request
     * @param accepterId the ID of the user receiving the request
     * @return the created friendship request
     * @throws UserNotFoundException if either user is not found
     * @throws IllegalStateException if friendship already exists or users are the same
     */
    @Transactional
    public Friendship sendFriendRequest(@NotNull Long requesterId, @NotNull Long accepterId) {
        if (requesterId.equals(accepterId)) {
            throw new IllegalArgumentException("Users cannot send friend requests to themselves");
        }

        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new UserNotFoundException("Requester not found with ID: " + requesterId));
        User accepter = userRepository.findById(accepterId)
            .orElseThrow(() -> new UserNotFoundException("Accepter not found with ID: " + accepterId));

        // Check if friendship already exists
        Optional<Friendship> existingFriendship = friendshipRepository.findFriendshipBetweenUsers(requester, accepter);
        if (existingFriendship.isPresent()) {
            Friendship existing = existingFriendship.get();
            switch (existing.getStatus()) {
                case PENDING:
                    throw new IllegalStateException("Friend request already pending between these users");
                case ACCEPTED:
                    throw new IllegalStateException("Users are already friends");
                case REJECTED:
                    // Allow new request after rejection
                    existing.setStatus(FriendshipStatus.PENDING);
                    Friendship reactivatedFriendship = friendshipRepository.save(existing);

                    // Create notification for the reactivated friend request
                    notificationService.createFriendRequestNotification(requester, accepter);

                    return reactivatedFriendship;
            }
        }

        Friendship friendship = new Friendship(requester, accepter);
        Friendship savedFriendship = friendshipRepository.save(friendship);

        // Create notification for friend request
        notificationService.createFriendRequestNotification(requester, accepter);

        return savedFriendship;
    }

    /**
     * Accept a friend request.
     *
     * @param friendshipId the ID of the friendship to accept
     * @param accepterId the ID of the user accepting (must be the accepter)
     * @return the updated friendship
     * @throws IllegalStateException if friendship cannot be accepted
     */
    @Transactional
    public Friendship acceptFriendRequest(@NotNull Long friendshipId, @NotNull Long accepterId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found with ID: " + friendshipId));

        User accepter = userRepository.findById(accepterId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + accepterId));

        if (!friendship.isAccepter(accepter)) {
            throw new IllegalStateException("Only the accepter can accept this friend request");
        }

        friendship.accept();
        return friendshipRepository.save(friendship);
    }

    /**
     * Reject a friend request.
     *
     * @param friendshipId the ID of the friendship to reject
     * @param accepterId the ID of the user rejecting (must be the accepter)
     * @return the updated friendship
     * @throws IllegalStateException if friendship cannot be rejected
     */
    @Transactional
    public Friendship rejectFriendRequest(@NotNull Long friendshipId, @NotNull Long accepterId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found with ID: " + friendshipId));

        User accepter = userRepository.findById(accepterId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + accepterId));

        if (!friendship.isAccepter(accepter)) {
            throw new IllegalStateException("Only the accepter can reject this friend request");
        }

        friendship.reject();
        return friendshipRepository.save(friendship);
    }

    /**
     * Remove a friend (delete accepted friendship).
     *
     * @param userId1 the ID of one user in the friendship
     * @param userId2 the ID of the other user in the friendship
     * @throws IllegalStateException if friendship doesn't exist or is not accepted
     */
    @Transactional
    public void removeFriend(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));

        Friendship friendship = friendshipRepository.findFriendshipBetweenUsers(user1, user2)
            .orElseThrow(() -> new IllegalStateException("No friendship exists between these users"));

        if (!friendship.isAccepted()) {
            throw new IllegalStateException("Can only remove accepted friendships");
        }

        friendshipRepository.delete(friendship);
    }

    // ==========================================
    // FRIENDSHIP QUERIES
    // ==========================================

    /**
     * Get all friends for a user.
     *
     * @param userId the user ID
     * @return list of friends
     */
    public List<User> getFriends(@NotNull Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.findFriendsByUser(user);
    }

    /**
     * Get friends count for a user.
     *
     * @param userId the user ID
     * @return number of friends
     */
    public long getFriendsCount(@NotNull Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.countFriendsByUser(user);
    }

    /**
     * Search friends by username or name.
     *
     * @param userId the user ID
     * @param searchTerm the search term
     * @return list of matching friends
     */
    public List<User> searchFriends(@NotNull Long userId, @NotNull String searchTerm) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.findFriendsByUserAndSearchTerm(user, searchTerm);
    }

    /**
     * Get mutual friends between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return list of mutual friends
     */
    public List<User> getMutualFriends(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));
        return friendshipRepository.findMutualFriends(user1, user2);
    }

    /**
     * Get mutual friends count between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return number of mutual friends
     */
    public long getMutualFriendsCount(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));
        return friendshipRepository.countMutualFriends(userId1, userId2);
    }

    // ==========================================
    // FRIEND REQUEST QUERIES
    // ==========================================

    /**
     * Get pending friend requests sent by a user.
     *
     * @param userId the user ID
     * @return list of pending requests sent
     */
    public List<Friendship> getPendingRequestsSent(@NotNull Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.findPendingRequestsSentByUser(user);
    }

    /**
     * Get pending friend requests received by a user.
     *
     * @param userId the user ID
     * @return list of pending requests received
     */
    public List<Friendship> getPendingRequestsReceived(@NotNull Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.findPendingRequestsReceivedByUser(user);
    }

    /**
     * Get count of pending friend requests received by a user.
     *
     * @param userId the user ID
     * @return number of pending requests received
     */
    public long getPendingRequestsReceivedCount(@NotNull Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return friendshipRepository.countPendingRequestsReceivedByUser(user);
    }

    // ==========================================
    // FRIENDSHIP STATUS QUERIES
    // ==========================================

    /**
     * Check if two users are friends.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return true if users are friends
     */
    public boolean areFriends(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));
        return friendshipRepository.areFriends(user1, user2);
    }

    /**
     * Check if there's a pending friend request between users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return true if there's a pending request
     */
    public boolean hasPendingRequest(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));
        return friendshipRepository.hasPendingRequest(user1, user2);
    }

    /**
     * Get friendship status between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return friendship status or null if no relationship exists
     */
    public FriendshipStatus getFriendshipStatus(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));

        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetweenUsers(user1, user2);
        return friendship.map(Friendship::getStatus).orElse(null);
    }

    /**
     * Get the friendship between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return the friendship or empty if not found
     */
    public Optional<Friendship> getFriendship(@NotNull Long userId1, @NotNull Long userId2) {
        User user1 = userRepository.findById(userId1)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId1));
        User user2 = userRepository.findById(userId2)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId2));
        return friendshipRepository.findFriendshipBetweenUsers(user1, user2);
    }

    // ==========================================
    // CLEANUP OPERATIONS
    // ==========================================

    /**
     * Clean up old rejected friend requests.
     *
     * @param daysOld how many days old requests to delete
     * @return number of requests deleted
     */
    @Transactional
    public void cleanupOldRejectedRequests(int daysOld) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOld);
        friendshipRepository.deleteRejectedFriendshipsOlderThan(cutoff);
    }

}