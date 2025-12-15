/**
 * Workout Sessions Service - Active Workout Management
 *
 * Manages live workout sessions with real-time tracking:
 * - Create/resume/pause/complete sessions
 * - Track sets, reps, weight for each exercise
 * - Save exercises_completed JSONB data
 * - Calculate live stats (volume, calories, duration)
 * - Error handling with proper types
 *
 * Architecture:
 * - Uses userWorkoutSessions table
 * - exercises_completed stores: [{ exercise_id, sets: [{ reps, weight, rest, completed_at }] }]
 * - Auto-saves every 30s during active session
 */

import { db, userWorkoutSessions, workouts, exercises } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { logger, handleError, toISOString } from '@/utils';
import { sanitizeWorkoutSessionExercises } from '@/utils/sanitize';

// =====================================================
// TYPES
// =====================================================

export interface SetData {
  reps: number;
  weight_kg?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  form_quality?: number; // 1-5 stars
  notes?: string;
  completed_at: Date;
}

export interface ExerciseSessionData {
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps?: number;
  target_duration_seconds?: number;
  sets_completed: SetData[];
  skipped: boolean;
  skip_reason?: 'equipment' | 'injury' | 'fatigue' | 'difficulty' | 'other';
  started_at?: Date;
  completed_at?: Date;
}

export interface WorkoutSessionData {
  id: string;
  user_id: string;
  workout_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  started_at: Date | null;
  completed_at: Date | null;
  duration_seconds: number | null;
  calories_burned: number | null;
  exercises_completed: ExerciseSessionData[];
  created_at: Date;
  updated_at: Date | null;
}

export interface WorkoutSessionStats {
  total_sets: number;
  total_reps: number;
  total_volume_kg: number; // reps * weight
  average_rpe: number;
  exercises_completed: number;
  exercises_skipped: number;
  duration_seconds: number;
  calories_burned: number;
  completion_percentage: number;
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Create a new workout session (when user clicks "Start Workout")
 */
export const createWorkoutSession = async (
  userId: string,
  workoutId: string
): Promise<WorkoutSessionData | null> => {
  try {
    logger.info('[WorkoutSessions] Creating new session', { userId, workoutId });

    // Create session
    const result = await db
      .insert(userWorkoutSessions)
      .values({
        user_id: userId,
        workout_id: workoutId,
        status: 'in_progress',
        started_at: toISOString(new Date()),
        exercises_completed: [],
      })
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create workout session');
    }

    const session = result[0];

    logger.info('[WorkoutSessions] Session created', { sessionId: session.id });

    return {
      id: session.id,
      user_id: session.user_id,
      workout_id: session.workout_id,
      status: session.status as any,
      started_at: session.started_at,
      completed_at: session.completed_at,
      duration_seconds: session.duration_seconds,
      calories_burned: session.calories_burned,
      exercises_completed: (session.exercises_completed as any) || [],
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to start workout',
      description: 'Please try again',
      showToast: true,
      context: 'WorkoutSessions.createWorkoutSession',
    });
    return null;
  }
};

/**
 * Get active session for user (in_progress status)
 */
export const getActiveSession = async (userId: string): Promise<WorkoutSessionData | null> => {
  try {
    const sessions = await db
      .select()
      .from(userWorkoutSessions)
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'in_progress')
        )
      )
      .orderBy(desc(userWorkoutSessions.started_at))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    return {
      id: session.id,
      user_id: session.user_id,
      workout_id: session.workout_id,
      status: session.status as any,
      started_at: session.started_at,
      completed_at: session.completed_at,
      duration_seconds: session.duration_seconds,
      calories_burned: session.calories_burned,
      exercises_completed: (session.exercises_completed as any) || [],
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to get active session',
      context: 'WorkoutSessions.getActiveSession',
      // No toast - internal function
    });
    return null;
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId: string): Promise<WorkoutSessionData | null> => {
  try {
    const sessions = await db
      .select()
      .from(userWorkoutSessions)
      .where(eq(userWorkoutSessions.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    return {
      id: session.id,
      user_id: session.user_id,
      workout_id: session.workout_id,
      status: session.status as any,
      started_at: session.started_at,
      completed_at: session.completed_at,
      duration_seconds: session.duration_seconds,
      calories_burned: session.calories_burned,
      exercises_completed: (session.exercises_completed as any) || [],
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to get session',
      context: 'WorkoutSessions.getSessionById',
      // No toast - internal function
    });
    return null;
  }
};

/**
 * Update exercises_completed data (save sets/reps)
 */
export const updateExercisesCompleted = async (
  sessionId: string,
  exercisesCompleted: ExerciseSessionData[]
): Promise<boolean> => {
  try {
    // ✅ Sanitize exercises_completed to prevent XSS/injection attacks
    const sanitizedExercises = sanitizeWorkoutSessionExercises(exercisesCompleted);

    await db
      .update(userWorkoutSessions)
      .set({
        exercises_completed: sanitizedExercises as any,
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    logger.debug('[WorkoutSessions] Updated exercises_completed', {
      sessionId,
      exerciseCount: exercisesCompleted.length,
    });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to save progress',
      description: 'Your workout data could not be saved',
      showToast: true,
      context: 'WorkoutSessions.updateExercisesCompleted',
    });
    return false;
  }
};

/**
 * Complete a set for an exercise
 */
export const completeSet = async (
  sessionId: string,
  exerciseId: string,
  setData: SetData
): Promise<boolean> => {
  try {
    // Get current session
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const exercisesCompleted = session.exercises_completed || [];

    // Find or create exercise entry
    let exerciseEntry = exercisesCompleted.find((e) => e.exercise_id === exerciseId);

    if (!exerciseEntry) {
      // Create new exercise entry
      exerciseEntry = {
        exercise_id: exerciseId,
        exercise_name: '', // Will be populated from workout data
        target_sets: 3,
        sets_completed: [],
        skipped: false,
      };
      exercisesCompleted.push(exerciseEntry);
    }

    // Add set
    exerciseEntry.sets_completed.push(setData);

    // Update session
    await updateExercisesCompleted(sessionId, exercisesCompleted);

    logger.info('[WorkoutSessions] Set completed', {
      sessionId,
      exerciseId,
      setNumber: exerciseEntry.sets_completed.length,
      reps: setData.reps,
      weight: setData.weight_kg,
    });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to save set',
      description: 'Your set data could not be saved',
      showToast: true,
      context: 'WorkoutSessions.completeSet',
    });
    return false;
  }
};

/**
 * Skip an exercise
 */
export const skipExercise = async (
  sessionId: string,
  exerciseId: string,
  reason?: 'equipment' | 'injury' | 'fatigue' | 'difficulty' | 'other'
): Promise<boolean> => {
  try {
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const exercisesCompleted = session.exercises_completed || [];

    // Find or create exercise entry
    let exerciseEntry = exercisesCompleted.find((e) => e.exercise_id === exerciseId);

    if (!exerciseEntry) {
      exerciseEntry = {
        exercise_id: exerciseId,
        exercise_name: '',
        target_sets: 3,
        sets_completed: [],
        skipped: true,
        skip_reason: reason,
      };
      exercisesCompleted.push(exerciseEntry);
    } else {
      exerciseEntry.skipped = true;
      exerciseEntry.skip_reason = reason;
    }

    await updateExercisesCompleted(sessionId, exercisesCompleted);

    logger.info('[WorkoutSessions] Exercise skipped', { sessionId, exerciseId, reason });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to skip exercise',
      showToast: true,
      context: 'WorkoutSessions.skipExercise',
    });
    return false;
  }
};

/**
 * Pause session
 */
export const pauseSession = async (sessionId: string): Promise<boolean> => {
  try {
    await db
      .update(userWorkoutSessions)
      .set({
        status: 'in_progress', // Keep as in_progress, just track pause in client
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    logger.info('[WorkoutSessions] Session paused', { sessionId });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to pause workout',
      showToast: true,
      context: 'WorkoutSessions.pauseSession',
    });
    return false;
  }
};

/**
 * Resume session
 */
export const resumeSession = async (sessionId: string): Promise<boolean> => {
  try {
    await db
      .update(userWorkoutSessions)
      .set({
        status: 'in_progress',
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    logger.info('[WorkoutSessions] Session resumed', { sessionId });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to resume workout',
      showToast: true,
      context: 'WorkoutSessions.resumeSession',
    });
    return false;
  }
};

/**
 * Complete session with final stats
 */
export const completeSession = async (
  sessionId: string,
  stats: WorkoutSessionStats
): Promise<boolean> => {
  try {
    await db
      .update(userWorkoutSessions)
      .set({
        status: 'completed',
        completed_at: toISOString(new Date()),
        duration_seconds: stats.duration_seconds,
        calories_burned: stats.calories_burned,
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    logger.info('[WorkoutSessions] Session completed', { sessionId, stats });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to complete workout',
      description: 'Your workout data could not be saved',
      showToast: true,
      context: 'WorkoutSessions.completeSession',
    });
    return false;
  }
};

/**
 * Cancel session
 */
export const cancelSession = async (sessionId: string): Promise<boolean> => {
  try {
    await db
      .update(userWorkoutSessions)
      .set({
        status: 'cancelled',
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    logger.info('[WorkoutSessions] Session cancelled', { sessionId });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to cancel workout',
      showToast: true,
      context: 'WorkoutSessions.cancelSession',
    });
    return false;
  }
};

// =====================================================
// STATS CALCULATION
// =====================================================

/**
 * Calculate live stats from exercises_completed
 */
export const calculateSessionStats = (
  exercisesCompleted: ExerciseSessionData[],
  totalExercises: number,
  startedAt: Date
): WorkoutSessionStats => {
  let total_sets = 0;
  let total_reps = 0;
  let total_volume_kg = 0;
  let total_rpe = 0;
  let rpe_count = 0;
  let exercises_completed_count = 0;
  let exercises_skipped = 0;

  exercisesCompleted.forEach((exercise) => {
    if (exercise.skipped) {
      exercises_skipped++;
    } else {
      exercises_completed_count++;

      exercise.sets_completed.forEach((set) => {
        total_sets++;
        total_reps += set.reps;
        if (set.weight_kg) {
          total_volume_kg += set.reps * set.weight_kg;
        }
        if (set.rpe) {
          total_rpe += set.rpe;
          rpe_count++;
        }
      });
    }
  });

  const duration_seconds = Math.floor((new Date().getTime() - startedAt.getTime()) / 1000);

  // Estimate calories (rough formula: 5 calories per minute of strength training)
  const calories_burned = Math.floor((duration_seconds / 60) * 5);

  const completion_percentage = totalExercises > 0
    ? Math.floor(((exercises_completed_count + exercises_skipped) / totalExercises) * 100)
    : 0;

  return {
    total_sets,
    total_reps,
    total_volume_kg,
    average_rpe: rpe_count > 0 ? total_rpe / rpe_count : 0,
    exercises_completed: exercises_completed_count,
    exercises_skipped,
    duration_seconds,
    calories_burned,
    completion_percentage,
  };
};

/**
 * Get workout exercises from enriched JSONB data
 *
 * NOTE: Exercises now include ALL details in JSONB (rep ranges, names, muscle groups)
 * No extra DB query needed - everything is denormalized for performance!
 */
export const getWorkoutExercises = async (workoutId: string): Promise<any[]> => {
  try {
    const workoutData = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, workoutId))
      .limit(1);

    if (workoutData.length === 0) {
      return [];
    }

    const workout = workoutData[0];
    const exercisesData = (workout.exercises as any) || [];

    if (exercisesData.length === 0) {
      return [];
    }

    // ✅ NEW: Exercises JSONB now contains ALL data - no extra query needed!
    // Map enriched JSONB to expected format for active-workout screen
    return exercisesData.map((ex: any, index: number) => ({
      exercise_id: ex.exercise_id,
      name: ex.exercise_name || 'Unknown Exercise', // From enriched JSONB
      muscle_group: ex.muscle_group, // From enriched JSONB
      category: ex.exercise_category, // From enriched JSONB

      // Volume with REP RANGES
      sets: ex.target_sets || 3,
      reps_min: ex.target_reps_min || 8, // NEW: Rep range minimum
      reps_max: ex.target_reps_max || 12, // NEW: Rep range maximum
      reps: ex.target_reps_max || 10, // Legacy field (use max as default)

      rest_seconds: ex.rest_seconds || 90,
      notes: ex.notes || '',
      equipment_needed: ex.equipment_needed || [],
      order: ex.order_index || index,

      // These fields can be loaded later if needed (not in JSONB yet)
      description: '',
      thumbnail_url: null,
      video_url: null,
      instructions: [],
      tips: [],
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout exercises',
      description: 'Unable to load exercise details',
      showToast: true,
      context: 'WorkoutSessions.getWorkoutExercises',
    });
    return [];
  }
};
