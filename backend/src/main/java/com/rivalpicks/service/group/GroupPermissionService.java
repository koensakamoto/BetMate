package com.rivalpicks.service.group;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.group.GroupPermissionException;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

/**
 * Service dedicated to group permission and access control logic.
 * Handles authorization checks for group operations.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class GroupPermissionService {

    private final GroupMembershipRepository membershipRepository;

    @Autowired
    public GroupPermissionService(GroupMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    /**
     * Checks if user can view group content.
     */
    public boolean canViewGroup(@NotNull User user, @NotNull Group group) {
        // Public groups can be viewed by anyone
        if (group.getPrivacy() == Group.Privacy.PUBLIC) {
            return true;
        }
        
        // Private groups require membership
        return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Checks if user can join the group.
     */
    public boolean canJoinGroup(@NotNull User user, @NotNull Group group) {
        // Can't join if already a member
        if (membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group)) {
            return false;
        }
        
        // Can't join inactive or deleted groups
        if (!group.getIsActive() || group.isDeleted()) {
            return false;
        }
        
        // Check if group has available slots (using entity business logic)
        if (group.isFull()) {
            return false;
        }
        
        // Private groups may require invitation (for now, anyone can join public groups)
        return group.getPrivacy() == Group.Privacy.PUBLIC;
    }

    /**
     * Checks if user can send messages in the group.
     */
    public boolean canSendMessage(@NotNull User user, @NotNull Group group) {
        return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Checks if user can create bets in the group.
     */
    public boolean canCreateBet(@NotNull User user, @NotNull Group group) {
        return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Checks if user can edit group settings.
     */
    public boolean canEditGroup(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can delete/deactivate the group.
     */
    public boolean canDeleteGroup(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can invite other users to the group.
     * - PUBLIC groups: Any active member can invite
     * - PRIVATE groups: Only admins can invite
     */
    public boolean canInviteUsers(@NotNull User user, @NotNull Group group) {
        // For public groups, any active member can invite
        if (group.getPrivacy() == Group.Privacy.PUBLIC) {
            return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
        }

        // For private groups, only admins can invite
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can remove other members from the group.
     */
    public boolean canRemoveMembers(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can change roles of other members.
     */
    public boolean canChangeRoles(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can manage pending join requests (approve/deny).
     */
    public boolean canManageJoinRequests(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdmin(user, group);
    }

    /**
     * Checks if user can view group member list.
     */
    public boolean canViewMembers(@NotNull User user, @NotNull Group group) {
        return canViewGroup(user, group);
    }

    /**
     * Checks if user can view group betting history.
     */
    public boolean canViewBettingHistory(@NotNull User user, @NotNull Group group) {
        return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Validates user has permission for an operation, throws exception if not.
     */
    public void requirePermission(@NotNull User user, @NotNull Group group, @NotNull GroupPermission permission) {
        boolean hasPermission = switch (permission) {
            case VIEW_GROUP -> canViewGroup(user, group);
            case JOIN_GROUP -> canJoinGroup(user, group);
            case SEND_MESSAGE -> canSendMessage(user, group);
            case CREATE_BET -> canCreateBet(user, group);
            case EDIT_GROUP -> canEditGroup(user, group);
            case DELETE_GROUP -> canDeleteGroup(user, group);
            case INVITE_USERS -> canInviteUsers(user, group);
            case REMOVE_MEMBERS -> canRemoveMembers(user, group);
            case CHANGE_ROLES -> canChangeRoles(user, group);
            case VIEW_MEMBERS -> canViewMembers(user, group);
            case VIEW_BETTING_HISTORY -> canViewBettingHistory(user, group);
        };
        
        if (!hasPermission) {
            throw new GroupPermissionException(
                String.format("User %d does not have permission %s for group %d", 
                    user.getId(), permission, group.getId())
            );
        }
    }

    // Enum for different group permissions
    public enum GroupPermission {
        VIEW_GROUP,
        JOIN_GROUP,
        SEND_MESSAGE,
        CREATE_BET,
        EDIT_GROUP,
        DELETE_GROUP,
        INVITE_USERS,
        REMOVE_MEMBERS,
        CHANGE_ROLES,
        VIEW_MEMBERS,
        VIEW_BETTING_HISTORY
    }

}