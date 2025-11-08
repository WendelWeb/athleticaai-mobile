/**
 * Email Confirmation Screen
 *
 * Shown when user needs to confirm their email
 * Allows resending confirmation email
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Input } from '@components/ui';
import { db } from '@/db';
import { Platform } from 'react-native';

export default function ConfirmEmailScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Email can come from params or user input
  const [email, setEmail] = useState((params.email as string) || '');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResendEmail = async () => {
    if (!email || email.trim().length === 0) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);

      // TODO: Implement email confirmation resend with Clerk
      // Clerk handles email confirmation differently
      Alert.alert('Feature Not Available', 'Email confirmation resend needs Clerk implementation');
      setLoading(false);
      return;

      // const { error } = await clerkClient.auth.resend({
      //   type: 'signup',
      //   email: email.trim(),
      // });

      // if (error) {
      //   console.error('Resend email error:', error);
      //   Alert.alert('Error', error.message || 'Failed to send confirmation email. Please try again.');
      //   setLoading(false);
      //   return;
      // }

      // Success
      setEmailSent(true);
      setLoading(false);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Email Sent! ✉️',
        `We've sent a new confirmation link to ${email}. Please check your inbox.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // User can stay on this screen or go back
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Resend email error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/auth-bg-signin.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
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

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-unread" size={64} color={theme.colors.primary[500]} />
              </View>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a confirmation link to your email address. Please check your inbox and click the link to verify your account.
              </Text>
            </View>

            {/* Glassmorphism Card */}
            <BlurView intensity={20} tint="dark" style={styles.glassCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.glassGradient}
              >
                {/* Email Input (if not provided via params) */}
                {!params.email && (
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChangeText={setEmail}
                    leftIcon="mail-outline"
                    placeholder="warrior@athletica.ai"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}

                {params.email && (
                  <View style={styles.emailDisplay}>
                    <Text style={styles.emailLabel}>Sent to:</Text>
                    <Text style={styles.emailValue}>{email}</Text>
                  </View>
                )}

                {/* Resend Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleResendEmail}
                  loading={loading}
                  disabled={emailSent}
                  icon={<Ionicons name="mail" size={20} color="#FFFFFF" />}
                >
                  {emailSent ? 'Email Sent ✓' : 'Resend Confirmation Email'}
                </Button>

                {/* Helper Text */}
                <Text style={styles.helperText}>
                  Didn't receive the email? Check your spam folder or click the button above to resend.
                </Text>
              </LinearGradient>
            </BlurView>

            {/* Back to Sign In */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already verified? </Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.replace('/auth/sign-in');
                }}
              >
                <Text style={[styles.footerLink, { color: theme.colors.primary[500] }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
  emailDisplay: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
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
