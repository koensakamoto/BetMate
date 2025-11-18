package com.betmate.event.betting;

import com.betmate.event.base.DomainEvent;

import java.time.LocalDateTime;
import java.util.List;

public class BetResolutionDeadlineApproachingEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final LocalDateTime resolveDate;
    private final String resolutionMethod; // CREATOR_ONLY, ASSIGNED_RESOLVER, CONSENSUS_VOTING
    private final Long creatorId;
    private final List<Long> assignedResolverIds;
    private final int hoursUntilDeadline; // 24 or 1

    public BetResolutionDeadlineApproachingEvent(Long betId, String betTitle, Long groupId, String groupName,
                                                 LocalDateTime resolveDate, String resolutionMethod,
                                                 Long creatorId, List<Long> assignedResolverIds,
                                                 int hoursUntilDeadline) {
        super("BET_RESOLUTION_DEADLINE_APPROACHING");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.resolveDate = resolveDate;
        this.resolutionMethod = resolutionMethod;
        this.creatorId = creatorId;
        this.assignedResolverIds = assignedResolverIds;
        this.hoursUntilDeadline = hoursUntilDeadline;
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

    public int getHoursUntilDeadline() {
        return hoursUntilDeadline;
    }
}
