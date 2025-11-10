-- Add winner confirmations for testuser123 and biotest on bet 519
-- This will show what happens when winners confirm receipt of stake

-- Add fulfillment confirmations for testuser123 (user_id=1) and biotest (user_id=3)
INSERT INTO bet_fulfillments (bet_id, winner_id, confirmed_at, notes)
VALUES
(519, 1, NOW(), 'Winner confirmed receipt of stake'),
(519, 3, NOW(), 'Winner confirmed receipt of stake')
ON DUPLICATE KEY UPDATE
confirmed_at = NOW(),
notes = 'Winner confirmed receipt of stake';

-- Verification: Show all fulfillment confirmations for bet 519
SELECT
    'Fulfillment Status for Bet 519:' AS '';

SELECT
    bf.id,
    bf.bet_id,
    u.username,
    u.email,
    bf.confirmed_at,
    bf.notes
FROM bet_fulfillments bf
JOIN users u ON bf.winner_id = u.id
WHERE bf.bet_id = 519
ORDER BY bf.confirmed_at;

-- Show winner confirmation progress
SELECT
    'Winner Confirmation Progress:' AS '';

SELECT
    COUNT(bf.id) AS confirmed_count,
    COUNT(DISTINCT bp.id) AS total_winners,
    CASE
        WHEN COUNT(bf.id) = COUNT(DISTINCT bp.id) THEN 'FULFILLED'
        WHEN COUNT(bf.id) > 0 THEN 'PARTIALLY_FULFILLED'
        ELSE 'PENDING'
    END AS fulfillment_status
FROM bet_participations bp
LEFT JOIN bet_fulfillments bf ON bp.bet_id = bf.bet_id AND bp.user_id = bf.winner_id
WHERE bp.bet_id = 519 AND bp.status = 'WON';
