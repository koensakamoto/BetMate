-- Reduce user bio max length from 500 to 150 characters
-- This aligns frontend and backend validation constraints

-- First, truncate any existing bios that exceed 150 characters
UPDATE users
SET bio = LEFT(bio, 150)
WHERE LENGTH(bio) > 150;

-- Now safely alter the column length
ALTER TABLE users MODIFY COLUMN bio VARCHAR(150);
