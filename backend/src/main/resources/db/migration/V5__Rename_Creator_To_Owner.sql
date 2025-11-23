-- Rename creator_id column to owner_id in groups table
-- This reflects the terminology change from "creator" to "owner"

-- First, find and drop the foreign key constraint on creator_id
-- The constraint name may vary, so we use a procedure to find it
SET @fk_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'groups'
    AND COLUMN_NAME = 'creator_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL,
    CONCAT('ALTER TABLE `groups` DROP FOREIGN KEY ', @fk_name),
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_group_creator ON `groups`;

-- Rename the column (this preserves the data)
ALTER TABLE `groups` CHANGE COLUMN creator_id owner_id BIGINT NOT NULL;

-- Add the new index
ALTER TABLE `groups` ADD INDEX idx_group_owner (owner_id);

-- Re-add the foreign key constraint with new column name
ALTER TABLE `groups` ADD CONSTRAINT fk_group_owner FOREIGN KEY (owner_id) REFERENCES users(id);
