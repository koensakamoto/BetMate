package com.rivalpicks.repository.messaging;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.messaging.Message;
import com.rivalpicks.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Group messages
    List<Message> findByGroup(Group group);
    List<Message> findByGroupOrderByCreatedAtDesc(Group group);

    // Eagerly fetch sender and group to avoid N+1 queries when converting to DTOs
    @EntityGraph(attributePaths = {"sender", "group"})
    Page<Message> findByGroupAndDeletedAtIsNull(Group group, Pageable pageable);

    // Pagination support - load messages before a timestamp
    // Eagerly fetch sender and group to avoid N+1 queries
    @EntityGraph(attributePaths = {"sender", "group"})
    @Query("SELECT m FROM Message m WHERE m.group = :group AND m.deletedAt IS NULL " +
           "AND m.createdAt < :before ORDER BY m.createdAt DESC")
    List<Message> findMessagesBefore(@Param("group") Group group,
                                     @Param("before") LocalDateTime before,
                                     Pageable pageable);

    // Eagerly fetch sender and group to avoid N+1 queries
    @EntityGraph(attributePaths = {"sender", "group"})
    @Query("SELECT m FROM Message m WHERE m.group = :group AND m.deletedAt IS NULL ORDER BY m.createdAt DESC")
    List<Message> findActiveMessagesByGroup(@Param("group") Group group);
    
    // User messages
    List<Message> findBySender(User sender);
    List<Message> findBySenderOrderByCreatedAtDesc(User sender);
    
    // Message types
    List<Message> findByMessageType(Message.MessageType messageType);
    List<Message> findByGroupAndMessageType(Group group, Message.MessageType messageType);
    
    // Thread messages
    List<Message> findByParentMessage(Message parentMessage);
    List<Message> findByParentMessageOrderByCreatedAt(Message parentMessage);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.parentMessage = :parentMessage AND m.deletedAt IS NULL")
    Long countReplies(@Param("parentMessage") Message parentMessage);
    
    // Time-based queries
    List<Message> findByCreatedAtAfter(LocalDateTime since);
    List<Message> findByGroupAndCreatedAtAfter(Group group, LocalDateTime since);
    List<Message> findByGroupAndCreatedAtBetween(Group group, LocalDateTime start, LocalDateTime end);
    
    // Recent messages
    @Query("SELECT m FROM Message m WHERE m.group = :group AND m.deletedAt IS NULL ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByGroup(@Param("group") Group group);
    
    @Query("SELECT m FROM Message m WHERE m.sender = :user ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByUser(@Param("user") User user);
    
    // Search functionality
    @Query("SELECT m FROM Message m WHERE m.group = :group AND m.deletedAt IS NULL AND " +
           "LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Message> searchMessagesInGroup(@Param("group") Group group, @Param("searchTerm") String searchTerm);
    
    @Query("SELECT m FROM Message m WHERE m.deletedAt IS NULL AND " +
           "LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Message> searchMessages(@Param("searchTerm") String searchTerm);
    
    // Edited messages
    List<Message> findByIsEditedTrue();
    List<Message> findByGroupAndIsEditedTrue(Group group);
    List<Message> findByEditedAtAfter(LocalDateTime since);
    
    // Group activity
    @Query("SELECT COUNT(m) FROM Message m WHERE m.group = :group AND m.deletedAt IS NULL")
    Long countMessagesByGroup(@Param("group") Group group);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.group = :group AND m.createdAt >= :start AND m.createdAt < :end AND m.deletedAt IS NULL")
    Long countMessagesByGroupBetween(@Param("group") Group group, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // User activity
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender = :user")
    Long countMessagesByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender = :user AND m.createdAt >= :start AND m.createdAt < :end")
    Long countMessagesByUserBetween(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Most active groups/users
    @Query("SELECT m.group, COUNT(m) FROM Message m WHERE m.deletedAt IS NULL GROUP BY m.group ORDER BY COUNT(m) DESC")
    List<Object[]> findMostActiveGroups();
    
    @Query("SELECT m.sender, COUNT(m) FROM Message m WHERE m.deletedAt IS NULL GROUP BY m.sender ORDER BY COUNT(m) DESC")
    List<Object[]> findMostActiveUsers();
    
    // Latest message in each group
    @Query("SELECT m FROM Message m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM Message m2 WHERE m2.deletedAt IS NULL GROUP BY m2.group)")
    List<Message> findLatestMessagePerGroup();
    
    // Mentions and interactions
    @Query("SELECT m FROM Message m WHERE m.deletedAt IS NULL AND LOWER(m.content) LIKE LOWER(CONCAT('%@', :username, '%'))")
    List<Message> findMessagesMentioningUser(@Param("username") String username);
    
    // Analytics
    @Query("SELECT COUNT(m) FROM Message m WHERE m.createdAt >= :todayStart AND m.deletedAt IS NULL")
    Long countMessagesToday(@Param("todayStart") LocalDateTime todayStart);
    
    @Query("SELECT HOUR(m.createdAt), COUNT(m) FROM Message m WHERE m.deletedAt IS NULL GROUP BY HOUR(m.createdAt)")
    List<Object[]> getMessageActivityByHour();
    
    @Query("SELECT DATE(m.createdAt), COUNT(m) FROM Message m WHERE m.createdAt >= :start AND m.deletedAt IS NULL GROUP BY DATE(m.createdAt)")
    List<Object[]> getMessageActivityByDay(@Param("start") LocalDateTime start);
}