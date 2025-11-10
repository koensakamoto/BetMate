-- Social Bet Test Data
-- This script adds sample social bets with different fulfillment states

-- Create a test social bet that's OPEN (can join)
INSERT INTO bets (
    title, description, bet_type, status, resolution_method,
    creator_id, group_id, betting_deadline, resolve_date,
    stake_type, social_stake_description, stake_fulfillment_required, fulfillment_status,
    minimum_bet, total_pool, total_participants,
    minimum_votes_required, allow_creator_vote, is_active,
    option1, option2,
    created_at, updated_at
) VALUES (
    'Who will win the Lakers vs Warriors game?',
    'Predict the winner of tonight''s big game!',
    'MULTIPLE_CHOICE', 'OPEN', 'CREATOR_ONLY',
    1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
    'SOCIAL', 'Loser buys pizza for the group', true, 'PENDING',
    0, 0, 0,
    0, true, true,
    'Lakers', 'Warriors',
    NOW(), NOW()
);
SET @bet1_id = LAST_INSERT_ID();

-- Add options for the first bet
INSERT INTO bet_options (bet_id, option_text, option_order, created_at, updated_at)
VALUES
    (@bet1_id, 'Lakers', 1, NOW(), NOW()),
    (@bet1_id, 'Warriors', 2, NOW(), NOW());

-- Create a RESOLVED social bet with PENDING fulfillment (no confirmations yet)
INSERT INTO bets (
    title, description, bet_type, status, outcome, resolution_method,
    creator_id, group_id, betting_deadline, resolve_date, resolved_at,
    stake_type, social_stake_description, stake_fulfillment_required, fulfillment_status,
    minimum_bet, total_pool, total_participants,
    minimum_votes_required, allow_creator_vote,
    created_at, updated_at
) VALUES (
    'Will it rain this weekend?',
    'Predict if we''ll get rain on Saturday or Sunday',
    'MULTIPLE_CHOICE', 'RESOLVED', 'Yes', 'CREATOR_ONLY',
    1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 6 HOUR),
    'SOCIAL', 'Loser makes breakfast for everyone', true, 'PENDING',
    0, 0, 3,
    0, true,
    DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()
);
SET @bet2_id = LAST_INSERT_ID();

-- Add options for the second bet
INSERT INTO bet_options (bet_id, option_text, option_order, created_at, updated_at)
VALUES
    (@bet2_id, 'Yes', 1, NOW(), NOW()),
    (@bet2_id, 'No', 2, NOW(), NOW());

-- Add participations for bet 2 (user 1 and 2 won, user 3 lost)
INSERT INTO bet_participations (bet_id, user_id, chosen_option, bet_amount, status, created_at, updated_at)
VALUES
    (@bet2_id, 1, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
    (@bet2_id, 2, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
    (@bet2_id, 3, 2, 0, 'LOST', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());

-- Create a RESOLVED social bet with PARTIALLY_FULFILLED status (one winner confirmed)
INSERT INTO bets (
    title, description, bet_type, status, outcome, resolution_method,
    creator_id, group_id, betting_deadline, resolve_date, resolved_at,
    stake_type, social_stake_description, stake_fulfillment_required, fulfillment_status,
    loser_claimed_fulfilled_at,
    minimum_bet, total_pool, total_participants,
    minimum_votes_required, allow_creator_vote,
    created_at, updated_at
) VALUES (
    'Who can do the most push-ups?',
    'Challenge to see who has the strongest arms!',
    'PREDICTION', 'RESOLVED', 'User 1', 'CREATOR_ONLY',
    2, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
    'SOCIAL', 'Loser does 50 burpees', true, 'PARTIALLY_FULFILLED',
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    0, 0, 3,
    0, true,
    DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()
);
SET @bet3_id = LAST_INSERT_ID();

-- Add participations for bet 3 (user 1 and 2 won, user 3 lost)
INSERT INTO bet_participations (bet_id, user_id, bet_amount, status, created_at, updated_at)
VALUES
    (@bet3_id, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
    (@bet3_id, 2, 0, 'WON', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
    (@bet3_id, 3, 0, 'LOST', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW());

-- Add one fulfillment confirmation for bet 3 (only user 1 confirmed)
INSERT INTO bet_fulfillments (bet_id, winner_id, confirmed_at, notes)
VALUES (@bet3_id, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Confirmed! Thanks!');

-- Create a RESOLVED social bet with FULFILLED status (all winners confirmed)
INSERT INTO bets (
    title, description, bet_type, status, outcome, resolution_method,
    creator_id, group_id, betting_deadline, resolve_date, resolved_at,
    stake_type, social_stake_description, stake_fulfillment_required, fulfillment_status,
    loser_claimed_fulfilled_at, all_winners_confirmed_at,
    minimum_bet, total_pool, total_participants,
    minimum_votes_required, allow_creator_vote,
    created_at, updated_at
) VALUES (
    'Best Halloween costume competition',
    'Vote for the best Halloween costume in our group!',
    'MULTIPLE_CHOICE', 'RESOLVED', 'User 2 - Zombie', 'CONSENSUS_VOTING',
    1, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY),
    'SOCIAL', 'Loser brings drinks to next party', true, 'FULFILLED',
    DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY),
    0, 0, 3,
    2, false,
    DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()
);
SET @bet4_id = LAST_INSERT_ID();

-- Add options for the fourth bet
INSERT INTO bet_options (bet_id, option_text, option_order, created_at, updated_at)
VALUES
    (@bet4_id, 'User 1 - Vampire', 1, NOW(), NOW()),
    (@bet4_id, 'User 2 - Zombie', 2, NOW(), NOW()),
    (@bet4_id, 'User 3 - Witch', 3, NOW(), NOW());

-- Add participations for bet 4 (user 2 won, users 1 and 3 lost)
INSERT INTO bet_participations (bet_id, user_id, chosen_option, bet_amount, status, created_at, updated_at)
VALUES
    (@bet4_id, 1, 1, 0, 'LOST', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
    (@bet4_id, 2, 2, 0, 'WON', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
    (@bet4_id, 3, 3, 0, 'LOST', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW());

-- Add fulfillment confirmation for bet 4 (user 2 confirmed - the only winner)
INSERT INTO bet_fulfillments (bet_id, winner_id, confirmed_at, notes)
VALUES (@bet4_id, 2, DATE_SUB(NOW(), INTERVAL 6 DAY), 'Got the drinks, thanks!');

-- Create another RESOLVED social bet with multiple winners and PARTIALLY_FULFILLED
INSERT INTO bets (
    title, description, bet_type, status, outcome, resolution_method,
    creator_id, group_id, betting_deadline, resolve_date, resolved_at,
    stake_type, social_stake_description, stake_fulfillment_required, fulfillment_status,
    minimum_bet, total_pool, total_participants,
    minimum_votes_required, allow_creator_vote,
    created_at, updated_at
) VALUES (
    'Stock market prediction: Will AAPL hit $200?',
    'Predict if Apple stock will reach $200 this month',
    'MULTIPLE_CHOICE', 'RESOLVED', 'Yes', 'CREATOR_ONLY',
    1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
    'SOCIAL', 'Loser buys coffee for winners for a week', true, 'PARTIALLY_FULFILLED',
    0, 0, 4,
    0, true,
    DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()
);
SET @bet5_id = LAST_INSERT_ID();

-- Add options for the fifth bet
INSERT INTO bet_options (bet_id, option_text, option_order, created_at, updated_at)
VALUES
    (@bet5_id, 'Yes', 1, NOW(), NOW()),
    (@bet5_id, 'No', 2, NOW(), NOW());

-- Add participations for bet 5 (users 1, 2, 3 won, user 4 lost)
INSERT INTO bet_participations (bet_id, user_id, chosen_option, bet_amount, status, created_at, updated_at)
VALUES
    (@bet5_id, 1, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
    (@bet5_id, 2, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
    (@bet5_id, 3, 1, 0, 'WON', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
    (@bet5_id, 4, 2, 0, 'LOST', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW());

-- Add partial fulfillment confirmations for bet 5 (2 out of 3 winners confirmed)
INSERT INTO bet_fulfillments (bet_id, winner_id, confirmed_at, notes)
VALUES
    (@bet5_id, 1, DATE_SUB(NOW(), INTERVAL 12 HOUR), 'Enjoyed my coffee!'),
    (@bet5_id, 2, DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL);
