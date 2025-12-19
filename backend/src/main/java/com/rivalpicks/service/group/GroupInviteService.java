package com.rivalpicks.service.group;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupInvite;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.group.GroupMembershipException;
import com.rivalpicks.repository.group.GroupInviteRepository;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * Service for managing group invite tokens.
 * Handles creation, validation, and acceptance of invite links.
 */
@Service
@Validated
@Transactional
public class GroupInviteService {

    private static final Logger logger = LoggerFactory.getLogger(GroupInviteService.class);

    private final GroupInviteRepository inviteRepository;
    private final GroupMembershipRepository membershipRepository;
    private final GroupService groupService;
    private final GroupPermissionService permissionService;

    @Autowired
    public GroupInviteService(GroupInviteRepository inviteRepository,
                              GroupMembershipRepository membershipRepository,
                              GroupService groupService,
                              GroupPermissionService permissionService) {
        this.inviteRepository = inviteRepository;
        this.membershipRepository = membershipRepository;
        this.groupService = groupService;
        this.permissionService = permissionService;
    }

    /**
     * Creates a new invite token for a group.
     *
     * @param group the group to create invite for
     * @param createdBy the user creating the invite
     * @return the created invite token
     */
    public GroupInvite createInvite(@NotNull Group group, @NotNull User createdBy) {
        // Verify user has permission to create invites
        if (!permissionService.canInviteUsers(createdBy, group)) {
            throw new GroupMembershipException("Insufficient permissions to create invite links");
        }

        GroupInvite invite = new GroupInvite(group, createdBy);
        GroupInvite savedInvite = inviteRepository.save(invite);

        logger.info("Created invite token {} for group {} by user {}",
            savedInvite.getToken(), group.getGroupName(), createdBy.getUsername());

        return savedInvite;
    }

    /**
     * Creates a new invite token with custom settings.
     *
     * @param group the group to create invite for
     * @param createdBy the user creating the invite
     * @param maxUses maximum number of times the invite can be used (null for unlimited)
     * @param expirationDays days until expiration (null for default, 0 for no expiration)
     * @return the created invite token
     */
    public GroupInvite createInvite(@NotNull Group group, @NotNull User createdBy,
                                    Integer maxUses, Integer expirationDays) {
        // Verify user has permission to create invites
        if (!permissionService.canInviteUsers(createdBy, group)) {
            throw new GroupMembershipException("Insufficient permissions to create invite links");
        }

        GroupInvite invite = new GroupInvite(group, createdBy, maxUses, expirationDays);
        GroupInvite savedInvite = inviteRepository.save(invite);

        logger.info("Created invite token {} for group {} by user {} (maxUses: {}, expirationDays: {})",
            savedInvite.getToken(), group.getGroupName(), createdBy.getUsername(), maxUses, expirationDays);

        return savedInvite;
    }

    /**
     * Validates an invite token and returns validation result.
     *
     * @param token the invite token string
     * @return validation result with group info if valid
     */
    @Transactional(readOnly = true)
    public InviteValidationResult validateInvite(@NotNull String token) {
        Optional<GroupInvite> inviteOpt = inviteRepository.findByToken(token);

        if (inviteOpt.isEmpty()) {
            return new InviteValidationResult(false, "INVALID", null, null);
        }

        GroupInvite invite = inviteOpt.get();

        if (!invite.isValid()) {
            GroupInvite.InvalidReason reason = invite.getInvalidReason();
            String reasonString = reason != null ? reason.name() : "INVALID";
            return new InviteValidationResult(false, reasonString, invite.getGroup().getId(), invite.getGroup().getGroupName());
        }

        return new InviteValidationResult(true, null, invite.getGroup().getId(), invite.getGroup().getGroupName());
    }

    /**
     * Accepts an invite and adds the user to the group.
     * This bypasses the normal join flow for private groups.
     *
     * @param token the invite token string
     * @param user the user accepting the invite
     * @return the created membership
     */
    public GroupMembership acceptInvite(@NotNull String token, @NotNull User user) {
        Optional<GroupInvite> inviteOpt = inviteRepository.findByToken(token);

        if (inviteOpt.isEmpty()) {
            throw new GroupMembershipException("Invalid invite token");
        }

        GroupInvite invite = inviteOpt.get();

        if (!invite.isValid()) {
            GroupInvite.InvalidReason reason = invite.getInvalidReason();
            switch (reason) {
                case EXPIRED:
                    throw new GroupMembershipException("This invite link has expired");
                case MAX_USES_REACHED:
                    throw new GroupMembershipException("This invite link is no longer available");
                case REVOKED:
                    throw new GroupMembershipException("This invite link has been revoked");
                default:
                    throw new GroupMembershipException("Invalid invite link");
            }
        }

        Group group = invite.getGroup();

        // Check if user is already a member
        Optional<GroupMembership> existingMembershipOpt = membershipRepository.findByUserAndGroup(user, group);

        if (existingMembershipOpt.isPresent()) {
            GroupMembership existingMembership = existingMembershipOpt.get();

            // If already approved and active, just return existing
            if (existingMembership.getIsActive() &&
                existingMembership.getStatus() == GroupMembership.MembershipStatus.APPROVED) {
                logger.info("User {} already a member of group {}", user.getUsername(), group.getGroupName());
                return existingMembership;
            }

            // If pending, approve it via invite
            if (existingMembership.getStatus() == GroupMembership.MembershipStatus.PENDING) {
                existingMembership.setStatus(GroupMembership.MembershipStatus.APPROVED);
                existingMembership.setIsActive(true);
                GroupMembership savedMembership = membershipRepository.save(existingMembership);

                // Update member count and increment invite use
                updateMemberCountAndIncrementUse(group, invite);

                logger.info("User {} joined group {} via invite (converted pending request)",
                    user.getUsername(), group.getGroupName());

                return savedMembership;
            }

            // If rejected or left, reset and approve
            if (existingMembership.getStatus() == GroupMembership.MembershipStatus.REJECTED ||
                existingMembership.getStatus() == GroupMembership.MembershipStatus.LEFT) {

                existingMembership.setStatus(GroupMembership.MembershipStatus.APPROVED);
                existingMembership.setIsActive(true);
                existingMembership.setLeftAt(null);
                existingMembership.setRole(GroupMembership.MemberRole.MEMBER);
                GroupMembership savedMembership = membershipRepository.save(existingMembership);

                // Update member count and increment invite use
                updateMemberCountAndIncrementUse(group, invite);

                logger.info("User {} rejoined group {} via invite",
                    user.getUsername(), group.getGroupName());

                return savedMembership;
            }
        }

        // Check if group can accept new members
        if (!group.canAcceptNewMembers()) {
            if (group.isFull()) {
                throw new GroupMembershipException("Group is full");
            }
            throw new GroupMembershipException("Group is not accepting new members");
        }

        // Create new membership - approved immediately via invite
        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(GroupMembership.MemberRole.MEMBER);
        membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
        membership.setIsActive(true);

        GroupMembership savedMembership = membershipRepository.save(membership);

        // Update member count and increment invite use
        updateMemberCountAndIncrementUse(group, invite);

        logger.info("User {} joined group {} via invite token",
            user.getUsername(), group.getGroupName());

        return savedMembership;
    }

    private void updateMemberCountAndIncrementUse(Group group, GroupInvite invite) {
        // Update group member count
        long memberCount = membershipRepository.countActiveMembers(group);
        groupService.updateMemberCount(group.getId(), (int) memberCount);

        // Increment invite use count
        invite.incrementUseCount();
        inviteRepository.save(invite);
    }

    /**
     * Revokes an invite token.
     *
     * @param token the invite token to revoke
     * @param revokedBy the user revoking the invite
     */
    public void revokeInvite(@NotNull String token, @NotNull User revokedBy) {
        Optional<GroupInvite> inviteOpt = inviteRepository.findByToken(token);

        if (inviteOpt.isEmpty()) {
            throw new GroupMembershipException("Invite token not found");
        }

        GroupInvite invite = inviteOpt.get();
        Group group = invite.getGroup();

        // Verify user has permission to revoke invites
        if (!permissionService.canInviteUsers(revokedBy, group)) {
            throw new GroupMembershipException("Insufficient permissions to revoke invite links");
        }

        invite.revoke();
        inviteRepository.save(invite);

        logger.info("Invite token {} revoked by user {}", token, revokedBy.getUsername());
    }

    /**
     * Gets the group ID for a token (used for unauthenticated users).
     *
     * @param token the invite token
     * @return the group ID if token exists, null otherwise
     */
    @Transactional(readOnly = true)
    public Long getGroupIdForToken(@NotNull String token) {
        return inviteRepository.findByToken(token)
            .map(invite -> invite.getGroup().getId())
            .orElse(null);
    }

    /**
     * Result of invite validation.
     */
    public static class InviteValidationResult {
        private final boolean valid;
        private final String reason;
        private final Long groupId;
        private final String groupName;

        public InviteValidationResult(boolean valid, String reason, Long groupId, String groupName) {
            this.valid = valid;
            this.reason = reason;
            this.groupId = groupId;
            this.groupName = groupName;
        }

        public boolean isValid() {
            return valid;
        }

        public String getReason() {
            return reason;
        }

        public Long getGroupId() {
            return groupId;
        }

        public String getGroupName() {
            return groupName;
        }
    }
}
