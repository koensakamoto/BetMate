package com.rivalpicks.dto.group.request;

import com.rivalpicks.entity.group.GroupMembership;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for updating a member's role in a group.
 */
@Data
public class UpdateMemberRoleRequestDto {

    @NotNull(message = "Role is required")
    private GroupMembership.MemberRole role;
}