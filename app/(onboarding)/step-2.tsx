/**
 * Onboarding Step 2: Fitness Level
 *
 * User selects their current fitness level
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FITNESS_LEVEL_OPTIONS, type FitnessLevel } from '@/types/onboarding';

export default function Step2FitnessLevel() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | null>(data.fitness_level);

  const handleSelectLevel = (level: FitnessLevel) => {
    setSelectedLevel(level);
    updateData({ fitness_level: level });
  };

  const handleContinue = () => {
    if (selectedLevel) {
      router.push('/(onboarding)/step-3');
    }
  };

  return (
    <OnboardingContainer
      step={2}
      totalSteps={9}
      title="What's Your Fitness Level?"
      subtitle="Be honest - this helps us personalize your workouts"
    >
      <View style={styles.options}>
        {FITNESS_LEVEL_OPTIONS.map((option) => {
          const isSelected = selectedLevel === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              onPress={() => handleSelectLevel(option.value)}
              style={[
                styles.option,
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
              <View style={styles.optionHeader}>
                <Text
                  style={[
                    styles.optionLabel,
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
                  {option.label}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: theme.colors.primary[500] },
                    ]}
                  >
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.optionDescription,
                  {
                    color: theme.isDark
                      ? theme.colors.dark.text.secondary
                      : theme.colors.light.text.secondary,
                  },
                ]}
              >
                {option.description}
              </Text>

              <View style={styles.examples}>
                {option.examples.map((example, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.exampleText,
                      {
                        color: theme.isDark
                          ? theme.colors.dark.text.tertiary
                          : theme.colors.light.text.tertiary,
                      },
                    ]}
                  >
                    • {example}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!selectedLevel}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 16,
    marginBottom: 32,
  },
  option: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 20,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 21,
  },
  examples: {
    gap: 6,
    marginTop: 4,
  },
  exampleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
