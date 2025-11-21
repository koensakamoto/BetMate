package com.rivalpicks.entity.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Friendship entity representing mutual relationships between users.
 *
 * This entity handles symmetric friend relationships with request/acceptance flow.
 * Each friendship has a requester and accepter, with status tracking.
 */
@Entity
@Table(name = "friendships",
    indexes = {
        @Index(name = "idx_friendship_requester", columnList = "requester_id"),
        @Index(name = "idx_friendship_accepter", columnList = "accepter_id"),
        @Index(name = "idx_friendship_status", columnList = "status"),
        @Index(name = "idx_friendship_created", columnList = "createdAt")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_friendship_users", columnNames = {"requester_id", "accepter_id"})
    }
)
public class Friendship {

    // ==========================================
    // IDENTITY
    // ==========================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "accepter_id", nullable = false)
    private User accepter;

    // ==========================================
    // FRIENDSHIP STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status = FriendshipStatus.PENDING;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime acceptedAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    // ==========================================
    // CONSTRUCTORS
    // ==========================================

    public Friendship() {}

    public Friendship(User requester, User accepter) {
        this.requester = requester;
        this.accepter = accepter;
        this.status = FriendshipStatus.PENDING;
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getRequester() {
        return requester;
    }

    public void setRequester(User requester) {
        this.requester = requester;
    }

    public User getAccepter() {
        return accepter;
    }

    public void setAccepter(User accepter) {
        this.accepter = accepter;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
        if (status == FriendshipStatus.ACCEPTED && acceptedAt == null) {
            this.acceptedAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Checks if the friendship is accepted (mutual friends).
     *
     * @return true if friendship is accepted
     */
    public boolean isAccepted() {
        return status == FriendshipStatus.ACCEPTED;
    }

    /**
     * Checks if the friendship is pending acceptance.
     *
     * @return true if friendship is pending
     */
    public boolean isPending() {
        return status == FriendshipStatus.PENDING;
    }

    /**
     * Checks if the friendship was rejected.
     *
     * @return true if friendship was rejected
     */
    public boolean isRejected() {
        return status == FriendshipStatus.REJECTED;
    }

    /**
     * Gets the other user in the friendship relationship.
     *
     * @param currentUser the current user
     * @return the other user in the friendship
     */
    public User getOtherUser(User currentUser) {
        if (currentUser.equals(requester)) {
            return accepter;
        } else if (currentUser.equals(accepter)) {
            return requester;
        }
        throw new IllegalArgumentException("User is not part of this friendship");
    }

    /**
     * Checks if the given user is the requester of this friendship.
     *
     * @param user the user to check
     * @return true if user is the requester
     */
    public boolean isRequester(User user) {
        return requester != null && requester.equals(user);
    }

    /**
     * Checks if the given user is the accepter of this friendship.
     *
     * @param user the user to check
     * @return true if user is the accepter
     */
    public boolean isAccepter(User user) {
        return accepter != null && accepter.equals(user);
    }

    /**
     * Accepts the friendship request.
     */
    public void accept() {
        if (status != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Can only accept pending friendship requests");
        }
        setStatus(FriendshipStatus.ACCEPTED);
    }

    /**
     * Rejects the friendship request.
     */
    public void reject() {
        if (status != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending friendship requests");
        }
        setStatus(FriendshipStatus.REJECTED);
    }

    /**
     * Checks if two users are involved in this friendship.
     *
     * @param user1 first user
     * @param user2 second user
     * @return true if both users are part of this friendship
     */
    public boolean involvesBothUsers(User user1, User user2) {
        return (requester.equals(user1) && accepter.equals(user2)) ||
               (requester.equals(user2) && accepter.equals(user1));
    }

    // ==========================================
    // EQUALS AND HASHCODE
    // ==========================================

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Friendship)) return false;
        Friendship other = (Friendship) obj;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // ==========================================
    // ENUMS
    // ==========================================

    /**
     * Status of a friendship relationship.
     */
    public enum FriendshipStatus {
        PENDING,    // Friend request sent, awaiting acceptance
        ACCEPTED,   // Friends - mutual relationship
        REJECTED    // Friend request rejected
    }
}