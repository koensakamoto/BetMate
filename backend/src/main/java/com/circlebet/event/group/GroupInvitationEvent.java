package com.circlebet.event.group;

import com.circlebet.event.base.DomainEvent;

public class GroupInvitationEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final String groupDescription;
    private final Long inviterId;
    private final String inviterName;
    private final Long invitedUserId;
    private final String invitedUsername;

    public GroupInvitationEvent(Long groupId, String groupName, String groupDescription,
                               Long inviterId, String inviterName,
                               Long invitedUserId, String invitedUsername) {
        super("GROUP_INVITATION");
        this.groupId = groupId;
        this.groupName = groupName;
        this.groupDescription = groupDescription;
        this.inviterId = inviterId;
        this.inviterName = inviterName;
        this.invitedUserId = invitedUserId;
        this.invitedUsername = invitedUsername;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getGroupDescription() {
        return groupDescription;
    }

    public Long getInviterId() {
        return inviterId;
    }

    public String getInviterName() {
        return inviterName;
    }

    public Long getInvitedUserId() {
        return invitedUserId;
    }

    public String getInvitedUsername() {
        return invitedUsername;
    }
}