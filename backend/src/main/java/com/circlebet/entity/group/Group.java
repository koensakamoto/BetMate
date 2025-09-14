package com.circlebet.entity.group;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

import com.circlebet.entity.user.User;
import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.messaging.Message;

/**
 * Group entity representing a betting group in the CircleBet platform.
 * 
 * Groups allow users to create communities for shared betting activities.
 */
@Entity
@Table(name = "`groups`", indexes = {
    @Index(name = "idx_group_name", columnList = "groupName"),
    @Index(name = "idx_group_creator", columnList = "creator_id"),
    @Index(name = "idx_group_privacy", columnList = "privacy"),
    @Index(name = "idx_group_active", columnList = "isActive"),
    @Index(name = "idx_group_deleted_at", columnList = "deletedAt")
})
public class Group {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // GROUP INFORMATION
    // ==========================================
    
    @Column(nullable = false, unique = true, length = 50)
    @Size(min = 3, max = 50, message = "Group name must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s_-]+$", message = "Group name can only contain letters, numbers, spaces, underscores, and hyphens")
    private String groupName;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String groupPictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Privacy privacy = Privacy.PUBLIC;

    // ==========================================
    // GROUP MANAGEMENT
    // ==========================================
    
    @ManyToOne(optional = false)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(nullable = false)
    private Integer memberCount = 1;

    @Column
    private Integer maxMembers;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean autoApproveMembers = true;

    // ==========================================
    // CHAT METADATA
    // ==========================================
    
    @Column(nullable = false)
    private Long totalMessages = 0L;

    private LocalDateTime lastMessageAt;

    @ManyToOne
    @JoinColumn(name = "last_message_user_id")
    private User lastMessageUser;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================
    
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GroupMembership> memberships;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Bet> bets;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> messages;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================
    
    // Identity
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    // Group Information
    public String getGroupName() {
        return groupName;
    }
    
    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }

    public String getGroupPictureUrl() {
        return groupPictureUrl;
    }
    
    public void setGroupPictureUrl(String groupPictureUrl) {
        this.groupPictureUrl = groupPictureUrl;
    }

    public Privacy getPrivacy() {
        return privacy;
    }
    
    public void setPrivacy(Privacy privacy) {
        this.privacy = privacy;
    }

    // Group Management
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }

    public Integer getMemberCount() {
        return memberCount;
    }
    
    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }
    
    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getAutoApproveMembers() {
        return autoApproveMembers;
    }
    
    public void setAutoApproveMembers(Boolean autoApproveMembers) {
        this.autoApproveMembers = autoApproveMembers;
    }

    // System Fields
    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }
    
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the group has been soft deleted.
     * 
     * @return true if group is marked as deleted
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if the group is at maximum capacity.
     * 
     * @return true if group has reached max members limit
     */
    public boolean isFull() {
        return maxMembers != null && memberCount >= maxMembers;
    }

    /**
     * Checks if the group can accept new members.
     * 
     * @return true if group is active, not deleted, and not full
     */
    public boolean canAcceptNewMembers() {
        return isActive && !isDeleted() && !isFull();
    }

    /**
     * Checks if the group is public.
     * 
     * @return true if privacy is set to PUBLIC
     */
    public boolean isPublic() {
        return privacy == Privacy.PUBLIC;
    }

    /**
     * Checks if the given user is the creator of this group.
     * 
     * @param user the user to check
     * @return true if user is the group creator
     */
    public boolean isCreator(User user) {
        return creator != null && user != null && 
               creator.getId() != null && user.getId() != null &&
               creator.getId().equals(user.getId());
    }

    /**
     * Increments the member count by 1.
     */
    public void incrementMemberCount() {
        memberCount++;
    }

    /**
     * Decrements the member count by 1, ensuring it doesn't go below 0.
     */
    public void decrementMemberCount() {
        if (memberCount > 0) {
            memberCount--;
        }
    }

    /**
     * Records a new message posted to this group's chat.
     * 
     * @param user the user who posted the message
     */
    public void recordNewMessage(User user) {
        totalMessages++;
        lastMessageAt = LocalDateTime.now();
        lastMessageUser = user;
    }

    /**
     * Checks if the group has any messages.
     * 
     * @return true if group has messages
     */
    public boolean hasMessages() {
        return totalMessages > 0;
    }

    // Relationships
    public List<GroupMembership> getMemberships() {
        return memberships;
    }
    
    public void setMemberships(List<GroupMembership> memberships) {
        this.memberships = memberships;
    }

    public List<Bet> getBets() {
        return bets;
    }
    
    public void setBets(List<Bet> bets) {
        this.bets = bets;
    }

    public List<Message> getMessages() {
        return messages;
    }
    
    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    // Chat Metadata
    public Long getTotalMessages() {
        return totalMessages;
    }
    
    public void setTotalMessages(Long totalMessages) {
        this.totalMessages = totalMessages;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }
    
    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public User getLastMessageUser() {
        return lastMessageUser;
    }
    
    public void setLastMessageUser(User lastMessageUser) {
        this.lastMessageUser = lastMessageUser;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Privacy levels for groups.
     */
    public enum Privacy {
        PUBLIC,      // Anyone can see and join
        PRIVATE,     // Visible but requires approval to join
        INVITE_ONLY  // Only visible to invited members
    }
}