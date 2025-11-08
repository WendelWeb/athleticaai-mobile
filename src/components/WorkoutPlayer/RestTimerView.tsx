/**
 * ⏱️ REST TIMER VIEW - Adaptive Rest Timer Display
 *
 * Timer de repos intelligent avec:
 * - Countdown avec progress ring
 * - Adaptive reasoning display
 * - Skip button
 * - Add time buttons (+15s, +30s)
 * - Haptic feedback
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { AdaptiveRestCalculation } from '@/types/workoutSession';

interface RestTimerViewProps {
  elapsedSeconds: number;
  remainingSeconds: number;
  progress: number; // 0-1
  restCalculation: AdaptiveRestCalculation | null;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
}

export function RestTimerView({
  elapsedSeconds,
  remainingSeconds,
  progress,
  restCalculation,
  onSkip,
  onAddTime,
}: RestTimerViewProps) {
  // Format time (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress ring (simple circle implementation)
  const circleProgress = progress * 360;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Rest Timer</Text>

      {/* Circular progress */}
      <View style={styles.circularTimerContainer}>
        <View style={styles.circularTimerBackground}>
          {/* TODO: Replace with actual circular progress (react-native-svg or reanimated) */}
          <View
            style={[
              styles.circularTimerFill,
              {
                transform: [{ rotate: `${circleProgress}deg` }],
              },
            ]}
          />
        </View>

        {/* Timer display */}
        <View style={styles.timerTextContainer}>
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.timerSubtext}>remaining</Text>
        </View>
      </View>

      {/* Adaptive reasoning */}
      {restCalculation && (
        <View style={styles.reasoningContainer}>
          <Text style={styles.reasoningTitle}>
            💡 Recommended: {restCalculation.recommended_rest_seconds}s
          </Text>
          <Text style={styles.reasoningText}>{restCalculation.reasoning}</Text>
          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${restCalculation.confidence * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              {Math.round(restCalculation.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      )}

      {/* Add time buttons */}
      <View style={styles.addTimeContainer}>
        <Text style={styles.addTimeLabel}>Need more rest?</Text>
        <View style={styles.addTimeButtons}>
          <Pressable
            style={({ pressed }) => [styles.addTimeButton, pressed && styles.addTimeButtonPressed]}
            onPress={() => onAddTime(15)}
          >
            <Text style={styles.addTimeButtonText}>+15s</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.addTimeButton, pressed && styles.addTimeButtonPressed]}
            onPress={() => onAddTime(30)}
          >
            <Text style={styles.addTimeButtonText}>+30s</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.addTimeButton, pressed && styles.addTimeButtonPressed]}
            onPress={() => onAddTime(60)}
          >
            <Text style={styles.addTimeButtonText}>+1m</Text>
          </Pressable>
        </View>
      </View>

      {/* Skip button */}
      <Pressable
        style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
        onPress={onSkip}
      >
        <Text style={styles.skipButtonText}>Skip Rest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  circularTimerContainer: {
    width: 220,
    height: 220,
    marginBottom: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularTimerBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    backgroundColor: '#2C2C2E',
    borderWidth: 8,
    borderColor: '#007AFF',
    position: 'absolute',
  },
  circularTimerFill: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  timerTextContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  reasoningContainer: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700', // Gold
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  reasoningText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 10,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
  },
  addTimeContainer: {
    width: '100%',
    marginBottom: 16,
  },
  addTimeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
  },
  addTimeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  addTimeButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addTimeButtonPressed: {
    opacity: 0.7,
  },
  addTimeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  skipButton: {
    width: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonPressed: {
    opacity: 0.8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
