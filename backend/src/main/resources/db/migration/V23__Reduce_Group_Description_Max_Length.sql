-- Reduce group description max length from 1000 to 200 characters
-- This aligns frontend and backend validation constraints

-- First, truncate any existing descriptions that exceed 200 characters
UPDATE `groups`
SET description = LEFT(description, 200)
WHERE LENGTH(description) > 200;

-- Now safely alter the column length
ALTER TABLE `groups` MODIFY COLUMN description VARCHAR(200);
