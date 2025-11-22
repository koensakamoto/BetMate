-- Rename creator_id column to owner_id in groups table
-- This reflects the terminology change from "creator" to "owner"

-- Rename the column
ALTER TABLE `groups` CHANGE COLUMN creator_id owner_id BIGINT NOT NULL;

-- Drop old index and create new one with updated name
ALTER TABLE `groups` DROP INDEX idx_group_creator;
ALTER TABLE `groups` ADD INDEX idx_group_owner (owner_id);
