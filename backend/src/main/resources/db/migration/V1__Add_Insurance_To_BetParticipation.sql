-- Migration Script: Add Insurance Fields to BetParticipation Table
-- Version: V1
-- Description: Adds insurance tracking fields to bet_participations table
-- Author: BetMate Development Team
-- Date: 2025-01-12

-- Add insurance-related columns to bet_participations table
ALTER TABLE bet_participations
ADD COLUMN insurance_item_id BIGINT NULL COMMENT 'References user_inventory.id for the insurance item applied',
ADD COLUMN insurance_refund_percentage INT NULL COMMENT 'Refund percentage: 25 (Basic), 50 (Premium), or 75 (Elite)',
ADD COLUMN insurance_refund_amount DECIMAL(19,2) NULL COMMENT 'Calculated refund amount based on bet amount and percentage',
ADD COLUMN insurance_applied BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether insurance has been applied to this participation';

-- Add foreign key constraint
ALTER TABLE bet_participations
ADD CONSTRAINT fk_bet_participation_insurance
FOREIGN KEY (insurance_item_id) REFERENCES user_inventory(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index for insurance queries
CREATE INDEX idx_bet_participation_insurance ON bet_participations(insurance_applied, insurance_item_id);

-- Add comment to table
ALTER TABLE bet_participations COMMENT = 'Stores user participation in bets, including insurance coverage';

-- Verification queries (commented out - uncomment to verify after migration)
-- SELECT COUNT(*) FROM bet_participations WHERE insurance_applied = TRUE; -- Should be 0 initially
-- DESCRIBE bet_participations; -- Verify columns were added
