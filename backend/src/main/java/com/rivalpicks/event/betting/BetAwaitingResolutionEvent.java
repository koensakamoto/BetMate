package com.rivalpicks.event.betting;

import com.rivalpicks.entity.betting.Bet.BetResolutionMethod;
import com.rivalpicks.event.base.DomainEvent;

import java.time.LocalDateTime;

/**
 * Event published when a bet has reached its resolution deadline
 * and is awaiting manual resolution by the creator, assigned resolvers, or voters.
 */
public class BetAwaitingResolutionEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final LocalDateTime resolveDate;
    private final BetResolutionMethod resolutionMethod;
    private final Long creatorId;

    public BetAwaitingResolutionEvent(Long betId, String betTitle, Long groupId,
                                     LocalDateTime resolveDate, BetResolutionMethod resolutionMethod,
                                     Long creatorId) {
        super("BET_AWAITING_RESOLUTION");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.resolveDate = resolveDate;
        this.resolutionMethod = resolutionMethod;
        this.creatorId = creatorId;
    }

    public Long getBetId() {
        return betId;
    }

    public String getBetTitle() {
        return betTitle;
    }

    public Long getGroupId() {
        return groupId;
    }

    public LocalDateTime getResolveDate() {
        return resolveDate;
    }

    public BetResolutionMethod getResolutionMethod() {
        return resolutionMethod;
    }

    public Long getCreatorId() {
        return creatorId;
    }
}
