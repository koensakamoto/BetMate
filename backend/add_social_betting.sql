-- Migration: Add social betting support
-- Description: Adds stake type fields to bets table to support both credit-based
--              and social bets (e.g., "Loser buys pizza")
-- Created: 2025-11-09

-- Add stake type enum column
-- Default to 'CREDIT' for backward compatibility with existing bets
ALTER TABLE bets
ADD COLUMN stake_type VARCHAR(20) DEFAULT 'CREDIT' NOT NULL;

-- Add social stake description
-- Used when stake_type = 'SOCIAL' to describe the stake (e.g., "Loser buys pizza")
ALTER TABLE bets
ADD COLUMN social_stake_description VARCHAR(500);

-- Add template data for future template-based stakes
-- Will store JSON data for pre-defined stake templates
ALTER TABLE bets
ADD COLUMN social_stake_template TEXT;

-- Future fulfillment tracking fields
-- These allow tracking whether the social stake was actually fulfilled
ALTER TABLE bets
ADD COLUMN stake_fulfillment_required BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE bets
ADD COLUMN stake_fulfilled_at TIMESTAMP NULL;

-- Verification query
-- Use this to confirm the migration was successful
SELECT
    id,
    title,
    stake_type,
    fixed_stake_amount,
    social_stake_description,
    stake_fulfillment_required
FROM bets
ORDER BY id DESC
LIMIT 10;
