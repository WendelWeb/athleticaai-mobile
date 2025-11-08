/**
 * Onboarding Step 1: Goal Selection
 *
 * User selects their primary fitness goal
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { GOAL_OPTIONS, type GoalType } from '@/types/onboarding';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with padding

export default function Step1Goal() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(data.goal);

  const handleSelectGoal = (goal: GoalType) => {
    setSelectedGoal(goal);
    updateData({ goal });
  };

  const handleContinue = () => {
    if (selectedGoal) {
      router.push('/(onboarding)/step-2');
    }
  };

  return (
    <OnboardingContainer
      step={1}
      totalSteps={9}
      title="What's Your Goal?"
      subtitle="Choose your main fitness objective"
      showBackButton={false}
    >
      <View style={styles.grid}>
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selectedGoal === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              onPress={() => handleSelectGoal(option.value)}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                },
              ]}
            >
              <LinearGradient
                colors={
                  isSelected
                    ? [option.color, option.color + 'CC']
                    : theme.isDark
                    ? ['#1C1C1E', '#2C2C2E']
                    : ['#FFFFFF', '#F9F9FB']
                }
                style={[
                  styles.cardGradient,
                  {
                    borderColor: isSelected
                      ? option.color
                      : theme.isDark
                      ? theme.colors.dark.border
                      : theme.colors.light.border,
                    borderWidth: isSelected ? 3 : 1,
                  },
                ]}
              >
                <Text style={styles.cardIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.cardLabel,
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
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.secondary
                        : theme.colors.light.text.secondary,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </LinearGradient>
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
          disabled={!selectedGoal}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    aspectRatio: 1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
