package com.rivalpicks.dto.betting.request;

import jakarta.validation.constraints.*;

/**
 * Request DTO for applying insurance to a bet participation.
 */
public class ApplyInsuranceRequestDto {

    @NotNull(message = "Insurance item ID is required")
    private Long insuranceItemId;

    // Constructors
    public ApplyInsuranceRequestDto() {}

    public ApplyInsuranceRequestDto(Long insuranceItemId) {
        this.insuranceItemId = insuranceItemId;
    }

    // Getters and setters
    public Long getInsuranceItemId() {
        return insuranceItemId;
    }

    public void setInsuranceItemId(Long insuranceItemId) {
        this.insuranceItemId = insuranceItemId;
    }
}
