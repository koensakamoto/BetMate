-- Fix: Convert OVER_UNDER bets to PREDICTION
-- This fixes the error: "No enum constant com.betmate.entity.betting.Bet.BetType.OVER_UNDER"

-- Update all OVER_UNDER bets to PREDICTION
UPDATE bets
SET bet_type = 'PREDICTION'
WHERE bet_type = 'OVER_UNDER';

-- Verify the change
SELECT id, title, bet_type, group_id
FROM bets
WHERE bet_type = 'PREDICTION' OR bet_type = 'OVER_UNDER'
ORDER BY group_id, id;
