-- Migration to rename BetResolutionMethod enum values
-- Old values: CREATOR_ONLY, ASSIGNED_RESOLVER, CONSENSUS_VOTING
-- New values: SELF, ASSIGNED_RESOLVERS, PARTICIPANT_VOTE

-- First, alter the column to VARCHAR to allow any string value temporarily
ALTER TABLE bets MODIFY COLUMN resolution_method VARCHAR(50) NOT NULL;

-- Update existing data to use new enum values
UPDATE bets SET resolution_method = 'SELF' WHERE resolution_method = 'CREATOR_ONLY';
UPDATE bets SET resolution_method = 'ASSIGNED_RESOLVERS' WHERE resolution_method = 'ASSIGNED_RESOLVER';
UPDATE bets SET resolution_method = 'PARTICIPANT_VOTE' WHERE resolution_method = 'CONSENSUS_VOTING';
