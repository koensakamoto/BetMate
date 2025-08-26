package com.circlebet.service.group;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupMembership;
import com.circlebet.entity.user.User;
import com.circlebet.repository.group.GroupMembershipRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service dedicated to group membership operations.
 * Handles joining, leaving, role management, and membership queries.
 */
@Service
@Validated
@Transactional
public class GroupMembershipService {

    private final GroupMembershipRepository membershipRepository;
    private final GroupService groupService;
    private final GroupPermissionService permissionService;

    @Autowired
    public GroupMembershipService(GroupMembershipRepository membershipRepository, 
                                  GroupService groupService,
                                  GroupPermissionService permissionService) {
        this.membershipRepository = membershipRepository;
        this.groupService = groupService;
        this.permissionService = permissionService;
    }

    /**
     * Adds a user to a group with specified role.
     */
    public GroupMembership joinGroup(@NotNull User user, @NotNull Group group, @NotNull GroupMembership.MemberRole role) {
        // Use permission service for validation
        if (!permissionService.canJoinGroup(user, group)) {
            throw new MembershipException("User cannot join this group");
        }
        
        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(role);
        membership.setIsActive(true);
        
        GroupMembership savedMembership = membershipRepository.save(membership);
        
        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);
        
        return savedMembership;
    }
    
    /**
     * Adds a user to a group as a regular member (convenience method).
     */
    public GroupMembership joinGroup(@NotNull User user, @NotNull Group group) {
        return joinGroup(user, group, GroupMembership.MemberRole.MEMBER);
    }
    
    /**
     * Admin invites a user to a group with a specific role.
     * 
     * @param actor the admin performing the invitation
     * @param userToInvite the user being invited
     * @param group the group
     * @param role the role to assign
     * @return the created membership
     */
    public GroupMembership inviteUserToGroup(@NotNull User actor, @NotNull User userToInvite, 
                                           @NotNull Group group, @NotNull GroupMembership.MemberRole role) {
        // Validate actor has permission to invite users
        if (!permissionService.canInviteUsers(actor, group)) {
            throw new MembershipException("Insufficient permissions to invite users");
        }
        
        // Validate actor has permission to create admins (only admins can invite other admins)
        if (role == GroupMembership.MemberRole.ADMIN && !permissionService.canChangeRoles(actor, group)) {
            throw new MembershipException("Only admins can invite other admins");
        }
        
        return joinGroup(userToInvite, group, role);
    }

    /**
     * Adds creator membership when group is created.
     */
    public GroupMembership addCreatorMembership(@NotNull Group group, @NotNull User creator) {
        return joinGroup(creator, group, GroupMembership.MemberRole.ADMIN);
    }

    /**
     * User leaves a group.
     */
    public void leaveGroup(@NotNull User user, @NotNull Group group) {
        // Use atomic operation to prevent race conditions
        LocalDateTime leftAt = LocalDateTime.now();
        int rowsUpdated = membershipRepository.atomicLeaveGroup(user, group, leftAt);
        
        if (rowsUpdated == 0) {
            // Check if user exists but is last admin
            Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group);
            if (membership.isEmpty()) {
                throw new MembershipException("User is not a member of this group");
            } else {
                throw new MembershipException("Cannot leave group - user is the only admin");
            }
        }
        
        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);
    }

    /**
     * Changes a user's role in a group.
     * 
     * @param actor the user performing the role change
     * @param targetUser the user whose role is being changed
     * @param group the group
     * @param newRole the new role to assign
     * @return the updated membership
     */
    public GroupMembership changeRole(@NotNull User actor, @NotNull User targetUser, 
                                    @NotNull Group group, @NotNull GroupMembership.MemberRole newRole) {
        // Validate actor has permission to change roles
        if (!permissionService.canChangeRoles(actor, group)) {
            throw new MembershipException("Insufficient permissions to change roles");
        }
        
        // Use atomic operation to prevent race conditions
        int rowsUpdated = membershipRepository.atomicChangeRole(targetUser, group, newRole);
        
        if (rowsUpdated == 0) {
            // Check if user exists but is last admin being demoted
            Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(targetUser, group);
            if (membership.isEmpty()) {
                throw new MembershipException("User is not a member of this group");
            } else if (membership.get().getRole() == GroupMembership.MemberRole.ADMIN && newRole != GroupMembership.MemberRole.ADMIN) {
                throw new MembershipException("Cannot change role - user is the only admin");
            }
        }
        
        // Return updated membership
        return getMembership(targetUser, group);
    }

    /**
     * Removes a user from a group (admin action).
     * 
     * @param actor the user performing the removal
     * @param userToRemove the user being removed
     * @param group the group
     */
    public void removeMember(@NotNull User actor, @NotNull User userToRemove, @NotNull Group group) {
        // Validate actor has permission to remove members
        if (!permissionService.canRemoveMembers(actor, group)) {
            throw new MembershipException("Insufficient permissions to remove members");
        }
        
        // Prevent self-removal (use leaveGroup instead)
        if (actor.equals(userToRemove)) {
            throw new MembershipException("Use leaveGroup to remove yourself");
        }
        
        // Use atomic operation to prevent race conditions
        LocalDateTime leftAt = LocalDateTime.now();
        int rowsUpdated = membershipRepository.atomicRemoveMember(userToRemove, group, leftAt);
        
        if (rowsUpdated == 0) {
            // Check if user exists but is last admin
            Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(userToRemove, group);
            if (membership.isEmpty()) {
                throw new MembershipException("User is not a member of this group");
            } else {
                throw new MembershipException("Cannot remove user - user is the only admin");
            }
        }
        
        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);
    }

    /**
     * Gets user's membership in a group.
     */
    @Transactional(readOnly = true)
    public Optional<GroupMembership> getUserMembership(@NotNull User user, @NotNull Group group) {
        return membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Gets all active members of a group.
     */
    @Transactional(readOnly = true)
    public List<GroupMembership> getGroupMembers(@NotNull Group group) {
        return membershipRepository.findByGroupAndIsActiveTrue(group);
    }

    /**
     * Gets all groups a user is a member of.
     */
    @Transactional(readOnly = true)
    public List<Group> getUserGroups(@NotNull User user) {
        return membershipRepository.findGroupsByUser(user);
    }

    /**
     * Gets groups where user has admin or moderator role.
     */
    @Transactional(readOnly = true)
    public List<GroupMembership> getUserAdminMemberships(@NotNull User user) {
        return membershipRepository.findUserAdminMemberships(user);
    }

    /**
     * Checks if user is a member of the group.
     */
    @Transactional(readOnly = true)
    public boolean isMember(@NotNull User user, @NotNull Group group) {
        return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Checks if user is admin or moderator of the group.
     */
    @Transactional(readOnly = true)
    public boolean isAdminOrModerator(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserAdminOrModerator(user, group);
    }

    /**
     * Checks if user is admin of the group.
     */
    @Transactional(readOnly = true)
    public boolean isAdmin(@NotNull User user, @NotNull Group group) {
        return membershipRepository.isUserGroupAdmin(user, group);
    }

    /**
     * Gets count of active members in a group.
     */
    @Transactional(readOnly = true)
    public long getMemberCount(@NotNull Group group) {
        return membershipRepository.countActiveMembers(group);
    }

    private GroupMembership getMembership(User user, Group group) {
        return membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group)
            .orElseThrow(() -> new MembershipException("User is not a member of this group"));
    }



    public static class MembershipException extends RuntimeException {
        public MembershipException(String message) {
            super(message);
        }
    }
}