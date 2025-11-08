/**
 * Onboarding Step 7: Availability
 *
 * User sets workout frequency and preferred time
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { WorkoutMoment } from '@/types/onboarding';

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const TIME_OPTIONS: { value: WorkoutMoment; label: string; icon: string; description: string }[] = [
  { value: 'morning', label: 'Morning', icon: '🌅', description: '6AM - 10AM' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️', description: '12PM - 5PM' },
  { value: 'evening', label: 'Evening', icon: '🌙', description: '6PM - 10PM' },
  { value: 'flexible', label: 'Flexible', icon: '🔄', description: 'Anytime' },
];

export default function Step7Availability() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [daysPerWeek, setDaysPerWeek] = useState(data.days_per_week || 3);
  const [minutesPerSession, setMinutesPerSession] = useState(
    data.minutes_per_session || 30
  );
  const [preferredTime, setPreferredTime] = useState<WorkoutMoment>(
    data.preferred_workout_time || 'flexible'
  );

  const handleContinue = () => {
    updateData({
      days_per_week: daysPerWeek,
      minutes_per_session: minutesPerSession,
      preferred_workout_time: preferredTime,
    });
    router.push('/(onboarding)/step-8');
  };

  return (
    <OnboardingContainer
      step={7}
      totalSteps={9}
      title="Your Availability"
      subtitle="How often can you workout?"
    >
      {/* Days per Week */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
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
            Days per Week
          </Text>
          <Text
            style={[
              styles.value,
              {
                color: theme.colors.primary[500],
                fontWeight: theme.typography.fontWeight.bold,
              },
            ]}
          >
            {daysPerWeek} {daysPerWeek === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <Slider
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={daysPerWeek}
          onValueChange={setDaysPerWeek}
          minimumTrackTintColor={theme.colors.primary[500]}
          maximumTrackTintColor={
            theme.isDark ? theme.colors.dark.border : theme.colors.light.border
          }
          thumbTintColor={theme.colors.primary[500]}
        />
      </View>

      {/* Duration per Session */}
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
          Duration per Session
        </Text>
        <View style={styles.durationOptions}>
          {DURATION_OPTIONS.map((duration) => {
            const isSelected = minutesPerSession === duration;
            return (
              <TouchableOpacity
                key={duration}
                onPress={() => setMinutesPerSession(duration)}
                style={[
                  styles.durationOption,
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
                <Text
                  style={[
                    styles.durationLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                      fontWeight: theme.typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {duration}'
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Preferred Time */}
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
          Preferred Workout Time
        </Text>
        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((time) => {
            const isSelected = preferredTime === time.value;
            return (
              <TouchableOpacity
                key={time.value}
                onPress={() => setPreferredTime(time.value)}
                style={[
                  styles.timeCard,
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
                <Text style={styles.timeIcon}>{time.icon}</Text>
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                      fontWeight: theme.typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {time.label}
                </Text>
                <Text
                  style={[
                    styles.timeDescription,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.secondary
                        : theme.colors.light.text.secondary,
                    },
                  ]}
                >
                  {time.description}
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
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 17,
    marginBottom: 16,
  },
  value: {
    fontSize: 20,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 18,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  timeIcon: {
    fontSize: 32,
  },
  timeLabel: {
    fontSize: 16,
  },
  timeDescription: {
    fontSize: 12,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
