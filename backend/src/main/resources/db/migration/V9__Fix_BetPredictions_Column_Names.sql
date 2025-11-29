-- Fix bet_predictions table - remove duplicate camelCase columns
-- The table has both camelCase (createdAt, updatedAt) and snake_case (created_at, updated_at) columns
-- Hibernate uses snake_case, so drop the camelCase columns

ALTER TABLE bet_predictions
    DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;
