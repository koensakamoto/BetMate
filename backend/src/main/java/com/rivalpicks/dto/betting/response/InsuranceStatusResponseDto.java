package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.betting.BetParticipation;

import java.math.BigDecimal;

/**
 * Response DTO for insurance status on a bet participation.
 * Shows if insurance is applied and what coverage the user has.
 */
public class InsuranceStatusResponseDto {

    private boolean hasInsurance;
    private Integer insurancePercentage;
    private String insuranceTier;
    private BigDecimal estimatedRefund;
    private BigDecimal betAmount;

    // Constructors
    public InsuranceStatusResponseDto() {}

    public InsuranceStatusResponseDto(boolean hasInsurance, Integer insurancePercentage,
                                     String insuranceTier, BigDecimal estimatedRefund,
                                     BigDecimal betAmount) {
        this.hasInsurance = hasInsurance;
        this.insurancePercentage = insurancePercentage;
        this.insuranceTier = insuranceTier;
        this.estimatedRefund = estimatedRefund;
        this.betAmount = betAmount;
    }

    // Getters and setters
    public boolean isHasInsurance() {
        return hasInsurance;
    }

    public void setHasInsurance(boolean hasInsurance) {
        this.hasInsurance = hasInsurance;
    }

    public Integer getInsurancePercentage() {
        return insurancePercentage;
    }

    public void setInsurancePercentage(Integer insurancePercentage) {
        this.insurancePercentage = insurancePercentage;
    }

    public String getInsuranceTier() {
        return insuranceTier;
    }

    public void setInsuranceTier(String insuranceTier) {
        this.insuranceTier = insuranceTier;
    }

    public BigDecimal getEstimatedRefund() {
        return estimatedRefund;
    }

    public void setEstimatedRefund(BigDecimal estimatedRefund) {
        this.estimatedRefund = estimatedRefund;
    }

    public BigDecimal getBetAmount() {
        return betAmount;
    }

    public void setBetAmount(BigDecimal betAmount) {
        this.betAmount = betAmount;
    }

    // Helper method to convert from entity
    public static InsuranceStatusResponseDto fromParticipation(BetParticipation participation) {
        InsuranceStatusResponseDto dto = new InsuranceStatusResponseDto();

        dto.setHasInsurance(participation.hasInsurance());
        dto.setBetAmount(participation.getBetAmount());

        if (participation.hasInsurance()) {
            dto.setInsurancePercentage(participation.getInsuranceRefundPercentage());
            dto.setInsuranceTier(getTierName(participation.getInsuranceRefundPercentage()));
            dto.setEstimatedRefund(participation.getInsuranceRefundAmount());
        }

        return dto;
    }

    private static String getTierName(Integer percentage) {
        if (percentage == null) return null;
        return switch (percentage) {
            case 25 -> "Basic";
            case 50 -> "Premium";
            case 75 -> "Elite";
            default -> "Unknown";
        };
    }
}
