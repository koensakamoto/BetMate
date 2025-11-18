package com.betmate.dto.group.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for inviting a user to a group.
 * Invited users join as regular members (MEMBER role).
 */
@Data
public class InviteUserRequestDto {

    @NotBlank(message = "Username is required")
    private String username;
}
