package com.rivalpicks.repository.messaging;

import com.rivalpicks.entity.messaging.ContactMessage;
import com.rivalpicks.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ContactMessage entity.
 */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    /**
     * Find all contact messages by user, ordered by creation date descending.
     */
    List<ContactMessage> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Find all contact messages by status, ordered by creation date descending.
     */
    List<ContactMessage> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Find all contact messages by category, ordered by creation date descending.
     */
    List<ContactMessage> findByCategoryOrderByCreatedAtDesc(String category);
}
