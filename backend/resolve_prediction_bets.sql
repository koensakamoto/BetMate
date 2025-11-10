-- =====================================================
-- Resolve Prediction Bets in Group "Newg"
-- =====================================================
-- This script:
-- 1. Adds participations for both prediction bets
-- 2. For bet 519 (PREDICTION): Adds predictions with actual values
-- 3. For bet 520 (MULTIPLE_CHOICE): Adds option choices
-- 4. Resolves both bets with outcomes
-- 5. Updates participations to show winners/losers
-- 6. Enables fulfillment tracking
-- =====================================================

-- =====================================================
-- BET 519: "Prediction bet 1" (PREDICTION type)
-- Social stake: "Loser pays for winners coffees"
-- =====================================================

-- Add participations for bet 519
-- Winners: testuser123 (1), biotest (3) - both predict "100"
-- Losers: alex_gamer (4), sarah_bet (5) - predict different values

INSERT INTO bet_participations (user_id, bet_id, chosen_option, bet_amount, potential_winnings, actual_winnings, status, is_active, created_at, updated_at)
VALUES
-- testuser123 predicts (WINNER)
(1, 519, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- biotest predicts (WINNER)
(3, 519, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- alex_gamer predicts (LOSER)
(4, 519, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- sarah_bet predicts (LOSER)
(5, 519, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW());

-- Get the participation IDs we just inserted
SET @part_519_user1 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 1 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_519_user3 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 3 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_519_user4 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 4 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_519_user5 = (SELECT id FROM bet_participations WHERE bet_id = 519 AND user_id = 5 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);

-- Add predictions for bet 519
INSERT INTO bet_predictions (participation_id, predicted_value, actual_value, is_correct, createdAt, updatedAt, created_at, updated_at)
VALUES
-- testuser123: predicts "100" (CORRECT)
(@part_519_user1, '100', '100', TRUE, NOW(), NOW(), NOW(), NOW()),
-- biotest: predicts "100" (CORRECT)
(@part_519_user3, '100', '100', TRUE, NOW(), NOW(), NOW(), NOW()),
-- alex_gamer: predicts "150" (INCORRECT)
(@part_519_user4, '150', '100', FALSE, NOW(), NOW(), NOW(), NOW()),
-- sarah_bet: predicts "200" (INCORRECT)
(@part_519_user5, '200', '100', FALSE, NOW(), NOW(), NOW(), NOW());

-- Resolve bet 519 with OPTION_1 as winner (using option 1 to mark prediction winners)
UPDATE bets
SET status = 'RESOLVED',
    outcome = 'OPTION_1',
    resolved_at = NOW(),
    stake_fulfillment_required = TRUE,
    fulfillment_status = 'PENDING'
WHERE id = 519;

-- Update participations for bet 519: Mark winners and losers
UPDATE bet_participations
SET status = 'WON', settled_at = NOW()
WHERE id IN (@part_519_user1, @part_519_user3);

UPDATE bet_participations
SET status = 'LOST', settled_at = NOW()
WHERE id IN (@part_519_user4, @part_519_user5);

-- =====================================================
-- BET 520: "Prediction bet 2" (MULTIPLE_CHOICE type)
-- Social stake: "Losers have to jump in cold pool"
-- Options: Stock 1 (option 1) vs Stock 2 (option 2)
-- =====================================================

-- Add participations for bet 520
-- Winners: testuser123 (1), biotest (3) - choose Stock 1
-- Losers: alex_gamer (4), sarah_bet (5) - choose Stock 2

INSERT INTO bet_participations (user_id, bet_id, chosen_option, bet_amount, potential_winnings, actual_winnings, status, is_active, created_at, updated_at)
VALUES
-- testuser123 chooses Stock 1 (WINNER)
(1, 520, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- biotest chooses Stock 1 (WINNER)
(3, 520, 1, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- alex_gamer chooses Stock 2 (LOSER)
(4, 520, 2, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW()),
-- sarah_bet chooses Stock 2 (LOSER)
(5, 520, 2, 0.00, 0.00, 0.00, 'ACTIVE', 1, NOW(), NOW());

-- Get the participation IDs we just inserted
SET @part_520_user1 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 1 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_520_user3 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 3 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_520_user4 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 4 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);
SET @part_520_user5 = (SELECT id FROM bet_participations WHERE bet_id = 520 AND user_id = 5 AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1);

-- Resolve bet 520 with OPTION_1 as winner (Stock 1 wins)
UPDATE bets
SET status = 'RESOLVED',
    outcome = 'OPTION_1',
    resolved_at = NOW(),
    stake_fulfillment_required = TRUE,
    fulfillment_status = 'PENDING'
WHERE id = 520;

-- Update participations for bet 520: Mark winners and losers
UPDATE bet_participations
SET status = 'WON', settled_at = NOW()
WHERE id IN (@part_520_user1, @part_520_user3);

UPDATE bet_participations
SET status = 'LOST', settled_at = NOW()
WHERE id IN (@part_520_user4, @part_520_user5);

-- =====================================================
-- Verification Queries
-- =====================================================

-- View bet 519 with participations
SELECT
    b.id AS bet_id,
    b.title,
    b.bet_type,
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
WHERE b.id = 519
ORDER BY bp.status DESC, u.username;

-- View bet 520 with participations
SELECT
    b.id AS bet_id,
    b.title,
    b.bet_type,
    b.status,
    b.outcome,
    b.option1,
    b.option2,
    b.fulfillment_status,
    u.username,
    bp.chosen_option,
    bp.status AS participation_status
FROM bets b
JOIN bet_participations bp ON b.id = bp.bet_id
JOIN users u ON bp.user_id = u.id
WHERE b.id = 520
ORDER BY bp.status DESC, u.username;
