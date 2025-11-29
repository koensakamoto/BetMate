-- Fix voted_outcome column type back to ENUM (nullable)
-- V10 incorrectly changed it to VARCHAR, but Hibernate expects ENUM

ALTER TABLE bet_resolution_votes
MODIFY COLUMN voted_outcome ENUM('OPTION_1', 'OPTION_2', 'OPTION_3', 'OPTION_4', 'DRAW', 'CANCELLED') NULL;
