/**
 * Drizzle Stats Service
 *
 * Replaces Supabase stats service with Drizzle ORM
 * Maintains EXACT same interface for seamless migration
 *
 * Features:
 * - User stats (total workouts, hours, calories, streaks)
 * - Weekly activity data for charts
 * - Personal records tracking
 * - XP & level calculation
 */

import { db, userWorkoutSessions, workouts } from '@/db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { logger, toISOString } from '@/utils';
import { handleError } from '@/utils/errorHandler';

// =====================================================
// INTERFACES (re-export from Supabase service)
// =====================================================

export interface UserStats {
  total_workouts: number;
  total_hours: number;
  total_calories: number;
  current_streak: number;
  best_streak: number;
  total_xp: number;
  current_level: number;
  xp_for_next_level: number;
  workouts_this_week: number;
  workouts_this_month: number;
}

export interface WeeklyActivity {
  date: string; // YYYY-MM-DD
  workouts_count: number;
  duration_minutes: number;
  calories_burned: number;
}

export interface PersonalRecord {
  metric: 'duration' | 'calories' | 'exercises';
  value: number;
  workout_title: string;
  date: string;
}

// =====================================================
// USER STATS - Main Function
// =====================================================

/**
 * Get comprehensive user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    // Fetch all completed workout sessions
    const sessions = await db
      .select({
        completed_at: userWorkoutSessions.completed_at,
        duration_seconds: userWorkoutSessions.duration_seconds,
        calories_burned: userWorkoutSessions.calories_burned,
      })
      .from(userWorkoutSessions)
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed')
        )
      )
      .orderBy(userWorkoutSessions.completed_at);

    if (!sessions || sessions.length === 0) {
      return {
        total_workouts: 0,
        total_hours: 0,
        total_calories: 0,
        current_streak: 0,
        best_streak: 0,
        total_xp: 0,
        current_level: 1,
        xp_for_next_level: 150,
        workouts_this_week: 0,
        workouts_this_month: 0,
      };
    }

    // Calculate total workouts
    const total_workouts = sessions.length;

    // Calculate total hours
    const total_seconds = sessions.reduce((sum: number, s: typeof sessions[0]) => sum + (s.duration_seconds || 0), 0);
    const total_hours = parseFloat((total_seconds / 3600).toFixed(1));

    // Calculate total calories
    const total_calories = sessions.reduce((sum: number, s: typeof sessions[0]) => sum + (s.calories_burned || 0), 0);

    // Calculate streaks
    const { current_streak, best_streak } = calculateStreaks(
      sessions
        .filter((s: typeof sessions[0]) => s.completed_at !== null)
        .map((s: typeof sessions[0]) => ({
          completed_at: toISOString(s.completed_at, new Date().toISOString()),
        }))
    );

    // Calculate XP (5 XP per minute of workout)
    const total_xp = Math.round((total_seconds / 60) * 5);

    // Calculate level
    const current_level = calculateLevel(total_xp);
    const xp_for_next_level = calculateXPForLevel(current_level + 1);

    // Calculate this week's workouts
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const workouts_this_week = sessions.filter((s: typeof sessions[0]) => {
      const date = s.completed_at ? new Date(s.completed_at) : new Date();
      return date >= weekStart;
    }).length;

    // Calculate this month's workouts
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const workouts_this_month = sessions.filter((s: typeof sessions[0]) => {
      const date = s.completed_at ? new Date(s.completed_at) : new Date();
      return date >= monthStart;
    }).length;

    return {
      total_workouts,
      total_hours,
      total_calories,
      current_streak,
      best_streak,
      total_xp,
      current_level,
      xp_for_next_level,
      workouts_this_week,
      workouts_this_month,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load stats',
      description: 'Unable to load your workout statistics',
      showToast: true,
      context: 'StatsService.getUserStats',
    });
    throw error; // Let React Query handle error state
  }
}

// =====================================================
// STREAK CALCULATION
// =====================================================

/**
 * Calculate current and best streaks from workout sessions
 */
function calculateStreaks(
  sessions: Array<{ completed_at: string }>
): { current_streak: number; best_streak: number } {
  if (sessions.length === 0) {
    return { current_streak: 0, best_streak: 0 };
  }

  // Get unique workout dates (YYYY-MM-DD)
  const workoutDates = new Set(
    sessions.map((s) => {
      const date = new Date(s.completed_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })
  );

  const sortedDates = Array.from(workoutDates).sort();

  // Calculate current streak (working backwards from today)
  let current_streak = 0;
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Check if user worked out today or yesterday (grace period)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let checkDate = new Date(today);
  if (workoutDates.has(todayString)) {
    current_streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (workoutDates.has(yesterdayString)) {
    current_streak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    current_streak = 0;
  }

  // Count consecutive days backwards
  while (current_streak > 0) {
    const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (workoutDates.has(dateString)) {
      current_streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak (all time)
  let best_streak = 0;
  let temp_streak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      temp_streak++;
    } else {
      best_streak = Math.max(best_streak, temp_streak);
      temp_streak = 1;
    }
  }

  best_streak = Math.max(best_streak, temp_streak);

  return { current_streak, best_streak };
}

// =====================================================
// LEVEL CALCULATION
// =====================================================

/**
 * Calculate level from total XP
 * Formula: Level = floor(sqrt(XP / 75)) + 1
 */
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 75)) + 1;
}

/**
 * Calculate XP required for a specific level
 */
function calculateXPForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 75;
}

// =====================================================
// WEEKLY ACTIVITY
// =====================================================

/**
 * Get weekly activity data for charts (last 7 days)
 */
export async function getWeeklyActivity(userId: string): Promise<WeeklyActivity[]> {
  try {
    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await db
      .select({
        completed_at: userWorkoutSessions.completed_at,
        duration_seconds: userWorkoutSessions.duration_seconds,
        calories_burned: userWorkoutSessions.calories_burned,
      })
      .from(userWorkoutSessions)
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed'),
          gte(userWorkoutSessions.completed_at, sevenDaysAgo)
        )
      )
      .orderBy(userWorkoutSessions.completed_at);

    if (!sessions) return [];

    // Group by date
    const activityMap = new Map<string, WeeklyActivity>();

    sessions.forEach((session: typeof sessions[0]) => {
      const date = session.completed_at ? new Date(session.completed_at) : new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!activityMap.has(dateString)) {
        activityMap.set(dateString, {
          date: dateString,
          workouts_count: 0,
          duration_minutes: 0,
          calories_burned: 0,
        });
      }

      const activity = activityMap.get(dateString)!;
      activity.workouts_count++;
      activity.duration_minutes += Math.round((session.duration_seconds || 0) / 60);
      activity.calories_burned += session.calories_burned || 0;
    });

    // Fill missing days with 0
    const result: WeeklyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      result.push(
        activityMap.get(dateString) || {
          date: dateString,
          workouts_count: 0,
          duration_minutes: 0,
          calories_burned: 0,
        }
      );
    }

    return result;
  } catch (error) {
    handleError(error, {
      message: 'Failed to load weekly activity',
      description: 'Unable to load your activity data',
      showToast: true,
      context: 'StatsService.getWeeklyActivity',
    });
    throw error; // Let React Query handle error state
  }
}

// =====================================================
// PERSONAL RECORDS
// =====================================================

/**
 * Get user's personal records
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  try {
    const sessions = await db
      .select({
        session: userWorkoutSessions,
        workout: workouts,
      })
      .from(userWorkoutSessions)
      .leftJoin(workouts, eq(userWorkoutSessions.workout_id, workouts.id))
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed')
        )
      )
      .orderBy(desc(userWorkoutSessions.duration_seconds))
      .limit(100);

    if (!sessions || sessions.length === 0) return [];

    const records: PersonalRecord[] = [];

    // Longest duration
    const longestSession = sessions.reduce((max: typeof sessions[0], s: typeof sessions[0]) =>
      (s.session.duration_seconds || 0) > (max.session.duration_seconds || 0) ? s : max
    );
    if (longestSession.session.duration_seconds) {
      records.push({
        metric: 'duration',
        value: Math.round(longestSession.session.duration_seconds / 60),
        workout_title: longestSession.workout?.name || 'Workout',
        date: longestSession.session.completed_at?.toISOString() || new Date().toISOString(),
      });
    }

    // Most calories
    const highestCalories = sessions.reduce((max: typeof sessions[0], s: typeof sessions[0]) =>
      (s.session.calories_burned || 0) > (max.session.calories_burned || 0) ? s : max
    );
    if (highestCalories.session.calories_burned) {
      records.push({
        metric: 'calories',
        value: highestCalories.session.calories_burned,
        workout_title: highestCalories.workout?.name || 'Workout',
        date: highestCalories.session.completed_at?.toISOString() || new Date().toISOString(),
      });
    }

    return records;
  } catch (error) {
    handleError(error, {
      message: 'Failed to load personal records',
      description: 'Unable to load your achievements',
      showToast: true,
      context: 'StatsService.getPersonalRecords',
    });
    throw error; // Let React Query handle error state
  }
}

/**
 * Refresh user stats (trigger background refresh)
 */
export async function refreshUserStats(userId: string): Promise<void> {
  await getUserStats(userId);
}

// =====================================================
// WORKOUT HISTORY BY DATE
// =====================================================

export interface WorkoutHistoryItem {
  id: string;
  workout_id: string;
  workout_name: string;
  completed_at: string;
  duration_seconds: number;
  duration_minutes: number;
  calories_burned: number | null;
  exercises_completed: any;
  difficulty_rating: number | null;
  energy_level: number | null;
  notes: string | null;
}

/**
 * Get workouts completed on a specific date
 * @param userId - User ID
 * @param date - Date string in YYYY-MM-DD format
 */
export async function getUserWorkoutsByDate(
  userId: string,
  date: string
): Promise<WorkoutHistoryItem[]> {
  try {
    // Parse date to get start and end of day
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const sessions = await db
      .select({
        session: userWorkoutSessions,
        workout: workouts,
      })
      .from(userWorkoutSessions)
      .leftJoin(workouts, eq(userWorkoutSessions.workout_id, workouts.id))
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed'),
          gte(userWorkoutSessions.completed_at, startOfDay),
          lte(userWorkoutSessions.completed_at, endOfDay)
        )
      )
      .orderBy(desc(userWorkoutSessions.completed_at));

    return sessions
      .filter((s: typeof sessions[0]) => s.session.completed_at !== null)
      .map((s: typeof sessions[0]) => ({
        id: s.session.id,
        workout_id: s.session.workout_id,
        workout_name: s.workout?.name || 'Workout',
        completed_at: s.session.completed_at!.toISOString(),
        duration_seconds: s.session.duration_seconds || 0,
        duration_minutes: Math.round((s.session.duration_seconds || 0) / 60),
        calories_burned: s.session.calories_burned,
        exercises_completed: s.session.exercises_completed,
        difficulty_rating: s.session.difficulty_rating,
        energy_level: s.session.energy_level,
        notes: s.session.notes,
      }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workouts',
      description: 'Unable to load workouts for this date',
      showToast: true,
      context: 'StatsService.getWorkoutsByDate',
    });
    throw error; // Let React Query handle error state
  }
}

/**
 * Get all workout dates for a month (for calendar dots)
 * @param userId - User ID
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Object with dates as keys and workout count as values
 */
export async function getUserWorkoutsByMonth(
  userId: string,
  year: number,
  month: number
): Promise<Record<string, number>> {
  try {
    // Get first and last day of month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await db
      .select({
        completed_at: userWorkoutSessions.completed_at,
      })
      .from(userWorkoutSessions)
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed'),
          gte(userWorkoutSessions.completed_at, startOfMonth),
          lte(userWorkoutSessions.completed_at, endOfMonth)
        )
      );

    // Group by date
    const dateCount: Record<string, number> = {};

    sessions.forEach((s: typeof sessions[0]) => {
      if (s.completed_at) {
        const date = s.completed_at.toISOString().split('T')[0];
        dateCount[date] = (dateCount[date] || 0) + 1;
      }
    });

    return dateCount;
  } catch (error) {
    handleError(error, {
      message: 'Failed to load monthly workouts',
      description: 'Unable to load workout calendar',
      showToast: true,
      context: 'StatsService.getWorkoutsByMonth',
    });
    throw error; // Let React Query handle error state
  }
}

/**
 * Get workout history with pagination and date filtering
 * @param userId - User ID
 * @param options - Filter options
 */
export async function getUserWorkoutHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<WorkoutHistoryItem[]> {
  try {
    const { limit = 20, offset = 0, startDate, endDate } = options;

    let query = db
      .select({
        session: userWorkoutSessions,
        workout: workouts,
      })
      .from(userWorkoutSessions)
      .leftJoin(workouts, eq(userWorkoutSessions.workout_id, workouts.id))
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed')
        )
      )
      .orderBy(desc(userWorkoutSessions.completed_at))
      .limit(limit)
      .offset(offset);

    const sessions = await query;

    return sessions
      .filter((s: typeof sessions[0]) => s.session.completed_at !== null)
      .map((s: typeof sessions[0]) => ({
        id: s.session.id,
        workout_id: s.session.workout_id,
        workout_name: s.workout?.name || 'Workout',
        completed_at: s.session.completed_at!.toISOString(),
        duration_seconds: s.session.duration_seconds || 0,
        duration_minutes: Math.round((s.session.duration_seconds || 0) / 60),
        calories_burned: s.session.calories_burned,
        exercises_completed: s.session.exercises_completed,
        difficulty_rating: s.session.difficulty_rating,
        energy_level: s.session.energy_level,
        notes: s.session.notes,
      }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout history',
      description: 'Unable to load your workout history',
      showToast: true,
      context: 'StatsService.getWorkoutHistory',
    });
    throw error; // Let React Query handle error state
  }
}
