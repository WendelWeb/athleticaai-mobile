/**
 * Onboarding Step 9: Motivation & Commitment
 *
 * User reflects on their motivation and why this goal matters
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Step9Motivation() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [motivation, setMotivation] = useState(data.motivation || '');

  const handleContinue = () => {
    // Update motivation in context
    updateData({ motivation: motivation.trim() || null });

    // Navigate to final step (step-10)
    router.push('/step-10' as any);
  };

  return (
    <OnboardingContainer
      step={9}
      totalSteps={10}
      title="What Drives You?"
      subtitle="Understanding your 'why' will keep you motivated"
    >
      {/* Motivational Quote */}
      <View
        style={[
          styles.quoteCard,
          {
            backgroundColor: theme.isDark
              ? theme.colors.dark.surface
              : theme.colors.light.surface,
          },
        ]}
      >
        <Text style={styles.quoteIcon}>💪</Text>
        <Text
          style={[
            styles.quoteText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
            },
          ]}
        >
          "Your body can stand almost anything. It's your mind you have to convince."
        </Text>
        <Text
          style={[
            styles.quoteAuthor,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          — Unknown
        </Text>
      </View>

      {/* Goal Summary */}
      <View style={styles.goalSummary}>
        <Text
          style={[
            styles.summaryTitle,
            {
              color: theme.isDark
                ? theme.colors.dark.text.secondary
                : theme.colors.light.text.secondary,
            },
          ]}
        >
          Your Goal
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>🎯</Text>
          <Text
            style={[
              styles.summaryText,
              {
                color: theme.isDark
                  ? theme.colors.dark.text.primary
                  : theme.colors.light.text.primary,
              },
            ]}
          >
            {data.goal
              ? data.goal.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
              : 'Not set'}
          </Text>
        </View>
        {data.weight_kg && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>⚖️</Text>
            <Text
              style={[
                styles.summaryText,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                },
              ]}
            >
              Current: {data.weight_kg} kg
            </Text>
          </View>
        )}
      </View>

      {/* Motivation Input */}
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
          What motivates you? (Optional but recommended)
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
          placeholder="Why is this important to you? What will achieving your goal mean? Who are you doing this for?"
          placeholderTextColor={
            theme.isDark
              ? theme.colors.dark.text.tertiary
              : theme.colors.light.text.tertiary
          }
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
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
          {motivation.length}/500 characters
        </Text>
      </View>

      {/* Examples */}
      <View style={styles.examples}>
        <Text
          style={[
            styles.examplesTitle,
            {
              color: theme.isDark
                ? theme.colors.dark.text.secondary
                : theme.colors.light.text.secondary,
            },
          ]}
        >
          Examples:
        </Text>
        <Text
          style={[
            styles.exampleText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          • "I want to be healthy for my kids"
        </Text>
        <Text
          style={[
            styles.exampleText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          • "I want to feel confident in my own skin"
        </Text>
        <Text
          style={[
            styles.exampleText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          • "I want to prove to myself I can do this"
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          style={styles.button}
        >
          Continue to Final Step
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  quoteCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    textAlign: 'center',
  },
  goalSummary: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  summaryText: {
    fontSize: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 150,
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
  examples: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    marginTop: 8,
  },
  button: {
    width: '100%',
  },
});
