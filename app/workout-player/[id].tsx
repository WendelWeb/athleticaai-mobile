/**
 * 🏋️ WORKOUT PLAYER V2 - Apple Fitness+ Level
 *
 * Remplacement complet du player original avec:
 * ✅ ML Adaptive rest timer
 * ✅ Real-time analytics
 * ✅ Performance scoring
 * ✅ Exercise recommendations
 * ✅ State machine robuste
 * ✅ Offline-first sync
 * ✅ Apple-grade UI modulaire
 *
 * Architecture: WorkoutPlayer + 6 sous-composants
 */

import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutPlayer } from '@/components/WorkoutPlayer';
import { ErrorState } from '@/components/ui/ErrorState';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { updateProgramProgress } from '@services/drizzle/user-programs';
import { getWorkoutById } from '@/services/drizzle/workouts';
import {
  getWorkoutExercises,
  completeSession,
  calculateSessionStats,
  createWorkoutSession,
  updateExercisesCompleted,
  type ExerciseSessionData
} from '@/services/drizzle/workout-sessions';
import { getWorkoutsByProgramId } from '@/services/drizzle/workouts';
import type { Workout as WorkoutPlayerType } from '@/types/workout-player';
import type { Workout as DBWorkout } from '@/types/workout';
import { useStyledTheme } from '@theme/ThemeProvider';

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useClerkAuth();
  const theme = useStyledTheme();

  // Extract params
  const workoutId = params.id as string;
  const programId = params.programId as string | undefined;
  const userProgramId = params.userProgramId as string | undefined;
  const workoutIndex = params.workoutIndex
    ? parseInt(params.workoutIndex as string, 10)
    : undefined;

  // State for loading workout
  const [workout, setWorkout] = useState<WorkoutPlayerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  // Check if this workout is part of a program
  const isPartOfProgram = programId && userProgramId && workoutIndex !== undefined;

  // Load workout data
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load workout details and exercises
        const [workoutData, exercises] = await Promise.all([
          getWorkoutById(workoutId),
          getWorkoutExercises(workoutId),
        ]);

        if (!workoutData) {
          throw new Error('Workout not found');
        }

        if (!exercises || exercises.length === 0) {
          throw new Error('No exercises found for this workout');
        }

        // Transform to Workout type expected by player
        const workoutForPlayer: WorkoutPlayerType = {
          id: workoutData.id!,
          name: workoutData.title!,
          description: workoutData.description || undefined,
          thumbnail_url: workoutData.thumbnail_url || undefined,
          difficulty: (workoutData.difficulty || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
          workout_type: workoutData.category || 'strength',
          estimated_duration_minutes: workoutData.estimated_duration_minutes || 30,
          estimated_calories: workoutData.estimated_calories || 200,
          target_muscles: workoutData.muscle_groups || [],
          exercises: exercises.map((ex, index) => ({
            id: ex.id,
            name: ex.name,
            description: ex.description || undefined,
            thumbnail_url: ex.thumbnail_url || undefined,
            video_url: ex.video_url || undefined,
            primary_muscle: ex.muscle_group || 'general',
            secondary_muscles: ex.secondary_muscles || [],
            sets: ex.sets || 3,
            reps: ex.reps || undefined,
            reps_min: ex.reps_min || undefined,
            reps_max: ex.reps_max || undefined,
            duration_seconds: ex.duration_seconds || undefined,
            rest_seconds: ex.rest_seconds || 90,
            instructions: ex.instructions || [],
            tips: ex.tips || [],
            equipment_needed: ex.equipment_needed || [],
            order_index: index,
          })),
        };

        setWorkout(workoutForPlayer);
      } catch (err) {
        console.error('Error loading workout:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workout');
      } finally {
        setIsLoading(false);
      }
    };

    if (workoutId && user) {
      loadWorkout();
    }
  }, [workoutId, user]);

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please sign in to start a workout</Text>
      </View>
    );
  }

  if (!workoutId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid workout ID</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={[styles.errorText, { marginTop: 16 }]}>Loading workout...</Text>
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={styles.errorContainer}>
        <ErrorState
          error={error ? new Error(error) : new Error('Failed to load workout')}
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            // Trigger re-fetch by re-running useEffect
            if (workoutId && user) {
              const loadWorkout = async () => {
                try {
                  setIsLoading(true);
                  setError(null);
                  const [workoutData, exercises] = await Promise.all([
                    getWorkoutById(workoutId),
                    getWorkoutExercises(workoutId),
                  ]);
                  if (!workoutData) throw new Error('Workout not found');
                  if (!exercises || exercises.length === 0) throw new Error('No exercises found');
                  const workoutForPlayer: WorkoutPlayerType = {
                    id: workoutData.id!,
                    name: workoutData.title!,
                    description: workoutData.description || undefined,
                    thumbnail_url: workoutData.thumbnail_url || undefined,
                    difficulty: (workoutData.difficulty || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
                    workout_type: workoutData.category || 'strength',
                    estimated_duration_minutes: workoutData.estimated_duration_minutes || 30,
                    estimated_calories: workoutData.estimated_calories || 200,
                    target_muscles: workoutData.muscle_groups || [],
                    exercises: exercises.map((ex, index) => ({
                      id: ex.id,
                      name: ex.name,
                      description: ex.description || undefined,
                      thumbnail_url: ex.thumbnail_url || undefined,
                      video_url: ex.video_url || undefined,
                      primary_muscle: ex.muscle_group || 'general',
                      secondary_muscles: ex.secondary_muscles || [],
                      sets: ex.sets || 3,
                      reps: ex.reps || undefined,
                      reps_min: ex.reps_min || undefined,
                      reps_max: ex.reps_max || undefined,
                      duration_seconds: ex.duration_seconds || undefined,
                      rest_seconds: ex.rest_seconds || 90,
                      instructions: ex.instructions || [],
                      tips: ex.tips || [],
                      equipment_needed: ex.equipment_needed || [],
                      order_index: index,
                    })),
                  };
                  setWorkout(workoutForPlayer);
                } catch (err) {
                  console.error('Error loading workout:', err);
                  setError(err instanceof Error ? err.message : 'Failed to load workout');
                } finally {
                  setIsLoading(false);
                }
              };
              loadWorkout();
            }
          }}
        />
      </View>
    );
  }

  const handleWorkoutStart = async () => {
    // Create database session when workout starts
    if (!user || !workoutId || dbSessionId) return;

    try {
      const sessionData = await createWorkoutSession(user.id, workoutId);
      if (sessionData) {
        setDbSessionId(sessionData.id);
        console.log('✅ Database session created:', sessionData.id);
      }
    } catch (error) {
      console.error('❌ Error creating workout session:', error);
    }
  };

  const handleSave = async (session: any) => {
    console.log('💾 Saving workout to database...', {
      sessionExists: !!session,
      elapsed: session?.elapsed_seconds,
      sets: session?.total_sets_completed,
      reps: session?.total_reps_completed,
    });

    try {
      // Transform session data to match database format
      const exercisesCompleted: ExerciseSessionData[] = (session?.completed_exercises || []).map((ex: any) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        target_sets: 3, // Default value
        sets_completed: ex.sets_completed || [],
        skipped: ex.skipped || false,
        skip_reason: ex.skip_reason,
        started_at: ex.started_at,
        completed_at: ex.completed_at,
      }));

      // Calculate final stats
      const stats = calculateSessionStats(
        exercisesCompleted,
        workout?.exercises.length || 0,
        session?.started_at || new Date()
      );

      // Save session to database
      let sessionId = dbSessionId;

      if (!sessionId && user) {
        // Create session if not created yet (fallback)
        const sessionData = await createWorkoutSession(user.id, workoutId);
        if (sessionData) {
          sessionId = sessionData.id;
          console.log('✅ Database session created (fallback):', sessionId);
        }
      }

      if (sessionId) {
        // Save exercise-level data
        await updateExercisesCompleted(sessionId, exercisesCompleted);

        // Update session with final stats
        await completeSession(sessionId, stats);
        console.log('✅ Workout session saved to database');
      } else {
        console.warn('⚠️ No database session ID - session not saved');
      }

      // If workout is part of a program, update progress
      if (isPartOfProgram) {
        const nextWorkoutIndex = workoutIndex! + 1;

        // Load program workouts to find the actual week of the next workout
        const programWorkouts = await getWorkoutsByProgramId(programId!);

        // Sort workouts by week and day
        const sortedWorkouts = programWorkouts.sort((a, b) => {
          if (a.week_number !== b.week_number) {
            return a.week_number - b.week_number;
          }
          return a.day_number - b.day_number;
        });

        // Find the week of the next workout (or last week if completed all)
        let currentWeek = 1;
        if (nextWorkoutIndex < sortedWorkouts.length) {
          currentWeek = sortedWorkouts[nextWorkoutIndex].week_number;
        } else {
          // Completed all workouts - stay on last week
          currentWeek = sortedWorkouts[sortedWorkouts.length - 1].week_number;
        }

        await updateProgramProgress({
          userProgramId: userProgramId!,
          workoutsCompleted: nextWorkoutIndex,
          currentWorkoutIndex: nextWorkoutIndex,
          currentWeek: currentWeek,
        });
        console.log('✅ Program progress updated - Week:', currentWeek, 'Workout:', nextWorkoutIndex);
      }

      // Don't navigate - let user close when ready
    } catch (error) {
      console.error('❌ Error saving workout:', error);
    }
  };

  return (
    <WorkoutPlayer
      workout={workout}
      userId={user.id}
      onStart={handleWorkoutStart}
      onComplete={handleSave}
      onCancel={() => {
        // Go back to previous screen
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
