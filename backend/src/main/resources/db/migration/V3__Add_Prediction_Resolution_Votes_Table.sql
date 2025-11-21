-- Migration V3: Add prediction_resolution_votes table for multi-resolver prediction bet voting
-- Each resolver votes on whether each participant's prediction was correct or incorrect

CREATE TABLE IF NOT EXISTS prediction_resolution_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bet_id BIGINT NOT NULL,
    resolver_id BIGINT NOT NULL,
    participation_id BIGINT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    -- Foreign key constraints
    CONSTRAINT fk_pred_vote_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
    CONSTRAINT fk_pred_vote_resolver FOREIGN KEY (resolver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pred_vote_participation FOREIGN KEY (participation_id) REFERENCES bet_participations(id) ON DELETE CASCADE,

    -- Unique constraint: one vote per resolver per participation
    CONSTRAINT uk_pred_vote_resolver_participation UNIQUE (bet_id, resolver_id, participation_id)
);

-- Indexes for performance
CREATE INDEX idx_pred_vote_bet ON prediction_resolution_votes(bet_id);
CREATE INDEX idx_pred_vote_resolver ON prediction_resolution_votes(resolver_id);
CREATE INDEX idx_pred_vote_participation ON prediction_resolution_votes(participation_id);
CREATE INDEX idx_pred_vote_created ON prediction_resolution_votes(created_at);
CREATE INDEX idx_pred_vote_bet_participation ON prediction_resolution_votes(bet_id, participation_id);
