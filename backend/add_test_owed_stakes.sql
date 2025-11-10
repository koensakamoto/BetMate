-- SQL script to add unfulfilled social bets for testing the Owed Stakes tab
-- User email: koensakamoto6@gmail.com

-- Get user ID (will use this in subsequent queries)
SET @user_id = (SELECT id FROM users WHERE email = 'koensakamoto6@gmail.com' LIMIT 1);

-- Get a group ID that the user is part of (any group they're in)
SET @group_id = (SELECT gm.group_id FROM group_memberships gm WHERE gm.user_id = @user_id AND gm.is_active = TRUE LIMIT 1);

-- If no variables found, show error message
SELECT CASE
    WHEN @user_id IS NULL THEN 'ERROR: User not found with email koensakamoto6@gmail.com'
    WHEN @group_id IS NULL THEN 'ERROR: User is not part of any group'
    ELSE CONCAT('Found user_id: ', @user_id, ', group_id: ', @group_id)
END AS status_message;

-- Create test bet 1: "Who will finish the project first?" - Loser buys lunch
INSERT INTO bets (
    title,
    description,
    bet_type,
    status,
    resolution_method,
    creator_id,
    group_id,
    betting_deadline,
    resolve_date,
    stake_type,
    social_stake_description,
    stake_fulfillment_required,
    fulfillment_status,
    minimum_bet,
    total_pool,
    total_participants,
    minimum_votes_required,
    allow_creator_vote,
    is_active,
    option1,
    option2,
    participants_for_option1,
    participants_for_option2,
    created_at,
    updated_at,
    resolved_at
) VALUES (
    'Who will finish the project first?',
    'The loser has to buy lunch for everyone',
    'PREDICTION',
    'RESOLVED',
    'CREATOR_ONLY',
    @user_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    'SOCIAL',
    'Loser buys lunch for the group',
    true,
    'PENDING',
    0,
    0,
    1,
    0,
    true,
    true,
    '',
    '',
    0,
    0,
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY)
);

SET @bet1_id = LAST_INSERT_ID();

-- Add participation for user (they lost)
INSERT INTO bet_participations (
    bet_id,
    user_id,
    chosen_option,
    bet_amount,
    potential_winnings,
    status,
    is_active,
    created_at,
    updated_at
) VALUES (
    @bet1_id,
    @user_id,
    0,
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 9 DAY),
    DATE_SUB(NOW(), INTERVAL 9 DAY)
);

-- Create test bet 2: "Will it rain tomorrow?" - Loser does dishes for a week
INSERT INTO bets (
    title,
    description,
    bet_type,
    status,
    outcome,
    resolution_method,
    creator_id,
    group_id,
    betting_deadline,
    resolve_date,
    stake_type,
    social_stake_description,
    stake_fulfillment_required,
    fulfillment_status,
    minimum_bet,
    total_pool,
    total_participants,
    minimum_votes_required,
    allow_creator_vote,
    is_active,
    option1,
    option2,
    participants_for_option1,
    participants_for_option2,
    created_at,
    updated_at,
    resolved_at
) VALUES (
    'Will it rain tomorrow?',
    'Simple yes or no bet about tomorrow''s weather',
    'MULTIPLE_CHOICE',
    'RESOLVED',
    'OPTION_1',
    'CREATOR_ONLY',
    @user_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    'SOCIAL',
    'Loser does dishes for a week',
    true,
    'PENDING',
    0,
    0,
    1,
    0,
    true,
    true,
    'Yes',
    'No',
    0,
    1,
    DATE_SUB(NOW(), INTERVAL 6 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);

SET @bet2_id = LAST_INSERT_ID();

-- Add participation for user (they lost)
INSERT INTO bet_participations (
    bet_id,
    user_id,
    chosen_option,
    bet_amount,
    potential_winnings,
    status,
    is_active,
    created_at,
    updated_at
) VALUES (
    @bet2_id,
    @user_id,
    1,
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY)
);

-- Create test bet 3: "Who can do more pushups?" - Loser buys coffee for a month
INSERT INTO bets (
    title,
    description,
    bet_type,
    status,
    resolution_method,
    creator_id,
    group_id,
    betting_deadline,
    resolve_date,
    stake_type,
    social_stake_description,
    stake_fulfillment_required,
    fulfillment_status,
    minimum_bet,
    total_pool,
    total_participants,
    minimum_votes_required,
    allow_creator_vote,
    is_active,
    option1,
    option2,
    participants_for_option1,
    participants_for_option2,
    created_at,
    updated_at,
    resolved_at
) VALUES (
    'Who can do more pushups?',
    'Physical challenge bet',
    'PREDICTION',
    'RESOLVED',
    'CREATOR_ONLY',
    @user_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    NOW(),
    'SOCIAL',
    'Loser buys coffee for a month',
    true,
    'PARTIALLY_FULFILLED',
    0,
    0,
    1,
    0,
    true,
    true,
    '',
    '',
    0,
    0,
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    NOW(),
    NOW()
);

SET @bet3_id = LAST_INSERT_ID();

-- Add participation for user (they lost)
INSERT INTO bet_participations (
    bet_id,
    user_id,
    chosen_option,
    bet_amount,
    potential_winnings,
    status,
    is_active,
    created_at,
    updated_at
) VALUES (
    @bet3_id,
    @user_id,
    0,
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- Show summary of created bets
SELECT
    'Created 3 test bets for owed stakes!' AS summary,
    COUNT(*) AS total_bets
FROM bets
WHERE creator_id = @user_id
    AND status = 'RESOLVED'
    AND stake_type = 'SOCIAL'
    AND fulfillment_status IN ('PENDING', 'PARTIALLY_FULFILLED');
