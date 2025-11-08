/**
 * Onboarding Step 3: Physical Information
 *
 * User enters age, gender, height, weight
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { Gender } from '@/types/onboarding';

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
  { value: 'other', label: 'Other', icon: '🧑' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🤐' },
];

export default function Step3PhysicalInfo() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [age, setAge] = useState(data.age || 25);
  const [gender, setGender] = useState<Gender>(data.gender || 'male');
  const [heightCm, setHeightCm] = useState(data.height_cm || 170);
  const [weightKg, setWeightKg] = useState(data.weight_kg || 70);

  const handleContinue = () => {
    updateData({
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
    });
    router.push('/(onboarding)/step-4');
  };

  const canContinue = age >= 13 && age <= 100 && heightCm >= 120 && heightCm <= 250 && weightKg >= 30 && weightKg <= 300;

  return (
    <OnboardingContainer
      step={3}
      totalSteps={9}
      title="Tell Us About Yourself"
      subtitle="This helps us personalize your experience"
    >
      {/* Gender Selection */}
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
          Gender
        </Text>
        <View style={styles.genderOptions}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = gender === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setGender(option.value)}
                style={[
                  styles.genderOption,
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
                <Text style={styles.genderIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.genderLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Age Slider */}
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
            Age
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
            {age} years
          </Text>
        </View>
        <Slider
          minimumValue={13}
          maximumValue={100}
          step={1}
          value={age}
          onValueChange={setAge}
          minimumTrackTintColor={theme.colors.primary[500]}
          maximumTrackTintColor={
            theme.isDark ? theme.colors.dark.border : theme.colors.light.border
          }
          thumbTintColor={theme.colors.primary[500]}
        />
      </View>

      {/* Height Slider */}
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
            Height
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
            {heightCm} cm
          </Text>
        </View>
        <Slider
          minimumValue={120}
          maximumValue={250}
          step={1}
          value={heightCm}
          onValueChange={setHeightCm}
          minimumTrackTintColor={theme.colors.primary[500]}
          maximumTrackTintColor={
            theme.isDark ? theme.colors.dark.border : theme.colors.light.border
          }
          thumbTintColor={theme.colors.primary[500]}
        />
      </View>

      {/* Weight Slider */}
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
            Weight
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
            {weightKg} kg
          </Text>
        </View>
        <Slider
          minimumValue={30}
          maximumValue={300}
          step={1}
          value={weightKg}
          onValueChange={setWeightKg}
          minimumTrackTintColor={theme.colors.primary[500]}
          maximumTrackTintColor={
            theme.isDark ? theme.colors.dark.border : theme.colors.light.border
          }
          thumbTintColor={theme.colors.primary[500]}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.button}
        >
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
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  genderIcon: {
    fontSize: 32,
  },
  genderLabel: {
    fontSize: 14,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
