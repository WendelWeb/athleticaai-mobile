/**
 * 📊 PROGRESS INDICATOR - Workout Progress Component
 *
 * Affiche la progression globale du workout
 * Style Apple Fitness+ avec timeline interactive
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  currentExerciseIndex: number;
  totalExercises: number;
  completionPercentage: number;
  elapsedSeconds: number;
}

export function ProgressIndicator({
  currentExerciseIndex,
  totalExercises,
  completionPercentage,
  elapsedSeconds,
}: ProgressIndicatorProps) {
  // Format elapsed time (HH:MM:SS or MM:SS)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Top row: Exercise counter + Timer */}
      <View style={styles.topRow}>
        <Text style={styles.exerciseCounter}>
          Exercise {currentExerciseIndex + 1} of {totalExercises}
        </Text>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
      </View>

      {/* Completion percentage */}
      <Text style={styles.completionText}>{Math.round(completionPercentage)}% Complete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseCounter: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  timer: {
    fontSize: 17,
    fontWeight: '700',
    color: '#34C759', // Green
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF', // Apple blue
    borderRadius: 2,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
