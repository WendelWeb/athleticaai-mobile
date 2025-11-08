/**
 * 🎮 WORKOUT PLAYER - Main Component
 *
 * Composant principal du player d'entraînement
 * Niveau Apple Fitness+ avec features ML/adaptive
 *
 * ARCHITECTURE MODULAIRE:
 * - ExerciseView: Affiche exercice actuel avec instructions
 * - SetTracker: Track sets avec RPE, form quality, notes
 * - RestTimerView: Timer intelligent avec adaptive rest
 * - LiveStatsBar: Métriques temps réel (volume, calories, score)
 * - PlayerControls: Play/Pause/Skip avec haptics
 * - ProgressIndicator: Progression globale + timeline
 *
 * STATE MACHINE:
 * idle → warmup → exercise → rest → [repeat] → completed
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useAdaptiveRest } from '@/hooks/useAdaptiveRest';
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics';
import { haptics } from '@/utils/haptics';
import { logger } from '@/utils/logger';

// Sub-components (à créer)
import { ExerciseView } from './ExerciseView';
import { SetTracker } from './SetTracker';
import { RestTimerView } from './RestTimerView';
import { LiveStatsBar } from './LiveStatsBar';
import { PlayerControls } from './PlayerControls';
import { ProgressIndicator } from './ProgressIndicator';
import { AchievementToast } from './AchievementToast';

import type { SetData, SkipReason } from '@/types/workoutSession';
import { AchievementEngine, type Achievement } from '@/services/achievements/AchievementEngine';
import { unlockAchievements } from '@/services/drizzle/achievements';

interface WorkoutPlayerProps {
  workoutId: string;
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function WorkoutPlayer({
  workoutId,
  userId,
  onComplete,
  onCancel,
}: WorkoutPlayerProps) {
  const router = useRouter();

  // ===================================================
  // HOOKS
  // ===================================================

  // Main session state
  const {
    session,
    currentExerciseLog,
    liveStats,
    isLoading,
    error,
    controls,
    refreshStats,
  } = useWorkoutSession({
    workoutId,
    userId,
    autoSave: true,
    autoSaveInterval: 30, // Save every 30s
  });

  // Analytics
  const {
    liveStats: analyticsLiveStats,
    insights,
    recommendations,
    volumeChartData,
    intensityChartData,
  } = useSessionAnalytics({
    sessionId: session?.id || null,
    userId,
    autoRefresh: true,
    refreshInterval: 5000,
    includeRecommendations: true,
  });

  // Local UI state
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Achievements
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
  const [restPeriodsSkipped, setRestPeriodsSkipped] = useState(0);

  // Adaptive rest (conditional on rest phase)
  const adaptiveRest = useAdaptiveRest({
    userId,
    exerciseId: currentExerciseLog?.exercise_id || '',
    setNumber: currentSetNumber,
    repsCompleted: 10, // TODO: Get from last set
    weightKg: 50, // TODO: Get from last set
    rpe: 7, // TODO: Get from last set
    onRestComplete: () => {
      haptics.success();
      logger.info('[WorkoutPlayer] Rest completed');
    },
    enableAlerts: true,
    alertAtSeconds: [10, 5], // Alert at 10s and 5s remaining
  });

  // ===================================================
  // LIFECYCLE
  // ===================================================

  // Auto-start session on mount
  useEffect(() => {
    if (!session && !isLoading) {
      controls.startSession(workoutId);
      logger.info('[WorkoutPlayer] Session auto-started', { workoutId });
    }
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => logger.warn('[WorkoutPlayer] Error acknowledged', { error }) },
      ]);
    }
  }, [error]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handlePause = useCallback(async () => {
    await controls.pauseSession();
    adaptiveRest.pause();
    haptics.medium();
  }, [controls, adaptiveRest]);

  const handleResume = useCallback(async () => {
    await controls.resumeSession();
    adaptiveRest.resume();
    haptics.light();
  }, [controls, adaptiveRest]);

  const handleCompleteSet = useCallback(
    async (setData: SetData) => {
      try {
        await controls.completeSet(setData);

        // Start adaptive rest timer
        await controls.startRest();
        adaptiveRest.start();

        // Increment set number
        setCurrentSetNumber((prev) => prev + 1);

        haptics.success();
        logger.info('[WorkoutPlayer] Set completed', { setNumber: currentSetNumber, setData });
      } catch (err) {
        logger.error('[WorkoutPlayer] Failed to complete set', err instanceof Error ? err : undefined);
        Alert.alert('Error', 'Failed to save set. Please try again.');
      }
    },
    [controls, adaptiveRest, currentSetNumber]
  );

  const handleSkipRest = useCallback(async () => {
    adaptiveRest.skip();
    await controls.skipRest();
    setRestPeriodsSkipped((prev) => prev + 1);
    haptics.medium();
  }, [controls, adaptiveRest]);

  const handleSkipExercise = useCallback(() => {
    Alert.alert(
      'Skip Exercise',
      'Why are you skipping this exercise?',
      [
        {
          text: 'Equipment Unavailable',
          onPress: () => controls.skipExercise('equipment'),
        },
        {
          text: 'Injury/Pain',
          onPress: () => controls.skipExercise('injury'),
        },
        {
          text: 'Too Difficult',
          onPress: () => controls.skipExercise('difficulty'),
        },
        {
          text: 'Fatigue',
          onPress: () => controls.skipExercise('fatigue'),
        },
        {
          text: 'Other',
          onPress: () => controls.skipExercise('other'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [controls]);

  const handlePreviousExercise = useCallback(async () => {
    await controls.goToPreviousExercise();
    setCurrentSetNumber(1);
    haptics.light();
  }, [controls]);

  const handleNextExercise = useCallback(async () => {
    await controls.goToNextExercise();
    setCurrentSetNumber(1);
    haptics.light();
  }, [controls]);

  const handleCompleteWorkout = useCallback(() => {
    Alert.alert(
      'Complete Workout',
      'Are you sure you want to finish this workout?',
      [
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            await controls.completeSession();

            // Check for achievements!
            const achievements = await AchievementEngine.checkAllAchievements({
              sets_completed: liveStats?.sets_completed || 0,
              sets_skipped: 0, // TODO: Track skipped sets
              average_rpe: liveStats?.average_rpe || 0,
              rest_periods_skipped: restPeriodsSkipped,
              all_sets_good_form: true, // TODO: Track form quality
              duration_seconds: liveStats?.active_time_seconds || 0,
              estimated_duration_seconds: (session?.total_exercises || 0) * 15 * 60, // Estimate
              total_workouts_completed: 1, // TODO: Get from user stats
              current_streak_days: 1, // TODO: Get from user stats
              total_volume_kg: liveStats?.total_volume_kg || 0,
              total_reps_lifetime: liveStats?.total_reps || 0,
              workout_start_time: session?.started_at || new Date(),
            });

            // Save achievements to database & show first one
            if (achievements.length > 0) {
              // Save all achievements to DB
              const saved = await unlockAchievements(
                userId,
                achievements,
                session?.id, // session_id
                workoutId // workout_id
              );

              // Show first achievement toast
              if (saved.length > 0) {
                setActiveAchievement(achievements[0]);
                logger.info('[WorkoutPlayer] Achievements saved to DB', {
                  total: achievements.length,
                  saved: saved.length,
                  firstAchievement: achievements[0].title
                });
              }
            }

            haptics.success();
            onComplete?.();

            // Delay navigation to show achievement
            setTimeout(() => {
              router.back();
            }, achievements.length > 0 ? 3500 : 0);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [controls, onComplete, router, liveStats, session, restPeriodsSkipped]);

  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    await controls.cancelSession();
    haptics.medium();
    onCancel?.();
    router.back();
  }, [controls, onCancel, router]);

  // ===================================================
  // RENDER HELPERS
  // ===================================================

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* TODO: Add loading spinner */}
          {/* <ActivityIndicator size="large" color="#007AFF" /> */}
        </View>
      </SafeAreaView>
    );
  }

  const isPaused = session.state === 'paused';
  const isResting = session.state === 'rest';
  const isExercising = session.state === 'exercise';

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator (top) */}
      <ProgressIndicator
        currentExerciseIndex={session.current_exercise_index}
        totalExercises={session.total_exercises || 0}
        completionPercentage={liveStats?.completion_percentage || 0}
        elapsedSeconds={session.total_duration_seconds || 0}
      />

      {/* Live Stats Bar */}
      <LiveStatsBar
        stats={analyticsLiveStats || liveStats}
        onPress={() => setShowStatsModal(true)}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise View */}
        {/* TODO: Load workout data separately */}
        {currentExerciseLog && (
          <ExerciseView
            exerciseLog={currentExerciseLog}
            exerciseData={null}
            isActive={isExercising}
          />
        )}

        {/* Set Tracker or Rest Timer */}
        {isResting ? (
          <RestTimerView
            elapsedSeconds={adaptiveRest.elapsedSeconds}
            remainingSeconds={adaptiveRest.remainingSeconds}
            progress={adaptiveRest.progress}
            restCalculation={adaptiveRest.restCalculation}
            onSkip={handleSkipRest}
            onAddTime={(seconds) => adaptiveRest.addTime(seconds)}
          />
        ) : (
          // TODO: Load set logs from database via relation
          <SetTracker
            currentSetNumber={currentSetNumber}
            totalSets={currentExerciseLog?.target_sets || 3}
            setLogs={[]}
            onCompleteSet={handleCompleteSet}
            isPaused={isPaused}
          />
        )}

        {/* AI Recommendations (if available) */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            {/* TODO: Display recommendations */}
          </View>
        )}

        {/* Performance Insights */}
        {insights !== null && (
          <View style={styles.insightsContainer}>
            {/* TODO: Display insights */}
          </View>
        )}
      </ScrollView>

      {/* Player Controls (bottom) */}
      <PlayerControls
        state={session.state}
        onPause={handlePause}
        onResume={handleResume}
        onPrevious={handlePreviousExercise}
        onNext={handleNextExercise}
        onSkipExercise={handleSkipExercise}
        onComplete={handleCompleteWorkout}
        onExit={handleExit}
        isPreviousDisabled={session.current_exercise_index === 0}
        isNextDisabled={
          session.current_exercise_index >= (session.total_exercises || 0) - 1
        }
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* TODO: Add exit confirmation UI */}
            <Pressable onPress={handleConfirmExit}>
              {/* Confirm Exit Button */}
            </Pressable>
            <Pressable onPress={() => setShowExitConfirm(false)}>
              {/* Cancel Button */}
            </Pressable>
          </View>
        </View>
      )}

      {/* Achievement Toast */}
      {activeAchievement && (
        <AchievementToast
          achievement={activeAchievement}
          onDismiss={() => setActiveAchievement(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ===================================================
// STYLES
// ===================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for controls
  },
  recommendationsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  insightsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
});
