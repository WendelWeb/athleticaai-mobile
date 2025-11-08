/**
 * Onboarding Step 10: Final Target & Motivation
 *
 * User sets their specific target goal and motivation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { db } from '@/db';
import { useClerkAuth } from '@/hooks/useClerkAuth';

export default function Step10Target() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();
  const { user } = useClerkAuth();

  const [targetWeight, setTargetWeight] = useState(
    data.target_weight_kg?.toString() || ''
  );
  const [targetDate, setTargetDate] = useState(data.target_date || '');
  const [motivation, setMotivation] = useState(data.motivation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate suggested date (3 months from now)
  const suggestedDate = new Date();
  suggestedDate.setMonth(suggestedDate.getMonth() + 3);
  const suggestedDateStr = suggestedDate.toISOString().split('T')[0];

  const handleSetSuggestedDate = () => {
    setTargetDate(suggestedDateStr);
  };

  const handleComplete = async () => {
    // Basic validation
    if (!targetWeight || parseFloat(targetWeight) <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid target weight');
      return;
    }

    if (!targetDate) {
      Alert.alert('Missing Date', 'Please set a target date');
      return;
    }

    if (!motivation || motivation.trim().length < 10) {
      Alert.alert(
        'Add Motivation',
        'Please write at least a short motivation (10+ characters)'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Update onboarding data
      const completedData = {
        target_weight_kg: parseFloat(targetWeight),
        target_date: targetDate,
        motivation: motivation.trim(),
        completed_at: new Date().toISOString(),
      };

      updateData(completedData);

      // Save onboarding data to database with Drizzle
      if (user) {
        const { profiles } = await import('@/db');
        const { eq } = await import('drizzle-orm');

        // Calculate birth year from age
        const birthYear = data.age ? new Date().getFullYear() - data.age : null;
        const dateOfBirth = birthYear ? `${birthYear}-01-01` : null;

        // Map goal type (handle potential mismatches)
        const goalMap: Record<string, string> = {
          'lose_weight': 'lose_weight',
          'build_muscle': 'build_muscle',
          'get_stronger': 'get_stronger',
          'improve_endurance': 'improve_endurance',
          'stay_healthy': 'stay_healthy',
          'athletic_performance': 'athletic_performance',
          'increase_flexibility': 'stay_healthy', // Map flexibility to stay_healthy
        };
        const mappedGoal = data.goal ? goalMap[data.goal] : undefined;

        // Map fitness level (handle expert → elite)
        const fitnessMap: Record<string, string> = {
          'beginner': 'beginner',
          'intermediate': 'intermediate',
          'advanced': 'advanced',
          'elite': 'elite',
          'expert': 'elite', // Map expert to elite
        };
        const mappedFitnessLevel = data.fitness_level ? fitnessMap[data.fitness_level] : undefined;

        // Update user profile with onboarding data
        const result = await db.update(profiles)
          .set({
            // Primary goal and fitness level (with mapped values)
            primary_goal: mappedGoal as any,
            fitness_level: mappedFitnessLevel as any,

            // Personal info
            gender: data.gender || undefined,
            date_of_birth: dateOfBirth,
            age: data.age || undefined,
            height_cm: data.height_cm ? data.height_cm.toString() : undefined,
            weight_kg: data.weight_kg ? data.weight_kg.toString() : undefined,

            // Target
            target_weight_kg: targetWeight ? parseFloat(targetWeight).toString() : undefined,
            target_date: targetDate || undefined,
            motivation: motivation.trim() || undefined,

            // Activity and sports
            sports_history: data.sports_history || [],
            current_activity_level: data.current_activity_level || undefined,

            // Health
            injuries: data.injuries || [],
            medical_conditions: data.medical_conditions || [],
            notes: data.notes || undefined,

            // Equipment and location
            equipment_available: data.equipment_available || [],
            workout_location: data.workout_location || undefined,

            // Schedule
            days_per_week: data.days_per_week || undefined,
            minutes_per_session: data.minutes_per_session || undefined,

            // Preferences
            music_enabled: data.music_enabled ?? true,
            music_genres: data.music_genres || [],
            voice_coach_enabled: data.voice_coach_enabled ?? true,
            language: data.language || 'en',
            units: data.units || 'metric',

            // Completion status
            onboarding_completed: true,
            onboarding_completed_at: new Date(),

            // Updated timestamp
            updated_at: new Date(),
          })
          .where(eq(profiles.id, user.id))
          .returning();

        if (!result || result.length === 0) {
          throw new Error('Failed to update profile - profile not found');
        }
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      // Clean error message (no console spam)
      Alert.alert('Could Not Save', 'Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingContainer
      step={10}
      totalSteps={10}
      title="Set Your Target"
      subtitle="Define your goal and what drives you"
    >
      {/* Current Weight Reminder */}
      {data.weight_kg && (
        <View
          style={[
            styles.currentWeightBadge,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.surface
                : theme.colors.light.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.currentWeightLabel,
              {
                color: theme.isDark
                  ? theme.colors.dark.text.secondary
                  : theme.colors.light.text.secondary,
              },
            ]}
          >
            Current Weight
          </Text>
          <Text
            style={[
              styles.currentWeightValue,
              {
                color: theme.colors.primary[500],
              },
            ]}
          >
            {data.weight_kg} kg
          </Text>
        </View>
      )}

      {/* Target Weight */}
      <View style={styles.field}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
            },
          ]}
        >
          Target Weight (kg) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.surface
                : theme.colors.light.surface,
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              borderColor: theme.isDark
                ? theme.colors.dark.border
                : theme.colors.light.border,
            },
          ]}
          value={targetWeight}
          onChangeText={setTargetWeight}
          placeholder="e.g., 75"
          placeholderTextColor={
            theme.isDark
              ? theme.colors.dark.text.tertiary
              : theme.colors.light.text.tertiary
          }
          keyboardType="numeric"
        />
      </View>

      {/* Target Date */}
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              {
                color: theme.isDark
                  ? theme.colors.dark.text.primary
                  : theme.colors.light.text.primary,
              },
            ]}
          >
            Target Date *
          </Text>
          <TouchableOpacity onPress={handleSetSuggestedDate}>
            <Text
              style={[
                styles.suggestedLink,
                { color: theme.colors.primary[500] },
              ]}
            >
              Use suggested (3 months)
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.surface
                : theme.colors.light.surface,
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              borderColor: theme.isDark
                ? theme.colors.dark.border
                : theme.colors.light.border,
            },
          ]}
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD (e.g., 2025-03-01)"
          placeholderTextColor={
            theme.isDark
              ? theme.colors.dark.text.tertiary
              : theme.colors.light.text.tertiary
          }
        />
      </View>

      {/* Motivation */}
      <View style={styles.field}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
            },
          ]}
        >
          What Motivates You? *
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.surface
                : theme.colors.light.surface,
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              borderColor: theme.isDark
                ? theme.colors.dark.border
                : theme.colors.light.border,
            },
          ]}
          value={motivation}
          onChangeText={setMotivation}
          placeholder="Why is this goal important to you? What will achieving it mean?"
          placeholderTextColor={
            theme.isDark
              ? theme.colors.dark.text.tertiary
              : theme.colors.light.text.tertiary
          }
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text
          style={[
            styles.helperText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          {motivation.length}/200 characters
        </Text>
      </View>

      {/* Complete Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleComplete}
          loading={isSubmitting}
          disabled={
            !targetWeight ||
            !targetDate ||
            !motivation ||
            motivation.trim().length < 10
          }
          style={styles.button}
        >
          {isSubmitting ? 'Saving...' : "Let's Begin Your Journey 🚀"}
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  currentWeightBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  currentWeightLabel: {
    fontSize: 14,
  },
  currentWeightValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  field: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestedLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  footer: {
    marginTop: 32,
  },
  button: {
    width: '100%',
  },
});
