-- Migration: Add fulfillment tracking for social bets
-- Description: Adds fulfillment status tracking to enable winners to confirm
--              they received their stakes. Supports 1v1, many-to-many scenarios.
-- Created: 2025-11-09

-- ==============================================
-- Step 1: Update bets table with fulfillment fields
-- ==============================================

-- Add fulfillment status enum column
ALTER TABLE bets
ADD COLUMN fulfillment_status VARCHAR(50) DEFAULT 'PENDING';

-- Add loser claim timestamp (optional)
ALTER TABLE bets
ADD COLUMN loser_claimed_fulfilled_at TIMESTAMP NULL;

-- Add loser proof URL (optional)
ALTER TABLE bets
ADD COLUMN loser_fulfillment_proof_url VARCHAR(500);

-- Rename stake_fulfilled_at to all_winners_confirmed_at for clarity
ALTER TABLE bets
CHANGE COLUMN stake_fulfilled_at all_winners_confirmed_at TIMESTAMP NULL;

-- ==============================================
-- Step 2: Create bet_fulfillments table
-- ==============================================

CREATE TABLE bet_fulfillments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bet_id BIGINT NOT NULL,
    winner_id BIGINT NOT NULL,
    confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bet_winner (bet_id, winner_id),
    INDEX idx_bet_fulfillment_bet (bet_id),
    INDEX idx_bet_fulfillment_winner (winner_id)
);

-- ==============================================
-- Step 3: Set fulfillment tracking for existing social bets
-- ==============================================

-- Auto-enable fulfillment tracking for all existing SOCIAL bets
UPDATE bets
SET stake_fulfillment_required = TRUE
WHERE stake_type = 'SOCIAL';

-- ==============================================
-- Verification Queries
-- ==============================================

-- Verify bets table structure
SELECT
    id,
    title,
    stake_type,
    fulfillment_status,
    loser_claimed_fulfilled_at,
    all_winners_confirmed_at
FROM bets
WHERE stake_type = 'SOCIAL'
ORDER BY id DESC
LIMIT 5;

-- Verify bet_fulfillments table structure
DESCRIBE bet_fulfillments;
