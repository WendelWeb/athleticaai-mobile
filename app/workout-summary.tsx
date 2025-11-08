/**
 * Post-Workout Summary Screen - Celebration & Stats
 *
 * INNOVATION FEATURES:
 * - Confetti animation on mount (celebration!)
 * - Stats recap cards (duration, calories, exercises completed)
 * - XP earned + progress bar to next level
 * - Streak counter with fire animation (consecutive days)
 * - Achievement unlocked notification (if applicable)
 * - Personal records (PR) highlighted (if new best)
 * - Social CTAs (Share on Feed, Challenge a Friend)
 * - Motivational message based on performance
 * - Navigation (View Progress, Done → Dashboard)
 * - Haptic feedback on celebration
 * - Dark mode optimized
 *
 * USER FLOW:
 * 1. User completes workout in Workout Player
 * 2. Workout Player navigates here with session data
 * 3. Confetti explodes + haptic feedback
 * 4. Stats animate in (stagger effect)
 * 5. User can share, view progress, or go back to dashboard
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Badge } from '@components/ui';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useUserStats } from '@/hooks/useUserStats';

const { width, height } = Dimensions.get('window');

// Session data structure
interface WorkoutSessionData {
  workout_title: string;
  duration_seconds: number;
  calories_burned: number;
  exercises_completed: number;
  total_exercises: number;
  xp_earned?: number;
  streak_days?: number;
  new_pr?: boolean;
  achievement_unlocked?: string;
}

export default function WorkoutSummaryScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useClerkAuth();
  const { stats: userStats } = useUserStats();

  // Session data
  const [sessionData, setSessionData] = useState<WorkoutSessionData | null>(null);

  // Animation values
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(30)).current;
  const xpBarWidth = useRef(new Animated.Value(0)).current;

  // Confetti particles (custom implementation)
  const [confettiParticles, setConfettiParticles] = useState<
    Array<{ id: number; x: number; rotation: Animated.Value; translateY: Animated.Value }>
  >([]);

  // Colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark
      ? theme.colors.dark.text.secondary
      : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // Load session data on mount
  useEffect(() => {
    loadSessionData();
    triggerCelebration();
  }, []);

  // Load session data from params
  const loadSessionData = () => {
    if (params.sessionData) {
      try {
        const data: WorkoutSessionData = JSON.parse(params.sessionData as string);
        setSessionData(data);
      } catch (error) {
        console.error('Error parsing session data:', error);
        // Fallback mock data for development
        setSessionData({
          workout_title: 'Full Body HIIT',
          duration_seconds: 1800,
          calories_burned: 285,
          exercises_completed: 8,
          total_exercises: 8,
          xp_earned: 150,
          streak_days: 7,
          new_pr: false,
        });
      }
    } else {
      // Mock data for testing
      setSessionData({
        workout_title: 'Full Body HIIT',
        duration_seconds: 1800,
        calories_burned: 285,
        exercises_completed: 8,
        total_exercises: 8,
        xp_earned: 150,
        streak_days: 7,
        new_pr: false,
      });
    }
  };

  // Trigger celebration animations
  const triggerCelebration = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
    }

    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      rotation: new Animated.Value(0),
      translateY: new Animated.Value(-100),
    }));
    setConfettiParticles(particles);

    // Animate confetti falling
    particles.forEach((particle, index) => {
      Animated.parallel([
        Animated.timing(particle.translateY, {
          toValue: height + 100,
          duration: 3000 + Math.random() * 1000,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000,
          delay: index * 20,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Stats fade in
    Animated.parallel([
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(statsTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // XP bar fill
    Animated.timing(xpBarWidth, {
      toValue: 1,
      duration: 1500,
      delay: 800,
      useNativeDriver: false,
    }).start();
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Get motivational message based on performance
  const getMotivationalMessage = (): string => {
    if (!sessionData) return '';

    const completion_rate = sessionData.exercises_completed / sessionData.total_exercises;

    if (completion_rate === 1) {
      return '🔥 Perfect! You crushed it!';
    } else if (completion_rate >= 0.8) {
      return '💪 Great work! Almost perfect!';
    } else if (completion_rate >= 0.5) {
      return '👏 Good effort! Keep pushing!';
    } else {
      return '💯 Every rep counts! You showed up!';
    }
  };

  // Handle share
  const handleShare = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // TODO: Implement share functionality (native share or social feed)
    alert('Share functionality coming soon!');
  };

  // Handle challenge
  const handleChallenge = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // TODO: Navigate to challenge creation
    alert('Challenge a friend feature coming soon!');
  };

  // Navigate to progress
  const handleViewProgress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.push('/(tabs)/progress' as any);
  };

  // Navigate to dashboard
  const handleDone = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.replace('/(tabs)/' as any);
  };

  if (!sessionData) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
        <Text style={[styles.loadingText, { color: textColors.secondary }]}>Loading...</Text>
      </View>
    );
  }

  // Calculate XP progress with real user stats
  const currentLevel = userStats?.current_level || 1;
  const currentXP = userStats?.total_xp || 0;

  // XP formula: Level 1 = 100 XP, increases by 50 per level (100, 150, 200, 250...)
  const xpForNextLevel = userStats?.xp_for_next_level || (100 + (currentLevel - 1) * 50);

  const newXP = currentXP + (sessionData.xp_earned || 0);
  const xpProgress = ((newXP % xpForNextLevel) / xpForNextLevel) || 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* Confetti Particles */}
      {confettiParticles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.confettiParticle,
            {
              left: particle.x,
              backgroundColor: [
                theme.colors.primary[500],
                theme.colors.secondary[500],
                theme.colors.warning[500],
                theme.colors.success[500],
              ][particle.id % 4],
              transform: [
                { translateY: particle.translateY },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroIcon, { color: textColors.primary }]}>🎉</Text>
          <Text style={[styles.heroTitle, { color: textColors.primary }]}>
            Workout Complete!
          </Text>
          <Text style={[styles.heroSubtitle, { color: textColors.secondary }]}>
            {getMotivationalMessage()}
          </Text>
          <Text style={[styles.workoutTitle, { color: textColors.tertiary }]}>
            {sessionData.workout_title}
          </Text>
        </View>

        {/* Stats Grid */}
        <Animated.View
          style={[
            styles.statsGrid,
            {
              opacity: statsOpacity,
              transform: [{ translateY: statsTranslateY }],
            },
          ]}
        >
          {/* Duration */}
          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="time-outline" size={32} color={theme.colors.primary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {Math.floor(sessionData.duration_seconds / 60)}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.secondary }]}>Minutes</Text>
          </View>

          {/* Calories */}
          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="flame-outline" size={32} color={theme.colors.warning[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {sessionData.calories_burned}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.secondary }]}>Calories</Text>
          </View>

          {/* Exercises */}
          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="barbell-outline" size={32} color={theme.colors.secondary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {sessionData.exercises_completed}/{sessionData.total_exercises}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.secondary }]}>Exercises</Text>
          </View>
        </Animated.View>

        {/* XP Earned */}
        {sessionData.xp_earned && (
          <View style={[styles.xpCard, { backgroundColor: bgColors.card }]}>
            <View style={styles.xpHeader}>
              <View style={styles.xpHeaderLeft}>
                <Ionicons name="star" size={20} color={theme.colors.warning[500]} />
                <Text style={[styles.xpTitle, { color: textColors.primary }]}>
                  +{sessionData.xp_earned} XP Earned
                </Text>
              </View>
              <Text style={[styles.levelBadge, { color: theme.colors.primary[500] }]}>
                Level {currentLevel}
              </Text>
            </View>

            {/* XP Progress Bar */}
            <View style={[styles.xpBarContainer, { backgroundColor: bgColors.surface }]}>
              <Animated.View
                style={[
                  styles.xpBarFill,
                  {
                    width: xpBarWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${xpProgress * 100}%`],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.xpBarGradient}
                />
              </Animated.View>
            </View>

            <Text style={[styles.xpProgress, { color: textColors.tertiary }]}>
              {newXP % xpForNextLevel} / {xpForNextLevel} XP to Level {currentLevel + 1}
            </Text>
          </View>
        )}

        {/* Streak Counter */}
        {sessionData.streak_days && sessionData.streak_days > 0 && (
          <View style={[styles.streakCard, { backgroundColor: bgColors.card }]}>
            <LinearGradient
              colors={[theme.colors.warning[500], theme.colors.error[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakGradient}
            >
              <Ionicons name="flame" size={32} color="#FFFFFF" />
              <View style={styles.streakContent}>
                <Text style={styles.streakNumber}>{sessionData.streak_days}</Text>
                <Text style={styles.streakLabel}>Day Streak!</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.streakSubtext, { color: textColors.secondary }]}>
              {sessionData.streak_days >= 7
                ? '🔥 You\'re on fire! Keep it up!'
                : 'Keep going to build your streak!'}
            </Text>
          </View>
        )}

        {/* New PR Badge */}
        {sessionData.new_pr && (
          <View style={[styles.prBadge, { backgroundColor: theme.colors.success[500] }]}>
            <Ionicons name="trophy" size={24} color="#FFFFFF" />
            <Text style={styles.prText}>New Personal Record! 🎯</Text>
          </View>
        )}

        {/* Achievement Unlocked */}
        {sessionData.achievement_unlocked && (
          <View style={[styles.achievementCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="ribbon" size={28} color={theme.colors.warning[500]} />
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: textColors.primary }]}>
                Achievement Unlocked!
              </Text>
              <Text style={[styles.achievementName, { color: theme.colors.primary[500] }]}>
                {sessionData.achievement_unlocked}
              </Text>
            </View>
          </View>
        )}

        {/* Social CTAs */}
        <View style={styles.socialSection}>
          <Text style={[styles.socialTitle, { color: textColors.secondary }]}>
            Share your achievement
          </Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.socialButton, { backgroundColor: bgColors.card }]}
            >
              <Ionicons name="share-social-outline" size={24} color={theme.colors.primary[500]} />
              <Text style={[styles.socialButtonText, { color: textColors.primary }]}>
                Share on Feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChallenge}
              style={[styles.socialButton, { backgroundColor: bgColors.card }]}
            >
              <Ionicons name="people-outline" size={24} color={theme.colors.secondary[500]} />
              <Text style={[styles.socialButtonText, { color: textColors.primary }]}>
                Challenge Friend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: bgColors.surface }]}>
        <Button variant="ghost" onPress={handleViewProgress} style={styles.actionButton}>
          View Progress
        </Button>
        <Button variant="primary" onPress={handleDone} style={styles.actionButton}>
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: height / 2 - 50,
  },

  // Confetti
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // XP Card
  xpCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  levelBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  xpBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
  },
  xpBarGradient: {
    flex: 1,
  },
  xpProgress: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Streak Card
  streakCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  streakSubtext: {
    fontSize: 14,
    textAlign: 'center',
    padding: 12,
  },

  // PR Badge
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  prText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Achievement Card
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Social Section
  socialSection: {
    marginBottom: 24,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
  },
});
