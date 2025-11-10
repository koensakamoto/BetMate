-- ============================================
-- Fix User Statistics Script (Simplified Streak Calculation)
-- ============================================
-- This script recalculates user statistics based on actual bet participation data
-- to fix the issue where mock data created random statistics that don't match reality.
--
-- Usage: Run this script against your database to sync all user statistics.
--

-- Step 1: Create a temporary table with correct win/loss/active counts
DROP TEMPORARY TABLE IF EXISTS user_stats_correct;

CREATE TEMPORARY TABLE user_stats_correct AS
SELECT
    u.id AS user_id,
    COALESCE(wins.win_count, 0) AS correct_win_count,
    COALESCE(losses.loss_count, 0) AS correct_loss_count,
    COALESCE(active.active_count, 0) AS correct_active_bets,
    u.win_count AS old_win_count,
    u.loss_count AS old_loss_count,
    u.active_bets AS old_active_bets,
    u.current_streak AS old_current_streak,
    u.longest_streak AS old_longest_streak
FROM users u
-- Count wins
LEFT JOIN (
    SELECT user_id, COUNT(*) AS win_count
    FROM bet_participations
    WHERE status = 'WON' AND is_active = 1
    GROUP BY user_id
) wins ON u.id = wins.user_id
-- Count losses
LEFT JOIN (
    SELECT user_id, COUNT(*) AS loss_count
    FROM bet_participations
    WHERE status = 'LOST' AND is_active = 1
    GROUP BY user_id
) losses ON u.id = losses.user_id
-- Count active bets
LEFT JOIN (
    SELECT user_id, COUNT(*) AS active_count
    FROM bet_participations
    WHERE status = 'ACTIVE' AND is_active = 1
    GROUP BY user_id
) active ON u.id = active.user_id
WHERE u.deleted_at IS NULL;

-- Step 2: Add streak columns
ALTER TABLE user_stats_correct
    ADD COLUMN correct_current_streak INT DEFAULT 0,
    ADD COLUMN correct_longest_streak INT DEFAULT 0;

-- Step 3: Calculate streaks using a stored procedure
DROP PROCEDURE IF EXISTS calculate_user_streaks;

DELIMITER //

CREATE PROCEDURE calculate_user_streaks()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id BIGINT;
    DECLARE v_current_streak INT DEFAULT 0;
    DECLARE v_longest_streak INT DEFAULT 0;
    DECLARE v_temp_streak INT DEFAULT 0;
    DECLARE v_status VARCHAR(50);

    -- Cursor for all users
    DECLARE user_cursor CURSOR FOR
        SELECT user_id FROM user_stats_correct;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN user_cursor;

    user_loop: LOOP
        FETCH user_cursor INTO v_user_id;
        IF done THEN
            LEAVE user_loop;
        END IF;

        -- Reset streak variables for this user
        SET v_current_streak = 0;
        SET v_longest_streak = 0;
        SET v_temp_streak = 0;

        -- Calculate longest streak by going through all bets chronologically
        BEGIN
            DECLARE bet_done INT DEFAULT FALSE;
            DECLARE bet_cursor CURSOR FOR
                SELECT status
                FROM bet_participations
                WHERE user_id = v_user_id
                    AND status IN ('WON', 'LOST')
                    AND is_active = 1
                ORDER BY COALESCE(settled_at, updated_at) ASC;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET bet_done = TRUE;

            OPEN bet_cursor;

            bet_loop: LOOP
                FETCH bet_cursor INTO v_status;
                IF bet_done THEN
                    LEAVE bet_loop;
                END IF;

                IF v_status = 'WON' THEN
                    SET v_temp_streak = v_temp_streak + 1;
                    IF v_temp_streak > v_longest_streak THEN
                        SET v_longest_streak = v_temp_streak;
                    END IF;
                ELSE
                    SET v_temp_streak = 0;
                END IF;
            END LOOP;

            CLOSE bet_cursor;
        END;

        -- Calculate current streak (count consecutive wins from most recent)
        BEGIN
            DECLARE current_done INT DEFAULT FALSE;
            DECLARE current_cursor CURSOR FOR
                SELECT status
                FROM bet_participations
                WHERE user_id = v_user_id
                    AND status IN ('WON', 'LOST')
                    AND is_active = 1
                ORDER BY COALESCE(settled_at, updated_at) DESC;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET current_done = TRUE;

            OPEN current_cursor;

            current_loop: LOOP
                FETCH current_cursor INTO v_status;
                IF current_done THEN
                    LEAVE current_loop;
                END IF;

                IF v_status = 'WON' THEN
                    SET v_current_streak = v_current_streak + 1;
                ELSE
                    -- Hit a loss, stop counting
                    LEAVE current_loop;
                END IF;
            END LOOP;

            CLOSE current_cursor;
        END;

        -- Update the stats table with calculated streaks
        UPDATE user_stats_correct
        SET correct_current_streak = v_current_streak,
            correct_longest_streak = v_longest_streak
        WHERE user_id = v_user_id;

    END LOOP;

    CLOSE user_cursor;
END//

DELIMITER ;

-- Step 4: Execute the procedure
CALL calculate_user_streaks();

-- Step 5: Show summary of changes that will be made
SELECT
    'SUMMARY OF CHANGES' AS info,
    COUNT(*) AS total_users,
    SUM(CASE WHEN correct_win_count != old_win_count THEN 1 ELSE 0 END) AS users_with_win_count_changes,
    SUM(CASE WHEN correct_loss_count != old_loss_count THEN 1 ELSE 0 END) AS users_with_loss_count_changes,
    SUM(CASE WHEN correct_active_bets != old_active_bets THEN 1 ELSE 0 END) AS users_with_active_bets_changes,
    SUM(CASE WHEN correct_current_streak != old_current_streak THEN 1 ELSE 0 END) AS users_with_current_streak_changes,
    SUM(CASE WHEN correct_longest_streak != old_longest_streak THEN 1 ELSE 0 END) AS users_with_longest_streak_changes
FROM user_stats_correct;

-- Step 6: Show detailed changes for users with discrepancies
SELECT
    user_id,
    old_win_count,
    correct_win_count,
    (correct_win_count - old_win_count) AS win_count_diff,
    old_loss_count,
    correct_loss_count,
    (correct_loss_count - old_loss_count) AS loss_count_diff,
    old_active_bets,
    correct_active_bets,
    (correct_active_bets - old_active_bets) AS active_bets_diff,
    old_current_streak,
    correct_current_streak,
    (correct_current_streak - old_current_streak) AS current_streak_diff,
    old_longest_streak,
    correct_longest_streak,
    (correct_longest_streak - old_longest_streak) AS longest_streak_diff
FROM user_stats_correct
WHERE
    correct_win_count != old_win_count
    OR correct_loss_count != old_loss_count
    OR correct_active_bets != old_active_bets
    OR correct_current_streak != old_current_streak
    OR correct_longest_streak != old_longest_streak
ORDER BY user_id;

-- Step 7: Update users table with correct statistics
UPDATE users u
INNER JOIN user_stats_correct usc ON u.id = usc.user_id
SET
    u.win_count = usc.correct_win_count,
    u.loss_count = usc.correct_loss_count,
    u.active_bets = usc.correct_active_bets,
    u.current_streak = usc.correct_current_streak,
    u.longest_streak = usc.correct_longest_streak,
    u.updated_at = NOW();

-- Step 8: Verification - Show updated statistics for sample users
SELECT
    id AS user_id,
    win_count,
    loss_count,
    active_bets,
    current_streak,
    longest_streak,
    (win_count + loss_count) AS total_games,
    CASE
        WHEN (win_count + loss_count) = 0 THEN 0.0
        ELSE ROUND(win_count / (win_count + loss_count), 4)
    END AS win_rate
FROM users
WHERE deleted_at IS NULL
ORDER BY id
LIMIT 20;

-- Step 9: Cleanup
DROP PROCEDURE IF EXISTS calculate_user_streaks;
DROP TEMPORARY TABLE IF EXISTS user_stats_correct;

-- Done! User statistics including streaks have been recalculated based on actual bet participation data.
