package com.betmate.dto.export;

import com.betmate.entity.user.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for exporting transaction data.
 */
public record TransactionExportDto(
    Long id,
    String type,
    BigDecimal amount,
    String reason,
    BigDecimal balanceBefore,
    BigDecimal balanceAfter,
    String correlationId,
    LocalDateTime createdAt
) {
    public static TransactionExportDto fromTransaction(Transaction transaction) {
        return new TransactionExportDto(
            transaction.getId(),
            transaction.getType() != null ? transaction.getType().name() : null,
            transaction.getAmount(),
            transaction.getReason(),
            transaction.getBalanceBefore(),
            transaction.getBalanceAfter(),
            transaction.getCorrelationId(),
            transaction.getCreatedAt()
        );
    }
}
