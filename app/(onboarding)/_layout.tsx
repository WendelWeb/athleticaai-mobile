/**
 * Onboarding Layout
 *
 * Wraps all onboarding screens with context and shared UI
 * ✅ Prevents flash by checking onboarding status BEFORE rendering
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { getProfile } from '@/services/drizzle/profile';
import { useStyledTheme } from '@theme/ThemeProvider';

export default function OnboardingLayout() {
  const router = useRouter();
  const { user, isLoaded } = useClerkAuth();
  const theme = useStyledTheme();
  const [checking, setChecking] = useState(true);

  // ✅ Guard: Check if onboarding already completed BEFORE showing screens
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded) return;

      // Not authenticated → shouldn't be here, redirect to index
      if (!user) {
        router.replace('/');
        return;
      }

      try {
        // Check if onboarding already completed
        const { profile } = await getProfile(user.id);

        if (profile?.onboarding_completed) {
          // ✅ Already completed → redirect to tabs (no flash!)
          console.log('🔍 [Onboarding Layout] Onboarding already completed → /(tabs)');
          router.replace('/(tabs)');
          return;
        }

        // ✅ Not completed → show onboarding screens
        console.log('🔍 [Onboarding Layout] Onboarding not completed → Show screens');
        setChecking(false);
      } catch (error) {
        // Error checking → allow onboarding to show (safe fallback)
        console.log('🔍 [Onboarding Layout] Error checking status → Show screens');
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, user]);

  // Show loading while checking (prevents flash)
  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.isDark ? '#000000' : '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  // ✅ Onboarding not completed → show screens
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="step-1" />
        <Stack.Screen name="step-2" />
        <Stack.Screen name="step-3" />
        <Stack.Screen name="step-4" />
        <Stack.Screen name="step-5" />
        <Stack.Screen name="step-6" />
        <Stack.Screen name="step-7" />
        <Stack.Screen name="step-8" />
        <Stack.Screen name="step-9" />
        <Stack.Screen name="step-10" />
      </Stack>
    </OnboardingProvider>
  );
}
