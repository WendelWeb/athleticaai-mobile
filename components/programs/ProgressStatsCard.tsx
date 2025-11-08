/**
 * Progress Stats Card Component
 *
 * Shows daily, weekly, and total progress for a program
 * Displays reset info and motivational messages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserProgram } from '@/services/drizzle/user-programs';
import { useStyledTheme } from '@theme/ThemeProvider';

interface ProgressStatsCardProps {
  userProgram: UserProgram;
}

export function ProgressStatsCard({ userProgram }: ProgressStatsCardProps) {
  const theme = useStyledTheme();

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
  };

  // Calculate percentages
  const dailyPercentage = Math.round(
    (userProgram.daily_workouts_completed / userProgram.daily_workouts_target) * 100
  );

  const weeklyPercentage = userProgram.weekly_workouts_completed
    ? Math.round((userProgram.weekly_workouts_completed / 7) * 100) // Assuming 7 days a week
    : 0;

  const totalPercentage = Math.round(
    (userProgram.workouts_completed / userProgram.total_workouts) * 100
  );

  // Check if completed today
  const today = new Date().toISOString().split('T')[0];
  const completedToday = userProgram.last_workout_date === today;

  return (
    <View style={styles.container}>
      {/* Daily Progress */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.statHeader}>
          <Ionicons name="today" size={24} color="#FFFFFF" />
          <Text style={styles.statLabel}>Today</Text>
        </View>

        <View style={styles.statBody}>
          <Text style={styles.statValue}>
            {userProgram.daily_workouts_completed}/{userProgram.daily_workouts_target}
          </Text>
          <Text style={styles.statSubtext}>
            {completedToday ? '✅ Completed!' : 'Workouts'}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(dailyPercentage, 100)}%`,
                backgroundColor: dailyPercentage >= 100 ? theme.colors.success[400] : '#FFFFFF',
              },
            ]}
          />
        </View>

        <Text style={styles.resetInfo}>Resets at midnight</Text>
      </LinearGradient>

      {/* Weekly Progress */}
      <LinearGradient
        colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.statHeader}>
          <Ionicons name="calendar" size={24} color="#FFFFFF" />
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statBody}>
          <Text style={styles.statValue}>{userProgram.weekly_workouts_completed}</Text>
          <Text style={styles.statSubtext}>Workouts</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(weeklyPercentage, 100)}%`,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
        </View>

        <Text style={styles.resetInfo}>Resets every Monday</Text>
      </LinearGradient>

      {/* Total Progress */}
      <LinearGradient
        colors={[theme.colors.success[500], theme.colors.success[600]]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.statHeader}>
          <Ionicons name="trophy" size={24} color="#FFFFFF" />
          <Text style={styles.statLabel}>Total Progress</Text>
        </View>

        <View style={styles.statBody}>
          <Text style={styles.statValue}>{totalPercentage}%</Text>
          <Text style={styles.statSubtext}>
            {userProgram.workouts_completed}/{userProgram.total_workouts} Workouts
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(totalPercentage, 100)}%`,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
        </View>

        <Text style={styles.resetInfo}>
          {userProgram.total_workouts - userProgram.workouts_completed} workouts remaining
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statBody: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  resetInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
