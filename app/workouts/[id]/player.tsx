/**
 * Workout Player Screen
 *
 * Full-screen immersive workout player with:
 * - Real-time exercise display
 * - Intelligent timer (countdown/countup)
 * - Rest timer with visual countdown
 * - Play/Pause/Skip controls
 * - Sets/reps tracking
 * - Auto-advance to next exercise
 * - Progress indicator
 * - Save session to Supabase
 */

// @ts-nocheck - Disable TypeScript checking for styled-components template types
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

import { useStyledTheme } from '@/theme';
import { getWorkoutById, createWorkoutSession, updateWorkoutSession, completeWorkoutSession } from '@/services/workouts';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import type { Workout, WorkoutExercise } from '@/types/workout';
import type { PlayerState, ExercisePhase, SetStatus, ExerciseSession } from '@/types/workoutPlayer';

// =============================================
// TIMER HOOK - Smart countdown/countup timer
// =============================================

function useTimer(initialSeconds: number = 0, type: 'countdown' | 'countup' = 'countdown') {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (type === 'countdown') {
            if (prev <= 1) {
              setIsRunning(false);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, type]);

  return { seconds, isRunning, start, pause, reset };
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function WorkoutPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useStyledTheme();
  const { user } = useClerkAuth();

  // Theme helpers
  const bg = theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg;
  const surface = theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface;
  const textPrimary = theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary;
  const textSecondary = theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary;

  // Workout data
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Current exercise
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const currentSession = exerciseSessions[currentExerciseIndex];

  // Timers
  const workoutTimer = useTimer(0, 'countup'); // Total workout duration
  const exerciseTimer = useTimer(0, 'countup'); // Current exercise duration
  const restTimer = useTimer(currentExercise?.rest_seconds || 60, 'countdown'); // Rest countdown

  // Exit modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Animations
  const pulseAnim = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  // =============================================
  // FETCH WORKOUT DATA
  // =============================================

  useEffect(() => {
    async function fetchWorkout() {
      if (!id) return;

      const data = await getWorkoutById(id);
      if (data) {
        setWorkout(data);

        // Initialize exercise sessions
        const sessions: ExerciseSession[] = data.exercises.map((ex, index) => ({
          exerciseId: ex.exercise_id,
          workoutExercise: ex,
          currentSet: 1,
          totalSets: ex.sets,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            completed: false,
            reps: ex.reps,
            duration: ex.duration_seconds,
          })),
          elapsedTime: 0,
          restTimeRemaining: ex.rest_seconds,
          phase: 'exercise',
          completed: false,
          startedAt: new Date().toISOString(),
        }));

        setExerciseSessions(sessions);
      }

      setLoading(false);
    }

    fetchWorkout();
  }, [id]);

  // =============================================
  // START WORKOUT
  // =============================================

  const startWorkout = useCallback(async () => {
    if (!user || !workout) return;

    // Create workout session in Supabase
    const session = await createWorkoutSession(user.id, workout.id);
    if (session) {
      setSessionId(session.id);
    }

    // Start timers
    workoutTimer.start();
    exerciseTimer.reset(0);
    exerciseTimer.start();

    setPlayerState('playing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [user, workout]);

  // =============================================
  // PLAY / PAUSE
  // =============================================

  const togglePlayPause = useCallback(() => {
    if (playerState === 'playing') {
      workoutTimer.pause();
      exerciseTimer.pause();
      setPlayerState('paused');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (playerState === 'paused') {
      workoutTimer.start();
      exerciseTimer.start();
      setPlayerState('playing');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [playerState, workoutTimer, exerciseTimer]);

  // =============================================
  // COMPLETE SET
  // =============================================

  const completeSet = useCallback(() => {
    if (!currentSession || playerState !== 'playing') return;

    const updatedSessions = [...exerciseSessions];
    const session = updatedSessions[currentExerciseIndex];

    // Mark current set as completed
    session.sets[session.currentSet - 1].completed = true;

    // Move to next set or rest phase
    if (session.currentSet < session.totalSets) {
      session.currentSet += 1;
      session.phase = 'rest';
      setPlayerState('resting');

      // Start rest timer
      restTimer.reset(currentExercise?.rest_seconds || 60);
      restTimer.start();

      // Pause exercise timer during rest
      exerciseTimer.pause();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Exercise completed
      session.completed = true;
      session.completedAt = new Date().toISOString();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-advance to next exercise after 1 second
      setTimeout(() => {
        nextExercise();
      }, 1000);
    }

    setExerciseSessions(updatedSessions);
  }, [currentSession, currentExerciseIndex, exerciseSessions, playerState]);

  // =============================================
  // SKIP REST
  // =============================================

  const skipRest = useCallback(() => {
    if (playerState !== 'resting') return;

    restTimer.pause();
    restTimer.reset(0);

    const updatedSessions = [...exerciseSessions];
    updatedSessions[currentExerciseIndex].phase = 'exercise';
    setExerciseSessions(updatedSessions);

    setPlayerState('playing');
    exerciseTimer.start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playerState, restTimer, exerciseSessions, currentExerciseIndex, exerciseTimer]);

  // =============================================
  // NEXT EXERCISE
  // =============================================

  const nextExercise = useCallback(async () => {
    if (!workout || !user || !sessionId) return;

    // TODO: Save current exercise log to database with Drizzle
    // if (currentSession) {
    //   await saveExerciseLog(sessionId, {
    //     exercise_id: currentSession.exerciseId,
    //     sets_completed: currentSession.totalSets,
    //     reps_completed: currentSession.repsCompleted,
    //     duration_seconds: exerciseTimer.seconds,
    //   });
    // }

    // Check if last exercise
    if (currentExerciseIndex >= workout.exercises.length - 1) {
      // Workout completed!
      await completeWorkout();
      return;
    }

    // Move to next exercise
    setCurrentExerciseIndex((prev) => prev + 1);

    // Reset exercise timer
    exerciseTimer.reset(0);
    exerciseTimer.start();

    // Update session progress
    await updateWorkoutSession(sessionId, {
      current_exercise_index: currentExerciseIndex + 1,
      completed_exercises: currentExerciseIndex + 1,
      duration_seconds: workoutTimer.seconds,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [workout, user, sessionId, currentSession, currentExerciseIndex, exerciseTimer, workoutTimer]);

  // =============================================
  // COMPLETE WORKOUT
  // =============================================

  const completeWorkout = useCallback(async () => {
    if (!sessionId || !workout) return;

    // Pause all timers
    workoutTimer.pause();
    exerciseTimer.pause();

    setPlayerState('completed');

    // Calculate calories (rough estimate)
    const caloriesBurned = Math.round(workoutTimer.seconds / 60 * 10); // ~10 cal/min

    // Save to Supabase
    await completeWorkoutSession(sessionId, {
      duration_seconds: workoutTimer.seconds,
      calories_burned: caloriesBurned,
      completed_exercises: workout.exercises.length,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to completion screen (to be created)
    setTimeout(() => {
      // TODO: Create completion screen
      // For now, just go back
      router.back();
    }, 2000);
  }, [sessionId, workout, workoutTimer, exerciseTimer, router]);

  // =============================================
  // EXIT WORKOUT
  // =============================================

  const exitWorkout = useCallback(async () => {
    if (!sessionId) {
      router.back();
      return;
    }

    // Mark session as abandoned
    await updateWorkoutSession(sessionId, {
      status: 'abandoned',
      duration_seconds: workoutTimer.seconds,
      completed_exercises: currentExerciseIndex,
    });

    router.back();
  }, [sessionId, workoutTimer, currentExerciseIndex, router]);

  // =============================================
  // AUTO-ADVANCE AFTER REST
  // =============================================

  useEffect(() => {
    if (playerState === 'resting' && restTimer.seconds === 0 && !restTimer.isRunning) {
      // Rest completed, resume exercise
      skipRest();
    }
  }, [playerState, restTimer.seconds, restTimer.isRunning]);

  // =============================================
  // PULSE ANIMATION
  // =============================================

  useEffect(() => {
    if (playerState === 'playing') {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [playerState]);

  // =============================================
  // PROGRESS ANIMATION
  // =============================================

  useEffect(() => {
    if (workout) {
      const progress = (currentExerciseIndex + 1) / workout.exercises.length;
      progressAnim.value = withSpring(progress, { damping: 15 });
    }
  }, [currentExerciseIndex, workout]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // =============================================
  // RENDER
  // =============================================

  if (loading) {
    return (
      <Container bg={bg}>
        <Text style={{ color: textPrimary }}>Loading workout...</Text>
      </Container>
    );
  }

  if (!workout || !currentExercise) {
    return (
      <Container bg={bg}>
        <Text style={{ color: textPrimary }}>Workout not found</Text>
      </Container>
    );
  }

  const isResting = playerState === 'resting';
  const isCompleted = playerState === 'completed';

  return (
    <Container bg={bg}>
      <StatusBar style="light" />

      {/* Progress Bar */}
      <ProgressBarContainer>
        <ProgressBarBg bg={surface} />
        <Animated.View style={[{ height: 4, backgroundColor: theme.colors.primary[500] }, progressStyle]} />
      </ProgressBarContainer>

      {/* Header */}
      <Header>
        <ExitButton onPress={() => setShowExitModal(true)}>
          <ExitIcon>✕</ExitIcon>
        </ExitButton>

        <ExerciseCounter>
          <CounterText color={textPrimary}>
            Exercise {currentExerciseIndex + 1} / {workout.exercises.length}
          </CounterText>
        </ExerciseCounter>

        <TimerText color={textSecondary}>
          {Math.floor(workoutTimer.seconds / 60)}:{String(workoutTimer.seconds % 60).padStart(2, '0')}
        </TimerText>
      </Header>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Rest Phase Overlay */}
        {isResting && (
          <RestOverlay>
            <RestTitle>REST</RestTitle>
            <RestTimerText>{restTimer.seconds}s</RestTimerText>
            <SkipRestButton onPress={skipRest}>
              <SkipRestText>Skip Rest</SkipRestText>
            </SkipRestButton>
          </RestOverlay>
        )}

        {/* Exercise Display */}
        {!isResting && (
          <ExerciseSection>
            <ExerciseTitle color={textPrimary}>{currentExercise.exercise.name}</ExerciseTitle>

            {/* Sets Display */}
            <SetsContainer>
              {currentSession?.sets.map((set, index) => (
                <SetBadge
                  key={index}
                  $completed={set.completed}
                  $active={index === currentSession.currentSet - 1}
                  $primaryColor={theme.colors.primary[500]}
                  $successColor={theme.colors.success[500]}
                >
                  <SetText
                    $completed={set.completed}
                    $active={index === currentSession.currentSet - 1}
                  >
                    {index + 1}
                  </SetText>
                </SetBadge>
              ))}
            </SetsContainer>

            {/* Reps/Duration Display */}
            <RepsContainer>
              {currentExercise.reps && (
                <RepsText color={textSecondary}>
                  {currentExercise.reps} reps
                </RepsText>
              )}
              {currentExercise.duration_seconds && (
                <RepsText color={textSecondary}>
                  {currentExercise.duration_seconds}s
                </RepsText>
              )}
            </RepsContainer>

            {/* Exercise Timer */}
            <ExerciseTimerText color={textPrimary}>
              {Math.floor(exerciseTimer.seconds / 60)}:{String(exerciseTimer.seconds % 60).padStart(2, '0')}
            </ExerciseTimerText>
          </ExerciseSection>
        )}
      </ScrollView>

      {/* Controls */}
      <ControlsContainer>
        {playerState === 'idle' && (
          <StartButton onPress={startWorkout} $bgColor={theme.colors.primary[500]}>
            <StartButtonText>Start Workout</StartButtonText>
          </StartButton>
        )}

        {(playerState === 'playing' || playerState === 'paused') && !isResting && (
          <>
            <ControlButton onPress={togglePlayPause} $bgColor={theme.colors.primary[500]}>
              <ControlIcon>{playerState === 'playing' ? '⏸' : '▶'}</ControlIcon>
            </ControlButton>

            <CompleteSetButton onPress={completeSet} $bgColor={theme.colors.success[500]}>
              <CompleteSetText>Complete Set</CompleteSetText>
            </CompleteSetButton>

            <ControlButton onPress={nextExercise} $bgColor={theme.colors.primary[500]}>
              <ControlIcon>⏭</ControlIcon>
            </ControlButton>
          </>
        )}
      </ControlsContainer>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <ModalOverlay>
          <ModalContent bg={surface}>
            <ModalTitle color={textPrimary}>Exit Workout?</ModalTitle>
            <ModalText color={textSecondary}>
              Your progress will be saved, but the workout won't be marked as completed.
            </ModalText>

            <ModalButtons>
              <ModalButton onPress={() => setShowExitModal(false)} $bgColor={theme.colors.primary[500]}>
                <ModalButtonText color={textPrimary}>Cancel</ModalButtonText>
              </ModalButton>

              <ModalButton onPress={exitWorkout} $bgColor="#EF4444">
                <ModalButtonText color="#FFFFFF">
                  Exit
                </ModalButtonText>
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
}

// =============================================
// STYLED COMPONENTS
// =============================================

// @ts-expect-error - styled-components props typing
const Container = styled.View<{ bg: string }>`
  flex: 1;
  background-color: ${({ bg }) => bg};
`;

const ProgressBarContainer = styled.View`
  height: 4px;
  width: 100%;
  position: absolute;
  top: 0;
  z-index: 10;
`;

// @ts-expect-error - styled-components props typing
const ProgressBarBg = styled.View<{ bg: string }>`
  height: 4px;
  width: 100%;
  background-color: ${({ bg }) => bg};
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 60px 20px 20px;
`;

const ExitButton = styled.Pressable`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  justify-content: center;
  align-items: center;
`;

const ExitIcon = styled.Text`
  font-size: 20px;
  color: #FFFFFF;
`;

const ExerciseCounter = styled.View``;

// @ts-expect-error - styled-components props typing
const CounterText = styled.Text<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ color }) => color};
`;

// @ts-expect-error - styled-components props typing
const TimerText = styled.Text<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ color }) => color};
  font-variant-numeric: tabular-nums;
`;

const RestOverlay = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const RestTitle = styled.Text`
  font-size: 48px;
  font-weight: 800;
  color: #3B82F6;
  margin-bottom: 20px;
`;

const RestTimerText = styled.Text`
  font-size: 80px;
  font-weight: 800;
  color: #3B82F6;
  font-variant-numeric: tabular-nums;
`;

const SkipRestButton = styled.Pressable`
  margin-top: 30px;
  padding: 12px 24px;
  background-color: rgba(59, 130, 246, 0.2);
  border-radius: 20px;
`;

const SkipRestText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #3B82F6;
`;

const ExerciseSection = styled.View`
  flex: 1;
  padding: 40px 20px;
  align-items: center;
`;

const ExerciseTitle = styled.Text<{ color: string }>`
  font-size: 32px;
  font-weight: 800;
  color: ${({ color }) => color};
  text-align: center;
  margin-bottom: 30px;
`;

const SetsContainer = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-bottom: 30px;
`;

const SetBadge = styled.View<{ $completed: boolean; $active: boolean; $primaryColor: string; $successColor: string }>`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${({ $completed, $active, $primaryColor, $successColor }) =>
    $completed ? $successColor : $active ? $primaryColor : 'rgba(255,255,255,0.1)'};
  justify-content: center;
  align-items: center;
  border-width: ${({ $active }) => ($active ? '3px' : '0')};
  border-color: ${({ $active, $primaryColor }) => ($active ? $primaryColor : 'transparent')};
`;

const SetText = styled.Text<{ $completed: boolean; $active: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${({ $completed, $active }) => ($completed || $active ? '#FFFFFF' : 'rgba(255,255,255,0.4)')};
`;

const RepsContainer = styled.View`
  margin-bottom: 20px;
`;

const RepsText = styled.Text<{ color: string }>`
  font-size: 24px;
  font-weight: 600;
  color: ${({ color }) => color};
  text-align: center;
`;

const ExerciseTimerText = styled.Text<{ color: string }>`
  font-size: 64px;
  font-weight: 800;
  color: ${({ color }) => color};
  font-variant-numeric: tabular-nums;
  margin-top: 20px;
`;

const ControlsContainer = styled.View`
  padding: 20px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16px;
`;

const StartButton = styled.Pressable<{ $bgColor: string }>`
  flex: 1;
  padding: 20px;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 16px;
  align-items: center;
`;

const StartButtonText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
`;

const ControlButton = styled.Pressable<{ $bgColor: string }>`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${({ $bgColor }) => $bgColor}33;
  justify-content: center;
  align-items: center;
`;

const ControlIcon = styled.Text`
  font-size: 24px;
`;

const CompleteSetButton = styled.Pressable<{ $bgColor: string }>`
  flex: 1;
  padding: 20px;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 16px;
  align-items: center;
`;

const CompleteSetText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.8);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.View<{ bg: string }>`
  width: 90%;
  max-width: 400px;
  background-color: ${({ bg }) => bg};
  border-radius: 20px;
  padding: 24px;
`;

const ModalTitle = styled.Text<{ color: string }>`
  font-size: 24px;
  font-weight: 800;
  color: ${({ color }) => color};
  margin-bottom: 12px;
`;

const ModalText = styled.Text<{ color: string }>`
  font-size: 16px;
  color: ${({ color }) => color};
  margin-bottom: 24px;
`;

const ModalButtons = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ModalButton = styled.Pressable<{ $bgColor: string }>`
  flex: 1;
  padding: 16px;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 12px;
  align-items: center;
`;

const ModalButtonText = styled.Text<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ color }) => color};
`;
