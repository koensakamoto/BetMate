package com.circlebet.repository.group;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupMembership;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {
    
    // Basic membership queries
    Optional<GroupMembership> findByUserAndGroup(User user, Group group);
    List<GroupMembership> findByUser(User user);
    List<GroupMembership> findByGroup(Group group);
    
    // Active membership queries
    List<GroupMembership> findByUserAndIsActiveTrue(User user);
    List<GroupMembership> findByGroupAndIsActiveTrue(Group group);
    Optional<GroupMembership> findByUserAndGroupAndIsActiveTrue(User user, Group group);
    
    // Role-based queries
    List<GroupMembership> findByRole(GroupMembership.MemberRole role);
    List<GroupMembership> findByGroupAndRole(Group group, GroupMembership.MemberRole role);
    List<GroupMembership> findByUserAndRole(User user, GroupMembership.MemberRole role);
    
    // Admin/moderator queries
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.group = :group AND gm.role IN ('ADMIN', 'MODERATOR') AND gm.isActive = true")
    List<GroupMembership> findGroupAdminsAndModerators(@Param("group") Group group);
    
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.user = :user AND gm.role IN ('ADMIN', 'MODERATOR') AND gm.isActive = true")
    List<GroupMembership> findUserAdminMemberships(@Param("user") User user);
    
    // Membership status checks
    boolean existsByUserAndGroupAndIsActiveTrue(User user, Group group);
    
    @Query("SELECT COUNT(gm) FROM GroupMembership gm WHERE gm.group = :group AND gm.isActive = true")
    Long countActiveMembers(@Param("group") Group group);
    
    @Query("SELECT COUNT(gm) FROM GroupMembership gm WHERE gm.user = :user AND gm.isActive = true")
    Long countUserActiveMemberships(@Param("user") User user);
    
    // Time-based queries
    List<GroupMembership> findByJoinedAtAfter(LocalDateTime since);
    List<GroupMembership> findByGroupAndJoinedAtAfter(Group group, LocalDateTime since);
    
    // Recent activity
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.group = :group AND gm.isActive = true ORDER BY gm.joinedAt DESC")
    List<GroupMembership> findRecentMembersByGroup(@Param("group") Group group);
    
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.user = :user AND gm.isActive = true ORDER BY gm.joinedAt DESC")
    List<GroupMembership> findUserMembershipsOrderedByJoinDate(@Param("user") User user);
    
    // Group discovery for user
    @Query("SELECT gm.group FROM GroupMembership gm WHERE gm.user = :user AND gm.isActive = true")
    List<Group> findGroupsByUser(@Param("user") User user);
    
    @Query("SELECT gm.user FROM GroupMembership gm WHERE gm.group = :group AND gm.isActive = true")
    List<User> findUsersByGroup(@Param("group") Group group);
    
    // Permission checks
    @Query("SELECT CASE WHEN COUNT(gm) > 0 THEN true ELSE false END FROM GroupMembership gm " +
           "WHERE gm.user = :user AND gm.group = :group AND gm.role IN ('ADMIN', 'MODERATOR') AND gm.isActive = true")
    boolean isUserAdminOrModerator(@Param("user") User user, @Param("group") Group group);
    
    @Query("SELECT CASE WHEN COUNT(gm) > 0 THEN true ELSE false END FROM GroupMembership gm " +
           "WHERE gm.user = :user AND gm.group = :group AND gm.role = 'ADMIN' AND gm.isActive = true")
    boolean isUserGroupAdmin(@Param("user") User user, @Param("group") Group group);
    
    // Analytics
    @Query("SELECT COUNT(gm) FROM GroupMembership gm WHERE gm.joinedAt >= :start AND gm.joinedAt < :end")
    Long countMembershipsCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT g, COUNT(gm) FROM GroupMembership gm JOIN gm.group g WHERE gm.isActive = true GROUP BY g ORDER BY COUNT(gm) DESC")
    List<Object[]> findMostPopularGroups();
    
    // Atomic admin operations to prevent race conditions
    @Modifying
    @Query("UPDATE GroupMembership gm SET gm.isActive = false, gm.leftAt = :leftAt " +
           "WHERE gm.user = :user AND gm.group = :group AND gm.isActive = true " +
           "AND (gm.role != 'ADMIN' OR " +
           "(SELECT COUNT(gm2) FROM GroupMembership gm2 WHERE gm2.group = :group AND gm2.role = 'ADMIN' AND gm2.isActive = true) > 1)")
    int atomicLeaveGroup(@Param("user") User user, @Param("group") Group group, @Param("leftAt") LocalDateTime leftAt);
    
    @Modifying
    @Query("UPDATE GroupMembership gm SET gm.role = :newRole " +
           "WHERE gm.user = :user AND gm.group = :group AND gm.isActive = true " +
           "AND (gm.role != 'ADMIN' OR :newRole = 'ADMIN' OR " +
           "(SELECT COUNT(gm2) FROM GroupMembership gm2 WHERE gm2.group = :group AND gm2.role = 'ADMIN' AND gm2.isActive = true) > 1)")
    int atomicChangeRole(@Param("user") User user, @Param("group") Group group, @Param("newRole") GroupMembership.MemberRole newRole);
    
    @Modifying
    @Query("UPDATE GroupMembership gm SET gm.isActive = false, gm.leftAt = :leftAt " +
           "WHERE gm.user = :user AND gm.group = :group AND gm.isActive = true " +
           "AND (gm.role != 'ADMIN' OR " +
           "(SELECT COUNT(gm2) FROM GroupMembership gm2 WHERE gm2.group = :group AND gm2.role = 'ADMIN' AND gm2.isActive = true) > 1)")
    int atomicRemoveMember(@Param("user") User user, @Param("group") Group group, @Param("leftAt") LocalDateTime leftAt);
}