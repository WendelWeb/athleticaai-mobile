/**
 * Workouts Service
 *
 * Fetches workout data from Neon database via Drizzle ORM
 */

import type { Workout, FitnessLevel, WorkoutCategory } from '@/types/workout';

// Re-export ALL Drizzle workout service functions and types
export {
  getWorkouts,
  getWorkoutById,
  getPopularWorkouts,
  getRecommendedWorkouts,
  searchWorkouts,
  getExercises,
  getExerciseById,
  getExercisesByCategory,
  searchExercises,
  getExerciseCategories,
  createWorkoutSession,
  updateWorkoutSession,
  completeWorkoutSession,
  getUserWorkoutHistory,
} from '@/services/drizzle/workouts';

export type {
  GetWorkoutsFilters,
  Exercise,
  ExerciseFilters,
} from '@/services/drizzle/workouts';
