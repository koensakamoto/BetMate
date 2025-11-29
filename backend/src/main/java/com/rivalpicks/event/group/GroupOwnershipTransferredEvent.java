package com.rivalpicks.event.group;

import com.rivalpicks.event.base.DomainEvent;

/**
 * Event fired when group ownership is transferred from one user to another.
 * This triggers notifications to the new owner, previous owner, and other admins.
 */
public class GroupOwnershipTransferredEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long previousOwnerId;
    private final String previousOwnerName;
    private final Long newOwnerId;
    private final String newOwnerName;

    public GroupOwnershipTransferredEvent(Long groupId, String groupName,
                                          Long previousOwnerId, String previousOwnerName,
                                          Long newOwnerId, String newOwnerName) {
        super("GROUP_OWNERSHIP_TRANSFERRED");
        this.groupId = groupId;
        this.groupName = groupName;
        this.previousOwnerId = previousOwnerId;
        this.previousOwnerName = previousOwnerName;
        this.newOwnerId = newOwnerId;
        this.newOwnerName = newOwnerName;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getPreviousOwnerId() {
        return previousOwnerId;
    }

    public String getPreviousOwnerName() {
        return previousOwnerName;
    }

    public Long getNewOwnerId() {
        return newOwnerId;
    }

    public String getNewOwnerName() {
        return newOwnerName;
    }
}
