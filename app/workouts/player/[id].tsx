/**
 * 🔥 WORKOUT PLAYER - APPLE FITNESS+ LEVEL
 *
 * Full-screen workout player with:
 * - Exercise timer (countdown/count-up)
 * - Rest timer with countdown
 * - Play/Pause/Skip controls
 * - Progress tracking
 * - Sets/reps checkmarks
 * - Auto-advance next exercise
 * - Save session to Supabase
 * - Exit confirmation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button } from '@components/ui';
import { getWorkoutById, createWorkoutSession, updateWorkoutSession, completeWorkoutSession } from '@services/workouts';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import type { Workout, WorkoutExercise } from '@/types/workout';

const { width, height } = Dimensions.get('window');

type PlayerState = 'exercise' | 'rest' | 'paused' | 'completed';

export default function WorkoutPlayerScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useClerkAuth();

  // Workout data
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  // Player state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [playerState, setPlayerState] = useState<PlayerState>('exercise');
  const [exerciseTime, setExerciseTime] = useState(0); // Seconds elapsed
  const [restTime, setRestTime] = useState(0); // Countdown seconds
  const [totalDuration, setTotalDuration] = useState(0); // Total workout duration
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);

  // Session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  // Modals
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Animations
  const pulseAnim = useSharedValue(1);

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Load workout
  useEffect(() => {
    loadWorkout();
  }, [id]);

  // Create session when workout starts
  useEffect(() => {
    if (workout && user && !sessionId) {
      initializeSession();
    }
  }, [workout, user]);

  // Main timer (exercise or rest)
  useEffect(() => {
    if (playerState === 'paused' || playerState === 'completed') return;

    const interval = setInterval(() => {
      if (playerState === 'exercise') {
        setExerciseTime(prev => prev + 1);
        setTotalDuration(prev => prev + 1);
        // Estimate calories (very rough: ~5 cal per minute)
        setCaloriesBurned(prev => prev + (5 / 60));
      } else if (playerState === 'rest') {
        setRestTime(prev => {
          if (prev <= 1) {
            // Rest complete → Auto-advance to next set or exercise
            handleRestComplete();
            return 0;
          }
          return prev - 1;
        });
        setTotalDuration(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState, currentExerciseIndex, currentSet]);

  // Pulse animation for timer
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 2, stiffness: 100 }),
        withSpring(1, { damping: 2, stiffness: 100 })
      ),
      -1,
      true
    );
  }, []);

  const loadWorkout = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getWorkoutById(id);
    setWorkout(data);
    if (data && data.exercises.length > 0) {
      // Initialize completed sets array
      const firstExercise = data.exercises[0];
      setCompletedSets(new Array(firstExercise.sets).fill(false));
    }
    setLoading(false);
  };

  const initializeSession = async () => {
    if (!user || !workout) return;
    const session = await createWorkoutSession(user.id, workout.id);
    if (session) {
      setSessionId(session.id);
    }
  };

  const handleRestComplete = () => {
    if (!workout) return;

    const currentExercise = workout.exercises[currentExerciseIndex];

    // Check if there are more sets
    if (currentSet < currentExercise.sets) {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      setExerciseTime(0);
      setPlayerState('exercise');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Exercise complete → Move to next exercise
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (!workout) return;

    const nextIndex = currentExerciseIndex + 1;

    if (nextIndex < workout.exercises.length) {
      // Move to next exercise
      setCurrentExerciseIndex(nextIndex);
      setCurrentSet(1);
      setExerciseTime(0);
      setPlayerState('exercise');
      setCompletedSets(new Array(workout.exercises[nextIndex].sets).fill(false));

      // Update session progress
      if (sessionId) {
        updateWorkoutSession(sessionId, {
          // TODO: Add current_exercise_index and completed_exercises to schema
          duration_seconds: totalDuration,
          calories_burned: Math.round(caloriesBurned),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Workout complete!
      handleWorkoutComplete();
    }
  };

  const handleSetComplete = () => {
    if (!workout) return;

    const currentExercise = workout.exercises[currentExerciseIndex];

    // Mark set as completed
    const newCompletedSets = [...completedSets];
    newCompletedSets[currentSet - 1] = true;
    setCompletedSets(newCompletedSets);

    // Start rest timer
    const restSeconds = currentExercise.rest_seconds || 60;
    setRestTime(restSeconds);
    setPlayerState('rest');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleSkipExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleNextExercise();
  };

  const handleSkipRest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleRestComplete();
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerState(prev => (prev === 'paused' ? 'exercise' : 'paused'));
  };

  const handleExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    // Save session as cancelled (abandoned not supported, using cancelled instead)
    if (sessionId) {
      await updateWorkoutSession(sessionId, {
        status: 'cancelled',
        duration_seconds: totalDuration,
        calories_burned: Math.round(caloriesBurned),
        // TODO: Add completed_exercises field to schema
      });
    }
    router.back();
  };

  const handleWorkoutComplete = async () => {
    setPlayerState('completed');

    // Save session as completed
    if (sessionId) {
      await completeWorkoutSession(sessionId, {
        duration_seconds: totalDuration,
        calories_burned: Math.round(caloriesBurned),
        // TODO: Add completed_exercises field to schema
      });
    }

    // Show completion modal
    setShowCompleteModal(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCompleteModalClose = () => {
    setShowCompleteModal(false);
    router.back();
  };

  if (loading || !workout) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <Text style={{ color: textColors.primary }}>Loading workout...</Text>
      </View>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;
  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f1624']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{workout.title}</Text>
          <Text style={styles.headerSubtitle}>
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Exercise Name */}
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} key={currentExerciseIndex}>
          <Text style={styles.exerciseName}>{currentExercise.exercise.name}</Text>
        </Animated.View>

        {/* Sets/Reps Info */}
        <View style={styles.setsInfo}>
          {currentExercise.reps && (
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Reps</Text>
              <Text style={styles.infoValue}>{currentExercise.reps}</Text>
            </View>
          )}
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>Set</Text>
            <Text style={styles.infoValue}>
              {currentSet}/{currentExercise.sets}
            </Text>
          </View>
          {currentExercise.rest_seconds && (
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Rest</Text>
              <Text style={styles.infoValue}>{currentExercise.rest_seconds}s</Text>
            </View>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerSection}>
          {playerState === 'rest' ? (
            <Animated.View style={[styles.timerCircle, timerAnimatedStyle]}>
              <LinearGradient
                colors={[theme.colors.secondary[500], theme.colors.secondary[700]]}
                style={styles.timerGradient}
              >
                <Text style={styles.timerLabel}>REST</Text>
                <Text style={styles.timerValue}>{formatTime(restTime)}</Text>
              </LinearGradient>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.timerCircle, timerAnimatedStyle]}>
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                style={styles.timerGradient}
              >
                <Text style={styles.timerLabel}>TIME</Text>
                <Text style={styles.timerValue}>{formatTime(exerciseTime)}</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Sets Checkmarks */}
        <View style={styles.setsCheckmarks}>
          {Array.from({ length: currentExercise.sets }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.setCheckmark,
                completedSets[index] && styles.setCheckmarkCompleted,
              ]}
            >
              {completedSets[index] && (
                <Animated.View entering={ZoomIn}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </Animated.View>
              )}
              <Text style={styles.setNumber}>{index + 1}</Text>
            </View>
          ))}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color={theme.colors.primary[500]} />
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatTime(totalDuration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={20} color={theme.colors.secondary[500]} />
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{Math.round(caloriesBurned)}</Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Main Action Button */}
        {playerState === 'rest' ? (
          <TouchableOpacity
            onPress={handleSkipRest}
            style={[styles.mainActionButton, { backgroundColor: theme.colors.secondary[500] }]}
          >
            <Ionicons name="play-forward" size={32} color="#FFFFFF" />
            <Text style={styles.mainActionText}>Skip Rest</Text>
          </TouchableOpacity>
        ) : playerState === 'paused' ? (
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.mainActionButton, { backgroundColor: theme.colors.success[500] }]}
          >
            <Ionicons name="play" size={32} color="#FFFFFF" />
            <Text style={styles.mainActionText}>Resume</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSetComplete}
            style={[styles.mainActionButton, { backgroundColor: theme.colors.primary[500] }]}
          >
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            <Text style={styles.mainActionText}>Complete Set</Text>
          </TouchableOpacity>
        )}

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Ionicons
              name={playerState === 'paused' ? 'play' : 'pause'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSkipExercise}
            style={[styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Ionicons name="play-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Workout?</Text>
            <Text style={styles.modalMessage}>
              Your progress will be saved, but the workout will be marked as incomplete.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowExitConfirm(false)}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonText}>Continue Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmExit}
                style={[styles.modalButton, styles.modalButtonConfirm]}
              >
                <Text style={styles.modalButtonTextDanger}>Exit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Workout Complete Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCompleteModalClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn} exiting={FadeOut} style={styles.modalContent}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Workout Complete!</Text>
            <Text style={styles.modalMessage}>
              Great work, Warrior! You crushed it!
            </Text>
            <View style={styles.completionStats}>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{formatTime(totalDuration)}</Text>
                <Text style={styles.completionStatLabel}>Duration</Text>
              </View>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{Math.round(caloriesBurned)}</Text>
                <Text style={styles.completionStatLabel}>Calories</Text>
              </View>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{workout.exercises.length}</Text>
                <Text style={styles.completionStatLabel}>Exercises</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleCompleteModalClose}
              style={[styles.modalButton, styles.modalButtonPrimary]}
            >
              <Text style={styles.modalButtonTextPrimary}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0A84FF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exerciseName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  setsInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  infoChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerSection: {
    marginBottom: 40,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  timerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 110,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  setsCheckmarks: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  setCheckmark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCheckmarkCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  setNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    gap: 16,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
  },
  mainActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  completionStat: {
    alignItems: 'center',
  },
  completionStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A84FF',
    marginBottom: 4,
  },
  completionStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  modalButtonPrimary: {
    backgroundColor: '#0A84FF',
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonTextDanger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
