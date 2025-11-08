/**
 * 🏋️ EXERCISE VIEW - Current Exercise Display
 *
 * Affiche l'exercice en cours avec:
 * - Image/Video preview
 * - Nom + muscle groups
 * - Instructions
 * - Target sets/reps/rest
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { WorkoutExerciseLog } from '@/db/schema-workout-sessions';

interface ExerciseViewProps {
  exerciseLog: WorkoutExerciseLog;
  exerciseData: any; // From workout.exercises array
  isActive: boolean; // True when actively doing exercise
}

export function ExerciseView({
  exerciseLog,
  exerciseData,
  isActive,
}: ExerciseViewProps) {
  // Get exercise details
  const exerciseName = exerciseData?.exercise_name || 'Exercise';
  const muscleGroups = exerciseData?.muscle_groups || [];
  const instructions = exerciseData?.instructions || [];
  const imageUrl = exerciseData?.image_url;
  const videoUrl = exerciseData?.video_url;

  // Target values
  const targetSets = exerciseLog.target_sets;
  const targetReps = exerciseLog.target_reps || 'N/A';
  const targetRestSeconds = 90; // TODO: Get from workout or set logs

  return (
    <View style={styles.container}>
      {/* Active indicator */}
      {isActive && <View style={styles.activeIndicator} />}

      {/* Media preview */}
      {imageUrl && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          {videoUrl && (
            <View style={styles.videoOverlay}>
              <Text style={styles.videoPlayIcon}>▶</Text>
            </View>
          )}
        </View>
      )}

      {/* Exercise header */}
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>

        {/* Muscle groups */}
        {muscleGroups.length > 0 && (
          <View style={styles.muscleGroupsContainer}>
            {muscleGroups.map((muscle: string, idx: number) => (
              <View key={idx} style={styles.musclePill}>
                <Text style={styles.musclePillText}>{muscle}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Target specs */}
      <View style={styles.targetContainer}>
        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>Sets</Text>
          <Text style={styles.targetValue}>{targetSets}</Text>
        </View>

        <View style={styles.targetDivider} />

        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>Reps</Text>
          <Text style={styles.targetValue}>{targetReps}</Text>
        </View>

        <View style={styles.targetDivider} />

        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>Rest</Text>
          <Text style={styles.targetValue}>{targetRestSeconds}s</Text>
        </View>
      </View>

      {/* Instructions */}
      {instructions.length > 0 && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          {instructions.map((instruction: string, idx: number) => (
            <View key={idx} style={styles.instructionRow}>
              <Text style={styles.instructionNumber}>{idx + 1}.</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeIndicator: {
    height: 4,
    backgroundColor: '#34C759', // Green - Active
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#2C2C2E',
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoPlayIcon: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  header: {
    padding: 16,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  musclePill: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.4)',
  },
  musclePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 0.2,
  },
  targetContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C2C2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
  },
  targetDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  instructionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
    width: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
});
