/**
 * 🔥 HOME SCREEN - PREMIUM REDESIGN
 *
 * Features:
 * - Progressive fade-in animations
 * - Parallax scroll effects
 * - Glassmorphism cards
 * - Animated gradients
 * - Micro-interactions with haptics
 * - Apple-grade design quality
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Animated,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useUserStats, useWeeklyActivity } from '@/hooks/useUserStats';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PARALLAX_FACTOR = 0.3;

export default function HomeScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values for staggered entrance
  const fadeAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(8)].map(() => new Animated.Value(30))).current;

  // Real-time stats from Drizzle ORM
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useUserStats();
  const { weeklyData, loading: weeklyLoading, refresh: refreshWeekly } = useWeeklyActivity();

  // Staggered entrance animation on mount
  useEffect(() => {
    const animations = fadeAnims.map((fadeAnim, index) =>
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[index], {
          toValue: 0,
          delay: index * 100,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(50, animations).start();
  }, []);

  const onRefresh = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([refreshStats(), refreshWeekly()]);
  };

  // Parallax effect calculations
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Animated card with press effect
  const AnimatedCard = ({
    children,
    index,
    onPress,
    gradient
  }: {
    children: React.ReactNode;
    index: number;
    onPress?: () => void;
    gradient?: readonly [string, string, ...string[]];
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const cardStyle = {
      opacity: fadeAnims[index],
      transform: [
        { translateY: slideAnims[index] },
        { scale: scaleAnim },
      ],
    };

    if (onPress) {
      return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
          <Animated.View style={[styles.animatedCard, cardStyle]}>
            {gradient ? (
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                {children}
              </LinearGradient>
            ) : (
              <View style={styles.glassCard}>
                <BlurView
                  intensity={theme.isDark ? 40 : 80}
                  tint={theme.isDark ? 'dark' : 'light'}
                  style={styles.blurContainer}
                >
                  {children}
                </BlurView>
              </View>
            )}
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <Animated.View style={[styles.animatedCard, cardStyle]}>
        {gradient ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {children}
          </LinearGradient>
        ) : (
          <View style={styles.glassCard}>
            <BlurView
              intensity={theme.isDark ? 40 : 80}
              tint={theme.isDark ? 'dark' : 'light'}
              style={styles.blurContainer}
            >
              {children}
            </BlurView>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? '#000000' : '#F5F5F7' }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Animated background gradient */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={
            theme.isDark
              ? ['#1a1a2e', '#0f0f1e', '#000000']
              : ['#E0F2FE', '#F0F9FF', '#FFFFFF']
          }
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading || weeklyLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {/* HERO SECTION - Animated Header */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              transform: [{ scale: headerScale }],
              opacity: fadeAnims[0],
            },
          ]}
        >
          <View style={styles.heroContent}>
            <Text style={[styles.greeting, { color: theme.colors.primary[500] }]}>
              Welcome back, Warrior
            </Text>
            <Text
              style={[
                styles.heroTitle,
                { color: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary },
              ]}
            >
              Ready to{'\n'}dominate today?
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary },
              ]}
            >
              Your journey to greatness continues
            </Text>
          </View>

          {/* Floating Stats Badges */}
          <View style={styles.floatingBadges}>
            <View style={styles.badgeWrapper}>
              <LinearGradient
                colors={['#FF6B6B', '#FF3B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.floatingBadge}
              >
                <Ionicons name="flame" size={20} color="#FFFFFF" />
                <Text style={styles.badgeText}>{stats?.current_streak || 0}</Text>
                <Text style={styles.badgeLabel}>Day Streak</Text>
              </LinearGradient>
            </View>

            <View style={styles.badgeWrapper}>
              <LinearGradient
                colors={['#34D399', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.floatingBadge}
              >
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
                <Text style={styles.badgeText}>+{stats?.total_workouts ? stats.total_workouts * 10 : 0}</Text>
                <Text style={styles.badgeLabel}>XP</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* AI GENERATOR - Premium Gradient Card */}
        <AnimatedCard
          index={1}
          gradient={['#8B5CF6', '#6366F1', '#3B82F6']}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push('/ai-generator/' as any);
          }}
        >
          <View style={styles.aiGeneratorContent}>
            <View style={styles.aiGeneratorHeader}>
              <View style={styles.aiIconCircle}>
                <Ionicons name="sparkles" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.aiGeneratorText}>
                <Text style={styles.aiGeneratorTitle}>AI Workout Generator</Text>
                <Text style={styles.aiGeneratorSubtitle}>
                  Science-backed • Personalized in seconds
                </Text>
              </View>
            </View>

            <View style={styles.aiGeneratorFeatures}>
              <View style={styles.featureTag}>
                <Ionicons name="flash" size={14} color="#FFFFFF" />
                <Text style={styles.featureText}>Instant</Text>
              </View>
              <View style={styles.featureTag}>
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.featureText}>Science-backed</Text>
              </View>
            </View>

            <Pressable
              style={styles.generateButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push('/ai-generator/' as any);
              }}
            >
              <Text style={styles.generateButtonText}>Generate Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#8B5CF6" />
            </Pressable>
          </View>
        </AnimatedCard>

        {/* CURRENT PROGRAM - Glassmorphism Card */}
        <AnimatedCard index={2}>
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                  Current Program
                </Text>
                <Text style={[styles.programSubtitle, { color: theme.colors.primary[500] }]}>
                  Keep the momentum going
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>65%</Text>
              </View>
            </View>

            <View style={styles.programInfo}>
              <LinearGradient
                colors={theme.isDark ? ['#2C2C2E', '#1C1C1E'] : ['#FFFFFF', '#F9F9FB']}
                style={styles.programDetails}
              >
                <View style={styles.programRow}>
                  <Ionicons name="barbell" size={24} color={theme.colors.primary[500]} />
                  <View style={styles.programTextContainer}>
                    <Text style={[styles.programName, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                      Warrior Transformation
                    </Text>
                    <Text style={[styles.programMeta, { color: theme.colors.primary[500] }]}>
                      Week 3 of 8 • 7 workouts left
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.success[500] }]}>13</Text>
                    <Text style={[styles.statLabel, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary[500] }]}>7</Text>
                    <Text style={[styles.statLabel, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                      Remaining
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Pressable
              style={[styles.continueButton, { backgroundColor: theme.colors.primary[500] }]}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            >
              <Text style={styles.continueButtonText}>Continue Program</Text>
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </AnimatedCard>

        {/* WORKOUT OF THE DAY - Featured Card */}
        <AnimatedCard index={3}>
          <View style={styles.wodCard}>
            <View style={styles.wodBadge}>
              <LinearGradient
                colors={['#FF6B6B', '#FF3B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wodBadgeGradient}
              >
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.wodBadgeText}>WOD</Text>
              </LinearGradient>
            </View>

            <Text style={[styles.wodTitle, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
              Full Body HIIT Blast
            </Text>
            <Text style={[styles.wodSubtitle, { color: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary }]}>
              High-intensity • 30 minutes • Intermediate
            </Text>

            <View style={styles.wodMetrics}>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                  <Ionicons name="flame" size={20} color={theme.colors.error[500]} />
                </View>
                <View>
                  <Text style={[styles.metricValue, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                    450
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                    Calories
                  </Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="barbell" size={20} color={theme.colors.primary[500]} />
                </View>
                <View>
                  <Text style={[styles.metricValue, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                    12
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                    Exercises
                  </Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="time" size={20} color={theme.colors.success[500]} />
                </View>
                <View>
                  <Text style={[styles.metricValue, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                    30
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                    Minutes
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[styles.startButton, { backgroundColor: theme.colors.primary[500] }]}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
              }}
            >
              <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>
          </View>
        </AnimatedCard>

        {/* QUICK STATS - Dual Cards */}
        <View style={styles.quickStatsContainer}>
          <AnimatedCard index={4}>
            <LinearGradient
              colors={['#FF6B6B', '#FF3B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="flame" size={40} color="#FFFFFF" />
              <Text style={styles.quickStatValue}>{stats?.current_streak || 0}</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={14} color="#FFFFFF" />
                <Text style={styles.statTrendText}>+2 this week</Text>
              </View>
            </LinearGradient>
          </AnimatedCard>

          <AnimatedCard index={5}>
            <LinearGradient
              colors={['#34D399', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="barbell" size={40} color="#FFFFFF" />
              <Text style={styles.quickStatValue}>{stats?.total_workouts || 0}</Text>
              <Text style={styles.quickStatLabel}>Total Workouts</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trophy" size={14} color="#FFFFFF" />
                <Text style={styles.statTrendText}>Top 10% users</Text>
              </View>
            </LinearGradient>
          </AnimatedCard>
        </View>

        {/* MORNING RITUAL - Premium Card */}
        <AnimatedCard index={6}>
          <View style={styles.ritualCard}>
            <View style={styles.ritualHeader}>
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ritualIcon}
              >
                <Ionicons name="sunny" size={28} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.ritualTextContainer}>
                <Text style={[styles.ritualTitle, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                  Morning Ritual
                </Text>
                <Text style={[styles.ritualSubtitle, { color: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary }]}>
                  Win the morning, win the day
                </Text>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.timeText, { color: '#F59E0B' }]}>5:00 AM</Text>
              </View>
            </View>

            <View style={styles.ritualProgress}>
              <View style={styles.ritualProgressBar}>
                <LinearGradient
                  colors={['#F59E0B', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.ritualProgressFill, { width: '60%' }]}
                />
              </View>
              <Text style={[styles.ritualProgressText, { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary }]}>
                3 of 5 rituals completed
              </Text>
            </View>

            <Pressable
              style={[styles.ritualButton, { borderColor: theme.isDark ? '#38383A' : '#E5E5EA' }]}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/morning-ritual' as any);
              }}
            >
              <Text style={[styles.ritualButtonText, { color: theme.colors.warning[500] }]}>
                Continue Ritual
              </Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.warning[500]} />
            </Pressable>
          </View>
        </AnimatedCard>

        {/* AI COACH - Quick Access */}
        <AnimatedCard index={7}>
          <LinearGradient
            colors={theme.isDark ? ['#2C2C2E', '#1C1C1E'] : ['#FFFFFF', '#F9F9FB']}
            style={styles.coachCard}
          >
            <View style={styles.coachHeader}>
              <View style={styles.coachIconContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.coachIconGradient}
                >
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.coachTextContainer}>
                <Text style={[styles.coachTitle, { color: theme.isDark ? '#FFFFFF' : '#000000' }]}>
                  AI Coach
                </Text>
                <Text style={[styles.coachSubtitle, { color: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary }]}>
                  Get personalized advice & motivation
                </Text>
              </View>
              <Pressable
                style={[styles.coachButton, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={[styles.coachButtonText, { color: theme.colors.accent[500] }]}>
                  Chat
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Bottom Spacing */}
        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },

  // HERO SECTION
  heroSection: {
    marginBottom: 32,
  },
  heroContent: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  floatingBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeWrapper: {
    flex: 1,
  },
  floatingBadge: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  // ANIMATED CARDS
  animatedCard: {
    marginBottom: 20,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  blurContainer: {
    padding: 24,
    overflow: 'hidden',
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  // AI GENERATOR
  aiGeneratorContent: {
    gap: 20,
  },
  aiGeneratorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiGeneratorText: {
    flex: 1,
  },
  aiGeneratorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  aiGeneratorSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  aiGeneratorFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },

  // PROGRAM CARD
  programCard: {
    gap: 20,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  programSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A84FF',
  },
  programInfo: {
    gap: 16,
  },
  programDetails: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programTextContainer: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  programMeta: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // WORKOUT OF THE DAY
  wodCard: {
    gap: 20,
  },
  wodBadge: {
    alignSelf: 'flex-start',
  },
  wodBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  wodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wodTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  wodSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  wodMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // QUICK STATS
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCardGradient: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // MORNING RITUAL
  ritualCard: {
    gap: 20,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ritualIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ritualTextContainer: {
    flex: 1,
  },
  ritualTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  ritualSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ritualProgress: {
    gap: 8,
  },
  ritualProgressBar: {
    height: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ritualProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  ritualProgressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ritualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  ritualButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // AI COACH
  coachCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coachIconContainer: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  coachIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachTextContainer: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  coachSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  coachButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  coachButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
