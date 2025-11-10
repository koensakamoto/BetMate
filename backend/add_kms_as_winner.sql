-- Add kms (user 2) as a winner to bet 519
-- This allows testing the winner confirmation functionality
-- Since user 2 is the creator, we update the existing CREATOR participation to WON

-- Update the existing CREATOR participation to WON status
UPDATE bet_participations
SET status = 'WON',
    settled_at = NOW()
WHERE bet_id = 519 AND user_id = 2;

-- Get the participation ID
SET @part_kms = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 2 LIMIT 1);

-- Add prediction for kms (predicted "100" which is correct)
INSERT IGNORE INTO bet_predictions (participation_id, predicted_value, actual_value, is_correct, createdAt, updatedAt, created_at, updated_at)
VALUES (@part_kms, '100', '100', TRUE, NOW(), NOW(), NOW(), NOW());

-- Verification: Show updated winners list for bet 519
SELECT
    'Updated Winners List for Bet 519:' AS '';

SELECT
    bp.id AS participation_id,
    u.username,
    u.email,
    bp.status,
    pred.predicted_value,
    pred.is_correct
FROM bet_participations bp
JOIN users u ON bp.user_id = u.id
LEFT JOIN bet_predictions pred ON pred.participation_id = bp.id
WHERE bp.bet_id = 519 AND bp.status = 'WON'
ORDER BY bp.id;
