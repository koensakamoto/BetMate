package com.rivalpicks.repository.group;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupInvite;
import com.rivalpicks.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupInviteRepository extends JpaRepository<GroupInvite, Long> {

    /**
     * Find an invite by its token string.
     */
    Optional<GroupInvite> findByToken(String token);

    /**
     * Find all invites for a group.
     */
    List<GroupInvite> findByGroup(Group group);

    /**
     * Find all active invites for a group.
     */
    @Query("SELECT gi FROM GroupInvite gi WHERE gi.group = :group AND gi.isActive = true")
    List<GroupInvite> findActiveInvitesByGroup(@Param("group") Group group);

    /**
     * Find all invites created by a user.
     */
    List<GroupInvite> findByCreatedBy(User user);

    /**
     * Find valid invites for a group (active, not expired, not at max uses).
     */
    @Query("SELECT gi FROM GroupInvite gi WHERE gi.group = :group AND gi.isActive = true " +
           "AND (gi.expiresAt IS NULL OR gi.expiresAt > :now) " +
           "AND (gi.maxUses IS NULL OR gi.useCount < gi.maxUses)")
    List<GroupInvite> findValidInvitesByGroup(@Param("group") Group group, @Param("now") LocalDateTime now);

    /**
     * Revoke all invites for a group.
     */
    @Modifying
    @Query("UPDATE GroupInvite gi SET gi.isActive = false WHERE gi.group = :group AND gi.isActive = true")
    int revokeAllInvitesForGroup(@Param("group") Group group);

    /**
     * Delete expired invites (for cleanup job).
     */
    @Modifying
    @Query("DELETE FROM GroupInvite gi WHERE gi.expiresAt < :cutoffTime")
    int deleteExpiredInvites(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Count active invites for a group.
     */
    @Query("SELECT COUNT(gi) FROM GroupInvite gi WHERE gi.group = :group AND gi.isActive = true")
    long countActiveInvitesForGroup(@Param("group") Group group);
}
