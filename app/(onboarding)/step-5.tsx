/**
 * Onboarding Step 5: Injuries & Limitations
 *
 * User selects injuries and medical conditions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button, Input } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';

const COMMON_INJURIES = [
  { value: 'knee', label: 'Knee Issues', icon: '🦵' },
  { value: 'back', label: 'Back Pain', icon: '🔙' },
  { value: 'shoulder', label: 'Shoulder Issues', icon: '💪' },
  { value: 'ankle', label: 'Ankle Problems', icon: '🦶' },
  { value: 'wrist', label: 'Wrist Pain', icon: '✋' },
  { value: 'hip', label: 'Hip Issues', icon: '🦴' },
  { value: 'neck', label: 'Neck Pain', icon: '🧑' },
  { value: 'elbow', label: 'Elbow Pain', icon: '💪' },
];

const MEDICAL_CONDITIONS = [
  { value: 'heart', label: 'Heart Condition', icon: '❤️' },
  { value: 'asthma', label: 'Asthma', icon: '🫁' },
  { value: 'diabetes', label: 'Diabetes', icon: '💉' },
  { value: 'high_bp', label: 'High Blood Pressure', icon: '🩺' },
  { value: 'arthritis', label: 'Arthritis', icon: '🦴' },
  { value: 'pregnant', label: 'Pregnant', icon: '🤰' },
];

export default function Step5Injuries() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [selectedInjuries, setSelectedInjuries] = useState<string[]>(data.injuries || []);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(data.medical_conditions || []);
  const [notes, setNotes] = useState(data.notes || '');

  const toggleInjury = (injury: string) => {
    setSelectedInjuries((prev) =>
      prev.includes(injury) ? prev.filter((i) => i !== injury) : [...prev, injury]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const handleContinue = () => {
    updateData({
      injuries: selectedInjuries,
      medical_conditions: selectedConditions,
      notes: notes || null,
    });
    router.push('/(onboarding)/step-6');
  };

  const handleSkip = () => {
    updateData({
      injuries: [],
      medical_conditions: [],
      notes: null,
    });
    router.push('/(onboarding)/step-6');
  };

  return (
    <OnboardingContainer
      step={5}
      totalSteps={9}
      title="Any Injuries or Limitations?"
      subtitle="We'll adjust your workouts accordingly"
    >
      {/* Injuries */}
      <View style={styles.section}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
        >
          Current or Past Injuries
        </Text>
        <View style={styles.chipsGrid}>
          {COMMON_INJURIES.map((injury) => {
            const isSelected = selectedInjuries.includes(injury.value);
            return (
              <TouchableOpacity
                key={injury.value}
                onPress={() => toggleInjury(injury.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary[500]
                      : theme.isDark
                      ? theme.colors.dark.surface
                      : theme.colors.light.surface,
                    borderColor: isSelected
                      ? theme.colors.primary[500]
                      : theme.isDark
                      ? theme.colors.dark.border
                      : theme.colors.light.border,
                  },
                ]}
              >
                <Text style={styles.chipIcon}>{injury.icon}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                    },
                  ]}
                >
                  {injury.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Medical Conditions */}
      <View style={styles.section}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
        >
          Medical Conditions
        </Text>
        <View style={styles.chipsGrid}>
          {MEDICAL_CONDITIONS.map((condition) => {
            const isSelected = selectedConditions.includes(condition.value);
            return (
              <TouchableOpacity
                key={condition.value}
                onPress={() => toggleCondition(condition.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary[500]
                      : theme.isDark
                      ? theme.colors.dark.surface
                      : theme.colors.light.surface,
                    borderColor: isSelected
                      ? theme.colors.primary[500]
                      : theme.isDark
                      ? theme.colors.dark.border
                      : theme.colors.light.border,
                  },
                ]}
              >
                <Text style={styles.chipIcon}>{condition.icon}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                    },
                  ]}
                >
                  {condition.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
        >
          Additional Notes (Optional)
        </Text>
        <Input
          placeholder="Any other health information we should know?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          containerStyle={styles.notesInput}
        />
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <Button variant="ghost" size="lg" onPress={handleSkip} style={styles.button}>
          Skip (I'm healthy!)
        </Button>
        <Button variant="primary" size="lg" onPress={handleContinue} style={styles.button}>
          Continue
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 17,
    marginBottom: 16,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipIcon: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: 14,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
