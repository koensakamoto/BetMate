package com.circlebet.repository.group;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupRewardAction;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GroupRewardActionRepository extends JpaRepository<GroupRewardAction, Long> {
    
    // Basic queries
    List<GroupRewardAction> findByGroup(Group group);
    List<GroupRewardAction> findByPurchaser(User purchaser);
    List<GroupRewardAction> findByTargetUser(User targetUser);
    
    // Status-based queries
    List<GroupRewardAction> findByStatus(GroupRewardAction.ActionStatus status);
    List<GroupRewardAction> findByGroupAndStatus(Group group, GroupRewardAction.ActionStatus status);
    List<GroupRewardAction> findByIsActive();
    
    // Action type queries
    List<GroupRewardAction> findByActionType(GroupRewardAction.ActionType actionType);
    List<GroupRewardAction> findByGroupAndActionType(Group group, GroupRewardAction.ActionType actionType);
    
    // Execution queries
    @Query("SELECT gra FROM GroupRewardAction gra WHERE gra.status = 'PENDING' AND gra.isActive = true AND " +
           "(gra.scheduledFor IS NULL OR gra.scheduledFor <= :currentTime) AND " +
           "(gra.expiresAt IS NULL OR gra.expiresAt > :currentTime)")
    List<GroupRewardAction> findActionsReadyForExecution(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT gra FROM GroupRewardAction gra WHERE gra.expiresAt IS NOT NULL AND gra.expiresAt <= :currentTime AND gra.status = 'PENDING'")
    List<GroupRewardAction> findExpiredActions(@Param("currentTime") LocalDateTime currentTime);
    
    // Target-based queries
    List<GroupRewardAction> findByTargetEntityTypeAndTargetEntityId(String entityType, Long entityId);
    List<GroupRewardAction> findByGroupAndTargetEntityTypeAndTargetEntityId(Group group, String entityType, Long entityId);
    
    // Time-based queries
    List<GroupRewardAction> findByCreatedAtAfter(LocalDateTime since);
    List<GroupRewardAction> findByGroupAndCreatedAtAfter(Group group, LocalDateTime since);
    List<GroupRewardAction> findByExecutedAtAfter(LocalDateTime since);
    
    // Recent activity
    @Query("SELECT gra FROM GroupRewardAction gra WHERE gra.group = :group ORDER BY gra.createdAt DESC")
    List<GroupRewardAction> findRecentActionsByGroup(@Param("group") Group group);
    
    @Query("SELECT gra FROM GroupRewardAction gra WHERE gra.purchaser = :user ORDER BY gra.createdAt DESC")
    List<GroupRewardAction> findRecentActionsByUser(@Param("user") User user);
    
    // Analytics
    @Query("SELECT COUNT(gra) FROM GroupRewardAction gra WHERE gra.group = :group")
    Long countActionsByGroup(@Param("group") Group group);
    
    @Query("SELECT COUNT(gra) FROM GroupRewardAction gra WHERE gra.purchaser = :user")
    Long countActionsByUser(@Param("user") User user);
    
    @Query("SELECT SUM(gra.cost) FROM GroupRewardAction gra WHERE gra.purchaser = :user")
    java.math.BigDecimal getTotalSpentByUser(@Param("user") User user);
    
    @Query("SELECT gra.actionType, COUNT(gra) FROM GroupRewardAction gra GROUP BY gra.actionType ORDER BY COUNT(gra) DESC")
    List<Object[]> getActionTypeStatistics();
    
    @Query("SELECT gra.group, SUM(gra.cost) FROM GroupRewardAction gra GROUP BY gra.group ORDER BY SUM(gra.cost) DESC")
    List<Object[]> getGroupSpendingStatistics();
    
    // Success rate tracking
    @Query("SELECT COUNT(gra) FROM GroupRewardAction gra WHERE gra.status = 'EXECUTED' AND gra.group = :group")
    Long countSuccessfulActionsByGroup(@Param("group") Group group);
    
    @Query("SELECT COUNT(gra) FROM GroupRewardAction gra WHERE gra.status = 'FAILED' AND gra.group = :group")
    Long countFailedActionsByGroup(@Param("group") Group group);
}