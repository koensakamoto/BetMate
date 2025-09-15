package com.circlebet.controller;

import com.circlebet.dto.user.response.UserSearchResultResponseDto;
import com.circlebet.entity.user.Friendship;
import com.circlebet.entity.user.Friendship.FriendshipStatus;
import com.circlebet.entity.user.User;
import com.circlebet.service.user.FriendshipService;
import com.circlebet.service.user.UserService;
import com.circlebet.util.SecurityContextUtil;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for friendship management operations.
 * Handles friend requests, acceptance/rejection, and friend data retrieval.
 */
@RestController
@RequestMapping("/api/friendships")
@Validated
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final UserService userService;

    @Autowired
    public FriendshipController(FriendshipService friendshipService, UserService userService) {
        this.friendshipService = friendshipService;
        this.userService = userService;
    }

    // ==========================================
    // FRIEND REQUEST OPERATIONS
    // ==========================================

    /**
     * Send a friend request to another user.
     */
    @PostMapping("/request/{accepterId}")
    public ResponseEntity<Map<String, Object>> sendFriendRequest(@PathVariable @NotNull Long accepterId) {
        try {
            Long currentUserId = getCurrentUserId();
            Friendship friendship = friendshipService.sendFriendRequest(currentUserId, accepterId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Friend request sent successfully",
                "friendshipId", friendship.getId()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to send friend request"
            ));
        }
    }

    /**
     * Accept a friend request.
     */
    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<Map<String, Object>> acceptFriendRequest(@PathVariable @NotNull Long friendshipId) {
        try {
            Long currentUserId = getCurrentUserId();
            Friendship friendship = friendshipService.acceptFriendRequest(friendshipId, currentUserId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Friend request accepted successfully",
                "friendship", friendship
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to accept friend request"
            ));
        }
    }

    /**
     * Reject a friend request.
     */
    @PostMapping("/{friendshipId}/reject")
    public ResponseEntity<Map<String, Object>> rejectFriendRequest(@PathVariable @NotNull Long friendshipId) {
        try {
            Long currentUserId = getCurrentUserId();
            Friendship friendship = friendshipService.rejectFriendRequest(friendshipId, currentUserId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Friend request rejected successfully",
                "friendship", friendship
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to reject friend request"
            ));
        }
    }

    /**
     * Remove a friend (unfriend).
     */
    @DeleteMapping("/remove/{friendId}")
    public ResponseEntity<Map<String, Object>> removeFriend(@PathVariable @NotNull Long friendId) {
        try {
            Long currentUserId = getCurrentUserId();
            friendshipService.removeFriend(currentUserId, friendId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Friend removed successfully"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to remove friend"
            ));
        }
    }

    // ==========================================
    // FRIENDS DATA RETRIEVAL
    // ==========================================

    /**
     * Get all friends for the current user.
     */
    @GetMapping("/friends")
    public ResponseEntity<List<UserSearchResultResponseDto>> getFriends(
            @RequestParam(value = "search", required = false) String searchTerm) {
        try {
            Long currentUserId = getCurrentUserId();
            List<User> friends;

            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                friends = friendshipService.searchFriends(currentUserId, searchTerm.trim());
            } else {
                friends = friendshipService.getFriends(currentUserId);
            }

            List<UserSearchResultResponseDto> friendDtos = friends.stream()
                .map(this::mapUserToSearchResult)
                .collect(Collectors.toList());

            return ResponseEntity.ok(friendDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get friends count for the current user.
     */
    @GetMapping("/friends/count")
    public ResponseEntity<Map<String, Object>> getFriendsCount() {
        try {
            Long currentUserId = getCurrentUserId();
            long count = friendshipService.getFriendsCount(currentUserId);

            return ResponseEntity.ok(Map.of(
                "friendsCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get mutual friends with another user.
     */
    @GetMapping("/mutual/{userId}")
    public ResponseEntity<List<UserSearchResultResponseDto>> getMutualFriends(@PathVariable @NotNull Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            List<User> mutualFriends = friendshipService.getMutualFriends(currentUserId, userId);

            List<UserSearchResultResponseDto> mutualFriendDtos = mutualFriends.stream()
                .map(this::mapUserToSearchResult)
                .collect(Collectors.toList());

            return ResponseEntity.ok(mutualFriendDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get mutual friends count with another user.
     */
    @GetMapping("/mutual/{userId}/count")
    public ResponseEntity<Map<String, Object>> getMutualFriendsCount(@PathVariable @NotNull Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            long count = friendshipService.getMutualFriendsCount(currentUserId, userId);

            return ResponseEntity.ok(Map.of(
                "mutualFriendsCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==========================================
    // FRIEND REQUESTS DATA RETRIEVAL
    // ==========================================

    /**
     * Get pending friend requests sent by the current user.
     */
    @GetMapping("/requests/sent")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequestsSent() {
        try {
            Long currentUserId = getCurrentUserId();
            List<Friendship> requests = friendshipService.getPendingRequestsSent(currentUserId);

            List<Map<String, Object>> requestDtos = requests.stream()
                .map(this::mapFriendshipToDto)
                .collect(Collectors.toList());

            return ResponseEntity.ok(requestDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get pending friend requests received by the current user.
     */
    @GetMapping("/requests/received")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequestsReceived() {
        try {
            Long currentUserId = getCurrentUserId();
            List<Friendship> requests = friendshipService.getPendingRequestsReceived(currentUserId);

            List<Map<String, Object>> requestDtos = requests.stream()
                .map(this::mapFriendshipToDto)
                .collect(Collectors.toList());

            return ResponseEntity.ok(requestDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get count of pending friend requests received.
     */
    @GetMapping("/requests/received/count")
    public ResponseEntity<Map<String, Object>> getPendingRequestsReceivedCount() {
        try {
            Long currentUserId = getCurrentUserId();
            long count = friendshipService.getPendingRequestsReceivedCount(currentUserId);

            return ResponseEntity.ok(Map.of(
                "pendingRequestsCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==========================================
    // FRIENDSHIP STATUS QUERIES
    // ==========================================

    /**
     * Get friendship status with another user.
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<Map<String, Object>> getFriendshipStatus(@PathVariable @NotNull Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            FriendshipStatus status = friendshipService.getFriendshipStatus(currentUserId, userId);
            boolean areFriends = friendshipService.areFriends(currentUserId, userId);
            boolean hasPendingRequest = friendshipService.hasPendingRequest(currentUserId, userId);

            return ResponseEntity.ok(Map.of(
                "friendshipStatus", status != null ? status.name() : "NONE",
                "areFriends", areFriends,
                "hasPendingRequest", hasPendingRequest
            ));
        } catch (Exception e) {
            e.printStackTrace(); // Add logging to see the actual error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to get friendship status: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            ));
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private Long getCurrentUserId() {
        return SecurityContextUtil.getCurrentUserId()
            .orElseThrow(() -> new IllegalStateException("User not authenticated"));
    }

    private UserSearchResultResponseDto mapUserToSearchResult(User user) {
        return UserSearchResultResponseDto.fromUser(user);
    }

    private Map<String, Object> mapFriendshipToDto(Friendship friendship) {
        Long currentUserId = getCurrentUserId();
        User currentUser = userService.getUserById(currentUserId);
        User otherUser = friendship.getOtherUser(currentUser);

        return Map.of(
            "friendshipId", friendship.getId(),
            "status", friendship.getStatus().name(),
            "createdAt", friendship.getCreatedAt(),
            "acceptedAt", friendship.getAcceptedAt(),
            "user", mapUserToSearchResult(otherUser),
            "isRequester", friendship.isRequester(currentUser)
        );
    }
}