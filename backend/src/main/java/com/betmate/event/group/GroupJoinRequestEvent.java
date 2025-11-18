package com.betmate.event.group;

import com.betmate.event.base.DomainEvent;

/**
 * Event fired when a user requests to join a private group.
 * This triggers notifications to group admins and officers.
 */
public class GroupJoinRequestEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long requesterId;
    private final String requesterName;
    private final String requesterUsername;
    private final Long membershipId;

    public GroupJoinRequestEvent(Long groupId, String groupName,
                                 Long requesterId, String requesterName, String requesterUsername,
                                 Long membershipId) {
        super("GROUP_JOIN_REQUEST");
        this.groupId = groupId;
        this.groupName = groupName;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterUsername = requesterUsername;
        this.membershipId = membershipId;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public String getRequesterUsername() {
        return requesterUsername;
    }

    public Long getMembershipId() {
        return membershipId;
    }
}
