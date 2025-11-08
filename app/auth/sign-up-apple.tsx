/**
 * Sign Up Screen - Pure Apple Style
 *
 * Features:
 * - Minimalist Apple design
 * - Username field (required by Clerk)
 * - Social auth (Apple, Google)
 * - Fixed verification flow
 * - Email verification with proper completion
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
import { useSignUp, useUser, useOAuth } from '@clerk/clerk-expo';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
import { validateEmail, validatePassword } from '@utils/validation';
import { createProfile, getProfile } from '@/services/drizzle/profile';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpAppleScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Validation state
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
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
      // Use first name + last name: "John Doe" → "john_doe"
      baseUsername = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    } else if (firstName) {
      // Use first name only: "John" → "john"
      baseUsername = firstName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    } else if (email) {
      // Use email prefix: "john.doe@gmail.com" → "john_doe"
      baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    } else {
      // Fallback: random username
      baseUsername = 'user';
    }

    // Add random 4-digit number to ensure uniqueness
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${baseUsername}${randomSuffix}`;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      const validation = validateEmail(text);
      setEmailError(validation.isValid ? '' : validation.error || '');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      const validation = validatePassword(text);
      setPasswordError(validation.isValid ? '' : validation.error || '');
    } else {
      setPasswordError('');
    }
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (text.length > 0 && text.length < 2) {
      setFirstNameError('First name must be at least 2 characters');
    } else {
      setFirstNameError('');
    }
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    if (text.length > 0 && text.length < 2) {
      setLastNameError('Last name must be at least 2 characters');
    } else {
      setLastNameError('');
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces, convert to lowercase
    const cleanUsername = text.toLowerCase().replace(/\s/g, '');
    setUsername(cleanUsername);

    if (cleanUsername.length > 0) {
      if (cleanUsername.length < 3) {
        setUsernameError('Username must be at least 3 characters');
      } else if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        setUsernameError('Only lowercase letters, numbers, and underscores');
      } else {
        setUsernameError('');
      }
    } else {
      setUsernameError('');
    }
  };

  const handleSignUp = async () => {
    if (!isLoaded) {
      Alert.alert('Loading', 'Please wait...');
      return;
    }

    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validate first name
    if (!firstName || firstName.length < 2) {
      setFirstNameError('First name is required');
      Alert.alert('First Name Required', 'Please enter your first name');
      return;
    }

    // Validate last name
    if (!lastName || lastName.length < 2) {
      setLastNameError('Last name is required');
      Alert.alert('Last Name Required', 'Please enter your last name');
      return;
    }

    // Validate username
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      Alert.alert('Invalid Username', 'Username must be at least 3 characters');
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      Alert.alert('Invalid Email', emailValidation.error);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      Alert.alert('Weak Password', passwordValidation.error);
      return;
    }

    setIsLoading(true);

    try {
      // Create sign up with username, firstName, lastName (ALL REQUIRED by Clerk)
      await signUp.create({
        emailAddress: email,
        password,
        username, // ✅ Username required
        firstName, // ✅ First name required
        lastName, // ✅ Last name required
      });

      // Send verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      setIsLoading(false);

      Alert.alert(
        'Verification Code Sent',
        'We sent a 6-digit code to your email. Please enter it below.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      // Silent error - show user-friendly alert instead
      const errorMessage = err.errors?.[0]?.message || 'Sign up failed. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);

      Platform.OS === 'ios' &&
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code from your email.');
      return;
    }

    setIsLoading(true);

    if (!signUp) {
      Alert.alert('Error', 'Sign up session not found. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ FIX: Attempt verification first
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      // Silent - verification attempted

      // ✅ FIX: Check if verification is complete OR if we need to complete the sign up
      if (result.status === 'complete') {
        // Set active session immediately
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // ✅ FIX: Get user ID from result
        const userId = result.createdUserId || user?.id;

        if (userId) {
          // Create profile in Neon
          await createProfile(userId, email, username);

          // Silent - profile created successfully
          // Navigate to onboarding
          router.replace('/onboarding');
        } else {
          // Silent - no user ID but continue
          // Still navigate to onboarding
          router.replace('/onboarding');
        }
      } else if (result.status === 'missing_requirements') {
        // ✅ FIX: If username or names are missing, update them
        // Silent - attempting to update missing fields

        try {
          await signUp.update({
            username,
            firstName,
            lastName,
          });

          // Try verification again
          const finalResult = await signUp.attemptEmailAddressVerification({
            code: verificationCode,
          });

          if (finalResult.status === 'complete' && finalResult.createdSessionId) {
            await setActive({ session: finalResult.createdSessionId });

            const userId = finalResult.createdUserId || user?.id;

            if (userId) {
              await createProfile(userId, email, username);
            }

            router.replace('/onboarding');
          } else {
            Alert.alert('Error', 'Could not complete sign up. Please try again.');
            setIsLoading(false);
          }
        } catch (updateErr: any) {
          // Silent error - show user-friendly alert
          Alert.alert('Error', updateErr.errors?.[0]?.message || 'Could not complete sign up.');
          setIsLoading(false);
        }
      } else {
        Alert.alert('Verification Incomplete', 'Please complete the verification process.');
        setIsLoading(false);
      }
    } catch (err: any) {
      // Silent error - show user-friendly alert instead
      const errorMessage = err.errors?.[0]?.message || 'Verification failed. Please try again.';

      // ✅ FIX: Handle "already verified" error
      if (errorMessage.includes('already') || errorMessage.includes('verified')) {
        Alert.alert(
          'Already Verified',
          'Your email is already verified. Completing sign up...'
        );

        try {
          // Try to complete the sign up
          if (signUp.status === 'complete' && signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });

            const userId = signUp.createdUserId || user?.id;

            if (userId) {
              await createProfile(userId, email, username);
            }

            router.replace('/onboarding');
            return;
          }
        } catch (finalErr) {
          // Silent error - non-critical
        }
      }

      Alert.alert('Verification Failed', errorMessage);

      Platform.OS === 'ios' &&
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSocialLoading('google');

    try {
      // ✅ Detect Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';

      let oauthResult;

      if (isExpoGo) {
        // ✅ In Expo Go: Let Clerk auto-detect redirect URL
        oauthResult = await startGoogleOAuth();
      } else {
        // ✅ In dev/prod build: Use custom deep link
        oauthResult = await startGoogleOAuth({
          redirectUrl: 'athleticaai://oauth-callback',
        });
      }

      const { createdSessionId, setActive: setOAuthActive, signUp: oauthSignUp } = oauthResult;

      // ✅ Handle missing_requirements (username missing from Google OAuth)
      if (!createdSessionId && oauthSignUp && oauthSignUp.status === 'missing_requirements') {
        console.log('⚠️ [Google OAuth Sign-Up] Missing requirements detected');
        console.log('⚠️ [Google OAuth Sign-Up] Missing fields:', oauthSignUp.missingFields);

        try {
          // Generate username from existing data
          const generatedUsername = generateUsername(
            oauthSignUp.firstName || undefined,
            oauthSignUp.lastName || undefined,
            oauthSignUp.emailAddress || undefined
          );

          console.log('🔧 [Google OAuth Sign-Up] Generated username:', generatedUsername);

          // Update sign-up with username
          await oauthSignUp.update({
            username: generatedUsername,
          });

          console.log('✅ [Google OAuth Sign-Up] Sign-up updated with username');

          // Check if session is now created
          if (oauthSignUp.createdSessionId) {
            await setOAuthActive!({ session: oauthSignUp.createdSessionId });

            Platform.OS === 'ios' &&
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.replace('/oauth-callback');
            return;
          } else {
            Alert.alert('Sign Up Incomplete', 'Please complete your profile to continue.');
          }
        } catch (updateErr: any) {
          console.log('❌ [Google OAuth Sign-Up] Update error:', updateErr.message);
          Alert.alert('Sign Up Failed', 'Could not complete sign up. Please try again.');
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

        // ✅ Wait a moment for user to be available
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
              // Continue anyway - Clerk might have already set data
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
        Alert.alert('Sign Up Failed', 'Could not sign up with Google. Please try again.');
        Platform.OS === 'ios' &&
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
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

      const { createdSessionId, setActive: setOAuthActive, signUp: oauthSignUp } = oauthResult;

      // ✅ Handle missing_requirements (username missing from Apple OAuth)
      if (!createdSessionId && oauthSignUp && oauthSignUp.status === 'missing_requirements') {
        console.log('⚠️ [Apple OAuth Sign-Up] Missing requirements detected');
        console.log('⚠️ [Apple OAuth Sign-Up] Missing fields:', oauthSignUp.missingFields);

        try {
          // Generate username from existing data
          const generatedUsername = generateUsername(
            oauthSignUp.firstName || undefined,
            oauthSignUp.lastName || undefined,
            oauthSignUp.emailAddress || undefined
          );

          console.log('🔧 [Apple OAuth Sign-Up] Generated username:', generatedUsername);

          // Update sign-up with username
          await oauthSignUp.update({
            username: generatedUsername,
          });

          console.log('✅ [Apple OAuth Sign-Up] Sign-up updated with username');

          // Check if session is now created
          if (oauthSignUp.createdSessionId) {
            await setOAuthActive!({ session: oauthSignUp.createdSessionId });

            Platform.OS === 'ios' &&
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.replace('/oauth-callback');
            return;
          } else {
            Alert.alert('Sign Up Incomplete', 'Please complete your profile to continue.');
          }
        } catch (updateErr: any) {
          console.log('❌ [Apple OAuth Sign-Up] Update error:', updateErr.message);
          Alert.alert('Sign Up Failed', 'Could not complete sign up. Please try again.');
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

        // ✅ Wait a moment for user to be available
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
              // Continue anyway - Clerk might have already set data
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
        Alert.alert('Sign Up Failed', 'Could not sign up with Apple. Please try again.');
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
            <Text style={[styles.title, { color: textColor }]}>
              {pendingVerification ? 'Verify Email' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              {pendingVerification
                ? 'Enter the 6-digit code sent to your email'
                : 'Start your transformation journey today'}
            </Text>
          </View>

          {!pendingVerification ? (
            <>
              {/* Social Auth Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  onPress={handleAppleSignUp}
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
                  onPress={handleGoogleSignUp}
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

              {/* Sign Up Form */}
              <View style={styles.form}>
                <Input
                  label="First Name"
                  type="text"
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  placeholder="John"
                  autoCapitalize="words"
                  error={firstNameError}
                />

                <Input
                  label="Last Name"
                  type="text"
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  placeholder="Warrior"
                  autoCapitalize="words"
                  error={lastNameError}
                />

                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="johnwarrior"
                  autoCapitalize="none"
                  error={usernameError}
                />

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
                  onChangeText={handlePasswordChange}
                  placeholder="Min. 8 characters"
                  error={passwordError}
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleSignUp}
                  loading={isLoading}
                  disabled={!isLoaded || socialLoading !== null}
                  style={styles.submitButton}
                >
                  Create Account
                </Button>

                <Text style={[styles.terms, { color: secondaryTextColor }]}>
                  By signing up, you agree to our{' '}
                  <Text style={{ color: theme.colors.primary[500] }}>Terms</Text> and{' '}
                  <Text style={{ color: theme.colors.primary[500] }}>Privacy Policy</Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Verification Form */}
              <View style={styles.form}>
                <Input
                  label="Verification Code"
                  type="text"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleVerifyEmail}
                  loading={isLoading}
                  style={styles.submitButton}
                >
                  Verify Email
                </Button>

                <TouchableOpacity
                  onPress={async () => {
                    if (!signUp) return;
                    try {
                      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                      Alert.alert('Code Resent', 'A new code has been sent to your email.');
                    } catch (err) {
                      Alert.alert('Error', 'Failed to resend code.');
                    }
                  }}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendText, { color: theme.colors.primary[500] }]}>
                    Didn't receive the code? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Sign In Link */}
          {!pendingVerification && (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: secondaryTextColor }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/auth/sign-in-apple');
                }}
              >
                <Text style={[styles.footerLink, { color: theme.colors.primary[500] }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  submitButton: {
    marginTop: 8,
  },
  terms: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendButton: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
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
