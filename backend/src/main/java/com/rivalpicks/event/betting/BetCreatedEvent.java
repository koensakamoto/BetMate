package com.rivalpicks.event.betting;

import com.rivalpicks.event.base.DomainEvent;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BetCreatedEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final String betDescription;
    private final Long groupId;
    private final String groupName;
    private final Long creatorId;
    private final String creatorName;
    private final BigDecimal minimumBet;
    private final LocalDateTime bettingDeadline;
    private final LocalDateTime resolutionDate;
    private final String resolutionMethod;
    private final List<Long> assignedResolverIds;

    public BetCreatedEvent(Long betId, String betTitle, String betDescription,
                          Long groupId, String groupName, Long creatorId, String creatorName,
                          BigDecimal minimumBet, LocalDateTime bettingDeadline, LocalDateTime resolutionDate,
                          String resolutionMethod, List<Long> assignedResolverIds) {
        super("BET_CREATED");
        this.betId = betId;
        this.betTitle = betTitle;
        this.betDescription = betDescription;
        this.groupId = groupId;
        this.groupName = groupName;
        this.creatorId = creatorId;
        this.creatorName = creatorName;
        this.minimumBet = minimumBet;
        this.bettingDeadline = bettingDeadline;
        this.resolutionDate = resolutionDate;
        this.resolutionMethod = resolutionMethod;
        this.assignedResolverIds = assignedResolverIds;
    }

    public Long getBetId() {
        return betId;
    }

    public String getBetTitle() {
        return betTitle;
    }

    public String getBetDescription() {
        return betDescription;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public BigDecimal getMinimumBet() {
        return minimumBet;
    }

    public LocalDateTime getBettingDeadline() {
        return bettingDeadline;
    }

    public LocalDateTime getResolutionDate() {
        return resolutionDate;
    }

    public String getResolutionMethod() {
        return resolutionMethod;
    }

    public List<Long> getAssignedResolverIds() {
        return assignedResolverIds;
    }
}