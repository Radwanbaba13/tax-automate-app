-- =====================================================
-- Fix price_list table: Set UUID id column as PRIMARY KEY
-- Run this in phpMyAdmin
-- =====================================================

-- Step 1: Check current table structure
-- DESCRIBE price_list;
-- SHOW CREATE TABLE price_list;

-- Step 2: If there's already a PRIMARY KEY on a different column, drop it first
-- ALTER TABLE price_list DROP PRIMARY KEY;

-- Step 3: Make sure the id column exists and is the right type
-- If id column doesn't exist or is wrong type, you may need to:
-- ALTER TABLE price_list MODIFY id VARCHAR(36) NOT NULL;

-- Step 4: Set id column as PRIMARY KEY
ALTER TABLE price_list
ADD PRIMARY KEY (id);

-- Step 5: Verify the change
-- DESCRIBE price_list;
-- You should see "PRI" under "Key" for the id column

-- =====================================================
-- Alternative: If you want to keep AUTO_INCREMENT INT instead of UUIDs
-- =====================================================
-- This would require changing all existing UUIDs to INT, which is more complex
-- Only do this if you want to switch from UUIDs to AUTO_INCREMENT

-- Step 1: Create a new temporary column
-- ALTER TABLE price_list ADD COLUMN new_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Step 2: Copy data (this is complex and may lose UUID references)
-- UPDATE price_list SET new_id = ... (you'd need to map UUIDs to sequential IDs)

-- Step 3: Drop old id column and rename new one
-- ALTER TABLE price_list DROP COLUMN id;
-- ALTER TABLE price_list CHANGE new_id id INT AUTO_INCREMENT;

