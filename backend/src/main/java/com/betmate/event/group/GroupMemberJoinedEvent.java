package com.betmate.event.group;

import com.betmate.event.base.DomainEvent;

public class GroupMemberJoinedEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long newMemberId;
    private final String newMemberName;
    private final String newMemberUsername;
    private final boolean wasInvited;

    public GroupMemberJoinedEvent(Long groupId, String groupName,
                                 Long newMemberId, String newMemberName, String newMemberUsername,
                                 boolean wasInvited) {
        super("GROUP_MEMBER_JOINED");
        this.groupId = groupId;
        this.groupName = groupName;
        this.newMemberId = newMemberId;
        this.newMemberName = newMemberName;
        this.newMemberUsername = newMemberUsername;
        this.wasInvited = wasInvited;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getNewMemberId() {
        return newMemberId;
    }

    public String getNewMemberName() {
        return newMemberName;
    }

    public String getNewMemberUsername() {
        return newMemberUsername;
    }

    public boolean wasInvited() {
        return wasInvited;
    }
}