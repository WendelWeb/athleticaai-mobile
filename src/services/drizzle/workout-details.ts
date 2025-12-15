/**
 * 🏋️ WORKOUT DETAILS SERVICE
 *
 * Load workouts with ALL details for pragmatic display
 * Exercises are denormalized in JSONB for performance
 */

import { db } from '@/db';
import { workouts, workoutPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { WorkoutWithExercises, WorkoutExercise } from '@/types/workoutExercise';
import { logger, handleError } from '@/utils';

/**
 * Get workout with full details including exercises
 *
 * @param workoutId - Workout ID
 * @returns Workout with all exercise details ready for display
 */
export async function getWorkoutWithDetails(
  workoutId: string
): Promise<WorkoutWithExercises | null> {
  try {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, workoutId));

    if (!workout) {
      logger.warn('[getWorkoutWithDetails] Workout not found', { workoutId });
      return null;
    }

    // Exercises are already in JSONB with all details!
    const exercises = (workout.exercises as unknown as WorkoutExercise[]) || [];

    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      thumbnail_url: workout.thumbnail_url,
      workout_type: workout.workout_type,
      difficulty_level: workout.difficulty_level,
      estimated_duration: workout.estimated_duration,
      calories_burned_estimate: workout.calories_burned_estimate,
      program_id: workout.program_id,
      week_number: workout.week_number,
      day_number: workout.day_number,
      exercises, // Rich array with names, sets, reps ranges, etc.
      created_at: workout.created_at,
      updated_at: workout.updated_at,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout details',
      description: 'Unable to load workout information',
      showToast: true,
      context: 'WorkoutDetails.getWorkoutWithDetails',
    });
    throw error; // Let React Query handle error state
  }
}

/**
 * Get workout preview summary for UI
 *
 * @param workoutId - Workout ID
 * @returns Summary info for preview screen
 */
export async function getWorkoutPreview(workoutId: string) {
  const workout = await getWorkoutWithDetails(workoutId);

  if (!workout) return null;

  return {
    id: workout.id,
    name: workout.name,
    description: workout.description,
    thumbnail_url: workout.thumbnail_url,
    difficulty_level: workout.difficulty_level,
    estimated_duration: workout.estimated_duration,
    calories_estimate: workout.calories_burned_estimate,

    // Summary stats
    total_exercises: workout.exercises.length,
    total_sets: workout.exercises.reduce((sum, ex) => sum + ex.target_sets, 0),
    muscle_groups: [
      ...new Set(workout.exercises.map((ex) => ex.muscle_group)),
    ],

    // Exercises list
    exercises: workout.exercises.map((ex) => ({
      name: ex.exercise_name,
      muscle_group: ex.muscle_group,
      sets: ex.target_sets,
      reps_min: ex.target_reps_min,
      reps_max: ex.target_reps_max,
      rest_seconds: ex.rest_seconds,
    })),
  };
}

/**
 * Get all workouts for a program with details
 *
 * @param programId - Program ID
 * @returns All workouts in program with exercises
 */
export async function getProgramWorkouts(programId: string) {
  try {
    const programWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.program_id, programId))
      .orderBy(workouts.week_number, workouts.day_number);

    return programWorkouts.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      week_number: w.week_number,
      day_number: w.day_number,
      difficulty_level: w.difficulty_level,
      estimated_duration: w.estimated_duration,
      exercises_count: Array.isArray(w.exercises) ? w.exercises.length : 0,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load program workouts',
      description: 'Unable to load workouts for this program',
      showToast: true,
      context: 'WorkoutDetails.getProgramWorkouts',
    });
    throw error; // Let React Query handle error state
  }
}
