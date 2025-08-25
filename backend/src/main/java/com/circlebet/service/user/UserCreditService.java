package com.circlebet.service.user;

import com.circlebet.entity.user.User;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service dedicated to user credit and financial operations.
 * Handles all monetary transactions with proper isolation, race condition prevention,
 * and comprehensive frozen credit tracking.
 */
@Service
@Validated
@Transactional(isolation = Isolation.SERIALIZABLE)
public class UserCreditService {

    private static final Logger log = LoggerFactory.getLogger(UserCreditService.class);
    private final UserService userService;

    @Autowired
    public UserCreditService(UserService userService) {
        this.userService = userService;
    }

    /**
     * Adds credits to a user's account with audit trail.
     */
    public User addCredits(@NotNull Long userId, 
                          @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive") BigDecimal amount,
                          @NotNull String reason) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Adding credits - User: {}, Amount: {}, Reason: {}, CorrelationId: {}", 
            userId, amount, reason, correlationId);

        User user = userService.getUserById(userId);
        BigDecimal oldBalance = user.getCreditBalance();
        BigDecimal newBalance = oldBalance.add(amount);
        
        user.setCreditBalance(newBalance);
        User updatedUser = userService.saveUser(user);
        
        logCreditTransaction(userId, amount, "CREDIT", reason, oldBalance, newBalance, correlationId);
        
        log.info("Credits added successfully - User: {}, NewBalance: {}, CorrelationId: {}", 
            userId, newBalance, correlationId);
        
        return updatedUser;
    }

    /**
     * Deducts credits from a user's available balance with sufficient balance check.
     * Uses available credits (total - frozen) to prevent spending frozen amounts.
     */
    public User deductCredits(@NotNull Long userId, 
                             @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive") BigDecimal amount,
                             @NotNull String reason) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Deducting credits - User: {}, Amount: {}, Reason: {}, CorrelationId: {}", 
            userId, amount, reason, correlationId);

        User user = userService.getUserById(userId);
        
        if (!user.hasSufficientAvailableCredits(amount)) {
            throw new InsufficientCreditsException(
                String.format("Insufficient available credits. Available: %s, Required: %s, Frozen: %s", 
                    user.getAvailableCredits(), amount, user.getFrozenCredits())
            );
        }
        
        BigDecimal oldBalance = user.getCreditBalance();
        BigDecimal newBalance = oldBalance.subtract(amount);
        user.setCreditBalance(newBalance);
        
        User updatedUser = userService.saveUser(user);
        
        logCreditTransaction(userId, amount, "DEBIT", reason, oldBalance, newBalance, correlationId);
        
        log.info("Credits deducted successfully - User: {}, NewBalance: {}, AvailableCredits: {}, CorrelationId: {}", 
            userId, newBalance, updatedUser.getAvailableCredits(), correlationId);
        
        return updatedUser;
    }

    /**
     * Transfers credits between two users atomically with consistent lock ordering
     * to prevent deadlocks and race conditions.
     */
    public TransferResult transferCredits(@NotNull Long fromUserId, 
                                        @NotNull Long toUserId,
                                        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
                                        @NotNull String reason) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Transferring credits - From: {}, To: {}, Amount: {}, Reason: {}, CorrelationId: {}", 
            fromUserId, toUserId, amount, reason, correlationId);

        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot transfer credits to the same user");
        }
        
        // Lock users in consistent order (by ID) to prevent deadlocks
        Long firstId = fromUserId < toUserId ? fromUserId : toUserId;
        Long secondId = fromUserId < toUserId ? toUserId : fromUserId;
        
        User firstUser = userService.getUserById(firstId);
        User secondUser = userService.getUserById(secondId);
        
        // Determine which is fromUser vs toUser after consistent locking
        User fromUser = firstUser.getId().equals(fromUserId) ? firstUser : secondUser;
        User toUser = firstUser.getId().equals(toUserId) ? firstUser : secondUser;
        
        // Check sufficient available credits for sender
        if (!fromUser.hasSufficientAvailableCredits(amount)) {
            throw new InsufficientCreditsException(
                String.format("Insufficient available credits for transfer. Available: %s, Required: %s, Frozen: %s", 
                    fromUser.getAvailableCredits(), amount, fromUser.getFrozenCredits())
            );
        }
        
        // Perform atomic transfer
        BigDecimal fromOldBalance = fromUser.getCreditBalance();
        BigDecimal toOldBalance = toUser.getCreditBalance();
        
        fromUser.setCreditBalance(fromOldBalance.subtract(amount));
        toUser.setCreditBalance(toOldBalance.add(amount));
        
        // Save both users
        User updatedFromUser = userService.saveUser(fromUser);
        User updatedToUser = userService.saveUser(toUser);
        
        // Log both sides of the transaction
        logCreditTransaction(fromUserId, amount, "TRANSFER_OUT", reason, 
            fromOldBalance, fromUser.getCreditBalance(), correlationId);
        logCreditTransaction(toUserId, amount, "TRANSFER_IN", reason, 
            toOldBalance, toUser.getCreditBalance(), correlationId);
        
        log.info("Transfer completed successfully - From: {} (Balance: {}), To: {} (Balance: {}), CorrelationId: {}", 
            fromUserId, updatedFromUser.getCreditBalance(), toUserId, updatedToUser.getCreditBalance(), correlationId);
        
        return new TransferResult(updatedFromUser, updatedToUser);
    }

    /**
     * Properly freezes credits by tracking them separately from available balance.
     * Frozen credits remain in the total balance but are unavailable for spending.
     */
    public User freezeCredits(@NotNull Long userId, 
                             @NotNull @DecimalMin(value = "0.01") BigDecimal amount, 
                             @NotNull String reason) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Freezing credits - User: {}, Amount: {}, Reason: {}, CorrelationId: {}", 
            userId, amount, reason, correlationId);

        User user = userService.getUserById(userId);
        
        if (!user.hasSufficientAvailableCredits(amount)) {
            throw new InsufficientCreditsException(
                String.format("Insufficient available credits to freeze. Available: %s, Required: %s", 
                    user.getAvailableCredits(), amount)
            );
        }
        
        BigDecimal oldFrozenAmount = user.getFrozenCredits();
        BigDecimal newFrozenAmount = oldFrozenAmount.add(amount);
        user.setFrozenCredits(newFrozenAmount);
        
        User updatedUser = userService.saveUser(user);
        
        logFreezeTransaction(userId, amount, "FREEZE", reason, oldFrozenAmount, newFrozenAmount, correlationId);
        
        log.info("Credits frozen successfully - User: {}, FrozenAmount: {}, AvailableCredits: {}, CorrelationId: {}", 
            userId, newFrozenAmount, updatedUser.getAvailableCredits(), correlationId);
        
        return updatedUser;
    }

    /**
     * Unfreezes credits and returns them to available balance.
     * Validates that sufficient frozen credits exist before unfreezing.
     */
    public User unfreezeCredits(@NotNull Long userId, 
                               @NotNull @DecimalMin(value = "0.01") BigDecimal amount, 
                               @NotNull String reason) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Unfreezing credits - User: {}, Amount: {}, Reason: {}, CorrelationId: {}", 
            userId, amount, reason, correlationId);

        User user = userService.getUserById(userId);
        
        if (user.getFrozenCredits().compareTo(amount) < 0) {
            throw new InsufficientFrozenCreditsException(
                String.format("Insufficient frozen credits to unfreeze. Frozen: %s, Required: %s", 
                    user.getFrozenCredits(), amount)
            );
        }
        
        BigDecimal oldFrozenAmount = user.getFrozenCredits();
        BigDecimal newFrozenAmount = oldFrozenAmount.subtract(amount);
        user.setFrozenCredits(newFrozenAmount);
        
        User updatedUser = userService.saveUser(user);
        
        logFreezeTransaction(userId, amount, "UNFREEZE", reason, oldFrozenAmount, newFrozenAmount, correlationId);
        
        log.info("Credits unfrozen successfully - User: {}, FrozenAmount: {}, AvailableCredits: {}, CorrelationId: {}", 
            userId, newFrozenAmount, updatedUser.getAvailableCredits(), correlationId);
        
        return updatedUser;
    }

    /**
     * Checks if user has sufficient available credits (excluding frozen) for a transaction.
     */
    @Transactional(readOnly = true)
    public boolean hasSufficientAvailableCredits(@NotNull Long userId, @NotNull BigDecimal amount) {
        User user = userService.getUserById(userId);
        return user.hasSufficientAvailableCredits(amount);
    }

    /**
     * Gets user's current total credit balance.
     */
    @Transactional(readOnly = true)
    public BigDecimal getCreditBalance(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return user.getCreditBalance();
    }

    /**
     * Gets user's available credits (total balance minus frozen credits).
     */
    @Transactional(readOnly = true)
    public BigDecimal getAvailableCredits(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return user.getAvailableCredits();
    }

    /**
     * Gets user's frozen credits amount.
     */
    @Transactional(readOnly = true)
    public BigDecimal getFrozenCredits(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return user.getFrozenCredits();
    }

    /**
     * Gets comprehensive credit summary for a user.
     */
    @Transactional(readOnly = true)
    public CreditSummary getCreditSummary(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return new CreditSummary(
            user.getCreditBalance(),
            user.getFrozenCredits(),
            user.getAvailableCredits()
        );
    }

    private void logCreditTransaction(Long userId, BigDecimal amount, String type, String reason, 
                                    BigDecimal oldBalance, BigDecimal newBalance, String correlationId) {
        log.info("CREDIT_TRANSACTION: User={}, Type={}, Amount={}, Reason={}, Balance={}→{}, CorrelationId={}", 
            userId, type, amount, reason, oldBalance, newBalance, correlationId);
    }

    private void logFreezeTransaction(Long userId, BigDecimal amount, String type, String reason, 
                                    BigDecimal oldFrozen, BigDecimal newFrozen, String correlationId) {
        log.info("FREEZE_TRANSACTION: User={}, Type={}, Amount={}, Reason={}, Frozen={}→{}, CorrelationId={}", 
            userId, type, amount, reason, oldFrozen, newFrozen, correlationId);
    }

    // ==========================================
    // DTOs and Exception Classes
    // ==========================================

    /**
     * Result object for transfer operations.
     */
    public record TransferResult(User fromUser, User toUser) {}

    /**
     * Comprehensive credit summary for a user.
     */
    public record CreditSummary(
        BigDecimal totalBalance,
        BigDecimal frozenCredits,
        BigDecimal availableCredits
    ) {}

    /**
     * Exception thrown when user has insufficient credits for an operation.
     */
    public static class InsufficientCreditsException extends RuntimeException {
        public InsufficientCreditsException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when user has insufficient frozen credits for unfreezing.
     */
    public static class InsufficientFrozenCreditsException extends RuntimeException {
        public InsufficientFrozenCreditsException(String message) {
            super(message);
        }
    }
}