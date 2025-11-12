-- Add booster tracking fields to user_inventory table
-- These fields enable tracking of active consumable items like daily bonus doublers

ALTER TABLE user_inventory
ADD COLUMN activated_at DATETIME NULL COMMENT 'When the booster/consumable was activated',
ADD COLUMN uses_remaining INT NULL COMMENT 'Number of uses remaining for this booster',
ADD COLUMN expires_at DATETIME NULL COMMENT 'Optional expiration date for this booster';

-- Add index for finding active boosters
CREATE INDEX idx_inventory_activated ON user_inventory(activated_at);
CREATE INDEX idx_inventory_uses ON user_inventory(uses_remaining);
