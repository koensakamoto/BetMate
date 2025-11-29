-- Add DRAW to bet_participations.status ENUM
-- Required for the three-state resolution system (WIN/DRAW/LOSE)

ALTER TABLE bet_participations
MODIFY COLUMN status ENUM('CREATOR', 'ACTIVE', 'WON', 'LOST', 'DRAW', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';
