package com.rivalpicks.dto.group.response;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;

import java.time.LocalDateTime;

/**
 * Response DTO for group information.
 */
public class GroupResponseDto {
    
    private Long id;
    private String groupName;
    private String description;
    private String groupPictureUrl;
    private Group.Privacy privacy;
    private UserProfileResponseDto owner;
    private Integer memberCount;
    private Integer maxMembers;
    private Boolean isActive;
    private Long totalMessages;
    private LocalDateTime lastMessageAt;
    private UserProfileResponseDto lastMessageUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional fields for user context
    private Boolean isUserMember;
    private String userRole; // ADMIN, MEMBER
    private String userMembershipStatus; // PENDING, APPROVED, REJECTED, LEFT
    private String ownerUsername; // Username of the group owner
    
    // Constructors
    public GroupResponseDto() {}

    public GroupResponseDto(Long id, String groupName, String description, String groupPictureUrl,
                          Group.Privacy privacy, UserProfileResponseDto owner, Integer memberCount,
                          Integer maxMembers, Boolean isActive, Long totalMessages,
                          LocalDateTime lastMessageAt, UserProfileResponseDto lastMessageUser,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.groupName = groupName;
        this.description = description;
        this.groupPictureUrl = groupPictureUrl;
        this.privacy = privacy;
        this.owner = owner;
        this.memberCount = memberCount;
        this.maxMembers = maxMembers;
        this.isActive = isActive;
        this.totalMessages = totalMessages;
        this.lastMessageAt = lastMessageAt;
        this.lastMessageUser = lastMessageUser;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Group.Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Group.Privacy privacy) {
        this.privacy = privacy;
    }

    public UserProfileResponseDto getOwner() {
        return owner;
    }

    public void setOwner(UserProfileResponseDto owner) {
        this.owner = owner;
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

    public UserProfileResponseDto getLastMessageUser() {
        return lastMessageUser;
    }

    public void setLastMessageUser(UserProfileResponseDto lastMessageUser) {
        this.lastMessageUser = lastMessageUser;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsUserMember() {
        return isUserMember;
    }

    public void setIsUserMember(Boolean isUserMember) {
        this.isUserMember = isUserMember;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getUserMembershipStatus() {
        return userMembershipStatus;
    }

    public void setUserMembershipStatus(String userMembershipStatus) {
        this.userMembershipStatus = userMembershipStatus;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }
}