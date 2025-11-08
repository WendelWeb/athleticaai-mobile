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

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutPlayer } from '@/components/WorkoutPlayer';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { View, Text, StyleSheet } from 'react-native';
import { updateProgramProgress } from '@services/drizzle/user-programs';

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useClerkAuth();

  // Extract params
  const workoutId = params.id as string;
  const programId = params.programId as string | undefined;
  const userProgramId = params.userProgramId as string | undefined;
  const workoutIndex = params.workoutIndex
    ? parseInt(params.workoutIndex as string, 10)
    : undefined;

  // Check if this workout is part of a program
  const isPartOfProgram = programId && userProgramId && workoutIndex !== undefined;

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

  const handleComplete = async () => {
    // If workout is part of a program, update progress
    if (isPartOfProgram) {
      try {
        await updateProgramProgress({
          userProgramId: userProgramId!,
          workoutsCompleted: workoutIndex! + 1,
          currentWorkoutIndex: workoutIndex! + 1,
        });

        // Navigate to Program Progress Celebration
        router.replace({
          pathname: '/program-progress-celebration',
          params: {
            programId,
            userProgramId,
            completedWorkoutIndex: workoutIndex!.toString(),
          },
        } as any);
      } catch (error) {
        console.error('Error updating program progress:', error);
        // Fallback to normal summary
        router.replace('/workout-summary');
      }
    } else {
      // Standalone workout - navigate to standard summary
      router.replace('/workout-summary');
    }
  };

  return (
    <WorkoutPlayer
      workoutId={workoutId}
      userId={user.id}
      onComplete={handleComplete}
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
