package com.rivalpicks.event.betting;

import com.rivalpicks.event.base.DomainEvent;

import java.time.LocalDateTime;

/**
 * Event published when a bet's betting deadline has been reached.
 * The bet has been closed and no more participants can join.
 */
public class BetDeadlineReachedEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final LocalDateTime bettingDeadline;
    private final int totalParticipants;

    public BetDeadlineReachedEvent(Long betId, String betTitle, Long groupId, String groupName,
                                   LocalDateTime bettingDeadline, int totalParticipants) {
        super("BET_DEADLINE_REACHED");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.bettingDeadline = bettingDeadline;
        this.totalParticipants = totalParticipants;
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

    public String getGroupName() {
        return groupName;
    }

    public LocalDateTime getBettingDeadline() {
        return bettingDeadline;
    }

    public int getTotalParticipants() {
        return totalParticipants;
    }
}
