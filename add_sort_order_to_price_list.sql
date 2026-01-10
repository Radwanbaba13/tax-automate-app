-- =====================================================
-- Add sort_order column to price_list table
-- Run this in phpMyAdmin
-- =====================================================

-- Add sort_order column
ALTER TABLE price_list
ADD COLUMN sort_order INT DEFAULT 0 AFTER id;

-- Set initial sort_order based on current id order (optional, to preserve existing order)
-- UPDATE price_list SET sort_order = 0; -- You can manually set these if needed

-- Make sure the column exists
-- DESCRIBE price_list;
-- You should see sort_order column

