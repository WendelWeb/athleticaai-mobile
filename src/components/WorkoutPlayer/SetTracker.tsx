/**
 * ✅ SET TRACKER - Set Logging Component
 *
 * Track sets avec inputs:
 * - Reps completed
 * - Weight (kg)
 * - RPE (1-10)
 * - Form quality (1-5 stars)
 * - Notes
 *
 * Apple design avec inputs clairs et validation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import type { WorkoutSetLog } from '@/db/schema-workout-sessions';
import type { SetData } from '@/types/workoutSession';

interface SetTrackerProps {
  currentSetNumber: number;
  totalSets: number;
  setLogs: WorkoutSetLog[];
  onCompleteSet: (setData: SetData) => void;
  isPaused: boolean;
}

export function SetTracker({
  currentSetNumber,
  totalSets,
  setLogs,
  onCompleteSet,
  isPaused,
}: SetTrackerProps) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [selectedFormQuality, setSelectedFormQuality] = useState<number | null>(null);

  const handleCompleteSet = () => {
    // Validation
    if (!reps || parseInt(reps) <= 0) {
      Alert.alert('Invalid Input', 'Please enter reps completed.');
      return;
    }

    const setData: SetData = {
      set_number: currentSetNumber,
      reps_completed: parseInt(reps),
      weight_kg: weight ? parseFloat(weight) : undefined,
      rpe: selectedRPE || undefined,
      form_quality: selectedFormQuality || undefined,
      notes: undefined,
    };

    onCompleteSet(setData);

    // Reset inputs
    setReps('');
    setWeight('');
    setSelectedRPE(null);
    setSelectedFormQuality(null);
  };

  // Render previous sets
  const renderPreviousSets = () => {
    if (setLogs.length === 0) return null;

    return (
      <View style={styles.previousSetsContainer}>
        <Text style={styles.previousSetsTitle}>Previous Sets</Text>
        {setLogs.map((log, idx) => (
          <View key={log.id} style={styles.previousSetRow}>
            <Text style={styles.previousSetNumber}>Set {idx + 1}</Text>
            <Text style={styles.previousSetData}>
              {log.reps_completed} reps
              {log.weight_kg && ` @ ${log.weight_kg}kg`}
              {log.rpe && ` • RPE ${log.rpe}`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.setTitle}>
          Set {currentSetNumber} of {totalSets}
        </Text>
        {isPaused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedBadgeText}>PAUSED</Text>
          </View>
        )}
      </View>

      {/* Previous sets */}
      {renderPreviousSets()}

      {/* Current set inputs */}
      <View style={styles.inputsContainer}>
        {/* Reps input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps Completed *</Text>
          <TextInput
            style={styles.input}
            placeholder="12"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="number-pad"
            value={reps}
            onChangeText={setReps}
            editable={!isPaused}
          />
        </View>

        {/* Weight input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            editable={!isPaused}
          />
        </View>
      </View>

      {/* RPE selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>RPE (Rate of Perceived Exertion)</Text>
        <View style={styles.rpeGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
            <Pressable
              key={rpe}
              style={[
                styles.rpeButton,
                selectedRPE === rpe && styles.rpeButtonSelected,
                rpe >= 9 && styles.rpeButtonHard,
                rpe <= 6 && styles.rpeButtonEasy,
              ]}
              onPress={() => setSelectedRPE(rpe)}
              disabled={isPaused}
            >
              <Text
                style={[
                  styles.rpeButtonText,
                  selectedRPE === rpe && styles.rpeButtonTextSelected,
                ]}
              >
                {rpe}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.rpeHelperText}>
          1 = Very Easy • 5 = Moderate • 10 = Max Effort
        </Text>
      </View>

      {/* Form quality selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Form Quality</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setSelectedFormQuality(star)}
              disabled={isPaused}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.starIcon,
                  selectedFormQuality !== null && star <= selectedFormQuality ? styles.starIconFilled : undefined,
                ]}
              >
                {selectedFormQuality && star <= selectedFormQuality ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.formHelperText}>
          {selectedFormQuality === 5 && 'Perfect form'}
          {selectedFormQuality === 4 && 'Good form'}
          {selectedFormQuality === 3 && 'Acceptable'}
          {selectedFormQuality === 2 && 'Needs work'}
          {selectedFormQuality === 1 && 'Poor form'}
        </Text>
      </View>

      {/* Complete set button */}
      <Pressable
        style={({ pressed }) => [
          styles.completeButton,
          pressed && styles.completeButtonPressed,
          isPaused && styles.completeButtonDisabled,
        ]}
        onPress={handleCompleteSet}
        disabled={isPaused}
      >
        <Text style={styles.completeButtonText}>
          {currentSetNumber === totalSets ? 'Complete Exercise' : 'Complete Set'}
        </Text>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pausedBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pausedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  previousSetsContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  previousSetsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previousSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  previousSetNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  previousSetData: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    fontVariant: ['tabular-nums'],
  },
  inputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontVariant: ['tabular-nums'],
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  rpeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rpeButton: {
    width: 52,
    height: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rpeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  rpeButtonEasy: {
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  rpeButtonHard: {
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  rpeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    fontVariant: ['tabular-nums'],
  },
  rpeButtonTextSelected: {
    color: '#FFFFFF',
  },
  rpeHelperText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  starIconFilled: {
    color: '#FFD700', // Gold
  },
  formHelperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    minHeight: 16,
  },
  completeButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonPressed: {
    opacity: 0.8,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
