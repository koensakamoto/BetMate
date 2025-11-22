-- Migration V4: Add loser_fulfillment_claims table for per-loser fulfillment tracking
-- This enables each loser to individually claim they fulfilled their stake with proof

CREATE TABLE IF NOT EXISTS loser_fulfillment_claims (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bet_id BIGINT NOT NULL,
    loser_id BIGINT NOT NULL,
    claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    proof_url VARCHAR(500),
    proof_description TEXT,
    CONSTRAINT fk_loser_claim_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
    CONSTRAINT fk_loser_claim_user FOREIGN KEY (loser_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_bet_loser_claim UNIQUE (bet_id, loser_id)
);

-- Index for efficient lookups by bet
CREATE INDEX idx_loser_claims_bet_id ON loser_fulfillment_claims(bet_id);
