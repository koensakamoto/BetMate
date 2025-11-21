package com.rivalpicks.repository.group;

import com.rivalpicks.entity.group.Group;
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
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    // Basic queries
    Optional<Group> findByGroupNameIgnoreCase(String groupName);
    Optional<Group> findByGroupNameIgnoreCaseAndDeletedAtIsNull(String groupName);
    Optional<Group> findByIdAndDeletedAtIsNull(Long id);
    boolean existsByGroupNameIgnoreCase(String groupName);
    
    // Group status queries
    List<Group> findByIsActiveTrueAndDeletedAtIsNull();
    List<Group> findByPrivacy(Group.Privacy privacy);
    List<Group> findByCreator(User creator);
    
    // Membership queries
    List<Group> findByMemberCountGreaterThan(Integer minMembers);
    List<Group> findByMemberCountLessThan(Integer maxMembers);
    
    @Query("SELECT g FROM Group g WHERE g.memberCount < g.maxMembers AND g.deletedAt IS NULL AND g.isActive = true")
    List<Group> findGroupsWithAvailableSlots();
    
    // Activity queries
    List<Group> findByCreatedAtAfter(LocalDateTime since);
    List<Group> findByLastMessageAtAfter(LocalDateTime since);
    
    // Search functionality (excludes SECRET groups)
    @Query("SELECT g FROM Group g WHERE g.deletedAt IS NULL AND g.isActive = true AND " +
           "g.privacy IN ('PUBLIC', 'PRIVATE') AND " +
           "(LOWER(g.groupName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Group> searchGroups(@Param("searchTerm") String searchTerm);
    
    // PUBLIC and PRIVATE groups for discovery (SECRET excluded)
    @Query("SELECT g FROM Group g WHERE g.privacy IN ('PUBLIC', 'PRIVATE') AND g.isActive = true AND g.deletedAt IS NULL")
    List<Group> findPublicGroups();
    
    // Most active groups
    @Query("SELECT g FROM Group g WHERE g.deletedAt IS NULL AND g.isActive = true ORDER BY g.totalMessages DESC")
    List<Group> findMostActiveGroups();
    
    // Admin queries
    @Query("SELECT COUNT(g) FROM Group g WHERE g.isActive = true AND g.deletedAt IS NULL")
    Long countActiveGroups();
    
    @Query("SELECT COUNT(g) FROM Group g WHERE g.createdAt >= :todayStart")
    Long countGroupsCreatedToday(@Param("todayStart") LocalDateTime todayStart);
    
    // Atomic update queries
    @Modifying
    @Query("UPDATE Group g SET g.totalMessages = g.totalMessages + 1, g.lastMessageAt = :lastMessageAt, g.lastMessageUser = :lastMessageUser WHERE g.id = :groupId AND g.deletedAt IS NULL")
    int updateChatMetadata(@Param("groupId") Long groupId, @Param("lastMessageAt") LocalDateTime lastMessageAt, @Param("lastMessageUser") User lastMessageUser);
    
    @Modifying
    @Query("UPDATE Group g SET g.memberCount = :memberCount WHERE g.id = :groupId AND g.deletedAt IS NULL")
    int updateMemberCount(@Param("groupId") Long groupId, @Param("memberCount") Integer memberCount);
}