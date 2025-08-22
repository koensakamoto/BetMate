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

    @Autowired
    public GroupMembershipService(GroupMembershipRepository membershipRepository, GroupService groupService) {
        this.membershipRepository = membershipRepository;
        this.groupService = groupService;
    }

    /**
     * Adds a user to a group with specified role.
     */
    public GroupMembership joinGroup(@NotNull User user, @NotNull Group group, @NotNull GroupMembership.MemberRole role) {
        validateCanJoinGroup(user, group);
        
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
     * Adds creator membership when group is created.
     */
    public GroupMembership addCreatorMembership(@NotNull Group group, @NotNull User creator) {
        return joinGroup(creator, group, GroupMembership.MemberRole.ADMIN);
    }

    /**
     * User leaves a group.
     */
    public void leaveGroup(@NotNull User user, @NotNull Group group) {
        GroupMembership membership = getMembership(user, group);
        
        // Prevent last admin from leaving
        if (membership.getRole() == GroupMembership.MemberRole.ADMIN) {
            long adminCount = membershipRepository.findGroupAdminsAndModerators(group).stream()
                .filter(m -> m.getRole() == GroupMembership.MemberRole.ADMIN)
                .count();
            
            if (adminCount <= 1) {
                throw new MembershipException("Cannot leave group - you are the only admin");
            }
        }
        
        membership.setIsActive(false);
        membership.setLeftAt(LocalDateTime.now());
        membershipRepository.save(membership);
        
        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);
    }

    /**
     * Changes a user's role in a group.
     */
    public GroupMembership changeRole(@NotNull User user, @NotNull Group group, @NotNull GroupMembership.MemberRole newRole) {
        GroupMembership membership = getMembership(user, group);
        
        // Prevent demoting last admin
        if (membership.getRole() == GroupMembership.MemberRole.ADMIN && newRole != GroupMembership.MemberRole.ADMIN) {
            long adminCount = membershipRepository.findGroupAdminsAndModerators(group).stream()
                .filter(m -> m.getRole() == GroupMembership.MemberRole.ADMIN)
                .count();
            
            if (adminCount <= 1) {
                throw new MembershipException("Cannot change role - user is the only admin");
            }
        }
        
        membership.setRole(newRole);
        return membershipRepository.save(membership);
    }

    /**
     * Removes a user from a group (admin action).
     */
    public void removeMember(@NotNull User userToRemove, @NotNull Group group) {
        GroupMembership membership = getMembership(userToRemove, group);
        
        // Prevent removing last admin
        if (membership.getRole() == GroupMembership.MemberRole.ADMIN) {
            long adminCount = membershipRepository.findGroupAdminsAndModerators(group).stream()
                .filter(m -> m.getRole() == GroupMembership.MemberRole.ADMIN)
                .count();
            
            if (adminCount <= 1) {
                throw new MembershipException("Cannot remove user - they are the only admin");
            }
        }
        
        membership.setIsActive(false);
        membership.setLeftAt(LocalDateTime.now());
        membershipRepository.save(membership);
        
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

    private void validateCanJoinGroup(User user, Group group) {
        if (membershipRepository.existsByUserAndGroupAndIsActiveTrue(user, group)) {
            throw new MembershipException("User is already a member of this group");
        }
        
        if (!groupService.hasAvailableSlots(group.getId())) {
            throw new MembershipException("Group is full");
        }
        
        if (!group.getIsActive() || group.isDeleted()) {
            throw new MembershipException("Cannot join inactive or deleted group");
        }
    }

    public static class MembershipException extends RuntimeException {
        public MembershipException(String message) {
            super(message);
        }
    }
}