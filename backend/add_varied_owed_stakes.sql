-- SQL script to add varied owed stakes (To-Do, Waiting, Completed) for testing
-- User email: koensakamoto6@gmail.com

-- Get user ID
SET @user_id = (SELECT id FROM users WHERE email = 'koensakamoto6@gmail.com' LIMIT 1);

-- Get a group ID that the user is part of
SET @group_id = (SELECT gm.group_id FROM group_memberships gm WHERE gm.user_id = @user_id AND gm.is_active = TRUE LIMIT 1);

-- Get another user from the same group to be the winner
SET @winner_id = (SELECT gm.user_id FROM group_memberships gm
                  WHERE gm.group_id = @group_id
                  AND gm.user_id != @user_id
                  AND gm.is_active = TRUE
                  LIMIT 1);

-- If no variables found, show error message
SELECT CASE
    WHEN @user_id IS NULL THEN 'ERROR: User not found'
    WHEN @group_id IS NULL THEN 'ERROR: User is not part of any group'
    WHEN @winner_id IS NULL THEN 'ERROR: No other users in group'
    ELSE CONCAT('Found user_id: ', @winner_id, ', group_id: ', @group_id, ', winner_id: ', @winner_id)
END AS status_message;

-- ============================================
-- TO-DO STAKES (User lost, PENDING status)
-- ============================================

-- To-Do #1: "Movie marathon bet" - User needs to organize movie night
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
    'Who will win the championship?',
    'Prediction about championship winner',
    'MULTIPLE_CHOICE',
    'RESOLVED',
    'OPTION_1',
    'CREATOR_ONLY',
    @user_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'SOCIAL',
    'Loser organizes movie night for the group',
    true,
    'PENDING',
    0,
    0,
    2,
    0,
    true,
    true,
    'Team A',
    'Team B',
    1,
    1,
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

SET @bet1_id = LAST_INSERT_ID();

-- User chose wrong option (OPTION_2) - they lost
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
    1, -- OPTION_2
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- Winner participation
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
    @winner_id,
    0, -- OPTION_1 (correct)
    0,
    0,
    'WON',
    true,
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- To-Do #2: "Workout challenge" - User needs to buy protein shakes
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
    'Who can run 5K faster?',
    'Fitness challenge',
    'PREDICTION',
    'RESOLVED',
    'OPTION_1',
    'CREATOR_ONLY',
    @winner_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'SOCIAL',
    'Loser buys protein shakes for everyone',
    true,
    'PENDING',
    0,
    0,
    2,
    0,
    true,
    true,
    '',
    '',
    0,
    0,
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

SET @bet2_id = LAST_INSERT_ID();

-- User lost
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
    0,
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- Winner participation
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
    @winner_id,
    0,
    0,
    0,
    'WON',
    true,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- ============================================
-- COMPLETED STAKES (FULFILLED status)
-- ============================================

-- Completed #1: "Pizza bet" - Already fulfilled
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
    loser_claimed_fulfilled_at,
    all_winners_confirmed_at,
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
    'Pizza toppings debate',
    'What is the best pizza topping?',
    'MULTIPLE_CHOICE',
    'RESOLVED',
    'OPTION_1',
    'CREATOR_ONLY',
    @winner_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    'SOCIAL',
    'Loser buys pizza for the group',
    true,
    'FULFILLED',
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    0,
    0,
    2,
    0,
    true,
    true,
    'Pineapple',
    'Pepperoni',
    1,
    1,
    DATE_SUB(NOW(), INTERVAL 12 DAY),
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
);

SET @bet3_id = LAST_INSERT_ID();

-- User lost this one
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
    1, -- Wrong choice
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 11 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
);

-- Winner participation with confirmation
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
    @winner_id,
    0, -- Correct choice
    0,
    0,
    'WON',
    true,
    DATE_SUB(NOW(), INTERVAL 11 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
);

-- Add winner confirmation
INSERT INTO bet_fulfillments (
    bet_id,
    winner_id,
    confirmed_at
) VALUES (
    @bet3_id,
    @winner_id,
    DATE_SUB(NOW(), INTERVAL 4 DAY)
);

-- Completed #2: "Game night bet" - Already fulfilled
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
    loser_claimed_fulfilled_at,
    all_winners_confirmed_at,
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
    'Board game championship',
    'Who will win the board game tournament?',
    'PREDICTION',
    'RESOLVED',
    'OPTION_1',
    'CREATOR_ONLY',
    @user_id,
    @group_id,
    DATE_SUB(NOW(), INTERVAL 8 DAY),
    DATE_SUB(NOW(), INTERVAL 6 DAY),
    'SOCIAL',
    'Loser brings snacks to next game night',
    true,
    'FULFILLED',
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    0,
    0,
    2,
    0,
    true,
    true,
    '',
    '',
    0,
    0,
    DATE_SUB(NOW(), INTERVAL 9 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 6 DAY)
);

SET @bet4_id = LAST_INSERT_ID();

-- User lost
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
    @bet4_id,
    @user_id,
    0,
    0,
    0,
    'LOST',
    true,
    DATE_SUB(NOW(), INTERVAL 8 DAY),
    DATE_SUB(NOW(), INTERVAL 6 DAY)
);

-- Winner participation
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
    @bet4_id,
    @winner_id,
    0,
    0,
    0,
    'WON',
    true,
    DATE_SUB(NOW(), INTERVAL 8 DAY),
    DATE_SUB(NOW(), INTERVAL 6 DAY)
);

-- Add winner confirmation
INSERT INTO bet_fulfillments (
    bet_id,
    winner_id,
    confirmed_at
) VALUES (
    @bet4_id,
    @winner_id,
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);

-- Show summary
SELECT
    'Created test owed stakes!' AS summary,
    COUNT(*) AS total_bets
FROM bets
WHERE creator_id = @user_id
    AND status = 'RESOLVED'
    AND stake_type = 'SOCIAL';

-- Show breakdown by status
SELECT
    fulfillment_status,
    COUNT(*) as count
FROM bets
WHERE creator_id = @user_id
    AND status = 'RESOLVED'
    AND stake_type = 'SOCIAL'
    AND fulfillment_status IN ('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED')
GROUP BY fulfillment_status;
