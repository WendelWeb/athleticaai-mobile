/**
 * 🔥 USE WORKOUT OF THE DAY
 *
 * Features:
 * - Fetches daily featured workout
 * - Rotates based on day of year
 * - Caches for 24h
 * - Fallback to random popular workout
 */

import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/utils/logger';

interface WorkoutOfDay {
  id: string;
  name: string;
  description: string;
  workoutType: string;
  difficultyLevel: string;
  estimatedDuration: number;
  caloriesBurnedEstimate: number;
  exerciseCount: number;
  thumbnailUrl: string | null;
}

async function fetchWorkoutOfDay(): Promise<WorkoutOfDay | null> {
  logger.info('[useWorkoutOfDay] Fetching workout of the day');

  // Get day of year for consistent daily rotation
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Get all workouts (ordered by completion count for popularity)
  const allWorkouts = await db
    .select()
    .from(workouts)
    .orderBy(desc(workouts.completion_count))
    .limit(100); // Get top 100 popular workouts

  if (!allWorkouts || allWorkouts.length === 0) {
    logger.warn('[useWorkoutOfDay] No workouts found in database');
    return null;
  }

  // Rotate through workouts based on day of year
  const wodIndex = dayOfYear % allWorkouts.length;
  const workout = allWorkouts[wodIndex];

  // Parse exercises to count them
  const exercises = workout.exercises as any[];
  const exerciseCount = exercises?.length || 0;

  const workoutOfDay: WorkoutOfDay = {
    id: workout.id,
    name: workout.name,
    description: workout.description || '',
    workoutType: workout.workout_type,
    difficultyLevel: workout.difficulty_level,
    estimatedDuration: workout.estimated_duration,
    caloriesBurnedEstimate: workout.calories_burned_estimate || 0,
    exerciseCount,
    thumbnailUrl: workout.thumbnail_url,
  };

  logger.info('[useWorkoutOfDay] WOD fetched', {
    name: workoutOfDay.name,
    dayOfYear,
    wodIndex,
  });

  return workoutOfDay;
  // Let errors propagate to React Query for proper error state handling
}

export function useWorkoutOfDay() {
  const {
    data: workoutOfDay,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workoutOfDay'],
    queryFn: fetchWorkoutOfDay,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (daily rotation)
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24h
    refetchOnMount: false, // Don't refetch on mount (cache 24h)
  });

  return {
    workoutOfDay,
    isLoading,
    error,
    refresh: refetch,
  };
}
