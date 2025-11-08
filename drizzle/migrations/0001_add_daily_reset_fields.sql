-- Migration: Add Daily Reset & Program Management Fields
-- Date: 2025-11-05
-- Description: Adds fields for daily progress tracking, primary program logic, and program management

-- =====================================================
-- USER PROGRAMS TABLE - Daily Reset Fields
-- =====================================================

-- Daily tracking (reset at midnight)
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS last_workout_date DATE;
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS daily_workouts_completed INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS daily_workouts_target INTEGER DEFAULT 1 NOT NULL;

-- Program management
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS paused_reason TEXT;

-- Weekly goal tracking (optional enhancement)
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS weekly_workouts_completed INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE user_programs ADD COLUMN IF NOT EXISTS current_week_start_date DATE;

-- Add constraint: Only one primary program per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_primary_program
ON user_programs (user_id)
WHERE is_primary = TRUE;

-- Add index for daily reset queries (performance)
CREATE INDEX IF NOT EXISTS idx_last_workout_date
ON user_programs (user_id, last_workout_date);

-- Add comments for documentation
COMMENT ON COLUMN user_programs.last_workout_date IS 'Last date user completed a workout in this program (for daily reset logic)';
COMMENT ON COLUMN user_programs.daily_workouts_completed IS 'Number of workouts completed today (resets at midnight)';
COMMENT ON COLUMN user_programs.daily_workouts_target IS 'Target number of workouts per day (customizable by user)';
COMMENT ON COLUMN user_programs.is_primary IS 'Whether this is the user''s primary/active program (only one can be true)';
COMMENT ON COLUMN user_programs.paused_reason IS 'User-provided reason for pausing the program (optional)';
COMMENT ON COLUMN user_programs.weekly_workouts_completed IS 'Number of workouts completed this week (resets on week start)';
COMMENT ON COLUMN user_programs.current_week_start_date IS 'Date when the current program week started';
