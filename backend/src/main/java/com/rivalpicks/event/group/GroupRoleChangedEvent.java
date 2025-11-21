package com.rivalpicks.event.group;

import com.rivalpicks.entity.group.GroupMembership.MemberRole;
import com.rivalpicks.event.base.DomainEvent;

public class GroupRoleChangedEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long targetUserId;
    private final String targetUserName;
    private final String targetUsername;
    private final MemberRole oldRole;
    private final MemberRole newRole;
    private final Long changedByUserId;

    public GroupRoleChangedEvent(Long groupId, String groupName,
                                 Long targetUserId, String targetUserName, String targetUsername,
                                 MemberRole oldRole, MemberRole newRole,
                                 Long changedByUserId) {
        super("GROUP_ROLE_CHANGED");
        this.groupId = groupId;
        this.groupName = groupName;
        this.targetUserId = targetUserId;
        this.targetUserName = targetUserName;
        this.targetUsername = targetUsername;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.changedByUserId = changedByUserId;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public String getTargetUserName() {
        return targetUserName;
    }

    public String getTargetUsername() {
        return targetUsername;
    }

    public MemberRole getOldRole() {
        return oldRole;
    }

    public MemberRole getNewRole() {
        return newRole;
    }

    public Long getChangedByUserId() {
        return changedByUserId;
    }

    public boolean wasPromoted() {
        // MEMBER -> OFFICER or OFFICER -> ADMIN is a promotion
        if (oldRole == MemberRole.MEMBER && newRole == MemberRole.OFFICER) {
            return true;
        }
        if (oldRole == MemberRole.OFFICER && newRole == MemberRole.ADMIN) {
            return true;
        }
        if (oldRole == MemberRole.MEMBER && newRole == MemberRole.ADMIN) {
            return true;
        }
        return false;
    }
}
