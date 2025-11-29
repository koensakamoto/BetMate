package com.rivalpicks.event.betting;

import com.rivalpicks.event.base.DomainEvent;

import java.time.LocalDateTime;
import java.util.List;

public class BetResolutionDeadlineApproachingEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final LocalDateTime resolveDate;
    private final String resolutionMethod; // SELF, ASSIGNED_RESOLVERS, PARTICIPANT_VOTE
    private final Long creatorId;
    private final List<Long> assignedResolverIds;
    private final long minutesUntilDeadline;

    public BetResolutionDeadlineApproachingEvent(Long betId, String betTitle, Long groupId, String groupName,
                                                 LocalDateTime resolveDate, String resolutionMethod,
                                                 Long creatorId, List<Long> assignedResolverIds,
                                                 long minutesUntilDeadline) {
        super("BET_RESOLUTION_DEADLINE_APPROACHING");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.resolveDate = resolveDate;
        this.resolutionMethod = resolutionMethod;
        this.creatorId = creatorId;
        this.assignedResolverIds = assignedResolverIds;
        this.minutesUntilDeadline = minutesUntilDeadline;
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

    public LocalDateTime getResolveDate() {
        return resolveDate;
    }

    public String getResolutionMethod() {
        return resolutionMethod;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public List<Long> getAssignedResolverIds() {
        return assignedResolverIds;
    }

    public long getMinutesUntilDeadline() {
        return minutesUntilDeadline;
    }

    // Backward compatibility - returns hours (rounded down)
    public int getHoursUntilDeadline() {
        return (int) (minutesUntilDeadline / 60);
    }

    public boolean isUrgent() {
        return minutesUntilDeadline <= 60;
    }
}
