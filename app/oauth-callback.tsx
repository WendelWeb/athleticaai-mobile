/**
 * OAuth Callback Handler
 *
 * This route handles OAuth redirects from Google/Apple Sign-In
 * Expo Router will automatically match this route when OAuth completes
 */

import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getProfile, createProfile } from '@/services/drizzle/profile';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const theme = useStyledTheme();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('🎯 [OAuth Callback] Step 1: OAuth callback triggered');
      console.log('🎯 [OAuth Callback] Step 1 - isLoaded:', isLoaded);
      console.log('🎯 [OAuth Callback] Step 1 - user exists:', !!user);

      if (!isLoaded) {
        console.log('⏳ [OAuth Callback] Step 1 WAITING: Clerk not loaded yet');
        return;
      }
      console.log('✅ [OAuth Callback] Step 1 SUCCESS: Clerk is loaded');

      // Wait a brief moment for Clerk to finish processing
      console.log('⏳ [OAuth Callback] Step 2: Waiting 200ms for Clerk to finish processing...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log('✅ [OAuth Callback] Step 2 SUCCESS: Wait complete');

      console.log('👤 [OAuth Callback] Step 3: Checking user...');
      console.log('👤 [OAuth Callback] Step 3 - user exists:', !!user);

      if (!user) {
        console.log('❌ [OAuth Callback] Step 3 FAILED: No user found');
        console.log('🧭 [OAuth Callback] Redirecting to /auth/sign-in-apple...');
        // No user found, redirect to sign in
        router.replace('/auth/sign-in-apple');
        return;
      }

      console.log('✅ [OAuth Callback] Step 3 SUCCESS: User found');
      console.log('👤 [OAuth Callback] Step 3 - User details:', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      try {
        // User authenticated via OAuth
        const userId = user.id;
        const userEmail = user.primaryEmailAddress?.emailAddress;
        const fullName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || '';

        console.log('📝 [OAuth Callback] Step 4: Extracted user data:', {
          userId,
          userEmail,
          fullName,
        });

        // Check if profile exists
        console.log('🔍 [OAuth Callback] Step 5: Checking if profile exists in database...');
        let { profile } = await getProfile(userId);

        console.log('🔍 [OAuth Callback] Step 5 - Profile result:', {
          exists: !!profile,
          onboardingCompleted: profile?.onboarding_completed,
        });

        if (!profile) {
          console.log('➕ [OAuth Callback] Step 6: Profile not found, creating new profile...');
          console.log('➕ [OAuth Callback] Step 6 - Create profile params:', {
            userId,
            userEmail: userEmail || '',
            fullName,
          });

          // Create profile for new OAuth user
          const { profile: newProfile } = await createProfile(userId, userEmail || '', fullName);
          profile = newProfile;

          console.log('✅ [OAuth Callback] Step 6 SUCCESS: Profile created:', {
            exists: !!profile,
            onboardingCompleted: profile?.onboarding_completed,
          });
        } else {
          console.log('✅ [OAuth Callback] Step 5: Profile already exists, skipping creation');
        }

        // Check onboarding status
        const onboardingCompleted = profile?.onboarding_completed;
        console.log('🎓 [OAuth Callback] Step 7: Checking onboarding status:', onboardingCompleted);

        if (!onboardingCompleted) {
          console.log('🧭 [OAuth Callback] Step 8: Onboarding not completed, redirecting to /onboarding...');
          // Navigate to onboarding
          router.replace('/onboarding');
          console.log('✅ [OAuth Callback] Step 8 SUCCESS: Navigation to /onboarding initiated');
        } else {
          console.log('🧭 [OAuth Callback] Step 8: Onboarding completed, redirecting to /(tabs)...');
          // Navigate to main app
          router.replace('/(tabs)');
          console.log('✅ [OAuth Callback] Step 8 SUCCESS: Navigation to /(tabs) initiated');
        }
      } catch (error: any) {
        console.log('❌ [OAuth Callback] ERROR caught in try-catch');
        console.log('❌ [OAuth Callback] Error details:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });
        console.log('🧭 [OAuth Callback] Fallback: Redirecting to /onboarding...');
        // Silent error - fallback to onboarding
        // Fallback to onboarding
        router.replace('/onboarding');
        console.log('✅ [OAuth Callback] Fallback navigation initiated');
      }
    };

    handleOAuthCallback();
  }, [isLoaded, user]);

  const bgColor = theme.isDark ? '#000000' : '#FFFFFF';
  const textColor = theme.isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      <Text style={[styles.text, { color: textColor }]}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '500',
  },
});
