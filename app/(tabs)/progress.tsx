/**
 * Progress Tab - Apple-grade Progress Dashboard
 *
 * Features:
 * - Stats overview (workouts, time, calories, streak)
 * - Weekly progress chart
 * - Workout history with calendar
 * - Personal records
 * - Monthly trends
 * - Dark mode support
 * - Pull-to-refresh
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Card, Badge } from '@components/ui';
import { Skeleton } from '@components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useUserStats, useWeeklyActivity } from '@/hooks/useUserStats';

// Day names for weekly chart
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProgressScreen() {
  const theme = useStyledTheme();
  const { user } = useClerkAuth();

  // INNOVATION: Real stats from Supabase
  const { stats: userStats, loading: statsLoading, error: statsError, refreshing: statsRefreshing, refresh: refreshStats } = useUserStats();
  const { weeklyData: rawWeeklyData, loading: weeklyLoading, error: weeklyError, refresh: refreshWeekly } = useWeeklyActivity();

  // Transform weekly data to chart format
  const weeklyData = rawWeeklyData.map((activity) => {
    const date = new Date(activity.date);
    const dayIndex = date.getDay();
    return {
      day: DAY_NAMES[dayIndex],
      workouts: activity.workouts_count,
      calories: activity.calories_burned,
    };
  });

  // Real stats with fallback
  const stats = {
    totalWorkouts: userStats?.total_workouts || 0,
    totalMinutes: Math.round((userStats?.total_hours || 0) * 60),
    totalCalories: userStats?.total_calories || 0,
    currentStreak: userStats?.current_streak || 0,
    longestStreak: userStats?.best_streak || 0,
    thisWeekWorkouts: userStats?.workouts_this_week || 0,
    lastWeekWorkouts: 0, // TODO: Calculate from historical data
  };

  const [recentWorkouts] = useState<Array<{ id: string; name: string; date: string; duration: number; calories: number }>>([]);

  // Personal Records (TODO: Fetch from getPersonalRecords service)
  const personalRecords = [
    { name: 'Longest Workout', value: `${Math.max(...weeklyData.map(d => d.workouts * 30), 0)} min`, date: 'This week' },
    { name: 'Most Calories Burned', value: `${Math.max(...weeklyData.map(d => d.calories), 0)} cal`, date: 'This week' },
    { name: 'Longest Streak', value: `${stats.longestStreak} days`, date: 'All time' },
    { name: 'Total Workouts', value: `${stats.totalWorkouts}`, date: 'All time' },
  ];

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

  const handleRefresh = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Refresh both stats and weekly data in parallel
    await Promise.all([refreshStats(), refreshWeekly()]);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStreakColor = (streak: number): string => {
    if (streak >= 30) return theme.colors.secondary[600]; // Dark purple for ultimate achievement
    if (streak >= 14) return theme.colors.warning[500];
    if (streak >= 7) return theme.colors.primary[500];
    return theme.colors.secondary[500];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColors.primary }} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: textColors.primary }]}>Progress</Text>
          <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
            Your fitness journey
          </Text>
        </View>
      </View>

      {/* Streak Card */}
      <LinearGradient
        colors={[getStreakColor(stats.currentStreak), getStreakColor(stats.currentStreak) + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakCard}
      >
        <View style={styles.streakContent}>
          <View style={styles.streakIcon}>
            <Ionicons name="flame" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.streakText}>
            <Text style={styles.streakValue}>{stats.currentStreak} Day Streak!</Text>
            <Text style={styles.streakSubtitle}>
              Keep it up, Warrior! 💪 Best: {stats.longestStreak} days
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      {statsError ? (
        <ErrorState
          error={statsError}
          onRetry={refreshStats}
          compact
        />
      ) : statsLoading ? (
        // INNOVATION: Skeleton loaders for stats
        <View style={styles.statsGrid}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: bgColors.card }]}>
              <Skeleton variant="circle" width={28} height={28} />
              <Skeleton variant="text" width={60} height={32} style={{ marginTop: 8 }} />
              <Skeleton variant="text" width={70} height={14} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="barbell-outline" size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {stats.totalWorkouts}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Workouts</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="time-outline" size={28} color={theme.colors.secondary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {formatTime(stats.totalMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Total Time</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="flame-outline" size={28} color={theme.colors.warning[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {(stats.totalCalories / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Calories</Text>
          </View>
        </View>
      )}

      {/* This Week vs Last Week */}
      <Card shadow="md" padding="lg">
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>This Week</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: theme.colors.primary[500] }]}>
              {stats.thisWeekWorkouts}
            </Text>
            <Text style={[styles.comparisonLabel, { color: textColors.tertiary }]}>
              Workouts
            </Text>
          </View>
          <Ionicons
            name={stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? 'trending-up' : 'trending-down'}
            size={32}
            color={
              stats.thisWeekWorkouts >= stats.lastWeekWorkouts
                ? theme.colors.success[500]
                : theme.colors.error[500]
            }
          />
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: textColors.tertiary }]}>
              {stats.lastWeekWorkouts}
            </Text>
            <Text style={[styles.comparisonLabel, { color: textColors.tertiary }]}>
              Last Week
            </Text>
          </View>
        </View>
      </Card>

      {/* Weekly Chart */}
      <Card shadow="md" padding="lg">
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          Weekly Activity
        </Text>
        {weeklyError ? (
          <ErrorState
            error={weeklyError}
            onRetry={refreshWeekly}
            compact
          />
        ) : weeklyLoading ? (
          // INNOVATION: Skeleton loaders for chart
          <View style={styles.chartContainer}>
            {[...Array(7)].map((_, index) => (
              <View key={index} style={styles.chartBar}>
                <Skeleton variant="rect" width={30} height={100} borderRadius={8} />
                <Skeleton variant="text" width={20} height={14} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {weeklyData.map((day) => {
              const maxWorkouts = Math.max(...weeklyData.map((d) => d.workouts));
              const heightPercentage = maxWorkouts > 0 ? (day.workouts / maxWorkouts) * 100 : 0;

              return (
                <View key={day.day} style={styles.chartBar}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(heightPercentage, day.workouts > 0 ? 20 : 0)}%`,
                        backgroundColor:
                          day.workouts > 0 ? theme.colors.primary[500] : bgColors.surface,
                      },
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: textColors.tertiary }]}>
                    {day.day.charAt(0)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Personal Records */}
      <Card shadow="md" padding="lg">
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
            Personal Records
          </Text>
          <Badge variant="warning" size="sm" icon="trophy">
            {personalRecords.length}
          </Badge>
        </View>

        <View style={styles.recordsList}>
          {personalRecords.map((record, index) => (
            <View key={index} style={styles.recordItem}>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordName, { color: textColors.primary }]}>
                  {record.name}
                </Text>
                <Text style={[styles.recordDate, { color: textColors.tertiary }]}>
                  {record.date}
                </Text>
              </View>
              <Text style={[styles.recordValue, { color: theme.colors.primary[500] }]}>
                {record.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Recent Workouts */}
      <Card shadow="md" padding="lg">
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          Recent Workouts
        </Text>

        <View style={styles.workoutsList}>
          {recentWorkouts.map((workout) => (
            <View key={workout.id} style={[styles.workoutItem, { backgroundColor: bgColors.surface }]}>
              <View style={styles.workoutHeader}>
                <View style={[styles.workoutCheckmark, { backgroundColor: theme.colors.success[500] }]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutName, { color: textColors.primary }]}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.workoutDate, { color: textColors.tertiary }]}>
                    {new Date(workout.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <Ionicons name="time-outline" size={14} color={textColors.tertiary} />
                  <Text style={[styles.workoutStatText, { color: textColors.tertiary }]}>
                    {workout.duration}m
                  </Text>
                </View>
                <View style={styles.workoutStat}>
                  <Ionicons name="flame-outline" size={14} color={textColors.tertiary} />
                  <Text style={[styles.workoutStatText, { color: textColors.tertiary }]}>
                    {workout.calories} cal
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Monthly Goal Progress */}
      <Card shadow="md" padding="lg">
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Monthly Goal</Text>
        <View style={styles.goalContainer}>
          <View style={styles.goalProgress}>
            <View
              style={[
                styles.goalProgressBar,
                {
                  width: `${(stats.totalWorkouts % 20 / 20) * 100}%`,
                  backgroundColor: theme.colors.primary[500],
                },
              ]}
            />
          </View>
          <Text style={[styles.goalText, { color: textColors.secondary }]}>
            {stats.totalWorkouts % 20} / 20 workouts this month
          </Text>
        </View>
      </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 20, // Minimal top space (immersive mode)
    paddingBottom: 100, // Safety space to avoid tab bar overlap
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },

  // Streak card
  streakCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    flex: 1,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Comparison
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 13,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Records
  recordsList: {
    gap: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 13,
  },
  recordValue: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Workouts list
  workoutsList: {
    gap: 12,
  },
  workoutItem: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 13,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 36,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Goal
  goalContainer: {
    gap: 12,
  },
  goalProgress: {
    height: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
