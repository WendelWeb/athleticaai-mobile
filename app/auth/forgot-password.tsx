/**
 * Forgot Password Screen - Premium UI with Image Background
 *
 * Features:
 * - Strict email validation (blocks fake emails)
 * - Image background with gradient overlay
 * - Glassmorphism card UI
 * - Haptic feedback
 * - Real-time validation feedback
 * - Success state with animations
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
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
// TODO: Implement password reset with Clerk
// import { resetPassword } from '@/services/supabase/auth';
import { validateEmail } from '@utils/validation';

export default function ForgotPasswordScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Validation state
  const [emailError, setEmailError] = useState<string>('');

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const successScaleAnim = useState(new Animated.Value(0))[0];

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

  const handleResetPassword = async () => {
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

    setIsLoading(true);

    // TODO: Implement password reset with Clerk
    // Send reset email
    // const { error } = await resetPassword(email);

    // Temporary: Show alert that password reset needs Clerk implementation
    Alert.alert('Feature Not Available', 'Password reset needs to be implemented with Clerk Auth');
    setIsLoading(false);
    return;

    // if (error) {
    //   Alert.alert('Error', error.message);
    //   if (Platform.OS === 'ios') {
    //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    //   }
    //   return;
    // }

    // Success haptic
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Show success with animation
    setEmailSent(true);
    Animated.spring(successScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleResend = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEmailSent(false);
    setEmail('');
    setEmailError('');
  };

  // Success State
  if (emailSent) {
    return (
      <View style={styles.container}>
        {/*
          IMAGE PROMPT (Midjourney/DALL-E):
          Powerful athlete in meditation pose before workout, silhouette against golden hour light
          streaming through gym windows, inspirational atmosphere, zen meets warrior energy, dramatic
          backlighting, motivational fitness photography, professional quality, shallow depth of field
          --ar 9:16 --q 2 --s 750

          Save as: assets/auth-bg-forgot.jpg
        */}
        <ImageBackground
          source={require('../../assets/auth-bg-forgot.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <View style={styles.successContainer}>
              <Animated.View
                style={{
                  transform: [{ scale: successScaleAnim }],
                }}
              >
                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                </View>

                {/* Success Message */}
                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to{'\n'}
                  <Text style={{ fontWeight: '700', color: theme.colors.primary[500] }}>
                    {email}
                  </Text>
                </Text>

                {/* Action Buttons */}
                <View style={styles.successActions}>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.back();
                    }}
                  >
                    Back to Sign In
                  </Button>

                  <TouchableOpacity onPress={handleResend} style={{ marginTop: 16 }}>
                    <Text style={[styles.resendText, { color: theme.colors.primary[500] }]}>
                      Didn't receive the email? Resend
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  // Main Form
  return (
    <View style={styles.container}>
      {/*
        IMAGE PROMPT (Midjourney/DALL-E):
        Powerful athlete in meditation pose before workout, silhouette against golden hour light
        streaming through gym windows, inspirational atmosphere, zen meets warrior energy, dramatic
        backlighting, motivational fitness photography, professional quality, shallow depth of field
        --ar 9:16 --q 2 --s 750

        Save as: assets/auth-bg-forgot.jpg
      */}
      <ImageBackground
        source={require('../../assets/auth-bg-forgot.jpg')}
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
                {/* Header with Icon */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={56} color="#0A84FF" />
                  </View>
                  <Text style={styles.title}>Forgot Your</Text>
                  <Text style={[styles.title, styles.titleAccent]}>Password?</Text>
                  <Text style={styles.subtitle}>
                    No worries, warrior. Enter your email and we'll send you a reset link.
                  </Text>
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

                    {/* Reset Button */}
                    <View style={{ marginTop: theme.spacing.lg }}>
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={handleResetPassword}
                        loading={isLoading}
                      >
                        Send Reset Link
                      </Button>
                    </View>

                    {/* Info Text */}
                    <Text style={styles.infoText}>
                      💡 Check your spam folder if you don't see the email within a few minutes.
                    </Text>
                  </LinearGradient>
                </BlurView>

                {/* Back to Sign In Link */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.back();
                    }}
                    style={styles.backToSignInButton}
                  >
                    <Ionicons name="arrow-back" size={16} color={theme.colors.primary[500]} />
                    <Text style={[styles.backToSignInText, { color: theme.colors.primary[500] }]}>
                      Back to Sign In
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(10,132,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(10,132,255,0.3)',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#0A84FF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
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
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backToSignInText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Success State Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  successTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
