package com.rivalpicks.repository.user;

import com.rivalpicks.entity.user.Transaction;
import com.rivalpicks.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Transaction entity.
 * Provides data access methods for user credit transaction history.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Find all transactions for a user, paginated and ordered by date descending.
     * @param user The user whose transactions to retrieve
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<Transaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Find transactions by user and type, ordered by date descending.
     * @param user The user whose transactions to retrieve
     * @param type The transaction type to filter by
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<Transaction> findByUserAndTypeOrderByCreatedAtDesc(User user, Transaction.TransactionType type, Pageable pageable);

    /**
     * Find transactions by user within a date range, ordered by date descending.
     * @param user The user whose transactions to retrieve
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<Transaction> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(
        User user,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Find transactions by correlation ID.
     * Useful for tracking related transactions (e.g., transfers, bet resolutions).
     * @param correlationId The correlation ID to search for
     * @return List of transactions with matching correlation ID
     */
    List<Transaction> findByCorrelationId(String correlationId);
}
