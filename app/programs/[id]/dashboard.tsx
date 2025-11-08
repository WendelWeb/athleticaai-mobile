/**
 * 🔥 ATHLETICAAI - PROGRAM DASHBOARD SCREEN
 * Complete program tracking with insights, calendar view, and innovations
 * Apple Fitness+ level experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getWorkoutProgramById, type WorkoutProgram } from '@services/drizzle/workouts';
import { getUserProgram, updateProgramProgress, type UserProgram } from '@services/drizzle/user-programs';
import { useClerkAuth } from '@hooks/useClerkAuth';

// Types
type WorkoutProgramWithWorkouts = WorkoutProgram & {
  workouts?: Array<{
    workout_id: string;
    week_number: number;
    day_number: number;
    name: string;
    description?: string;
    duration_minutes?: number;
  }>;
};

type WorkoutDay = {
  workout_id: string;
  week: number;
  day: number;
  name: string;
  duration_minutes: number;
  status: 'completed' | 'current' | 'locked';
};

const { width, height } = Dimensions.get('window');

export default function ProgramDashboardScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id, userProgramId } = useLocalSearchParams<{ id: string; userProgramId: string }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgramWithWorkouts | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Debug: Log params on mount
  useEffect(() => {
    console.log('🏁 Dashboard component mounted');
    console.log('📦 Received params:', { id, userProgramId });
    console.log('👤 Profile status:', { hasProfile: !!profile, profileId: profile?.id });
  }, []);

  // Load data (wait for profile to be loaded)
  useEffect(() => {
    if (profile?.id) {
      console.log('✅ Profile loaded, calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('⏳ Waiting for profile to load...');
    }
  }, [id, userProgramId, profile?.id]);

  const loadDashboardData = async () => {
    console.log('🔍 Dashboard: loadDashboardData called');
    console.log('📝 Dashboard params:', { id, userProgramId, profileId: profile?.id });

    if (!id || !userProgramId || !profile?.id) {
      console.log('❌ Dashboard: Missing required params');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Dashboard: Fetching program and user program...');

      // Load program and user program in parallel
      const [programData, userProgramData] = await Promise.all([
        getWorkoutProgramById(id as string),
        getUserProgram(profile.id, id as string),
      ]);

      console.log('✅ Dashboard: Program data loaded:', programData?.id, programData?.name);
      console.log('✅ Dashboard: User program data loaded:', userProgramData?.id, userProgramData?.status);
      console.log('📊 Dashboard: Program workouts count:', (programData as any)?.workouts?.length || 0);

      setProgram(programData as WorkoutProgramWithWorkouts);
      setUserProgram(userProgramData);

      // Set selected week to current week
      if (userProgramData) {
        setSelectedWeek(userProgramData.current_week);
        console.log('📅 Dashboard: Selected week:', userProgramData.current_week);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading dashboard data:', error);
      alert(`Error loading dashboard: ${error}`);
    } finally {
      console.log('✅ Dashboard: Loading complete');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Compute workout days with status
  const getWorkoutDays = (): WorkoutDay[] => {
    if (!program || !userProgram) {
      console.log('⚠️ Dashboard: Missing program or userProgram');
      return [];
    }

    // If program has no workouts array (not populated in DB), create mock workouts
    if (!program.workouts || program.workouts.length === 0) {
      console.log('⚠️ Dashboard: Program has no workouts, creating mock data');
      const mockWorkouts: WorkoutDay[] = [];
      const totalWorkouts = userProgram.total_workouts || 12;

      // Create mock workouts based on total_workouts
      for (let i = 0; i < totalWorkouts; i++) {
        const week = Math.floor(i / 3) + 1; // 3 workouts per week
        const day = (i % 3) + 1;
        let status: 'completed' | 'current' | 'locked' = 'locked';

        if (i < userProgram.workouts_completed) {
          status = 'completed';
        } else if (i === userProgram.current_workout_index) {
          status = 'current';
        }

        mockWorkouts.push({
          workout_id: `mock-workout-${i}`,
          week,
          day,
          name: `Workout ${i + 1}`,
          duration_minutes: 45,
          status,
        });
      }

      return mockWorkouts;
    }

    return program.workouts.map((workout) => {
      const workoutIndex = (workout.week_number - 1) * 7 + (workout.day_number - 1);
      let status: 'completed' | 'current' | 'locked' = 'locked';

      if (workoutIndex < userProgram.workouts_completed) {
        status = 'completed';
      } else if (workoutIndex === userProgram.current_workout_index) {
        status = 'current';
      }

      return {
        workout_id: workout.workout_id,
        week: workout.week_number,
        day: workout.day_number,
        name: workout.name,
        duration_minutes: workout.duration_minutes || 45,
        status,
      };
    });
  };

  const workoutDays = getWorkoutDays();
  console.log('📊 Dashboard: Workout days computed:', workoutDays.length);

  // Get today's workout
  const todaysWorkout = workoutDays.find((w) => w.status === 'current');

  // Get weeks count
  const totalWeeks = Math.max(...workoutDays.map((w) => w.week), 1);

  // Compute stats
  const completionPercentage = userProgram
    ? Math.round((userProgram.workouts_completed / userProgram.total_workouts) * 100)
    : 0;

  const streak = 5; // TODO: Calculate real streak from workout sessions
  const avgDuration = 42; // TODO: Calculate from completed workouts
  const totalVolume = 15420; // TODO: Calculate from workout logs
  const caloriesBurned = 3450; // TODO: Calculate from workout logs

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleStartTodaysWorkout = () => {
    if (!todaysWorkout || !program || !userProgram) return;

    // Check if this is a mock workout (not in database)
    if (todaysWorkout.workout_id.startsWith('mock-workout-')) {
      console.log('⚠️ Mock today\'s workout, showing info alert');
      alert(
        '📋 Demo Mode\n\n' +
        'You\'re viewing demo data because your workout program doesn\'t have real workouts yet.\n\n' +
        '✅ To use real workouts:\n' +
        '1. Run: npm run seed:programs\n' +
        '2. This will populate the database with complete workout programs\n\n' +
        'The rest of the dashboard features work perfectly! Try the 4 innovation cards below.'
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.push({
      pathname: `/workout-player/${todaysWorkout.workout_id}`,
      params: {
        programId: program.id,
        userProgramId: userProgram.id,
        workoutIndex: userProgram.current_workout_index,
      },
    } as any);
  };

  const handleWorkoutPress = (workout: WorkoutDay) => {
    if (workout.status === 'locked') {
      alert('Complete previous workouts to unlock this one!');
      return;
    }

    // Check if this is a mock workout (not in database)
    if (workout.workout_id.startsWith('mock-workout-')) {
      console.log('⚠️ Mock workout clicked, showing info alert');
      alert(
        '📋 Mock Workout\n\n' +
        'This is placeholder data. To see real workouts:\n\n' +
        '1. Populate your database with workout programs\n' +
        '2. Use the "Start Today\'s Workout" button to begin\n\n' +
        'For now, click the big "Start Today\'s Workout" card above!'
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Navigate to workout detail (only for real workouts)
    router.push(`/workouts/${workout.workout_id}` as any);
  };

  const handleInnovationPress = (innovation: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!program || !userProgram) return;

    switch (innovation) {
      case 'adaptive':
        router.push({
          pathname: `/programs/${program.id}/adaptive-scheduling`,
          params: { userProgramId: userProgram.id },
        } as any);
        break;
      case 'leaderboard':
        router.push({
          pathname: `/programs/${program.id}/leaderboard`,
          params: { userProgramId: userProgram.id },
        } as any);
        break;
      case 'remix':
        router.push({
          pathname: `/programs/${program.id}/remix`,
          params: { userProgramId: userProgram.id },
        } as any);
        break;
      case 'challenge':
        // Challenge Mode not implemented yet
        alert('⚡ Challenge Mode - Coming Soon!');
        break;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.colors.primary[500]} style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!program || !userProgram) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, { color: textColors.secondary }]}>
          Unable to load program dashboard
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColors.surface }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColors.primary }]} numberOfLines={1}>
            {program.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
            Week {userProgram.current_week} • {completionPercentage}% Complete
          </Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={textColors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[500]} />
        }
      >
        {/* Progress Ring */}
        <View style={[styles.progressSection, { backgroundColor: bgColors.surface }]}>
          <View style={styles.progressRing}>
            {/* TODO: Replace with actual ProgressRing component with animation */}
            <View
              style={[
                styles.progressRingInner,
                {
                  borderColor: theme.colors.primary[500],
                  borderWidth: 8,
                },
              ]}
            >
              <Text style={[styles.progressPercentage, { color: textColors.primary }]}>
                {completionPercentage}%
              </Text>
              <Text style={[styles.progressLabel, { color: textColors.secondary }]}>Complete</Text>
            </View>
          </View>

          <View style={styles.progressInfo}>
            <Text style={[styles.progressTitle, { color: textColors.primary }]}>
              {userProgram.workouts_completed} of {userProgram.total_workouts} Workouts
            </Text>
            <Text style={[styles.progressSubtitle, { color: textColors.secondary }]}>
              {userProgram.total_workouts - userProgram.workouts_completed} workouts remaining
            </Text>
          </View>
        </View>

        {/* Today's Workout Card */}
        {todaysWorkout && (
          <View style={styles.todaySection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Today's Workout</Text>

            <TouchableOpacity
              onPress={handleStartTodaysWorkout}
              activeOpacity={0.9}
              style={styles.todayCard}
            >
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                style={styles.todayCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.todayCardContent}>
                  <View style={styles.todayCardHeader}>
                    <View style={styles.todayCardBadge}>
                      <Text style={styles.todayCardBadgeText}>
                        W{todaysWorkout.week}D{todaysWorkout.day}
                      </Text>
                    </View>
                    <View style={styles.todayCardDuration}>
                      <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.todayCardDurationText}>{todaysWorkout.duration_minutes} min</Text>
                    </View>
                  </View>

                  <Text style={styles.todayCardTitle} numberOfLines={2}>
                    {todaysWorkout.name}
                  </Text>

                  <View style={styles.todayCardAction}>
                    <Text style={styles.todayCardActionText}>Start Workout</Text>
                    <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Quick Stats</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="flame" size={24} color={theme.colors.warning[500]} />
              <Text style={[styles.statValue, { color: textColors.primary }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>Day Streak</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="barbell" size={24} color={theme.colors.primary[500]} />
              <Text style={[styles.statValue, { color: textColors.primary }]}>
                {totalVolume.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>Total Volume</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="time" size={24} color={theme.colors.success[500]} />
              <Text style={[styles.statValue, { color: textColors.primary }]}>{avgDuration}</Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>Avg Duration</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="fitness" size={24} color={theme.colors.error[500]} />
              <Text style={[styles.statValue, { color: textColors.primary }]}>
                {caloriesBurned.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>Calories Burned</Text>
            </View>
          </View>
        </View>

        {/* Week Selector */}
        <View style={styles.weekSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Program Calendar</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
              <TouchableOpacity
                key={week}
                onPress={() => {
                  setSelectedWeek(week);
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={[
                  styles.weekTab,
                  {
                    backgroundColor:
                      selectedWeek === week ? theme.colors.primary[500] : bgColors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weekTabText,
                    {
                      color: selectedWeek === week ? '#FFFFFF' : textColors.primary,
                    },
                  ]}
                >
                  Week {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Workout Days Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarGrid}>
            {workoutDays
              .filter((w) => w.week === selectedWeek)
              .map((workout) => (
                <TouchableOpacity
                  key={`${workout.week}-${workout.day}`}
                  onPress={() => handleWorkoutPress(workout)}
                  activeOpacity={0.8}
                  style={[
                    styles.calendarDay,
                    { backgroundColor: bgColors.surface },
                    workout.status === 'current' && {
                      borderColor: theme.colors.primary[500],
                      borderWidth: 2,
                    },
                  ]}
                >
                  {/* Status Indicator */}
                  <View
                    style={[
                      styles.calendarDayStatus,
                      {
                        backgroundColor:
                          workout.status === 'completed'
                            ? theme.colors.success[500]
                            : workout.status === 'current'
                            ? theme.colors.primary[500]
                            : 'rgba(0,0,0,0.2)',
                      },
                    ]}
                  >
                    {workout.status === 'completed' ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : workout.status === 'current' ? (
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    ) : (
                      <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                    )}
                  </View>

                  <Text style={[styles.calendarDayLabel, { color: textColors.secondary }]}>
                    Day {workout.day}
                  </Text>
                  <Text style={[styles.calendarDayName, { color: textColors.primary }]} numberOfLines={2}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.calendarDayDuration, { color: textColors.secondary }]}>
                    {workout.duration_minutes} min
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* 4 Innovations Cards */}
        <View style={styles.innovationsSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Explore Features</Text>

          <View style={styles.innovationsGrid}>
            {/* Adaptive Scheduling */}
            <TouchableOpacity
              onPress={() => handleInnovationPress('adaptive')}
              activeOpacity={0.8}
              style={[styles.innovationCard, { backgroundColor: bgColors.surface }]}
            >
              <View
                style={[
                  styles.innovationIcon,
                  { backgroundColor: theme.colors.primary[100] },
                ]}
              >
                <Ionicons name="calendar" size={24} color={theme.colors.primary[500]} />
              </View>
              <Text style={[styles.innovationTitle, { color: textColors.primary }]}>
                Adaptive Scheduling
              </Text>
              <Text style={[styles.innovationDescription, { color: textColors.secondary }]}>
                AI-powered rest days & deload weeks
              </Text>
            </TouchableOpacity>

            {/* Social Leaderboard */}
            <TouchableOpacity
              onPress={() => handleInnovationPress('leaderboard')}
              activeOpacity={0.8}
              style={[styles.innovationCard, { backgroundColor: bgColors.surface }]}
            >
              <View
                style={[
                  styles.innovationIcon,
                  { backgroundColor: theme.colors.warning[100] },
                ]}
              >
                <Ionicons name="trophy" size={24} color={theme.colors.warning[500]} />
              </View>
              <Text style={[styles.innovationTitle, { color: textColors.primary }]}>
                Social Leaderboard
              </Text>
              <Text style={[styles.innovationDescription, { color: textColors.secondary }]}>
                Compete with other users
              </Text>
            </TouchableOpacity>

            {/* Program Remix AI */}
            <TouchableOpacity
              onPress={() => handleInnovationPress('remix')}
              activeOpacity={0.8}
              style={[styles.innovationCard, { backgroundColor: bgColors.surface }]}
            >
              <View
                style={[
                  styles.innovationIcon,
                  { backgroundColor: theme.colors.success[100] },
                ]}
              >
                <Ionicons name="color-wand" size={24} color={theme.colors.success[500]} />
              </View>
              <Text style={[styles.innovationTitle, { color: textColors.primary }]}>
                Program Remix AI
              </Text>
              <Text style={[styles.innovationDescription, { color: textColors.secondary }]}>
                Adapt workouts on-the-fly
              </Text>
            </TouchableOpacity>

            {/* Challenge Mode */}
            <TouchableOpacity
              onPress={() => handleInnovationPress('challenge')}
              activeOpacity={0.8}
              style={[styles.innovationCard, { backgroundColor: bgColors.surface }]}
            >
              <View
                style={[
                  styles.innovationIcon,
                  { backgroundColor: theme.colors.error[100] },
                ]}
              >
                <Ionicons name="flash" size={24} color={theme.colors.error[500]} />
              </View>
              <Text style={[styles.innovationTitle, { color: textColors.primary }]}>
                Challenge Mode
              </Text>
              <Text style={[styles.innovationDescription, { color: textColors.secondary }]}>
                Push your limits
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorText: {
    marginTop: 100,
    textAlign: 'center',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // Progress Section
  progressSection: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    marginRight: 20,
  },
  progressRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },

  // Today's Workout
  todaySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  todayCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  todayCardGradient: {
    padding: 24,
  },
  todayCardContent: {},
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayCardBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  todayCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  todayCardDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayCardDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  todayCardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  todayCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayCardActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats Grid
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  // Week Selector
  weekSection: {
    marginBottom: 16,
  },
  weekSelector: {
    paddingHorizontal: 20,
  },
  weekTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  weekTabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Calendar
  calendarSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  calendarDay: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  calendarDayStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  calendarDayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayDuration: {
    fontSize: 12,
  },

  // Innovations
  innovationsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  innovationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  innovationCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
  },
  innovationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  innovationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  innovationDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
