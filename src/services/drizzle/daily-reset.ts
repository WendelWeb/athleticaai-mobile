/**
 * Daily Reset Service
 *
 * Handles automatic reset of daily/weekly progress counters
 * - Resets daily_workouts_completed at midnight
 * - Resets weekly_workouts_completed on week start (Monday)
 * - Should be called when app opens or when user completes workout
 */

import { db, userPrograms } from '@/db';
import { eq, and, or, sql, lt } from 'drizzle-orm';
import { logger, handleError, toISOString } from '@/utils';

/**
 * Check if we need to reset daily/weekly progress for a user's programs
 * Call this function:
 * - When app opens (useEffect in root _layout or main tab)
 * - After completing a workout
 * - Before displaying progress stats
 */
export async function checkAndResetProgress(userId: string): Promise<void> {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Get all active programs for user
    const activePrograms = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          or(
            eq(userPrograms.status, 'active'),
            eq(userPrograms.status, 'paused')
          )
        )
      );

    logger.debug('[DailyReset] Checking progress reset', {
      userId,
      programsCount: activePrograms.length,
      today: todayString
    });

    // Reset daily/weekly progress for programs that need it
    for (const program of activePrograms) {
      const lastWorkoutDate = program.last_workout_date;
      const needsDailyReset = !lastWorkoutDate || lastWorkoutDate !== todayString;
      const needsWeeklyReset = checkNeedsWeeklyReset(
        program.current_week_start_date,
        today
      );

      if (needsDailyReset || needsWeeklyReset) {
        const updates: any = {
          updated_at: toISOString(new Date()),
        };

        // Reset daily counter if day changed
        if (needsDailyReset) {
          updates.daily_workouts_completed = 0;
          logger.debug('[DailyReset] Resetting daily progress', {
            programId: program.id,
            lastDate: lastWorkoutDate,
            today: todayString
          });
        }

        // Reset weekly counter if week changed
        if (needsWeeklyReset) {
          updates.weekly_workouts_completed = 0;
          updates.current_week_start_date = getWeekStartDate(today);
          logger.debug('[DailyReset] Resetting weekly progress', {
            programId: program.id,
            oldWeekStart: program.current_week_start_date,
            newWeekStart: getWeekStartDate(today)
          });
        }

        await db
          .update(userPrograms)
          .set(updates)
          .where(eq(userPrograms.id, program.id));
      }
    }

    logger.info('[DailyReset] Progress reset check completed', {
      userId,
      programsChecked: activePrograms.length
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to reset progress',
      description: 'Unable to check daily/weekly progress',
      showToast: false, // Silent - happens automatically in background
      context: 'DailyReset.checkAndResetProgress',
    });
    // Don't throw - this runs in background, failures shouldn't block app
  }
}

/**
 * Reset all users' daily progress at midnight
 * This function should be called by a scheduled job (cron, cloud function, etc.)
 *
 * For React Native apps without backend, this is called automatically
 * when the app opens via checkAndResetProgress()
 */
export async function resetAllDailyProgress(): Promise<{ affected: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    logger.info('[DailyReset] Starting global daily reset', { date: today });

    // Reset daily progress for all programs where last_workout_date != today
    const result = await db
      .update(userPrograms)
      .set({
        daily_workouts_completed: 0,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          or(
            eq(userPrograms.status, 'active'),
            eq(userPrograms.status, 'paused')
          ),
          // Only reset if last workout was NOT today
          or(
            sql`${userPrograms.last_workout_date} IS NULL`,
            sql`${userPrograms.last_workout_date} < ${today}`
          )
        )
      );

    logger.info('[DailyReset] Global daily reset completed', {
      affected: result.rowCount || 0
    });

    return { affected: result.rowCount || 0 };
  } catch (error) {
    handleError(error, {
      message: 'Failed to reset daily progress',
      description: 'Global daily reset failed',
      showToast: false, // Silent - background job
      context: 'DailyReset.resetAllDailyProgress',
    });
    return { affected: 0 }; // Return fallback instead of throwing
  }
}

/**
 * Reset weekly progress for programs that started a new week
 * Call this alongside daily reset
 */
export async function resetAllWeeklyProgress(): Promise<{ affected: number }> {
  try {
    const weekStart = getWeekStartDate(new Date());

    logger.info('[DailyReset] Starting global weekly reset', { weekStart });

    // Reset weekly progress for programs where week start has passed
    const result = await db
      .update(userPrograms)
      .set({
        weekly_workouts_completed: 0,
        current_week_start_date: weekStart,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          or(
            eq(userPrograms.status, 'active'),
            eq(userPrograms.status, 'paused')
          ),
          // Only reset if current_week_start_date is before this week's start
          or(
            sql`${userPrograms.current_week_start_date} IS NULL`,
            lt(userPrograms.current_week_start_date, weekStart)
          )
        )
      );

    logger.info('[DailyReset] Global weekly reset completed', {
      affected: result.rowCount || 0
    });

    return { affected: result.rowCount || 0 };
  } catch (error) {
    handleError(error, {
      message: 'Failed to reset weekly progress',
      description: 'Global weekly reset failed',
      showToast: false, // Silent - background job
      context: 'DailyReset.resetAllWeeklyProgress',
    });
    return { affected: 0 }; // Return fallback instead of throwing
  }
}

/**
 * Increment daily workout counter for a program
 * Call this after completing a workout
 */
export async function incrementDailyProgress(
  programId: string,
  userId: string
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // First, ensure daily/weekly progress is reset if needed
    await checkAndResetProgress(userId);

    // Then increment counters
    await db
      .update(userPrograms)
      .set({
        daily_workouts_completed: sql`${userPrograms.daily_workouts_completed} + 1`,
        weekly_workouts_completed: sql`${userPrograms.weekly_workouts_completed} + 1`,
        last_workout_date: today,
        updated_at: toISOString(new Date()),
      })
      .where(eq(userPrograms.id, programId));

    logger.debug('[DailyReset] Daily progress incremented', {
      programId,
      userId,
      date: today
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to update progress',
      description: 'Unable to increment daily progress counter',
      showToast: true, // Show error - user-triggered action
      context: 'DailyReset.incrementDailyProgress',
    });
    // Don't throw - failure to increment shouldn't block workout completion
  }
}

/**
 * Get daily progress stats for a user's programs
 */
export async function getDailyProgressStats(userId: string) {
  try {
    // Ensure progress is up to date
    await checkAndResetProgress(userId);

    const programs = await db
      .select({
        id: userPrograms.id,
        program_id: userPrograms.program_id,
        daily_completed: userPrograms.daily_workouts_completed,
        daily_target: userPrograms.daily_workouts_target,
        weekly_completed: userPrograms.weekly_workouts_completed,
        last_workout_date: userPrograms.last_workout_date,
        status: userPrograms.status,
      })
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          or(
            eq(userPrograms.status, 'active'),
            eq(userPrograms.status, 'paused')
          )
        )
      );

    const today = new Date().toISOString().split('T')[0];

    return programs.map((program: typeof programs[0]) => ({
      ...program,
      daily_progress_percentage: Math.round(
        (program.daily_completed / program.daily_target) * 100
      ),
      completed_today: program.last_workout_date === today,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load progress stats',
      description: 'Unable to load daily progress statistics',
      showToast: true, // Show error - user-visible feature
      context: 'DailyReset.getDailyProgressStats',
    });
    throw error; // Let React Query handle error state
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if weekly reset is needed
 * Returns true if current week start date is before this week's Monday
 */
function checkNeedsWeeklyReset(
  currentWeekStart: string | null,
  today: Date
): boolean {
  if (!currentWeekStart) return true;

  const currentWeekStartDate = new Date(currentWeekStart);
  const thisWeekStart = getWeekStartDate(today);

  return currentWeekStartDate < new Date(thisWeekStart);
}

/**
 * Get the start date of the current week (Monday)
 * Returns 'YYYY-MM-DD' string
 */
function getWeekStartDate(date: Date): string {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go to Monday

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return monday.toISOString().split('T')[0];
}

/**
 * Get days until weekly reset (days until next Monday)
 */
export function getDaysUntilWeeklyReset(): number {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (day === 1) return 7; // If Monday, next reset is in 7 days
  if (day === 0) return 1; // If Sunday, next reset is tomorrow

  return 8 - day; // Days until next Monday
}

/**
 * Check if it's a new day since last check
 * Useful for showing "Good morning" messages or daily streaks
 */
export function isNewDay(lastCheckDate: string | null): boolean {
  if (!lastCheckDate) return true;

  const today = new Date().toISOString().split('T')[0];
  return lastCheckDate !== today;
}
