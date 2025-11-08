/**
 * Onboarding Entry Point
 *
 * Redirects to the full 9-step onboarding flow
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding flow
    router.replace('/(onboarding)');
  }, [router]);

  return null;
}

