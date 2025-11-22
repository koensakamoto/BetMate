package com.rivalpicks.dto.group.request;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for transferring group ownership.
 */
public class TransferOwnershipRequestDto {

    @NotNull(message = "New owner ID is required")
    private Long newOwnerId;

    public TransferOwnershipRequestDto() {}

    public TransferOwnershipRequestDto(Long newOwnerId) {
        this.newOwnerId = newOwnerId;
    }

    public Long getNewOwnerId() {
        return newOwnerId;
    }

    public void setNewOwnerId(Long newOwnerId) {
        this.newOwnerId = newOwnerId;
    }
}
