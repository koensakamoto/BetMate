-- Add loser_fulfillment_proof_description column to bets table
ALTER TABLE bets
ADD COLUMN loser_fulfillment_proof_description VARCHAR(500) NULL;
