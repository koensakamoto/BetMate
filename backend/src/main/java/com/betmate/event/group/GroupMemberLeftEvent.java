package com.betmate.event.group;

import com.betmate.event.base.DomainEvent;

public class GroupMemberLeftEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long memberId;
    private final String memberName;
    private final String memberUsername;
    private final boolean wasKicked;
    private final String reason;
    private final Long removedById;  // ID of the user who removed this member (null if voluntary leave)

    public GroupMemberLeftEvent(Long groupId, String groupName,
                               Long memberId, String memberName, String memberUsername,
                               boolean wasKicked, String reason, Long removedById) {
        super("GROUP_MEMBER_LEFT");
        this.groupId = groupId;
        this.groupName = groupName;
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberUsername = memberUsername;
        this.wasKicked = wasKicked;
        this.reason = reason;
        this.removedById = removedById;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getMemberId() {
        return memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public String getMemberUsername() {
        return memberUsername;
    }

    public boolean wasKicked() {
        return wasKicked;
    }

    public String getReason() {
        return reason;
    }

    public Long getRemovedById() {
        return removedById;
    }
}