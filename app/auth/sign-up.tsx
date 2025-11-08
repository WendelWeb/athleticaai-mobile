/**
 * Sign Up Screen - Clerk Auth Integration
 *
 * Features:
 * - Clerk authentication with useSignUp hook
 * - Email verification flow (OTP code)
 * - Strict email + password validation
 * - Premium gradient background UI
 * - Password strength indicator
 * - Auto-create profile in Neon after verification
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
  Animated,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSignUp } from '@clerk/clerk-expo';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '@utils/validation';
import { createProfile } from '@/services/drizzle/profile';

export default function SignUpScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Validation state
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>();

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  // Real-time password validation
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      const validation = validatePassword(text);
      setPasswordError(validation.isValid ? '' : validation.error || '');
      setPasswordStrength(validation.strength);
    } else {
      setPasswordError('');
      setPasswordStrength(undefined);
    }
  };

  // Real-time name validation
  const handleNameChange = (text: string) => {
    setFullName(text);
    if (text.length > 0) {
      const validation = validateFullName(text);
      setNameError(validation.isValid ? '' : validation.error || '');
    } else {
      setNameError('');
    }
  };

  // Real-time confirm password validation
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text.length > 0 && password.length > 0) {
      setConfirmPasswordError(text === password ? '' : 'Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSignUp = async () => {
    if (!isLoaded) {
      Alert.alert('Error', 'Authentication system is loading...');
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Validate full name
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error || '');
      Alert.alert('Invalid Name', nameValidation.error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      Alert.alert('Invalid Email', emailValidation.error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      Alert.alert('Weak Password', passwordValidation.error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      Alert.alert('Password Mismatch', 'Passwords do not match');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Create account with Clerk
    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Show verification UI
      setPendingVerification(true);
      setIsLoading(false);

      Alert.alert(
        'Verification Code Sent',
        'We sent a 6-digit code to your email. Please enter it below to verify your account.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Sign up error:', err);

      let errorTitle = 'Sign Up Failed';
      let errorMessage = err.errors?.[0]?.message || 'An error occurred during sign up.';

      // Handle specific Clerk errors
      if (errorMessage.includes('already') || errorMessage.includes('exists')) {
        errorTitle = 'Account Already Exists';
        errorMessage = 'This email is already registered. Please sign in instead or use a different email.';

        Alert.alert(errorTitle, errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In Instead', onPress: () => router.push('/auth/sign-in') },
        ]);
      } else {
        Alert.alert(errorTitle, errorMessage);
      }

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

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
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        // Set active session
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        // Success haptic
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Create profile in Neon
        const userId = result.createdUserId;
        if (userId) {
          await createProfile(userId, email, fullName);
        }

        // Navigate to onboarding
        router.replace('/onboarding');
      } else {
        Alert.alert('Verification Incomplete', 'Please complete the verification process.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Verification error:', err);

      const errorMessage = err.errors?.[0]?.message || 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', errorMessage);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/auth-bg-signup.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
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
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.back();
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {pendingVerification ? 'Verify Your' : 'Start Your'}
                  </Text>
                  <Text style={[styles.title, styles.titleAccent]}>
                    {pendingVerification ? 'Email' : 'Transformation'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {pendingVerification
                      ? 'Enter the 6-digit code sent to your email'
                      : 'Join thousands of warriors reaching their peak potential'}
                  </Text>
                </View>

                {/* Glassmorphism Card */}
                <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.glassGradient}
                  >
                    {!pendingVerification ? (
                      <>
                        {/* Full Name Input */}
                        <Input
                          label="Full Name"
                          type="text"
                          value={fullName}
                          onChangeText={handleNameChange}
                          leftIcon="person-outline"
                          placeholder="John Warrior"
                          autoCapitalize="words"
                          error={nameError}
                        />

                        {/* Email Input */}
                        <Input
                          label="Email"
                          type="email"
                          value={email}
                          onChangeText={handleEmailChange}
                          leftIcon="mail-outline"
                          placeholder="warrior@athletica.ai"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          error={emailError}
                        />

                        {/* Password Input */}
                        <View>
                          <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChangeText={handlePasswordChange}
                            leftIcon="lock-closed-outline"
                            placeholder="Min. 8 characters"
                            error={passwordError}
                          />

                          {/* Password Strength Indicator */}
                          {password.length > 0 && passwordStrength && (
                            <View style={styles.strengthContainer}>
                              <View style={styles.strengthBars}>
                                <View
                                  style={[
                                    styles.strengthBar,
                                    {
                                      backgroundColor:
                                        passwordStrength === 'weak'
                                          ? getPasswordStrengthColor('weak')
                                          : '#2C2C2E',
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.strengthBar,
                                    {
                                      backgroundColor:
                                        passwordStrength === 'medium' || passwordStrength === 'strong'
                                          ? getPasswordStrengthColor(passwordStrength)
                                          : '#2C2C2E',
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.strengthBar,
                                    {
                                      backgroundColor:
                                        passwordStrength === 'strong'
                                          ? getPasswordStrengthColor('strong')
                                          : '#2C2C2E',
                                    },
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.strengthLabel,
                                  { color: getPasswordStrengthColor(passwordStrength) },
                                ]}
                              >
                                {getPasswordStrengthLabel(passwordStrength)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Confirm Password Input */}
                        <Input
                          label="Confirm Password"
                          type="password"
                          value={confirmPassword}
                          onChangeText={handleConfirmPasswordChange}
                          leftIcon="lock-closed-outline"
                          placeholder="Re-enter password"
                          error={confirmPasswordError}
                        />

                        {/* Sign Up Button */}
                        <View style={{ marginTop: theme.spacing.lg }}>
                          <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={handleSignUp}
                            loading={isLoading}
                            disabled={!isLoaded}
                          >
                            Create Account
                          </Button>
                        </View>

                        {/* Terms */}
                        <Text style={styles.terms}>
                          By signing up, you agree to our{' '}
                          <Text style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
                            Terms
                          </Text>{' '}
                          and{' '}
                          <Text style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
                            Privacy Policy
                          </Text>
                        </Text>
                      </>
                    ) : (
                      <>
                        {/* Verification Code Input */}
                        <Input
                          label="Verification Code"
                          type="text"
                          value={verificationCode}
                          onChangeText={setVerificationCode}
                          leftIcon="key-outline"
                          placeholder="123456"
                          keyboardType="number-pad"
                          maxLength={6}
                        />

                        {/* Verify Button */}
                        <View style={{ marginTop: theme.spacing.lg }}>
                          <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={handleVerifyEmail}
                            loading={isLoading}
                          >
                            Verify Email
                          </Button>
                        </View>

                        {/* Resend Code */}
                        <TouchableOpacity
                          onPress={async () => {
                            if (!signUp) {
                              Alert.alert('Error', 'Sign up session not found.');
                              return;
                            }
                            try {
                              await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                              Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
                            } catch (err) {
                              Alert.alert('Error', 'Failed to resend code. Please try again.');
                            }
                          }}
                          style={{ marginTop: theme.spacing.md }}
                        >
                          <Text style={[styles.resendText, { color: theme.colors.primary[500] }]}>
                            Didn't receive the code? Resend
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </LinearGradient>
                </BlurView>

                {/* Sign In Link */}
                {!pendingVerification && (
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already a warrior? </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push('/auth/sign-in');
                      }}
                    >
                      <Text style={[styles.footerLink, { color: theme.colors.primary[500] }]}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
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
    marginBottom: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#0A84FF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassGradient: {
    padding: 24,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 8,
    gap: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
