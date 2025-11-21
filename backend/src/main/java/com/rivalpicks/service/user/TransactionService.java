package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.Transaction;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.user.TransactionRepository;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service for managing user transaction history.
 * Records all credit operations for audit trail and user visibility.
 */
@Service
@Validated
@Transactional
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Creates and persists a new transaction record.
     *
     * @param user The user this transaction belongs to
     * @param type The type of transaction (CREDIT, DEBIT, TRANSFER_IN, TRANSFER_OUT)
     * @param amount The transaction amount
     * @param reason Human-readable description of the transaction
     * @param balanceBefore User's balance before the transaction
     * @param balanceAfter User's balance after the transaction
     * @param correlationId Optional ID to link related transactions (e.g., transfers, bet resolutions)
     * @return The persisted transaction
     */
    public Transaction createTransaction(
            @NotNull User user,
            @NotNull Transaction.TransactionType type,
            @NotNull BigDecimal amount,
            @NotNull String reason,
            @NotNull BigDecimal balanceBefore,
            @NotNull BigDecimal balanceAfter,
            String correlationId) {

        log.debug("Creating transaction - User: {}, Type: {}, Amount: {}, Reason: {}, CorrelationId: {}",
            user.getId(), type, amount, reason, correlationId);

        Transaction transaction = new Transaction(
            user,
            type,
            amount,
            reason,
            balanceBefore,
            balanceAfter,
            correlationId
        );

        Transaction savedTransaction = transactionRepository.save(transaction);

        log.info("Transaction created - ID: {}, User: {}, Type: {}, Amount: {}",
            savedTransaction.getId(), user.getId(), type, amount);

        return savedTransaction;
    }

    /**
     * Retrieves paginated transaction history for a user.
     * Transactions are ordered by creation date (newest first).
     *
     * @param user The user whose transactions to retrieve
     * @param page Page number (0-indexed)
     * @param size Number of transactions per page
     * @return Page of transactions
     */
    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactions(@NotNull User user, int page, int size) {
        log.debug("Fetching transactions for user {} - page: {}, size: {}", user.getId(), page, size);

        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    /**
     * Retrieves filtered transaction history for a user by type.
     *
     * @param user The user whose transactions to retrieve
     * @param type The transaction type to filter by
     * @param page Page number (0-indexed)
     * @param size Number of transactions per page
     * @return Page of transactions matching the type
     */
    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactionsByType(
            @NotNull User user,
            @NotNull Transaction.TransactionType type,
            int page,
            int size) {

        log.debug("Fetching {} transactions for user {} - page: {}, size: {}",
            type, user.getId(), page, size);

        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserAndTypeOrderByCreatedAtDesc(user, type, pageable);
    }

    /**
     * Retrieves transactions within a specific date range.
     *
     * @param user The user whose transactions to retrieve
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param page Page number (0-indexed)
     * @param size Number of transactions per page
     * @return Page of transactions within the date range
     */
    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactionsByDateRange(
            @NotNull User user,
            @NotNull LocalDateTime startDate,
            @NotNull LocalDateTime endDate,
            int page,
            int size) {

        log.debug("Fetching transactions for user {} between {} and {} - page: {}, size: {}",
            user.getId(), startDate, endDate, page, size);

        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(
            user, startDate, endDate, pageable);
    }
}
