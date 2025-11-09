-- Migration: Add fixed_stake_amount column to bets table
-- Date: 2025-01-09
-- Purpose: Support fixed-stake betting where everyone bets the same amount

-- Add the new column (nullable for backward compatibility)
ALTER TABLE bets
ADD COLUMN fixed_stake_amount DECIMAL(19,2) DEFAULT NULL
COMMENT 'Fixed stake amount - everyone must bet exactly this amount (NULL for variable-stake bets)';

-- Optional: Migrate existing bets to use fixed_stake_amount
-- Uncomment the following line if you want to convert all existing bets to fixed-stake
-- based on their minimum_bet value
-- UPDATE bets SET fixed_stake_amount = minimum_bet WHERE fixed_stake_amount IS NULL;

-- Optional: Add index for faster queries on fixed_stake_amount
-- CREATE INDEX idx_bet_fixed_stake ON bets(fixed_stake_amount);

-- Verification query - check that column was added
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bets'
    AND COLUMN_NAME = 'fixed_stake_amount';
