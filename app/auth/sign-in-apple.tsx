/**
 * Sign In Screen - Pure Apple Style
 *
 * Features:
 * - Minimalist Apple design language
 * - Social auth (Apple, Google)
 * - Clean white/dark mode
 * - Subtle animations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSignIn, useUser, useOAuth } from '@clerk/clerk-expo';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
import { validateEmail } from '@utils/validation';
import { getProfile, createProfile } from '@/services/drizzle/profile';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function SignInAppleScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isLoaded: userLoaded } = useUser();

  // Redirect if already signed in
  useEffect(() => {
    const checkAuth = async () => {
      if (!userLoaded) return;

      if (user) {
        // User already signed in - redirect to appropriate screen
        try {
          const { profile } = await getProfile(user.id);
          if (profile?.onboarding_completed) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        } catch (error) {
          router.replace('/onboarding');
        }
      }
    };

    checkAuth();
  }, [userLoaded, user]);

  // OAuth
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const isDark = theme.isDark;
  const bgColor = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#8E8E93' : '#6E6E73';
  const borderColor = isDark ? '#38383A' : '#E5E5EA';
  const cardBgColor = isDark ? '#1C1C1E' : '#F2F2F7';

  // Generate username from name or email
  // Generate firstName and lastName from email if missing (required by Clerk)
  const generateNames = (firstName?: string, lastName?: string, email?: string): { firstName: string; lastName: string } => {
    // If both exist, use them
    if (firstName && lastName) {
      return { firstName, lastName };
    }

    // If only firstName exists, extract lastName from email
    if (firstName && !lastName && email) {
      const emailPart = email.split('@')[0];
      const parts = emailPart.split(/[._-]/);
      const extractedLastName = parts.length > 1 ? parts[parts.length - 1] : 'User';
      return {
        firstName,
        lastName: extractedLastName.charAt(0).toUpperCase() + extractedLastName.slice(1).toLowerCase()
      };
    }

    // If only lastName exists (rare), extract firstName from email
    if (!firstName && lastName && email) {
      const emailPart = email.split('@')[0];
      const parts = emailPart.split(/[._-]/);
      const extractedFirstName = parts[0] || 'User';
      return {
        firstName: extractedFirstName.charAt(0).toUpperCase() + extractedFirstName.slice(1).toLowerCase(),
        lastName
      };
    }

    // If both missing, extract from email
    if (!firstName && !lastName && email) {
      const emailPart = email.split('@')[0];
      const parts = emailPart.split(/[._-]/);
      if (parts.length >= 2) {
        return {
          firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
          lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()
        };
      } else {
        return {
          firstName: emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase(),
          lastName: 'User'
        };
      }
    }

    // Fallback if nothing available
    return { firstName: 'User', lastName: 'Account' };
  };

  const generateUsername = (firstName?: string, lastName?: string, email?: string): string => {
    let baseUsername = '';

    if (firstName && lastName) {
      baseUsername = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    } else if (firstName) {
      baseUsername = firstName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    } else if (email) {
      baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    } else {
      baseUsername = 'user';
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${baseUsername}${randomSuffix}`;
  };

  // Real-time email validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      const validation = validateEmail(text);
      setEmailError(validation.isValid ? '' : validation.error || '');
    } else {
      setEmailError('');
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded) {
      Alert.alert('Loading', 'Please wait...');
      return;
    }

    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validate
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      Alert.alert('Invalid Email', emailValidation.error);
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const userId = user?.id;

        if (userId) {
          let { profile } = await getProfile(userId);
          console.log('🔍 [Sign In] User ID:', userId);
          console.log('🔍 [Sign In] Profile fetched:', profile ? 'EXISTS' : 'NULL');

          if (!profile) {
            // Create profile if it doesn't exist
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            const fullName = user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.firstName || user?.lastName || '';

            console.log('🔍 [Sign In] Creating new profile...');
            const { profile: newProfile } = await createProfile(userId, userEmail || email, fullName);
            profile = newProfile; // ✅ Use new profile
            console.log('🔍 [Sign In] New profile created:', newProfile ? 'SUCCESS' : 'FAILED');
          }

          const onboardingCompleted = profile?.onboarding_completed;
          console.log('🔍 [Sign In] Onboarding completed:', onboardingCompleted);

          if (!onboardingCompleted) {
            console.log('🔍 [Sign In] → Redirecting to /onboarding');
            router.replace('/onboarding');
          } else {
            console.log('🔍 [Sign In] → Redirecting to /(tabs)');
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/onboarding');
        }
      } else {
        Alert.alert('Sign In Incomplete', 'Please complete the sign in process.');
        setIsLoading(false);
      }
    } catch (err: any) {
      // Silent error - show user-friendly alert instead
      const errorMessage = err.errors?.[0]?.message || 'Invalid email or password.';
      Alert.alert('Sign In Failed', errorMessage);

      Platform.OS === 'ios' &&
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🚀 [Google OAuth] Step 1: handleGoogleSignIn called');

    if (!isLoaded) {
      console.log('❌ [Google OAuth] Step 1 FAILED: Clerk not loaded yet');
      return;
    }
    console.log('✅ [Google OAuth] Step 1 SUCCESS: Clerk is loaded');

    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSocialLoading('google');
    console.log('🔄 [Google OAuth] Step 2: Loading state set to "google"');

    try {
      // ✅ Detect Expo Go - don't use custom redirect URL
      const isExpoGo = Constants.appOwnership === 'expo';

      console.log('🌐 [Google OAuth] Step 3: Calling startGoogleOAuth...');
      console.log('🌐 [Google OAuth] Step 3 - Is Expo Go:', isExpoGo);

      let oauthResult;

      if (isExpoGo) {
        // ✅ In Expo Go: Let Clerk auto-detect redirect URL
        console.log('🌐 [Google OAuth] Step 3 - Using Clerk auto redirect (Expo Go mode)');
        oauthResult = await startGoogleOAuth();
      } else {
        // ✅ In dev/prod build: Use custom deep link
        console.log('🌐 [Google OAuth] Step 3 - Redirect URL:', 'athleticaai://oauth-callback');
        oauthResult = await startGoogleOAuth({
          redirectUrl: 'athleticaai://oauth-callback',
        });
      }

      console.log('✅ [Google OAuth] Step 3 SUCCESS: OAuth flow completed');
      console.log('🔍 [Google OAuth] Step 3 - OAuth result:', {
        createdSessionId: oauthResult.createdSessionId,
        hasSetActive: !!oauthResult.setActive,
        hasSignIn: !!oauthResult.signIn,
        hasSignUp: !!oauthResult.signUp,
      });

      const { createdSessionId, setActive: setOAuthActive, signIn, signUp } = oauthResult;

      // ✅ Handle missing_requirements (username missing from Google OAuth)
      if (!createdSessionId && signUp && signUp.status === 'missing_requirements') {
        console.log('⚠️ [Google OAuth] Step 4: Sign-up incomplete - missing requirements');
        console.log('⚠️ [Google OAuth] Step 4 - Missing fields:', signUp.missingFields);
        console.log('⚠️ [Google OAuth] Step 4 - User data:', {
          email: signUp.emailAddress,
          firstName: signUp.firstName,
          lastName: signUp.lastName,
          username: signUp.username,
        });

        try {
          // Generate username from existing data
          const generatedUsername = generateUsername(
            signUp.firstName || undefined,
            signUp.lastName || undefined,
            signUp.emailAddress || undefined
          );

          console.log('🔧 [Google OAuth] Step 5: Generated username:', generatedUsername);

          // Update sign-up with username
          console.log('💾 [Google OAuth] Step 6: Updating sign-up with username...');
          await signUp.update({
            username: generatedUsername,
          });

          console.log('✅ [Google OAuth] Step 6 SUCCESS: Sign-up updated');

          // Now try to complete the sign-up
          if (signUp.createdSessionId) {
            console.log('✅ [Google OAuth] Step 7: Session created after update');
            await setOAuthActive!({ session: signUp.createdSessionId });

            Platform.OS === 'ios' &&
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            console.log('🧭 [Google OAuth] Step 8: Navigating to /oauth-callback...');
            router.replace('/oauth-callback');
            return;
          } else {
            console.log('⚠️ [Google OAuth] Step 7: No session yet, sign-up may need more steps');
            Alert.alert('Sign Up Incomplete', 'Please complete your profile to continue.');
          }
        } catch (updateErr: any) {
          console.log('❌ [Google OAuth] Step 5-7 ERROR:', updateErr.message);
          Alert.alert('Sign In Failed', 'Could not complete sign in. Please try again.');
          Platform.OS === 'ios' &&
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setSocialLoading(null);
        return;
      }

      if (createdSessionId) {
        console.log('✅ [Google OAuth] Step 4: createdSessionId exists:', createdSessionId);
        console.log('🔑 [Google OAuth] Step 5: Activating session...');

        await setOAuthActive!({ session: createdSessionId });

        console.log('✅ [Google OAuth] Step 5 SUCCESS: Session activated');

        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // ✅ Wait for user to be available
        console.log('⏳ [Google OAuth] Step 6: Waiting 300ms for user data...');
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log('✅ [Google OAuth] Step 6 SUCCESS: Wait complete');

        // ✅ Generate username and names if missing (required by Clerk)
        console.log('👤 [Google OAuth] Step 7: Checking user data...');
        console.log('👤 [Google OAuth] Step 7 - User exists:', !!user);

        if (user) {
          console.log('👤 [Google OAuth] Step 7 - User details:', {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          });

          const needsUsername = !user.username;
          const needsNames = !user.firstName || !user.lastName;

          console.log('👤 [Google OAuth] Step 7 - Needs username:', needsUsername);
          console.log('👤 [Google OAuth] Step 7 - Needs names:', needsNames);

          if (needsUsername || needsNames) {
            const email = user.primaryEmailAddress?.emailAddress || undefined;
            const updateData: any = {};

            // Generate username if missing
            if (needsUsername) {
              updateData.username = generateUsername(
                user.firstName || undefined,
                user.lastName || undefined,
                email
              );
              console.log('🔧 [Google OAuth] Step 8: Generated username:', updateData.username);
            }

            // Generate firstName and lastName if missing
            if (needsNames) {
              const { firstName, lastName } = generateNames(
                user.firstName || undefined,
                user.lastName || undefined,
                email
              );
              updateData.firstName = firstName;
              updateData.lastName = lastName;
              console.log('🔧 [Google OAuth] Step 8: Generated names:', { firstName, lastName });
            }

            // Auto-update user with generated data
            try {
              console.log('💾 [Google OAuth] Step 9: Updating user with generated data...');
              await user.update(updateData);
              console.log('✅ [Google OAuth] Step 9 SUCCESS: User data updated');
            } catch (updateErr: any) {
              console.log('⚠️ [Google OAuth] Step 9 WARNING: User update failed (non-critical):', updateErr.message);
            }
          } else {
            console.log('✅ [Google OAuth] Step 7: User data already complete, no updates needed');
          }
        } else {
          console.log('⚠️ [Google OAuth] Step 7 WARNING: User object not available yet');
        }

        // OAuth successful - navigate to callback
        console.log('🧭 [Google OAuth] Step 10: Navigating to /oauth-callback...');
        router.replace('/oauth-callback');
        console.log('✅ [Google OAuth] Step 10 SUCCESS: Navigation initiated');
      } else {
        console.log('❌ [Google OAuth] Step 4 FAILED: No createdSessionId returned');
        console.log('❌ [Google OAuth] OAuth result was:', oauthResult);
      }
    } catch (err: any) {
      console.log('❌ [Google OAuth] ERROR caught in try-catch');
      console.log('❌ [Google OAuth] Error details:', {
        message: err.message,
        code: err.code,
        errors: err.errors,
        stack: err.stack,
      });

      // Silent error handling
      // Check if user cancelled
      if (err.message?.includes('cancel') || err.message?.includes('abort')) {
        console.log('ℹ️ [Google OAuth] User cancelled OAuth flow');
        // User cancelled - silent (no error)
      } else {
        console.log('❌ [Google OAuth] Showing error alert to user');
        Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      console.log('🏁 [Google OAuth] Finally block: Resetting loading state');
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded) return;

    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSocialLoading('apple');

    try {
      // ✅ Detect Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';

      let oauthResult;

      if (isExpoGo) {
        // ✅ In Expo Go: Let Clerk auto-detect redirect URL
        oauthResult = await startAppleOAuth();
      } else {
        // ✅ In dev/prod build: Use custom deep link
        oauthResult = await startAppleOAuth({
          redirectUrl: 'athleticaai://oauth-callback',
        });
      }

      const { createdSessionId, setActive: setOAuthActive, signIn, signUp } = oauthResult;

      // ✅ Handle missing_requirements (username missing from Apple OAuth)
      if (!createdSessionId && signUp && signUp.status === 'missing_requirements') {
        console.log('⚠️ [Apple OAuth] Sign-up incomplete - missing requirements');
        console.log('⚠️ [Apple OAuth] Missing fields:', signUp.missingFields);

        try {
          // Generate username from existing data
          const generatedUsername = generateUsername(
            signUp.firstName || undefined,
            signUp.lastName || undefined,
            signUp.emailAddress || undefined
          );

          console.log('🔧 [Apple OAuth] Generated username:', generatedUsername);

          // Update sign-up with username
          await signUp.update({
            username: generatedUsername,
          });

          console.log('✅ [Apple OAuth] Sign-up updated');

          // Check if session is now created
          if (signUp.createdSessionId) {
            await setOAuthActive!({ session: signUp.createdSessionId });

            Platform.OS === 'ios' &&
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.replace('/oauth-callback');
            return;
          } else {
            Alert.alert('Sign In Incomplete', 'Please complete your profile to continue.');
          }
        } catch (updateErr: any) {
          console.log('❌ [Apple OAuth] Update error:', updateErr.message);
          Alert.alert('Sign In Failed', 'Could not complete sign in. Please try again.');
          Platform.OS === 'ios' &&
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setSocialLoading(null);
        return;
      }

      if (createdSessionId) {
        await setOAuthActive!({ session: createdSessionId });

        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // ✅ Wait for user to be available
        await new Promise((resolve) => setTimeout(resolve, 300));

        // ✅ Generate username and names if missing (required by Clerk)
        if (user) {
          const needsUsername = !user.username;
          const needsNames = !user.firstName || !user.lastName;

          if (needsUsername || needsNames) {
            const email = user.primaryEmailAddress?.emailAddress || undefined;
            const updateData: any = {};

            // Generate username if missing
            if (needsUsername) {
              updateData.username = generateUsername(
                user.firstName || undefined,
                user.lastName || undefined,
                email
              );
            }

            // Generate firstName and lastName if missing
            if (needsNames) {
              const { firstName, lastName } = generateNames(
                user.firstName || undefined,
                user.lastName || undefined,
                email
              );
              updateData.firstName = firstName;
              updateData.lastName = lastName;
            }

            // Auto-update user with generated data
            try {
              await user.update(updateData);
              // Silent - user data completed successfully
            } catch (updateErr: any) {
              // Silent - non-critical error
            }
          }
        }

        // OAuth successful - navigate to callback
        router.replace('/oauth-callback');
      }
    } catch (err: any) {
      // Silent error handling
      // Check if user cancelled
      if (err.message?.includes('cancel') || err.message?.includes('abort')) {
        // User cancelled - silent (no error)
      } else {
        Alert.alert('Sign In Failed', 'Could not sign in with Apple. Please try again.');
        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: cardBgColor }]}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              onPress={handleAppleSignIn}
              disabled={socialLoading !== null}
              style={[styles.socialButton, { backgroundColor: textColor, borderColor }]}
            >
              {socialLoading === 'apple' ? (
                <ActivityIndicator color={bgColor} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color={bgColor} />
                  <Text style={[styles.socialButtonText, { color: bgColor }]}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={socialLoading !== null}
              style={[styles.socialButton, { backgroundColor: cardBgColor, borderColor }]}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color={textColor} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={textColor} />
                  <Text style={[styles.socialButtonText, { color: textColor }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <Text style={[styles.dividerText, { color: secondaryTextColor }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
          </View>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              error={emailError}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
            />

            <TouchableOpacity
              onPress={() => {
                Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/auth/forgot-password');
              }}
              style={styles.forgotButton}
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary[500] }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSignIn}
              loading={isLoading}
              disabled={!isLoaded || socialLoading !== null}
              style={styles.signInButton}
            >
              Sign In
            </Button>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/auth/sign-up-apple');
              }}
            >
              <Text style={[styles.footerLink, { color: theme.colors.primary[500] }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 15,
  },
  form: {
    gap: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
