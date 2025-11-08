/**
 * Onboarding Welcome Screen
 *
 * Introduction screen before starting the 9-step onboarding flow
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';

export default function OnboardingWelcome() {
  const router = useRouter();
  const theme = useStyledTheme();

  const handleStart = () => {
    router.push('/(onboarding)/step-1');
  };

  return (
    <LinearGradient
      colors={
        theme.isDark
          ? ['#000000', '#1a1a1a', '#0A84FF']
          : ['#FFFFFF', '#F5F5F7', '#0A84FF']
      }
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>⚡</Text>
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
              Welcome, Warrior
            </Text>
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
              Let's build your personalized fitness journey in just 10 simple steps
            </Text>
          </View>

          {/* Benefits List */}
          <View style={styles.benefits}>
            <BenefitItem
              icon="🎯"
              text="Personalized workout plans based on your goals"
              theme={theme}
            />
            <BenefitItem
              icon="🤖"
              text="AI coach that adapts to your progress"
              theme={theme}
            />
            <BenefitItem
              icon="📊"
              text="Track your transformation journey"
              theme={theme}
            />
            <BenefitItem
              icon="👥"
              text="Join a community of Warriors"
              theme={theme}
            />
          </View>

          {/* Info */}
          <Text
            style={[
              styles.info,
              {
                color: theme.isDark
                  ? theme.colors.dark.text.tertiary
                  : theme.colors.light.text.tertiary,
              },
            ]}
          >
            Takes less than 3 minutes • Skip anytime
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleStart}
            style={styles.button}
          >
            Let's Begin
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const BenefitItem: React.FC<{ icon: string; text: string; theme: any }> = ({
  icon,
  text,
  theme,
}) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitIcon}>{icon}</Text>
    <Text
      style={[
        styles.benefitText,
        {
          color: theme.isDark
            ? theme.colors.dark.text.primary
            : theme.colors.light.text.primary,
        },
      ]}
    >
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefits: {
    gap: 20,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  benefitIcon: {
    fontSize: 32,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    width: '100%',
  },
});
