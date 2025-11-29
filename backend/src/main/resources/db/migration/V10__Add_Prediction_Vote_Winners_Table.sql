-- Add table for storing winner selections in PREDICTION bet resolution votes
-- Each resolver can select multiple winners, stored via this join table

CREATE TABLE bet_resolution_vote_winners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vote_id BIGINT NOT NULL,
    winner_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vote_winner_vote FOREIGN KEY (vote_id) REFERENCES bet_resolution_votes(id) ON DELETE CASCADE,
    CONSTRAINT fk_vote_winner_user FOREIGN KEY (winner_user_id) REFERENCES users(id),
    CONSTRAINT unique_vote_winner UNIQUE (vote_id, winner_user_id)
);

CREATE INDEX idx_vote_winners_vote ON bet_resolution_vote_winners(vote_id);
CREATE INDEX idx_vote_winners_user ON bet_resolution_vote_winners(winner_user_id);

-- Make voted_outcome nullable (PREDICTION bets use winner votes instead of outcome)
ALTER TABLE bet_resolution_votes MODIFY COLUMN voted_outcome VARCHAR(255) NULL;
