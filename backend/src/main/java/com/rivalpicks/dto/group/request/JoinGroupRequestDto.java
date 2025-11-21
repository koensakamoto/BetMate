package com.rivalpicks.dto.group.request;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for joining a group.
 */
public class JoinGroupRequestDto {
    
    @NotNull(message = "Group ID is required")
    private Long groupId;
    
    private String joinMessage; // Optional message when joining
    
    // Constructors
    public JoinGroupRequestDto() {}

    public JoinGroupRequestDto(Long groupId, String joinMessage) {
        this.groupId = groupId;
        this.joinMessage = joinMessage;
    }

    // Getters and setters
    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getJoinMessage() {
        return joinMessage;
    }

    public void setJoinMessage(String joinMessage) {
        this.joinMessage = joinMessage;
    }
}