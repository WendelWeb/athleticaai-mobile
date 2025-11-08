/**
 * Welcome Screen - First screen users see
 *
 * Features:
 * - Auto-redirect if already signed in
 * - Hero animation
 * - CTA buttons
 * - Smooth transitions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { Button } from '@components/ui/Button';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getProfile } from '@/services/drizzle/profile';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checking, setChecking] = useState(true);

  // Auto-redirect if already signed in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!isLoaded) return;

      // If user is signed in, redirect to app
      if (user) {
        try {
          // Check if profile exists and onboarding is complete
          console.log('🔍 [Index] Checking profile for user:', user.id);
          const { profile } = await getProfile(user.id);
          console.log('🔍 [Index] Profile:', profile ? 'EXISTS' : 'NULL');
          console.log('🔍 [Index] Onboarding completed:', profile?.onboarding_completed);

          if (profile?.onboarding_completed) {
            // User completed onboarding → go to tabs
            console.log('🔍 [Index] → Redirecting to /(tabs)');
            router.replace('/(tabs)');
          } else {
            // User needs to complete onboarding
            console.log('🔍 [Index] → Redirecting to /onboarding');
            router.replace('/onboarding');
          }
        } catch (error) {
          // Silent error - redirect to onboarding to be safe
          console.log('🔍 [Index] Error checking profile, redirecting to /onboarding');
          router.replace('/onboarding');
        }
      } else {
        // User not signed in → show welcome screen
        setChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [isLoaded, user]);

  // Show loading spinner while checking auth
  if (!isLoaded || checking) {
    return (
      <LinearGradient
        colors={theme.isDark ? ['#000000', '#1C1C1E', '#2C2C2E'] : ['#FFFFFF', '#F9F9FB', '#EBEBF5']}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text
          style={[
            styles.loadingText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.secondary
                : theme.colors.light.text.secondary,
            },
          ]}
        >
          Loading...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.isDark ? ['#000000', '#1C1C1E', '#2C2C2E'] : ['#FFFFFF', '#F9F9FB', '#EBEBF5']}
      style={styles.container}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.colors.primary[500] }]}>AthleticaAI</Text>
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
          Transform Your Body.{'\n'}Transform Your Life.
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <Button variant="primary" size="lg" fullWidth onPress={() => router.push('/auth/sign-up-apple')}>
          Get Started
        </Button>

        <View style={{ height: theme.spacing.md }} />

        <Button variant="ghost" size="lg" fullWidth onPress={() => router.push('/auth/sign-in-apple')}>
          Sign In
        </Button>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            {
              color: theme.isDark
                ? theme.colors.dark.text.tertiary
                : theme.colors.light.text.tertiary,
            },
          ]}
        >
          We are the Warriors. We are unstoppable. 🔥
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 50,
  },
  hero: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: 16,
  },
});
