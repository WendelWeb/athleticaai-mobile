/**
 * 🔥 ATHLETICAAI - PROGRAM PROGRESS CELEBRATION SCREEN
 * Celebration screen after completing a workout in a program
 * Shows progress, achievements, and next workout preview
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getWorkoutProgramById, type WorkoutProgram } from '@services/drizzle/workouts';
import { getUserProgram, type UserProgram } from '@services/drizzle/user-programs';
import { useClerkAuth } from '@hooks/useClerkAuth';

const { width, height } = Dimensions.get('window');

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

export default function ProgramProgressCelebrationScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { programId, userProgramId, completedWorkoutIndex } = useLocalSearchParams<{
    programId: string;
    userProgramId: string;
    completedWorkoutIndex: string;
  }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgramWithWorkouts | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const scaleAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  useEffect(() => {
    loadData();
    startAnimations();
    triggerHaptics();
  }, []);

  const loadData = async () => {
    if (!programId || !userProgramId || !profile?.id) return;

    setLoading(true);
    try {
      const [programData, userProgramData] = await Promise.all([
        getWorkoutProgramById(programId as string),
        getUserProgram(profile.id, programId as string),
      ]);

      setProgram(programData as WorkoutProgramWithWorkouts);
      setUserProgram(userProgramData);
    } catch (error) {
      console.error('Error loading celebration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    // Scale animation for celebration icon
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }, 500);

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const triggerHaptics = () => {
    if (Platform.OS === 'ios') {
      // Triple impact for celebration
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 0);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);
    }
  };

  // Compute data
  const completionPercentage = userProgram
    ? Math.round((userProgram.workouts_completed / userProgram.total_workouts) * 100)
    : 0;

  const isLastWorkout = userProgram
    ? userProgram.workouts_completed >= userProgram.total_workouts
    : false;

  const nextWorkout = program?.workouts
    ? program.workouts.find((w, index) => {
        const workoutIndex = (w.week_number - 1) * 7 + (w.day_number - 1);
        return workoutIndex === (userProgram?.current_workout_index || 0);
      })
    : null;

  const currentWeek = userProgram?.current_week || 1;
  const currentDay = nextWorkout?.day_number || 1;

  // Handlers
  const handleViewSummary = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    router.push({
      pathname: '/workout-summary',
      params: {
        fromProgram: 'true',
        programId,
        userProgramId,
      },
    } as any);
  };

  const handleBackToDashboard = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    router.replace({
      pathname: `/programs/${programId}/dashboard`,
      params: { userProgramId },
    } as any);
  };

  const handleStartNextWorkout = () => {
    if (!nextWorkout || !userProgram) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.push({
      pathname: `/workout-player/${nextWorkout.workout_id}`,
      params: {
        programId,
        userProgramId,
        workoutIndex: userProgram.current_workout_index,
      },
    } as any);
  };

  if (loading || !program || !userProgram) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  // Animated progress interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${completionPercentage}%`],
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={styles.backgroundGradient}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Celebration Icon (Animated) */}
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.celebrationIconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>
            {isLastWorkout ? 'Program Complete! 🎉' : 'Workout Complete! 💪'}
          </Text>
          <Text style={styles.subtitle}>
            {isLastWorkout
              ? `Congratulations! You completed ${program.name}!`
              : `Week ${currentWeek} Day ${currentDay} DONE!`}
          </Text>
        </Animated.View>

        {/* Progress Section */}
        <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Program Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {userProgram.workouts_completed} of {userProgram.total_workouts} workouts completed
          </Text>
        </Animated.View>

        {/* Next Workout Preview (if not last) */}
        {!isLastWorkout && nextWorkout && (
          <Animated.View style={[styles.nextWorkoutSection, { opacity: fadeAnim }]}>
            <Text style={styles.nextWorkoutTitle}>Next Up:</Text>
            <View style={styles.nextWorkoutCard}>
              <View style={styles.nextWorkoutHeader}>
                <Text style={styles.nextWorkoutBadge}>
                  W{nextWorkout.week_number}D{nextWorkout.day_number}
                </Text>
                <View style={styles.nextWorkoutDuration}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.nextWorkoutDurationText}>
                    {nextWorkout.duration_minutes || 45} min
                  </Text>
                </View>
              </View>
              <Text style={styles.nextWorkoutName}>{nextWorkout.name}</Text>
            </View>

            <TouchableOpacity
              onPress={handleStartNextWorkout}
              activeOpacity={0.8}
              style={styles.nextWorkoutButton}
            >
              <Text style={styles.nextWorkoutButtonText}>Start Next Workout</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={handleViewSummary}
            activeOpacity={0.8}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>View Detailed Summary</Text>
            <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBackToDashboard}
            activeOpacity={0.8}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
              Back to Program Dashboard
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Achievements Earned (placeholder) */}
        <Animated.View style={[styles.achievementsSection, { opacity: fadeAnim }]}>
          <Text style={styles.achievementsTitle}>Achievements Earned</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementBadge}>
              <Ionicons name="flame" size={24} color={theme.colors.warning[500]} />
              <Text style={styles.achievementBadgeText}>+5 Day Streak</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Ionicons name="barbell" size={24} color={theme.colors.primary[500]} />
              <Text style={styles.achievementBadgeText}>Strength Warrior</Text>
            </View>
          </View>
        </Animated.View>
      </View>
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
    height: height * 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : StatusBar.currentHeight! + 40,
  },

  // Celebration Icon
  celebrationIcon: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },

  // Progress Section
  progressSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // Next Workout
  nextWorkoutSection: {
    marginBottom: 32,
  },
  nextWorkoutTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 12,
  },
  nextWorkoutCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  nextWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextWorkoutBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  nextWorkoutDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextWorkoutDurationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  nextWorkoutName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextWorkoutButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  // Actions
  actionsSection: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Achievements
  achievementsSection: {
    alignItems: 'center',
  },
  achievementsTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
