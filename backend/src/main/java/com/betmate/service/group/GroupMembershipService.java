package com.betmate.service.group;

import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;
import com.betmate.entity.user.User;
import com.betmate.event.group.GroupInvitationEvent;
import com.betmate.event.group.GroupJoinRequestEvent;
import com.betmate.event.group.GroupMemberJoinedEvent;
import com.betmate.event.group.GroupMemberLeftEvent;
import com.betmate.event.group.GroupRoleChangedEvent;
import com.betmate.exception.group.GroupMembershipException;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.service.notification.NotificationService;
import com.betmate.service.user.UserService;
import jakarta.persistence.EntityManager;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
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

    private static final Logger logger = LoggerFactory.getLogger(GroupMembershipService.class);

    private final GroupMembershipRepository membershipRepository;
    private final GroupService groupService;
    private final GroupPermissionService permissionService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final EntityManager entityManager;

    @Autowired
    public GroupMembershipService(GroupMembershipRepository membershipRepository,
                                  GroupService groupService,
                                  GroupPermissionService permissionService,
                                  UserService userService,
                                  @Lazy NotificationService notificationService,
                                  ApplicationEventPublisher eventPublisher,
                                  EntityManager entityManager) {
        this.membershipRepository = membershipRepository;
        this.groupService = groupService;
        this.permissionService = permissionService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
        this.entityManager = entityManager;
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
        membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
        membership.setIsActive(true);

        GroupMembership savedMembership = membershipRepository.save(membership);

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        return savedMembership;
    }
    
    /**
     * Adds a user to a group as a regular member (convenience method).
     * Handles auto-approve logic:
     * - PUBLIC groups with auto-approve: User joins immediately as APPROVED member
     * - PRIVATE groups or groups without auto-approve: Creates PENDING request
     */
    public GroupMembership joinGroup(@NotNull User user, @NotNull Group group) {
        // Check for existing membership
        Optional<GroupMembership> existingMembershipOpt = membershipRepository.findByUserAndGroup(user, group);

        if (existingMembershipOpt.isPresent()) {
            GroupMembership existingMembership = existingMembershipOpt.get();

            // Block if user is active member or has pending request
            if (existingMembership.getIsActive() ||
                existingMembership.getStatus() == GroupMembership.MembershipStatus.PENDING) {
                throw new GroupMembershipException("User already has a membership or pending request for this group");
            }

            // Allow re-request for REJECTED or LEFT memberships
            // Also handle members who have leftAt set (regardless of status inconsistency)
            if (existingMembership.getStatus() == GroupMembership.MembershipStatus.REJECTED ||
                existingMembership.getStatus() == GroupMembership.MembershipStatus.LEFT ||
                (!existingMembership.getIsActive() && existingMembership.getLeftAt() != null)) {

                // Determine if should auto-approve based on group privacy
                boolean shouldAutoApprove = group.getPrivacy() == Group.Privacy.PUBLIC;

                if (shouldAutoApprove) {
                    // Immediate approval for PUBLIC groups
                    existingMembership.setStatus(GroupMembership.MembershipStatus.APPROVED);
                    existingMembership.setIsActive(true);
                    existingMembership.setRole(GroupMembership.MemberRole.MEMBER);

                    GroupMembership savedMembership = membershipRepository.save(existingMembership);

                    // Update member count
                    long memberCount = membershipRepository.countActiveMembers(group);
                    groupService.updateMemberCount(group.getId(), (int) memberCount);

                    return savedMembership;
                } else {
                    // Pending request for PRIVATE and SECRET groups
                    existingMembership.setStatus(GroupMembership.MembershipStatus.PENDING);
                    existingMembership.setIsActive(false);
                    existingMembership.setRole(GroupMembership.MemberRole.MEMBER);

                    GroupMembership savedMembership = membershipRepository.save(existingMembership);

                    // Publish event to notify group admins/officers
                    String requesterName = user.getFirstName() != null && !user.getFirstName().isEmpty()
                        ? user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")
                        : user.getUsername();

                    GroupJoinRequestEvent event = new GroupJoinRequestEvent(
                        group.getId(),
                        group.getGroupName(),
                        user.getId(),
                        requesterName.trim(),
                        user.getUsername(),
                        savedMembership.getId()
                    );

                    eventPublisher.publishEvent(event);

                    return savedMembership;
                }
            }
        }

        // Can't join inactive or deleted groups
        if (!group.getIsActive() || group.isDeleted()) {
            throw new GroupMembershipException("Cannot join inactive or deleted groups");
        }

        // Check if group is full (only for PUBLIC groups with immediate joins)
        if (group.isFull() && group.getPrivacy() == Group.Privacy.PUBLIC) {
            throw new GroupMembershipException("Group is full");
        }

        // Create new membership
        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(GroupMembership.MemberRole.MEMBER);

        // Determine join method based on group privacy level
        // PUBLIC: instant join, PRIVATE/SECRET: requires approval
        boolean shouldAutoApprove = group.getPrivacy() == Group.Privacy.PUBLIC;

        if (shouldAutoApprove) {
            // Immediate approval for PUBLIC groups
            membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
            membership.setIsActive(true);
        } else {
            // Pending request for PRIVATE and SECRET groups
            membership.setStatus(GroupMembership.MembershipStatus.PENDING);
            membership.setIsActive(false);
        }

        GroupMembership savedMembership = membershipRepository.save(membership);

        // Only update member count if approved immediately
        if (shouldAutoApprove) {
            long memberCount = membershipRepository.countActiveMembers(group);
            groupService.updateMemberCount(group.getId(), (int) memberCount);

            // Publish event to notify existing members
            publishMemberJoinedEvent(user, group, false);
        } else {
            // Publish event to notify group admins/officers about the join request
            String requesterName = user.getFirstName() != null && !user.getFirstName().isEmpty()
                ? user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")
                : user.getUsername();

            GroupJoinRequestEvent event = new GroupJoinRequestEvent(
                group.getId(),
                group.getGroupName(),
                user.getId(),
                requesterName.trim(),
                user.getUsername(),
                savedMembership.getId()
            );

            eventPublisher.publishEvent(event);
        }

        return savedMembership;
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

        // Check if user already has an active membership or pending request
        logger.debug("Checking for existing membership - User ID: {}, Group ID: {}",
            userToInvite.getId(), group.getId());
        Optional<GroupMembership> existingMembershipOpt = membershipRepository.findByUserAndGroup(userToInvite, group);

        if (existingMembershipOpt.isPresent()) {
            GroupMembership existingMembership = existingMembershipOpt.get();

            logger.info("Found existing membership - ID: {}, Status: {}, IsActive: {}, User: {}, Group: {}",
                existingMembership.getId(),
                existingMembership.getStatus(),
                existingMembership.getIsActive(),
                userToInvite.getUsername(),
                group.getGroupName());

            // Block if user is already an active member
            if (existingMembership.getIsActive() &&
                existingMembership.getStatus() == GroupMembership.MembershipStatus.APPROVED) {
                throw new GroupMembershipException("User is already a member of this group");
            }

            // Block if user has a pending request
            if (existingMembership.getStatus() == GroupMembership.MembershipStatus.PENDING) {
                throw new GroupMembershipException("User already has a pending request for this group");
            }

            // Allow re-invite for REJECTED or LEFT memberships - reset the existing record
            // Also handle members who have leftAt set (regardless of status inconsistency)
            if (existingMembership.getStatus() == GroupMembership.MembershipStatus.REJECTED ||
                existingMembership.getStatus() == GroupMembership.MembershipStatus.LEFT ||
                (!existingMembership.getIsActive() && existingMembership.getLeftAt() != null)) {

                logger.info("Re-inviting user with LEFT/REJECTED membership - " +
                    "Membership ID: {}, Current Status: {}, User: {}, Group: {}",
                    existingMembership.getId(),
                    existingMembership.getStatus(),
                    userToInvite.getUsername(),
                    group.getGroupName());

                // Reset the existing membership to a fresh pending state
                existingMembership.setStatus(GroupMembership.MembershipStatus.PENDING);
                existingMembership.setIsActive(false);
                existingMembership.setRole(role);
                existingMembership.setLeftAt(null);
                // Note: joinedAt cannot be updated as it's marked updatable=false in the entity
                existingMembership.setTotalBets(0);
                existingMembership.setTotalWins(0);
                existingMembership.setTotalLosses(0);

                logger.debug("About to save membership - " +
                    "ID: {}, Status: {}, IsActive: {}, Role: {}, " +
                    "LeftAt: {}, TotalBets: {}, EntityState: {}",
                    existingMembership.getId(),
                    existingMembership.getStatus(),
                    existingMembership.getIsActive(),
                    existingMembership.getRole(),
                    existingMembership.getLeftAt(),
                    existingMembership.getTotalBets(),
                    entityManager.contains(existingMembership) ? "MANAGED" : "DETACHED");

                GroupMembership savedMembership = membershipRepository.save(existingMembership);

                logger.info("Successfully saved re-invited membership - " +
                    "ID: {}, Status: {}, User: {}, Group: {}",
                    savedMembership.getId(),
                    savedMembership.getStatus(),
                    userToInvite.getUsername(),
                    group.getGroupName());

                // Don't update member count for pending invitations

                // Publish event
                publishInvitationEvent(actor, userToInvite, group, savedMembership.getId());

                return savedMembership;
            }
        }

        // Create new membership as pending invitation (user must accept to join)
        GroupMembership membership = new GroupMembership();
        membership.setUser(userToInvite);
        membership.setGroup(group);
        membership.setRole(role);
        membership.setStatus(GroupMembership.MembershipStatus.PENDING);
        membership.setIsActive(false);

        GroupMembership savedMembership = membershipRepository.save(membership);

        // Don't update member count for pending invitations

        // Publish event to notify the invited user
        publishInvitationEvent(actor, userToInvite, group, savedMembership.getId());

        return savedMembership;
    }

    private void publishInvitationEvent(User actor, User userToInvite, Group group, Long membershipId) {
        String inviterName = actor.getFirstName() != null && !actor.getFirstName().isEmpty()
            ? actor.getFirstName() + " " + (actor.getLastName() != null ? actor.getLastName() : "")
            : actor.getUsername();

        String invitedUsername = userToInvite.getUsername();

        GroupInvitationEvent event = new GroupInvitationEvent(
            group.getId(),
            group.getGroupName(),
            group.getDescription(),
            actor.getId(),
            inviterName.trim(),
            userToInvite.getId(),
            invitedUsername,
            membershipId
        );

        eventPublisher.publishEvent(event);
    }

    /**
     * Publishes a GroupMemberJoinedEvent to notify other group members
     */
    private void publishMemberJoinedEvent(@NotNull User newMember, @NotNull Group group, boolean wasInvited) {
        String memberName = newMember.getFirstName() != null && !newMember.getFirstName().isEmpty()
            ? newMember.getFirstName() + " " + (newMember.getLastName() != null ? newMember.getLastName() : "")
            : newMember.getUsername();

        GroupMemberJoinedEvent event = new GroupMemberJoinedEvent(
            group.getId(),
            group.getGroupName(),
            newMember.getId(),
            memberName.trim(),
            newMember.getUsername(),
            wasInvited
        );

        eventPublisher.publishEvent(event);
        logger.info("Published GroupMemberJoinedEvent for user {} joining group {}",
                    newMember.getUsername(), group.getGroupName());
    }

    private void publishMemberLeftEvent(@NotNull User member, @NotNull Group group, boolean wasKicked, String reason, Long removedById) {
        String memberName = member.getFirstName() != null && !member.getFirstName().isEmpty()
            ? member.getFirstName() + " " + (member.getLastName() != null ? member.getLastName() : "")
            : member.getUsername();

        GroupMemberLeftEvent event = new GroupMemberLeftEvent(
            group.getId(),
            group.getGroupName(),
            member.getId(),
            memberName.trim(),
            member.getUsername(),
            wasKicked,
            reason,
            removedById
        );

        eventPublisher.publishEvent(event);
        logger.info("Published GroupMemberLeftEvent for user {} leaving group {} (wasKicked: {}, removedById: {})",
                    member.getUsername(), group.getGroupName(), wasKicked, removedById);
    }

    private void publishRoleChangedEvent(@NotNull Group group, @NotNull User targetUser,
                                         @NotNull GroupMembership.MemberRole oldRole,
                                         @NotNull GroupMembership.MemberRole newRole,
                                         @NotNull User changedBy) {
        String targetUserName = targetUser.getFirstName() != null && !targetUser.getFirstName().isEmpty()
            ? targetUser.getFirstName() + " " + (targetUser.getLastName() != null ? targetUser.getLastName() : "")
            : targetUser.getUsername();

        GroupRoleChangedEvent event = new GroupRoleChangedEvent(
            group.getId(),
            group.getGroupName(),
            targetUser.getId(),
            targetUserName.trim(),
            targetUser.getUsername(),
            oldRole,
            newRole,
            changedBy.getId()
        );

        eventPublisher.publishEvent(event);
        logger.info("Published GroupRoleChangedEvent for user {} in group {} (old: {}, new: {})",
                    targetUser.getUsername(), group.getGroupName(), oldRole, newRole);
    }

    /**
     * Adds creator membership when group is created.
     * Bypasses permission checks since the creator should always be able to join their own group.
     */
    public GroupMembership addCreatorMembership(@NotNull Group group, @NotNull User creator) {
        // Create membership directly without permission checks
        GroupMembership membership = new GroupMembership();
        membership.setUser(creator);
        membership.setGroup(group);
        membership.setRole(GroupMembership.MemberRole.ADMIN);
        membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
        membership.setIsActive(true);

        GroupMembership savedMembership = membershipRepository.save(membership);

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        return savedMembership;
    }

    /**
     * User leaves a group.
     */
    public void leaveGroup(@NotNull User user, @NotNull Group group) {
        // Check if user is a member
        Optional<GroupMembership> membership = membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group);
        if (membership.isEmpty()) {
            throw new GroupMembershipException("User is not a member of this group");
        }

        LocalDateTime leftAt = LocalDateTime.now();
        int rowsUpdated;

        // If user is an admin, check if they're the last admin
        if (membership.get().getRole() == GroupMembership.MemberRole.ADMIN) {
            long adminCount = membershipRepository.countActiveAdmins(group);
            if (adminCount <= 1) {
                throw new GroupMembershipException("Cannot leave group - user is the only admin");
            }
            rowsUpdated = membershipRepository.atomicLeaveGroupAdmin(user, group, leftAt);
        } else {
            // Non-admin can leave without restrictions
            rowsUpdated = membershipRepository.atomicLeaveGroupNonAdmin(user, group, leftAt);
        }

        if (rowsUpdated == 0) {
            throw new GroupMembershipException("Failed to leave group - membership may have changed");
        }

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        // Publish event to notify other members (null removedById since voluntary leave)
        publishMemberLeftEvent(user, group, false, null, null);
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
        // Validate actor has permission to remove members (admin or officer)
        if (!permissionService.canRemoveMembers(actor, group)) {
            throw new GroupMembershipException("Insufficient permissions to remove members");
        }

        // Prevent self-removal (use leaveGroup instead)
        if (actor.equals(userToRemove)) {
            throw new GroupMembershipException("Use leaveGroup to remove yourself");
        }

        // Get actor's and target's memberships
        Optional<GroupMembership> actorMembershipOpt = membershipRepository.findByUserAndGroupAndIsActiveTrue(actor, group);
        Optional<GroupMembership> targetMembershipOpt = membershipRepository.findByUserAndGroupAndIsActiveTrue(userToRemove, group);

        if (actorMembershipOpt.isEmpty()) {
            throw new GroupMembershipException("Actor is not a member of this group");
        }

        if (targetMembershipOpt.isEmpty()) {
            throw new GroupMembershipException("User is not a member of this group");
        }

        GroupMembership actorMembership = actorMembershipOpt.get();
        GroupMembership targetMembership = targetMembershipOpt.get();

        // Enforce role-based restrictions:
        // - Admins can remove anyone
        // - Officers can only remove regular members (not other officers or admins)
        if (actorMembership.getRole() == GroupMembership.MemberRole.OFFICER) {
            if (targetMembership.getRole() == GroupMembership.MemberRole.ADMIN ||
                targetMembership.getRole() == GroupMembership.MemberRole.OFFICER) {
                throw new GroupMembershipException("Officers can only remove regular members, not admins or other officers");
            }
        }

        // Check if target is an admin and if they're the last admin
        if (targetMembership.getRole() == GroupMembership.MemberRole.ADMIN) {
            long adminCount = membershipRepository.findByGroupAndRole(group, GroupMembership.MemberRole.ADMIN)
                .stream()
                .filter(GroupMembership::getIsActive)
                .count();

            if (adminCount <= 1) {
                throw new GroupMembershipException("Cannot remove user - user is the only admin");
            }
        }

        // Directly update the membership
        targetMembership.setIsActive(false);
        targetMembership.setLeftAt(LocalDateTime.now());
        targetMembership.setStatus(GroupMembership.MembershipStatus.LEFT);
        membershipRepository.save(targetMembership);

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        // Publish event to notify other members
        String reason = "Removed by " + actor.getUsername();
        publishMemberLeftEvent(userToRemove, group, true, reason, actor.getId());
    }

    /**
     * Gets user's membership in a group (active members only).
     */
    @Transactional(readOnly = true)
    public Optional<GroupMembership> getUserMembership(@NotNull User user, @NotNull Group group) {
        return membershipRepository.findByUserAndGroupAndIsActiveTrue(user, group);
    }

    /**
     * Gets user's membership in a group (any status including PENDING, REJECTED, LEFT).
     */
    @Transactional(readOnly = true)
    public Optional<GroupMembership> getAnyUserMembership(@NotNull User user, @NotNull Group group) {
        return membershipRepository.findByUserAndGroup(user, group);
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

        // Capture old role BEFORE updating (needed for event)
        GroupMembership.MemberRole oldRole = membership.getRole();

        // Prevent demoting the group creator from admin
        if (group.getCreator().getId().equals(targetUser.getId()) &&
            oldRole == GroupMembership.MemberRole.ADMIN &&
            newRole != GroupMembership.MemberRole.ADMIN) {
            System.out.println("❌ [SERVICE DEBUG] Cannot demote group creator from admin");
            throw new GroupMembershipException("Cannot demote the group creator from admin role");
        }

        // Update the role
        System.out.println("🔄 [SERVICE DEBUG] Updating role from " + membership.getRole() + " to " + newRole);
        membership.setRole(newRole);

        System.out.println("🔄 [SERVICE DEBUG] Saving membership to database...");
        GroupMembership savedMembership = membershipRepository.save(membership);
        System.out.println("🔄 [SERVICE DEBUG] Saved membership - Role is now: " + savedMembership.getRole());

        // Publish GROUP_ROLE_CHANGED event
        publishRoleChangedEvent(group, targetUser, oldRole, newRole, requestingUser);

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

        // Delete the join request notification since it's been processed
        notificationService.deleteGroupJoinRequestNotification(requestId);

        // Publish event to notify existing members
        publishMemberJoinedEvent(membership.getUser(), group, false);

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

        // Delete the join request notification since it's been processed
        notificationService.deleteGroupJoinRequestNotification(requestId);
    }

    /**
     * Accept a pending group invitation.
     *
     * @param user the user accepting the invitation (must be the invited user)
     * @param membershipId the membership/invitation ID
     * @return the approved membership
     */
    public GroupMembership acceptInvitation(@NotNull User user, @NotNull Long membershipId) {
        // Get the pending membership
        GroupMembership membership = membershipRepository.findById(membershipId)
            .orElseThrow(() -> new GroupMembershipException("Invitation not found"));

        // Validate it belongs to this user
        if (!membership.getUser().getId().equals(user.getId())) {
            throw new GroupMembershipException("This invitation does not belong to you");
        }

        // Validate it's actually pending
        if (membership.getStatus() != GroupMembership.MembershipStatus.PENDING) {
            throw new GroupMembershipException("Invitation is not in pending status");
        }

        // Get the group
        Group group = membership.getGroup();

        // Check if group is full
        if (group.isFull()) {
            throw new GroupMembershipException("Group is full");
        }

        // Accept the invitation
        membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
        membership.setIsActive(true);
        GroupMembership approvedMembership = membershipRepository.save(membership);

        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        // Publish event to notify existing members
        publishMemberJoinedEvent(user, group, true);

        return approvedMembership;
    }

    /**
     * Reject a pending group invitation.
     *
     * @param user the user rejecting the invitation (must be the invited user)
     * @param membershipId the membership/invitation ID
     */
    public void rejectInvitation(@NotNull User user, @NotNull Long membershipId) {
        // Get the pending membership
        GroupMembership membership = membershipRepository.findById(membershipId)
            .orElseThrow(() -> new GroupMembershipException("Invitation not found"));

        // Validate it belongs to this user
        if (!membership.getUser().getId().equals(user.getId())) {
            throw new GroupMembershipException("This invitation does not belong to you");
        }

        // Validate it's actually pending
        if (membership.getStatus() != GroupMembership.MembershipStatus.PENDING) {
            throw new GroupMembershipException("Invitation is not in pending status");
        }

        // Reject the invitation
        membership.setStatus(GroupMembership.MembershipStatus.REJECTED);
        membership.setIsActive(false);
        membershipRepository.save(membership);
    }

}