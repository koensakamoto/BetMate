package com.betmate.dto.user.response;

import com.betmate.entity.user.Transaction;
import java.math.BigDecimal;

/**
 * Response DTO for transaction history.
 * Provides transaction details for user's credit operations.
 */
public class TransactionResponseDto {
    private Long id;
    private String type;
    private BigDecimal amount;
    private String reason;
    private String timestamp;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String correlationId;

    public static TransactionResponseDto fromTransaction(Transaction transaction) {
        TransactionResponseDto dto = new TransactionResponseDto();
        dto.id = transaction.getId();
        dto.type = transaction.getType().name();
        dto.amount = transaction.getAmount();
        dto.reason = transaction.getReason();
        dto.timestamp = transaction.getCreatedAt().toString();
        dto.balanceBefore = transaction.getBalanceBefore();
        dto.balanceAfter = transaction.getBalanceAfter();
        dto.correlationId = transaction.getCorrelationId();
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public String getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public String getReason() { return reason; }
    public String getTimestamp() { return timestamp; }
    public BigDecimal getBalanceBefore() { return balanceBefore; }
    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public String getCorrelationId() { return correlationId; }
}
