package com.rivalpicks.dto.group.response;

import com.rivalpicks.service.group.GroupInviteService.InviteValidationResult;

/**
 * Response DTO for invite token validation.
 */
public class InviteValidationResponseDto {

    private boolean valid;
    private String reason;
    private Long groupId;
    private String groupName;

    public InviteValidationResponseDto() {
    }

    public static InviteValidationResponseDto fromValidationResult(InviteValidationResult result) {
        InviteValidationResponseDto dto = new InviteValidationResponseDto();
        dto.setValid(result.isValid());
        dto.setReason(result.getReason());
        dto.setGroupId(result.getGroupId());
        dto.setGroupName(result.getGroupName());
        return dto;
    }

    // Getters and Setters
    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
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
}
