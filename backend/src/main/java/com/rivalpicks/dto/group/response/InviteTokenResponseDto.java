package com.rivalpicks.dto.group.response;

import com.rivalpicks.entity.group.GroupInvite;

import java.time.LocalDateTime;

/**
 * Response DTO for invite token creation.
 */
public class InviteTokenResponseDto {

    private String token;
    private Long groupId;
    private String groupName;
    private LocalDateTime expiresAt;
    private Integer maxUses;
    private Integer useCount;
    private LocalDateTime createdAt;

    public InviteTokenResponseDto() {
    }

    public static InviteTokenResponseDto fromEntity(GroupInvite invite) {
        InviteTokenResponseDto dto = new InviteTokenResponseDto();
        dto.setToken(invite.getToken());
        dto.setGroupId(invite.getGroup().getId());
        dto.setGroupName(invite.getGroup().getGroupName());
        dto.setExpiresAt(invite.getExpiresAt());
        dto.setMaxUses(invite.getMaxUses());
        dto.setUseCount(invite.getUseCount());
        dto.setCreatedAt(invite.getCreatedAt());
        return dto;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Integer getMaxUses() {
        return maxUses;
    }

    public void setMaxUses(Integer maxUses) {
        this.maxUses = maxUses;
    }

    public Integer getUseCount() {
        return useCount;
    }

    public void setUseCount(Integer useCount) {
        this.useCount = useCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
