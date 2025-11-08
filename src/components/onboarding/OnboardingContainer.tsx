/**
 * Onboarding Container
 *
 * Shared container for all onboarding steps with progress indicator
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingContainerProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  showBackButton = true,
}) => {
  const theme = useStyledTheme();
  const { previousStep } = useOnboarding();

  const progress = (step / totalSteps) * 100;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      damping: 20,
      stiffness: 90,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
        },
      ]}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.border
                : theme.colors.light.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary[500],
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Step Counter */}
        <Text
          style={[
            styles.stepCounter,
            {
              color: theme.isDark
                ? theme.colors.dark.text.secondary
                : theme.colors.light.text.secondary,
            },
          ]}
        >
          {step} / {totalSteps}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          {showBackButton && step > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.backButton,
                {
                  backgroundColor: theme.isDark
                    ? theme.colors.dark.surface
                    : theme.colors.light.surface,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                },
              ]}
            >
              {title}
            </Text>

            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.isDark
                      ? theme.colors.dark.text.secondary
                      : theme.colors.light.text.secondary,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 13,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
  },
  headerText: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
});
