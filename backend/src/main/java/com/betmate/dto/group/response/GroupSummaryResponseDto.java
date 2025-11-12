package com.betmate.dto.group.response;

import com.betmate.entity.group.Group;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Lightweight response DTO for group summary information.
 * Used in lists and search results.
 */
public class GroupSummaryResponseDto {

    private Long id;
    private String groupName;
    private String description;
    private String groupPictureUrl;
    private Group.Privacy privacy;
    private String creatorUsername;
    private Integer memberCount;
    private Integer maxMembers;
    private Boolean isActive;
    private Long totalMessages;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;

    // User context
    private Boolean isUserMember;

    // Member previews for displaying avatars
    private List<MemberPreviewDto> memberPreviews;
    
    // Constructors
    public GroupSummaryResponseDto() {}

    public GroupSummaryResponseDto(Long id, String groupName, String description, String groupPictureUrl,
                                 Group.Privacy privacy, String creatorUsername, Integer memberCount,
                                 Integer maxMembers, Boolean isActive, Long totalMessages,
                                 LocalDateTime lastMessageAt, LocalDateTime createdAt) {
        this.id = id;
        this.groupName = groupName;
        this.description = description;
        this.groupPictureUrl = groupPictureUrl;
        this.privacy = privacy;
        this.creatorUsername = creatorUsername;
        this.memberCount = memberCount;
        this.maxMembers = maxMembers;
        this.isActive = isActive;
        this.totalMessages = totalMessages;
        this.lastMessageAt = lastMessageAt;
        this.createdAt = createdAt;
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

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsUserMember() {
        return isUserMember;
    }

    public void setIsUserMember(Boolean isUserMember) {
        this.isUserMember = isUserMember;
    }

    public List<MemberPreviewDto> getMemberPreviews() {
        return memberPreviews;
    }

    public void setMemberPreviews(List<MemberPreviewDto> memberPreviews) {
        this.memberPreviews = memberPreviews;
    }
}