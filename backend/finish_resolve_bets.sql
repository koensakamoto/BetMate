-- =====================================================
-- Finish Resolving Prediction Bets
-- =====================================================
-- Continue from where we left off - add predictions and resolve
-- =====================================================

-- =====================================================
-- Step 1: Add predictions for bet 519
-- =====================================================

-- Get the participation IDs
SET @part_519_user1 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 1 LIMIT 1);
SET @part_519_user3 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 3 LIMIT 1);
SET @part_519_user4 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 4 LIMIT 1);
SET @part_519_user5 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 5 LIMIT 1);

-- Add predictions (using INSERT IGNORE to avoid duplicates)
INSERT IGNORE INTO bet_predictions (participation_id, predicted_value, actual_value, is_correct, createdAt, updatedAt, created_at, updated_at)
VALUES
(@part_519_user1, '100', '100', TRUE, NOW(), NOW(), NOW(), NOW()),
(@part_519_user3, '100', '100', TRUE, NOW(), NOW(), NOW(), NOW()),
(@part_519_user4, '150', '100', FALSE, NOW(), NOW(), NOW(), NOW()),
(@part_519_user5, '200', '100', FALSE, NOW(), NOW(), NOW(), NOW());

-- =====================================================
-- Step 2: Add participations for bet 520 (Stock bet)
-- =====================================================

INSERT IGNORE INTO bet_participations (user_id, bet_id, chosen_option, bet_amount, potential_winnings, actual_winnings, status, is_active, created_at, updated_at)
VALUES
(1, 520, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
(3, 520, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
(4, 520, 2, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
(5, 520, 2, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW());

-- Get participation IDs for bet 520
SET @part_520_user1 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 1 LIMIT 1);
SET @part_520_user3 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 3 LIMIT 1);
SET @part_520_user4 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 4 LIMIT 1);
SET @part_520_user5 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 5 LIMIT 1);

-- =====================================================
-- Step 3: Resolve both bets
-- =====================================================

-- Resolve bet 519 (Prediction bet)
UPDATE bets
SET status = 'RESOLVED',
    outcome = 'OPTION_1',
    resolved_at = NOW(),
    stake_fulfillment_required = TRUE,
    fulfillment_status = 'PENDING'
WHERE id = 519;

-- Resolve bet 520 (Stock bet - Option 1 wins)
UPDATE bets
SET status = 'RESOLVED',
    outcome = 'OPTION_1',
    resolved_at = NOW(),
    stake_fulfillment_required = TRUE,
    fulfillment_status = 'PENDING'
WHERE id = 520;

-- =====================================================
-- Step 4: Update participation statuses
-- =====================================================

-- Bet 519: Mark winners (users who predicted 100)
UPDATE bet_participations
SET status = 'WON', settled_at = NOW()
WHERE id IN (@part_519_user1, @part_519_user3);

-- Bet 519: Mark losers
UPDATE bet_participations
SET status = 'LOST', settled_at = NOW()
WHERE id IN (@part_519_user4, @part_519_user5);

-- Bet 520: Mark winners (users who chose option 1)
UPDATE bet_participations
SET status = 'WON', settled_at = NOW()
WHERE id IN (@part_520_user1, @part_520_user3);

-- Bet 520: Mark losers (users who chose option 2)
UPDATE bet_participations
SET status = 'LOST', settled_at = NOW()
WHERE id IN (@part_520_user4, @part_520_user5);

-- =====================================================
-- Verification: Show results
-- =====================================================

SELECT 'BET 519 RESULTS:' AS '';

SELECT
    b.id AS bet_id,
    b.title,
    b.status,
    b.outcome,
    b.fulfillment_status,
    u.username,
    bp.status AS participation_status,
    pred.predicted_value,
    pred.actual_value,
    pred.is_correct
FROM bets b
JOIN bet_participations bp ON b.id = bp.bet_id
JOIN users u ON bp.user_id = u.id
LEFT JOIN bet_predictions pred ON pred.participation_id = bp.id
WHERE b.id = 519 AND bp.status != 'CREATOR'
ORDER BY bp.status DESC, u.username;

SELECT 'BET 520 RESULTS:' AS '';

SELECT
    b.id AS bet_id,
    b.title,
    b.status,
    b.outcome,
    b.fulfillment_status,
    u.username,
    bp.chosen_option,
    CASE WHEN bp.chosen_option = 1 THEN b.option1 ELSE b.option2 END AS chosen_stock,
    bp.status AS participation_status
FROM bets b
JOIN bet_participations bp ON b.id = bp.bet_id
JOIN users u ON bp.user_id = u.id
WHERE b.id = 520 AND bp.status != 'CREATOR'
ORDER BY bp.status DESC, u.username;
