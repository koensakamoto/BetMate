package com.circlebet.service.user;

import com.circlebet.entity.user.User;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

/**
 * Service dedicated to user credit and financial operations.
 * Handles all monetary transactions with proper isolation and validation.
 */
@Service
@Validated
@Transactional(isolation = Isolation.SERIALIZABLE)
public class UserCreditService {

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
        User user = userService.getUserById(userId);
        
        BigDecimal newBalance = user.getCreditBalance().add(amount);
        user.setCreditBalance(newBalance);
        
        User updatedUser = userService.saveUser(user);
        
        // Log the transaction (would integrate with audit service)
        logCreditTransaction(userId, amount, "CREDIT", reason, user.getCreditBalance(), newBalance);
        
        return updatedUser;
    }

    /**
     * Deducts credits from a user's account with sufficient balance check.
     */
    public User deductCredits(@NotNull Long userId, 
                             @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive") BigDecimal amount,
                             @NotNull String reason) {
        User user = userService.getUserById(userId);
        
        if (!hasSufficientCredits(user, amount)) {
            throw new InsufficientCreditsException(
                String.format("Insufficient credits. Available: %s, Required: %s", 
                    user.getCreditBalance(), amount)
            );
        }
        
        BigDecimal oldBalance = user.getCreditBalance();
        BigDecimal newBalance = oldBalance.subtract(amount);
        user.setCreditBalance(newBalance);
        
        User updatedUser = userService.saveUser(user);
        
        // Log the transaction
        logCreditTransaction(userId, amount, "DEBIT", reason, oldBalance, newBalance);
        
        return updatedUser;
    }

    /**
     * Transfers credits between two users atomically.
     */
    public TransferResult transferCredits(@NotNull Long fromUserId, 
                                        @NotNull Long toUserId,
                                        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
                                        @NotNull String reason) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot transfer credits to the same user");
        }
        
        User fromUser = userService.getUserById(fromUserId);
        User toUser = userService.getUserById(toUserId);
        
        if (!hasSufficientCredits(fromUser, amount)) {
            throw new InsufficientCreditsException(
                String.format("Insufficient credits for transfer. Available: %s, Required: %s", 
                    fromUser.getCreditBalance(), amount)
            );
        }
        
        // Deduct from sender
        BigDecimal fromOldBalance = fromUser.getCreditBalance();
        fromUser.setCreditBalance(fromOldBalance.subtract(amount));
        
        // Add to receiver
        BigDecimal toOldBalance = toUser.getCreditBalance();
        toUser.setCreditBalance(toOldBalance.add(amount));
        
        // Save both users
        User updatedFromUser = userService.saveUser(fromUser);
        User updatedToUser = userService.saveUser(toUser);
        
        // Log both transactions
        logCreditTransaction(fromUserId, amount, "TRANSFER_OUT", reason, fromOldBalance, fromUser.getCreditBalance());
        logCreditTransaction(toUserId, amount, "TRANSFER_IN", reason, toOldBalance, toUser.getCreditBalance());
        
        return new TransferResult(updatedFromUser, updatedToUser);
    }

    /**
     * Checks if user has sufficient credits for a transaction.
     */
    @Transactional(readOnly = true)
    public boolean hasSufficientCredits(@NotNull Long userId, @NotNull BigDecimal amount) {
        User user = userService.getUserById(userId);
        return hasSufficientCredits(user, amount);
    }

    /**
     * Gets user's current credit balance.
     */
    @Transactional(readOnly = true)
    public BigDecimal getCreditBalance(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        return user.getCreditBalance();
    }

    /**
     * Freezes credits for a pending transaction (e.g., while bet is active).
     */
    public void freezeCredits(@NotNull Long userId, @NotNull BigDecimal amount, @NotNull String reason) {
        // This would typically involve a separate frozen_credits table or field
        // For now, we'll deduct from available balance
        deductCredits(userId, amount, "FREEZE: " + reason);
    }

    /**
     * Unfreezes credits and returns them to available balance.
     */
    public void unfreezeCredits(@NotNull Long userId, @NotNull BigDecimal amount, @NotNull String reason) {
        addCredits(userId, amount, "UNFREEZE: " + reason);
    }

    private boolean hasSufficientCredits(User user, BigDecimal amount) {
        return user.getCreditBalance().compareTo(amount) >= 0;
    }

    private void logCreditTransaction(Long userId, BigDecimal amount, String type, String reason, 
                                    BigDecimal oldBalance, BigDecimal newBalance) {
        // This would integrate with an audit/transaction logging service
        // For now, this is a placeholder for the logging functionality
        System.out.printf("CREDIT_TRANSACTION: User=%d, Type=%s, Amount=%s, Reason=%s, Balance=%s->%s%n",
            userId, type, amount, reason, oldBalance, newBalance);
    }

    // Result object for transfer operations
    public record TransferResult(User fromUser, User toUser) {}

    public static class InsufficientCreditsException extends RuntimeException {
        public InsufficientCreditsException(String message) {
            super(message);
        }
    }
}