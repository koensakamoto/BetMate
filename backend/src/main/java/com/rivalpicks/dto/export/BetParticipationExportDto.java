package com.rivalpicks.dto.export;

import com.rivalpicks.entity.betting.BetParticipation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for exporting bet participation data.
 */
public record BetParticipationExportDto(
    Long id,
    Long betId,
    String betTitle,
    Integer chosenOption,
    String chosenOptionLabel,
    BigDecimal betAmount,
    BigDecimal potentialWinnings,
    BigDecimal actualWinnings,
    String status,
    Boolean insuranceApplied,
    Integer insuranceRefundPercentage,
    BigDecimal insuranceRefundAmount,
    LocalDateTime settledAt,
    LocalDateTime createdAt
) {
    public static BetParticipationExportDto fromBetParticipation(BetParticipation participation) {
        String chosenOptionLabel = null;
        if (participation.getBet() != null && participation.getChosenOption() != null) {
            chosenOptionLabel = switch (participation.getChosenOption()) {
                case 1 -> participation.getBet().getOption1();
                case 2 -> participation.getBet().getOption2();
                case 3 -> participation.getBet().getOption3();
                case 4 -> participation.getBet().getOption4();
                default -> null;
            };
        }

        return new BetParticipationExportDto(
            participation.getId(),
            participation.getBet() != null ? participation.getBet().getId() : null,
            participation.getBet() != null ? participation.getBet().getTitle() : null,
            participation.getChosenOption(),
            chosenOptionLabel,
            participation.getBetAmount(),
            participation.getPotentialWinnings(),
            participation.getActualWinnings(),
            participation.getStatus() != null ? participation.getStatus().name() : null,
            participation.getInsuranceApplied(),
            participation.getInsuranceRefundPercentage(),
            participation.getInsuranceRefundAmount(),
            participation.getSettledAt(),
            participation.getCreatedAt()
        );
    }
}
