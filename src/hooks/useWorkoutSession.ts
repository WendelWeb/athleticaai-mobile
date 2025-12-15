/**
 * 🎮 USE WORKOUT SESSION - Main Hook
 *
 * Hook principal pour gérer une session d'entraînement
 * Wrapper autour de SessionManager avec React state
 *
 * FEATURES:
 * - State machine complet
 * - Real-time sync
 * - Optimistic UI updates
 * - Auto-save
 * - Error recovery
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { SessionManager } from '@/services/sessions/SessionManager';
import { AdaptiveEngine } from '@/services/sessions/AdaptiveEngine';
import { AnalyticsEngine } from '@/services/sessions/AnalyticsEngine';
import { SessionPerformanceMonitor } from '@/services/monitoring/SessionPerformanceMonitor';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/Toast';
import type {
  WorkoutSessionV2,
  WorkoutExerciseLog,
  WorkoutSetLog,
} from '@/db/schema-workout-sessions';
import { toISOString } from '@/utils';
import type {
  SessionState,
  SetData,
  SkipReason,
  LiveSessionStats,
  SessionControls,
} from '@/types/workoutSession';

interface UseWorkoutSessionOptions {
  workoutId: string;
  userId: string;
  autoSave?: boolean; // Auto-save every N seconds
  autoSaveInterval?: number; // Seconds
}

interface UseWorkoutSessionReturn {
  // State
  session: WorkoutSessionV2 | null;
  currentExerciseLog: WorkoutExerciseLog | null;
  liveStats: LiveSessionStats | null | undefined; // undefined when React Query is loading
  isLoading: boolean;
  error: string | null;

  // Controls
  controls: SessionControls;
}

export function useWorkoutSession(
  options: UseWorkoutSessionOptions
): UseWorkoutSessionReturn {
  // State
  const [session, setSession] = useState<WorkoutSessionV2 | null>(null);
  const [currentExerciseLog, setCurrentExerciseLog] = useState<WorkoutExerciseLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast for user feedback
  const { showSuccess, showError, showWarning } = useToast();

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===================================================
  // REACT QUERY - Live Stats (replaces manual polling)
  // ===================================================

  const { data: liveStats } = useQuery({
    queryKey: ['sessionStats', session?.id],
    queryFn: async () => {
      if (!session) return null;
      return AnalyticsEngine.calculateLiveStats(session.id);
    },
    enabled: !!session && session.state !== 'completed' && session.state !== 'cancelled',
    refetchInterval: (data) => {
      // Adaptive refetch based on session state
      if (!session) return false;

      switch (session.state) {
        case 'paused':
          return 30000; // 30s when paused (save battery)
        case 'rest':
          return 10000; // 10s during rest
        case 'exercise':
          return 3000; // 3s during active exercise (responsive)
        default:
          return 5000; // Default 5s
      }
    },
    staleTime: 2000, // Consider data stale after 2s
    gcTime: 60000, // Keep in cache for 1min (formerly cacheTime)
  });

  // ===================================================
  // HAPTIC HELPER
  // ===================================================

  const triggerHaptic = useCallback((
    type: 'success' | 'warning' | 'error' | 'impact_light' | 'impact_medium' | 'impact_heavy'
  ) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'impact_light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impact_medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impact_heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      // Haptics can fail on some devices, silently ignore
      logger.debug('[useWorkoutSession] Haptic feedback failed', { type });
    }
  }, []);

  // ===================================================
  // CONTROLS
  // ===================================================

  const startSession = useCallback(async (workoutId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Track performance of session start
      await SessionPerformanceMonitor.trackPerformance(
        'session_start',
        async () => {
          // ========================================
          // OPTIMIZATION: Create and start in one go
          // Sequential operations that can't be parallelized,
          // but we minimize round trips
          // ========================================

          // Create new session
          const newSession = await SessionManager.createSession({
            user_id: options.userId,
            workout_id: workoutId,
          });

          // Start it immediately
          const startedSession = await SessionManager.startSession(newSession.id);

          // ========================================
          // OPTIMIZATION: Immediate UI update
          // Don't wait for everything to complete
          // ========================================

          setSession(startedSession);
          setIsLoading(false); // ✅ UI ready NOW, rest happens in background
          triggerHaptic('success');
          showSuccess('Workout started!', 'Let\'s crush it! 💪');

          // ========================================
          // Background operations (non-blocking)
          // ========================================

          // Track analytics event (fire and forget)
          SessionPerformanceMonitor.trackSessionEvent('session_start', startedSession.id, {
            workout_id: workoutId,
            user_id: options.userId,
          });

          logger.info('[useWorkoutSession] Session started', { sessionId: startedSession.id });
        },
        { workout_id: workoutId, user_id: options.userId }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
      triggerHaptic('error');
      showError('Failed to start workout', message);

      // Track error
      if (err instanceof Error) {
        SessionPerformanceMonitor.trackError(err, 'session_start', {
          user_id: options.userId,
        });
      }

      logger.error('[useWorkoutSession] Start session failed', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [options.userId, showSuccess, showError, triggerHaptic]);

  const pauseSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.pauseSession(session.id);
      setSession(updatedSession);
      showWarning('Workout paused', 'Take your time, come back strong!');
      logger.info('[useWorkoutSession] Session paused', { sessionId: session.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause';
      setError(message);
      showError('Failed to pause', message);
    }
  }, [session, showWarning, showError]);

  const resumeSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.resumeSession(session.id);
      setSession(updatedSession);
      showSuccess('Workout resumed', 'Let\'s get back to it! 🔥');
      logger.info('[useWorkoutSession] Session resumed', { sessionId: session.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume';
      setError(message);
      showError('Failed to resume', message);
    }
  }, [session, showSuccess, showError]);

  const completeSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.completeSession(session.id);
      setSession(updatedSession);

      // Generate final summary
      await AnalyticsEngine.generateSessionSummary(session.id);

      triggerHaptic('success');
      showSuccess('Workout completed! 🎉', 'Amazing work! Check your summary.');
      logger.info('[useWorkoutSession] Session completed', { sessionId: session.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete';
      setError(message);
      triggerHaptic('error');
      showError('Failed to complete workout', message);
    }
  }, [session, showSuccess, showError]);

  const cancelSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.cancelSession(session.id);
      setSession(updatedSession);
      logger.info('[useWorkoutSession] Session cancelled', { sessionId: session.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }, [session]);

  const startExercise = useCallback(async (exerciseIndex: number) => {
    if (!session) return;

    // Optimistic update for instant navigation
    const previousSession = session;
    const previousExerciseLog = currentExerciseLog;

    try {
      // Update current exercise index immediately
      const optimisticSession: WorkoutSessionV2 = {
        ...session,
        current_exercise_index: exerciseIndex,
        current_phase: 'working_set' as const,
        updated_at: new Date(),
      };

      setSession(optimisticSession);
      setCurrentExerciseLog(null); // Will be loaded from server

      logger.debug('[useWorkoutSession] Optimistic exercise change', { exerciseIndex });

      // Sync with database
      const result = await SessionManager.startExercise(session.id, { exercise_index: exerciseIndex });
      setSession(result.session);
      setCurrentExerciseLog(result.exerciseLog);

      logger.info('[useWorkoutSession] Exercise started', { exerciseIndex });
    } catch (err) {
      // Rollback on error
      setSession(previousSession);
      setCurrentExerciseLog(previousExerciseLog);

      const message = err instanceof Error ? err.message : 'Failed to start exercise';
      setError(message);
      showError('Failed to change exercise', message);
    }
  }, [session, currentExerciseLog, showError]);

  const completeExercise = useCallback(async () => {
    if (!session || !currentExerciseLog) return;

    try {
      const result = await SessionManager.completeExercise(session.id, currentExerciseLog.id);
      setSession(result.session);
      setCurrentExerciseLog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete exercise');
    }
  }, [session, currentExerciseLog]);

  const skipExercise = useCallback(async (reason: SkipReason, notes?: string) => {
    if (!session || !currentExerciseLog) return;

    try {
      const result = await SessionManager.skipExercise(session.id, currentExerciseLog.id, {
        reason,
        notes,
      });
      setSession(result.session);
      setCurrentExerciseLog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip exercise');
    }
  }, [session, currentExerciseLog]);

  const goToPreviousExercise = useCallback(async () => {
    if (!session || session.current_exercise_index === 0) return;

    await startExercise(session.current_exercise_index - 1);
  }, [session, startExercise]);

  const goToNextExercise = useCallback(async () => {
    if (!session) return;

    await startExercise(session.current_exercise_index + 1);
  }, [session, startExercise]);

  const startSet = useCallback(async (setNumber: number) => {
    // No DB operation needed, just UI state
    logger.debug('[useWorkoutSession] Starting set', { setNumber });
  }, []);

  const completeSet = useCallback(async (setData: SetData) => {
    if (!session || !currentExerciseLog) return;

    // ========================================
    // OPTIMISTIC UPDATE - UI responds INSTANTLY
    // ========================================

    // 1. Save current state for rollback
    const previousSession = session;

    // 2. Update UI immediately (optimistic)
    const optimisticSession: WorkoutSessionV2 = {
      ...session,
      sets_completed: session.sets_completed + 1,
      total_reps: (session.total_reps || 0) + (setData.reps_completed || 0),
      total_volume_kg: String(Number(session.total_volume_kg || 0) + ((setData.weight_kg || 0) * (setData.reps_completed || 0))),
      updated_at: new Date(),
    };

    setSession(optimisticSession);
    triggerHaptic('impact_light'); // Immediate haptic feedback

    logger.debug('[useWorkoutSession] Optimistic set complete', { setData });

    // 3. Sync to database in background
    try {
      const result = await SessionManager.completeSet(
        session.id,
        currentExerciseLog.id,
        { set_data: setData }
      );

      // 4. Reconcile with server truth
      setSession(result.session);

      logger.info('[useWorkoutSession] Set saved to DB', { setData });
    } catch (err) {
      // 5. Rollback on error
      setSession(previousSession);

      const message = err instanceof Error ? err.message : 'Failed to save set';
      setError(message);
      triggerHaptic('error');
      showError('Set not saved - tap again', message);

      logger.error('[useWorkoutSession] Set save failed, rolled back', err);
    }
  }, [session, currentExerciseLog, showError, triggerHaptic]);

  const startRest = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.startRest(session.id);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start rest');
    }
  }, [session]);

  const skipRest = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.skipRest(session.id);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip rest');
    }
  }, [session]);

  const updateTimer = useCallback((elapsedSeconds: number) => {
    if (!session) return;

    // Update real-time data (debounced in SessionManager)
    SessionManager.updateRealtimeData(session.id, {
      total_elapsed_seconds: elapsedSeconds,
    });
  }, [session]);

  const syncToDatabase = useCallback(async () => {
    if (!session) return;

    // Force sync (already happening in background)
    logger.debug('[useWorkoutSession] Force sync to database', { sessionId: session.id });
  }, [session]);

  // ===================================================
  // EFFECTS
  // ===================================================

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ===================================================
  // RETURN (MEMOIZED for performance)
  // ===================================================

  // Memoize controls object to prevent re-renders in child components
  const controls: SessionControls = useMemo(() => ({
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    startExercise,
    completeExercise,
    skipExercise,
    goToPreviousExercise,
    goToNextExercise,
    startSet,
    completeSet,
    startRest,
    skipRest,
    updateTimer,
    syncToDatabase,
  }), [
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    startExercise,
    completeExercise,
    skipExercise,
    goToPreviousExercise,
    goToNextExercise,
    startSet,
    completeSet,
    startRest,
    skipRest,
    updateTimer,
    syncToDatabase,
  ]);

  return {
    session,
    currentExerciseLog,
    liveStats,
    isLoading,
    error,
    controls,
  };
}
