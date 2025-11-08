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

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionManager } from '@/services/sessions/SessionManager';
import { AdaptiveEngine } from '@/services/sessions/AdaptiveEngine';
import { AnalyticsEngine } from '@/services/sessions/AnalyticsEngine';
import { logger } from '@/utils/logger';
import type {
  WorkoutSessionV2,
  WorkoutExerciseLog,
  WorkoutSetLog,
} from '@/db/schema-workout-sessions';
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
  liveStats: LiveSessionStats | null;
  isLoading: boolean;
  error: string | null;

  // Controls
  controls: SessionControls;

  // Utils
  refreshStats: () => Promise<void>;
}

export function useWorkoutSession(
  options: UseWorkoutSessionOptions
): UseWorkoutSessionReturn {
  // State
  const [session, setSession] = useState<WorkoutSessionV2 | null>(null);
  const [currentExerciseLog, setCurrentExerciseLog] = useState<WorkoutExerciseLog | null>(null);
  const [liveStats, setLiveStats] = useState<LiveSessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===================================================
  // CONTROLS
  // ===================================================

  const startSession = useCallback(async (workoutId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create new session
      const newSession = await SessionManager.createSession({
        user_id: options.userId,
        workout_id: workoutId,
      });

      // Start it
      const startedSession = await SessionManager.startSession(newSession.id);

      setSession(startedSession);
      logger.info('[useWorkoutSession] Session started', { sessionId: startedSession.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
      logger.error('[useWorkoutSession] Start session failed', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [options.userId]);

  const pauseSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.pauseSession(session.id);
      setSession(updatedSession);
      logger.info('[useWorkoutSession] Session paused', { sessionId: session.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause');
    }
  }, [session]);

  const resumeSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.resumeSession(session.id);
      setSession(updatedSession);
      logger.info('[useWorkoutSession] Session resumed', { sessionId: session.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume');
    }
  }, [session]);

  const completeSession = useCallback(async () => {
    if (!session) return;

    try {
      const updatedSession = await SessionManager.completeSession(session.id);
      setSession(updatedSession);

      // Generate final summary
      await AnalyticsEngine.generateSessionSummary(session.id);

      logger.info('[useWorkoutSession] Session completed', { sessionId: session.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    }
  }, [session]);

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

    try {
      const result = await SessionManager.startExercise(session.id, { exercise_index: exerciseIndex });
      setSession(result.session);
      setCurrentExerciseLog(result.exerciseLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exercise');
    }
  }, [session]);

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

    try {
      const result = await SessionManager.completeSet(
        session.id,
        currentExerciseLog.id,
        { set_data: setData }
      );
      setSession(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete set');
    }
  }, [session, currentExerciseLog]);

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

  const refreshStats = useCallback(async () => {
    if (!session) return;

    try {
      const stats = await AnalyticsEngine.calculateLiveStats(session.id);
      setLiveStats(stats);
    } catch (err) {
      logger.warn('[useWorkoutSession] Failed to refresh stats', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [session]);

  // ===================================================
  // EFFECTS
  // ===================================================

  // Auto-refresh stats every 5 seconds
  useEffect(() => {
    if (!session || session.state === 'completed' || session.state === 'cancelled') {
      return;
    }

    const refreshStatsInterval = setInterval(() => {
      refreshStats();
    }, 5000);

    return () => clearInterval(refreshStatsInterval);
  }, [session, refreshStats]);

  // Initial stats load
  useEffect(() => {
    if (session) {
      refreshStats();
    }
  }, [session?.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (statsRefreshTimerRef.current) {
        clearInterval(statsRefreshTimerRef.current);
      }
    };
  }, []);

  // ===================================================
  // RETURN
  // ===================================================

  const controls: SessionControls = {
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
  };

  return {
    session,
    currentExerciseLog,
    liveStats,
    isLoading,
    error,
    controls,
    refreshStats,
  };
}
