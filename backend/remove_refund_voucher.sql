-- Remove Refund Voucher store item as it doesn't make logical sense in pool-based betting
-- Winners already receive their stake back as part of the payout calculation

-- First, remove any user inventory records for this item
DELETE FROM user_inventory
WHERE store_item_id IN (
    SELECT id FROM store_items WHERE name = 'Refund Voucher'
);

-- Then remove the store item itself
DELETE FROM store_items WHERE name = 'Refund Voucher';
