package com.betmate.dto.export;

import com.betmate.entity.betting.Bet;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for exporting bet data (bets created by user).
 */
public record BetExportDto(
    Long id,
    String title,
    String description,
    String betType,
    String status,
    String outcome,
    String resolutionMethod,
    String stakeType,
    BigDecimal fixedStakeAmount,
    String socialStakeDescription,
    BigDecimal totalPool,
    Integer totalParticipants,
    String option1,
    String option2,
    String option3,
    String option4,
    LocalDateTime bettingDeadline,
    LocalDateTime resolveDate,
    LocalDateTime resolvedAt,
    Long groupId,
    String groupName,
    LocalDateTime createdAt
) {
    public static BetExportDto fromBet(Bet bet) {
        return new BetExportDto(
            bet.getId(),
            bet.getTitle(),
            bet.getDescription(),
            bet.getBetType() != null ? bet.getBetType().name() : null,
            bet.getStatus() != null ? bet.getStatus().name() : null,
            bet.getOutcome() != null ? bet.getOutcome().name() : null,
            bet.getResolutionMethod() != null ? bet.getResolutionMethod().name() : null,
            bet.getStakeType() != null ? bet.getStakeType().name() : null,
            bet.getFixedStakeAmount(),
            bet.getSocialStakeDescription(),
            bet.getTotalPool(),
            bet.getTotalParticipants(),
            bet.getOption1(),
            bet.getOption2(),
            bet.getOption3(),
            bet.getOption4(),
            bet.getBettingDeadline(),
            bet.getResolveDate(),
            bet.getResolvedAt(),
            bet.getGroup() != null ? bet.getGroup().getId() : null,
            bet.getGroup() != null ? bet.getGroup().getName() : null,
            bet.getCreatedAt()
        );
    }
}
