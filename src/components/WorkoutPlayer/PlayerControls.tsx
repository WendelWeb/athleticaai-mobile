/**
 * 🎮 PLAYER CONTROLS - Workout Control Buttons
 *
 * Barre de contrôle avec boutons:
 * - Play/Pause/Resume
 * - Previous/Next exercise
 * - Skip exercise
 * - Complete workout
 * - Exit
 *
 * Style Apple Music/Fitness avec haptics
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { SessionState } from '@/types/workoutSession';

interface PlayerControlsProps {
  state: SessionState;
  onPause: () => void;
  onResume: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkipExercise: () => void;
  onComplete: () => void;
  onExit: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
}

export function PlayerControls({
  state,
  onPause,
  onResume,
  onPrevious,
  onNext,
  onSkipExercise,
  onComplete,
  onExit,
  isPreviousDisabled,
  isNextDisabled,
}: PlayerControlsProps) {
  const isPaused = state === 'paused';
  const isCompleted = state === 'completed';

  return (
    <View style={styles.container}>
      {/* Top row: Secondary controls */}
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onSkipExercise}
          disabled={isCompleted}
        >
          <Text style={styles.secondaryButtonText}>Skip Exercise</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onExit}
        >
          <Text style={styles.secondaryButtonText}>Exit</Text>
        </Pressable>
      </View>

      {/* Main row: Navigation + Play/Pause */}
      <View style={styles.mainRow}>
        {/* Previous button */}
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.buttonPressed,
            isPreviousDisabled && styles.navButtonDisabled,
          ]}
          onPress={onPrevious}
          disabled={isPreviousDisabled || isCompleted}
        >
          <Text style={[styles.navButtonIcon, isPreviousDisabled && styles.navButtonIconDisabled]}>
            ◀
          </Text>
        </Pressable>

        {/* Play/Pause button (center) */}
        <Pressable
          style={({ pressed }) => [
            styles.playPauseButton,
            pressed && styles.buttonPressed,
            isCompleted && styles.playPauseButtonCompleted,
          ]}
          onPress={isPaused ? onResume : onPause}
          disabled={isCompleted}
        >
          <Text style={styles.playPauseIcon}>{isPaused ? '▶' : '❚❚'}</Text>
        </Pressable>

        {/* Next button */}
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.buttonPressed,
            isNextDisabled && styles.navButtonDisabled,
          ]}
          onPress={onNext}
          disabled={isNextDisabled || isCompleted}
        >
          <Text style={[styles.navButtonIcon, isNextDisabled && styles.navButtonIconDisabled]}>
            ▶
          </Text>
        </Pressable>
      </View>

      {/* Bottom row: Complete button */}
      <Pressable
        style={({ pressed }) => [
          styles.completeButton,
          pressed && styles.buttonPressed,
          isCompleted && styles.completeButtonCompleted,
        ]}
        onPress={onComplete}
        disabled={isCompleted}
      >
        <Text style={styles.completeButtonText}>
          {isCompleted ? '✓ Workout Completed' : 'Complete Workout'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    paddingTop: 12,
    paddingBottom: 30, // Safe area
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 0.2,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 40,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  navButtonIconDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  playPauseButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playPauseButtonCompleted: {
    backgroundColor: '#34C759',
  },
  playPauseIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonCompleted: {
    backgroundColor: 'rgba(52, 199, 89, 0.5)',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
