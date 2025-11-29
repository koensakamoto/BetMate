package com.rivalpicks.event.betting;

import com.rivalpicks.event.base.DomainEvent;

import java.time.LocalDateTime;

public class BetDeadlineApproachingEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final LocalDateTime bettingDeadline;
    private final long minutesRemaining;

    public BetDeadlineApproachingEvent(Long betId, String betTitle, Long groupId, String groupName,
                                      LocalDateTime bettingDeadline, long minutesRemaining) {
        super("BET_DEADLINE_APPROACHING");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.bettingDeadline = bettingDeadline;
        this.minutesRemaining = minutesRemaining;
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

    public long getMinutesRemaining() {
        return minutesRemaining;
    }

    // Backward compatibility - returns hours (rounded down)
    public int getHoursRemaining() {
        return (int) (minutesRemaining / 60);
    }

    public boolean isUrgent() {
        return minutesRemaining <= 60;
    }
}