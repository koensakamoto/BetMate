package com.circlebet.repository.group;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
    boolean existsByGroupNameIgnoreCase(String groupName);
    
    // Group status queries
    List<Group> findByIsActiveTrueAndDeletedAtIsNull();
    List<Group> findByPrivacy(Group.Privacy privacy);
    List<Group> findByCreator(User creator);
    
    // Membership queries
    List<Group> findByMemberCountGreaterThan(Integer minMembers);
    List<Group> findByMemberCountLessThan(Integer maxMembers);
    
    @Query("SELECT g FROM Group g WHERE g.maxMembers IS NULL OR g.memberCount < g.maxMembers")
    List<Group> findGroupsWithAvailableSlots();
    
    // Activity queries
    List<Group> findByCreatedAtAfter(LocalDateTime since);
    List<Group> findByLastMessageAtAfter(LocalDateTime since);
    
    // Search functionality
    @Query("SELECT g FROM Group g WHERE g.deletedAt IS NULL AND g.isActive = true AND " +
           "(LOWER(g.groupName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Group> searchGroups(@Param("searchTerm") String searchTerm);
    
    // Public groups for discovery
    @Query("SELECT g FROM Group g WHERE g.privacy = 'PUBLIC' AND g.isActive = true AND g.deletedAt IS NULL")
    List<Group> findPublicGroups();
    
    // Most active groups
    @Query("SELECT g FROM Group g WHERE g.deletedAt IS NULL AND g.isActive = true ORDER BY g.totalMessages DESC")
    List<Group> findMostActiveGroups();
    
    // Admin queries
    @Query("SELECT COUNT(g) FROM Group g WHERE g.isActive = true AND g.deletedAt IS NULL")
    Long countActiveGroups();
    
    @Query("SELECT COUNT(g) FROM Group g WHERE g.createdAt >= :todayStart")
    Long countGroupsCreatedToday(@Param("todayStart") LocalDateTime todayStart);
}