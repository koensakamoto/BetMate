-- Migration: Remove autoApproveMembers column from groups table
-- Date: 2025-01-11
-- Description: Removing autoApproveMembers field as join method is now determined by privacy level

ALTER TABLE `groups` DROP COLUMN IF EXISTS autoApproveMembers;
