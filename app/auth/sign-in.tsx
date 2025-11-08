/**
 * Sign In Screen - Clerk Auth Integration
 *
 * Features:
 * - Clerk authentication with useSignIn hook
 * - Strict email validation (blocks fake emails)
 * - Premium gradient background UI
 * - Glassmorphism card UI
 * - Haptic feedback
 * - Real-time validation feedback
 * - Auto-create profile in Neon after sign in
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
import { useSignIn, useUser } from '@clerk/clerk-expo';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
import { validateEmail } from '@utils/validation';
import { getProfile, createProfile } from '@/services/drizzle/profile';

export default function SignInScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Validation state
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (text.length > 0 && text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded) {
      Alert.alert('Error', 'Authentication system is loading...');
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Sign in with Clerk
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Set active session
        await setActive({ session: result.createdSessionId });

        // Success haptic
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Wait a moment for user to be available
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get Clerk user ID (will be available after setActive)
        const userId = user?.id;

        if (userId) {
          // Check if profile exists in Neon
          const { profile, error: profileError } = await getProfile(userId);

          if (!profile && !profileError) {
            // Create profile if doesn't exist
            await createProfile(userId, email);
          }

          // Check onboarding status
          const onboardingCompleted = profile?.onboarding_completed;

          if (!onboardingCompleted) {
            // Navigate to onboarding
            router.replace('/onboarding');
          } else {
            // Navigate to home
            router.replace('/(tabs)');
          }
        } else {
          // Fallback: navigate to onboarding
          router.replace('/onboarding');
        }
      } else {
        // Handle incomplete sign in (e.g., 2FA required)
        Alert.alert('Sign In Incomplete', 'Please complete the sign in process.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);

      let errorTitle = 'Sign In Failed';
      let errorMessage = err.errors?.[0]?.message || 'An error occurred during sign in.';

      // Handle specific Clerk errors
      if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
        errorTitle = 'Invalid Credentials';
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
      }

      if (errorMessage.includes('not found') || errorMessage.includes("doesn't exist")) {
        errorTitle = 'Account Not Found';
        errorMessage = 'No account found with this email. Please sign up first.';

        Alert.alert(errorTitle, errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/auth/sign-up') },
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

  return (
    <View style={styles.container}>
      {/* Background Image with Gradient Overlay */}
      <ImageBackground
        source={require('../../assets/auth-bg-signin.jpg')}
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
                  <Text style={styles.title}>Welcome Back,</Text>
                  <Text style={[styles.title, styles.titleAccent]}>Warrior</Text>
                  <Text style={styles.subtitle}>Continue your transformation journey</Text>
                </View>

                {/* Glassmorphism Card */}
                <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.glassGradient}
                  >
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
                    <Input
                      label="Password"
                      type="password"
                      value={password}
                      onChangeText={handlePasswordChange}
                      leftIcon="lock-closed-outline"
                      placeholder="Enter your password"
                      error={passwordError}
                    />

                    {/* Forgot Password */}
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push('/auth/forgot-password');
                      }}
                    >
                      <Text style={[styles.forgotPassword, { color: theme.colors.primary[500] }]}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <View style={{ marginTop: theme.spacing.lg }}>
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={handleSignIn}
                        loading={isLoading}
                        disabled={!isLoaded}
                      >
                        Sign In
                      </Button>
                    </View>
                  </LinearGradient>
                </BlurView>

                {/* Sign Up Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>New warrior? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push('/auth/sign-up');
                    }}
                  >
                    <Text style={[styles.footerLink, { color: theme.colors.primary[500] }]}>
                      Join the Battle
                    </Text>
                  </TouchableOpacity>
                </View>
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
    marginBottom: 24,
  },
  glassGradient: {
    padding: 24,
  },
  forgotPassword: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 8,
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
