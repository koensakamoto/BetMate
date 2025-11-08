package com.betmate.service.group;

import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;
import com.betmate.entity.user.User;
import com.betmate.exception.group.GroupMembershipException;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.service.user.UserService;
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
    private final UserService userService;

    @Autowired
    public GroupMembershipService(GroupMembershipRepository membershipRepository, 
                                  GroupService groupService,
                                  GroupPermissionService permissionService,
                                  UserService userService) {
        this.membershipRepository = membershipRepository;
        this.groupService = groupService;
        this.permissionService = permissionService;
        this.userService = userService;
    }

    /**
     * Adds a user to a group with specified role.
     */
    public GroupMembership joinGroup(@NotNull User user, @NotNull Group group, @NotNull GroupMembership.MemberRole role) {
        // Use permission service for validation
        if (!permissionService.canJoinGroup(user, group)) {
            throw new GroupMembershipException("User cannot join this group");
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
            throw new GroupMembershipException("Insufficient permissions to invite users");
        }
        
        // Validate actor has permission to create admins (only admins can invite other admins)
        if (role == GroupMembership.MemberRole.ADMIN && !permissionService.canChangeRoles(actor, group)) {
            throw new GroupMembershipException("Only admins can invite other admins");
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
                throw new GroupMembershipException("User is not a member of this group");
            } else {
                throw new GroupMembershipException("Cannot leave group - user is the only admin");
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
            throw new GroupMembershipException("Insufficient permissions to change roles");
        }
        
        // Use atomic operation to prevent race conditions
        int rowsUpdated = membershipRepository.atomicChangeRole(targetUser, group, newRole);
        
        if (rowsUpdated == 0) {
            // Check if user exists but is last admin being demoted
            Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(targetUser, group);
            if (membership.isEmpty()) {
                throw new GroupMembershipException("User is not a member of this group");
            } else if (membership.get().getRole() == GroupMembership.MemberRole.ADMIN && newRole != GroupMembership.MemberRole.ADMIN) {
                throw new GroupMembershipException("Cannot change role - user is the only admin");
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
            throw new GroupMembershipException("Insufficient permissions to remove members");
        }
        
        // Prevent self-removal (use leaveGroup instead)
        if (actor.equals(userToRemove)) {
            throw new GroupMembershipException("Use leaveGroup to remove yourself");
        }
        
        // Use atomic operation to prevent race conditions
        LocalDateTime leftAt = LocalDateTime.now();
        int rowsUpdated = membershipRepository.atomicRemoveMember(userToRemove, group, leftAt);
        
        if (rowsUpdated == 0) {
            // Check if user exists but is last admin
            Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(userToRemove, group);
            if (membership.isEmpty()) {
                throw new GroupMembershipException("User is not a member of this group");
            } else {
                throw new GroupMembershipException("Cannot remove user - user is the only admin");
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
     * Checks if user is a member of the group - for @PreAuthorize expressions.
     * @param groupId the group ID
     * @param username the username
     * @return true if user is a member of the group
     */
    @Transactional(readOnly = true)
    public boolean isMember(@NotNull Long groupId, @NotNull String username) {
        try {
            Group group = groupService.getGroupById(groupId);
            Optional<User> userOpt = userService.getUserByUsername(username);
            
            if (userOpt.isEmpty() || group == null) {
                return false;
            }
            
            User user = userOpt.get();
            return membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group);
        } catch (Exception e) {
            // If any error occurs (group not found, user not found, etc), deny access
            return false;
        }
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
     * Checks if user is an active member of the group - for @PreAuthorize expressions.
     * @param groupId the group ID
     * @param username the username
     * @return true if user is an active member of the group
     */
    @Transactional(readOnly = true)
    public boolean isActiveMember(@NotNull Long groupId, @NotNull String username) {
        return isMember(groupId, username); // Reuse existing method
    }

    /**
     * Gets count of active members in a group.
     */
    @Transactional(readOnly = true)
    public long getMemberCount(@NotNull Group group) {
        return membershipRepository.countActiveMembers(group);
    }

    /**
     * Updates a member's role in the group.
     * @param group the group
     * @param targetUser the user whose role to update
     * @param newRole the new role to assign
     * @param requestingUser the user making the request (must be admin)
     * @return the updated membership
     */
    @Transactional
    public GroupMembership updateMemberRole(@NotNull Group group, @NotNull User targetUser,
                                           @NotNull GroupMembership.MemberRole newRole, @NotNull User requestingUser) {
        System.out.println("🔄 [SERVICE DEBUG] updateMemberRole called");
        System.out.println("🔄 [SERVICE DEBUG] Group: " + group.getGroupName() + " (ID: " + group.getId() + ")");
        System.out.println("🔄 [SERVICE DEBUG] Target user: " + targetUser.getUsername() + " (ID: " + targetUser.getId() + ")");
        System.out.println("🔄 [SERVICE DEBUG] New role: " + newRole);
        System.out.println("🔄 [SERVICE DEBUG] Requesting user: " + requestingUser.getUsername() + " (ID: " + requestingUser.getId() + ")");

        // Check if requesting user is admin
        boolean isAdminUser = isAdmin(requestingUser, group);
        System.out.println("🔄 [SERVICE DEBUG] Is requesting user admin? " + isAdminUser);

        if (!isAdminUser) {
            System.out.println("❌ [SERVICE DEBUG] Permission denied - user is not admin");
            throw new GroupMembershipException("Only admins can update member roles");
        }

        // Get the target user's membership
        System.out.println("🔄 [SERVICE DEBUG] Looking for target user's membership...");
        GroupMembership membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(targetUser, group)
            .orElseThrow(() -> new GroupMembershipException("Target user is not a member of this group"));

        System.out.println("🔄 [SERVICE DEBUG] Found membership - Current role: " + membership.getRole());

        // Prevent demoting the group creator from admin
        if (group.getCreator().getId().equals(targetUser.getId()) && newRole != GroupMembership.MemberRole.ADMIN) {
            System.out.println("❌ [SERVICE DEBUG] Cannot demote group creator from admin");
            throw new GroupMembershipException("Cannot demote the group creator from admin role");
        }

        // Update the role
        System.out.println("🔄 [SERVICE DEBUG] Updating role from " + membership.getRole() + " to " + newRole);
        membership.setRole(newRole);

        System.out.println("🔄 [SERVICE DEBUG] Saving membership to database...");
        GroupMembership savedMembership = membershipRepository.save(membership);
        System.out.println("🔄 [SERVICE DEBUG] Saved membership - Role is now: " + savedMembership.getRole());

        return savedMembership;
    }

    private GroupMembership getMembership(User user, Group group) {
        return membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group)
            .orElseThrow(() -> new GroupMembershipException("User is not a member of this group"));
    }

    // ==========================================
    // PENDING REQUEST METHODS
    // ==========================================

    /**
     * Gets all pending join requests for a group.
     *
     * @param group the group
     * @return list of pending memberships
     */
    public List<GroupMembership> getPendingRequests(@NotNull Group group) {
        return membershipRepository.findPendingRequestsByGroup(group);
    }

    /**
     * Gets the count of pending join requests for a group.
     *
     * @param group the group
     * @return number of pending requests
     */
    public Long getPendingRequestCount(@NotNull Group group) {
        return membershipRepository.countPendingRequestsByGroup(group);
    }

    /**
     * Approves a pending join request.
     *
     * @param actor the user approving the request (must be admin/officer)
     * @param requestId the membership/request ID
     * @param group the group
     * @return the approved membership
     */
    public GroupMembership approvePendingRequest(@NotNull User actor, @NotNull Long requestId, @NotNull Group group) {
        // Check permission (admins and officers can manage requests)
        if (!permissionService.canManageJoinRequests(actor, group)) {
            throw new GroupMembershipException("Insufficient permissions to manage join requests");
        }

        // Get the pending membership
        GroupMembership membership = membershipRepository.findById(requestId)
            .orElseThrow(() -> new GroupMembershipException("Join request not found"));

        // Validate it belongs to this group
        if (!membership.getGroup().getId().equals(group.getId())) {
            throw new GroupMembershipException("Join request does not belong to this group");
        }

        // Validate it's actually pending
        if (membership.getStatus() != GroupMembership.MembershipStatus.PENDING) {
            throw new GroupMembershipException("Join request is not in pending status");
        }

        // Approve the request
        membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
        membership.setIsActive(true);
        GroupMembership approvedMembership = membershipRepository.save(membership);

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        return approvedMembership;
    }

    /**
     * Denies/rejects a pending join request.
     *
     * @param actor the user denying the request (must be admin/officer)
     * @param requestId the membership/request ID
     * @param group the group
     */
    public void denyPendingRequest(@NotNull User actor, @NotNull Long requestId, @NotNull Group group) {
        // Check permission (admins and officers can manage requests)
        if (!permissionService.canManageJoinRequests(actor, group)) {
            throw new GroupMembershipException("Insufficient permissions to manage join requests");
        }

        // Get the pending membership
        GroupMembership membership = membershipRepository.findById(requestId)
            .orElseThrow(() -> new GroupMembershipException("Join request not found"));

        // Validate it belongs to this group
        if (!membership.getGroup().getId().equals(group.getId())) {
            throw new GroupMembershipException("Join request does not belong to this group");
        }

        // Validate it's actually pending
        if (membership.getStatus() != GroupMembership.MembershipStatus.PENDING) {
            throw new GroupMembershipException("Join request is not in pending status");
        }

        // Reject the request
        membership.setStatus(GroupMembership.MembershipStatus.REJECTED);
        membership.setIsActive(false);
        membershipRepository.save(membership);
    }

}