/**
 * Onboarding Step 4: Sports History
 *
 * User selects sports they've practiced and current activity level
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';

const SPORTS_OPTIONS = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'weightlifting', label: 'Weightlifting', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'pilates', label: 'Pilates', icon: '🤸' },
  { value: 'boxing', label: 'Boxing', icon: '🥊' },
  { value: 'martial_arts', label: 'Martial Arts', icon: '🥋' },
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'crossfit', label: 'CrossFit', icon: '💪' },
  { value: 'dancing', label: 'Dancing', icon: '💃' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'climbing', label: 'Climbing', icon: '🧗' },
  { value: 'other', label: 'Other', icon: '🎯' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', description: '1-2 times/week' },
  { value: 'moderately_active', label: 'Moderately Active', description: '3-4 times/week' },
  { value: 'very_active', label: 'Very Active', description: '5-6 times/week' },
  { value: 'extremely_active', label: 'Extremely Active', description: 'Daily intense training' },
];

export default function Step4SportsHistory() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [selectedSports, setSelectedSports] = useState<string[]>(data.sports_history || []);
  const [activityLevel, setActivityLevel] = useState(data.current_activity_level || 'lightly_active');

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleContinue = () => {
    updateData({
      sports_history: selectedSports,
      current_activity_level: activityLevel,
    });
    router.push('/(onboarding)/step-5');
  };

  return (
    <OnboardingContainer
      step={4}
      totalSteps={9}
      title="Sports Background"
      subtitle="What sports or activities have you done?"
    >
      {/* Sports Selection */}
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
          Select all that apply
        </Text>
        <View style={styles.sportsGrid}>
          {SPORTS_OPTIONS.map((sport) => {
            const isSelected = selectedSports.includes(sport.value);
            return (
              <TouchableOpacity
                key={sport.value}
                onPress={() => toggleSport(sport.value)}
                style={[
                  styles.sportChip,
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
                <Text style={styles.sportIcon}>{sport.icon}</Text>
                <Text
                  style={[
                    styles.sportLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                    },
                  ]}
                >
                  {sport.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Activity Level */}
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
          Current Activity Level
        </Text>
        <View style={styles.activityOptions}>
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = activityLevel === level.value;
            return (
              <TouchableOpacity
                key={level.value}
                onPress={() => setActivityLevel(level.value as any)}
                style={[
                  styles.activityOption,
                  {
                    backgroundColor: theme.isDark
                      ? theme.colors.dark.surface
                      : theme.colors.light.surface,
                    borderColor: isSelected
                      ? theme.colors.primary[500]
                      : theme.isDark
                      ? theme.colors.dark.border
                      : theme.colors.light.border,
                    borderWidth: isSelected ? 3 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.activityLabel,
                    {
                      color: isSelected
                        ? theme.colors.primary[500]
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                      fontWeight: theme.typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    {
                      color: theme.isDark
                        ? theme.colors.dark.text.secondary
                        : theme.colors.light.text.secondary,
                    },
                  ]}
                >
                  {level.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
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
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportIcon: {
    fontSize: 18,
  },
  sportLabel: {
    fontSize: 14,
  },
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  activityLabel: {
    fontSize: 16,
  },
  activityDescription: {
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
