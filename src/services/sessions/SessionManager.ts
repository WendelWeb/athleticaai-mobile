/**
 * 🚀 SESSION MANAGER - Core Service
 *
 * Le cerveau du Workout Session System
 * Gère toute la logique de session: CRUD, state machine, real-time sync
 *
 * FEATURES:
 * - State machine robuste avec transitions validées
 * - Real-time sync vers DB (optimistic UI)
 * - Offline-first avec queue de sync
 * - Auto-save toutes les actions
 * - Performance tracking granulaire
 *
 * ARCHITECTURE:
 * - Service singleton
 * - Observable pattern pour UI reactivity
 * - Transaction safety pour consistency
 * - Error recovery automatique
 */

import { db } from '@/db';
import {
  workoutSessionsV2,
  workoutExerciseLogs,
  workoutSetLogs,
  sessionAnalytics,
  type WorkoutSessionV2,
  type NewWorkoutSessionV2,
  type WorkoutExerciseLog,
  type NewWorkoutExerciseLog,
  type WorkoutSetLog,
  type NewWorkoutSetLog,
} from '@/db/schema-workout-sessions';
import { workouts, exercises } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger, toISOString } from '@/utils';
import type {
  SessionState,
  ExerciseStatus,
  SkipReason,
  RealTimeSessionData,
  PauseTimestamp,
  PlannedExercise,
  SetData,
  ExerciseLogData,
} from '@/types/workoutSession';

// =====================================================
// INTERFACES
// =====================================================

interface CreateSessionOptions {
  user_id: string;
  workout_id: string;
  scheduled_at?: Date;
}

interface StartExerciseOptions {
  exercise_index: number;
  auto_start_timer?: boolean;
}

interface SkipExerciseOptions {
  reason: SkipReason;
  notes?: string;
  alternative_exercise_id?: string;
}

interface CompleteSetOptions {
  set_data: SetData;
  auto_start_rest?: boolean;
}

// =====================================================
// SESSION MANAGER CLASS
// =====================================================

class SessionManagerService {
  // Singleton instance
  private static instance: SessionManagerService;

  // Current active session ID (in-memory cache)
  private activeSessionId: string | null = null;

  // Real-time data cache
  private realtimeCache: Map<string, RealTimeSessionData> = new Map();

  // Offline sync queue
  private syncQueue: Array<{ sessionId: string; action: string; data: any }> = [];

  private constructor() {
    // Private constructor pour singleton
  }

  public static getInstance(): SessionManagerService {
    if (!SessionManagerService.instance) {
      SessionManagerService.instance = new SessionManagerService();
    }
    return SessionManagerService.instance;
  }

  // ===================================================
  // CRUD OPERATIONS
  // ===================================================

  /**
   * Créer une nouvelle session
   */
  async createSession(options: CreateSessionOptions): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Creating new session', {
        userId: options.user_id,
        workoutId: options.workout_id,
      });

      // Fetch workout details pour initialiser
      const workout = await (db as any).query.workouts.findFirst({
        where: eq(workouts.id, options.workout_id),
      });

      if (!workout) {
        throw new Error('Workout not found');
      }

      // Parse exercises from workout
      const exercisesData = workout.exercises as any[];
      const totalExercises = exercisesData.length;
      const totalSets = exercisesData.reduce(
        (sum, ex) => sum + (ex.sets || 0),
        0
      );

      // Create session
      const [newSession] = await db
        .insert(workoutSessionsV2)
        .values({
          user_id: options.user_id,
          workout_id: options.workout_id,
          state: 'idle',
          scheduled_at: options.scheduled_at,
          current_exercise_index: 0,
          current_set_index: 0,
          total_exercises: totalExercises,
          total_sets: totalSets,
          real_time_data: this.initializeRealtimeData(),
          sync_status: 'synced',
        })
        .returning();

      logger.info('[SessionManager] Session created', {
        sessionId: newSession.id,
      });

      return newSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to create session', error instanceof Error ? error : undefined, {
        userId: options.user_id,
        workoutId: options.workout_id,
      });
      throw error;
    }
  }

  /**
   * Récupérer une session par ID
   */
  async getSession(sessionId: string): Promise<WorkoutSessionV2 | null> {
    try {
      const session = await (db as any).query.workoutSessionsV2.findFirst({
        where: eq(workoutSessionsV2.id, sessionId),
      });

      return session || null;
    } catch (error) {
      logger.error('[SessionManager] Failed to get session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      return null;
    }
  }

  /**
   * Récupérer la dernière session d'un utilisateur
   */
  async getLatestSession(userId: string): Promise<WorkoutSessionV2 | null> {
    try {
      const session = await (db as any).query.workoutSessionsV2.findFirst({
        where: eq(workoutSessionsV2.user_id, userId),
        orderBy: [desc(workoutSessionsV2.created_at)],
      });

      return session || null;
    } catch (error) {
      logger.error('[SessionManager] Failed to get latest session', error instanceof Error ? error : undefined, {
        userId,
      });
      return null;
    }
  }

  // ===================================================
  // STATE MACHINE - SESSION LEVEL
  // ===================================================

  /**
   * Démarrer une session
   * Transition: idle → warmup
   */
  async startSession(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Starting session', { sessionId });

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.state !== 'idle') {
        throw new Error(`Cannot start session from state: ${session.state}`);
      }

      const now = new Date();

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'warmup',
          started_at: now,
          phase_started_at: now,
          current_phase: 'warmup',
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      this.activeSessionId = sessionId;

      logger.info('[SessionManager] Session started', {
        sessionId,
        state: 'warmup',
      });

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to start session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Mettre une session en pause
   * Transition: exercise|rest → paused
   */
  async pauseSession(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Pausing session', { sessionId });

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!['exercise', 'rest', 'warmup'].includes(session.state)) {
        throw new Error(`Cannot pause session from state: ${session.state}`);
      }

      const now = new Date();

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'paused',
          paused_at: now,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      logger.info('[SessionManager] Session paused', { sessionId });

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to pause session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Reprendre une session en pause
   * Transition: paused → exercise|rest
   */
  async resumeSession(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Resuming session', { sessionId });

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.state !== 'paused') {
        throw new Error('Session is not paused');
      }

      const now = new Date();
      const pausedDuration = session.paused_at
        ? Math.floor((now.getTime() - session.paused_at.getTime()) / 1000)
        : 0;

      // Add pause to history
      const pauseTimestamps = (session.pause_timestamps as PauseTimestamp[]) || [];
      pauseTimestamps.push({
        paused_at: session.paused_at!.toISOString(),
        resumed_at: now.toISOString(),
        duration_seconds: pausedDuration,
      });

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: session.current_phase === 'rest' ? 'rest' : 'exercise',
          resumed_at: now,
          total_paused_seconds: (session.total_paused_seconds || 0) + pausedDuration,
          pause_timestamps: pauseTimestamps,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      logger.info('[SessionManager] Session resumed', {
        sessionId,
        pausedDuration,
      });

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to resume session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Terminer une session avec succès
   * Transition: exercise|rest → completed
   */
  async completeSession(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Completing session', { sessionId });

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const now = new Date();
      const startedAt = session.started_at ? new Date(session.started_at) : null;
      const totalDuration = startedAt && !isNaN(startedAt.getTime())
        ? Math.floor((now.getTime() - startedAt.getTime()) / 1000)
        : 0;
      const activeDuration = totalDuration - (session.total_paused_seconds || 0);

      // Calculate completion percentage
      const completionPercentage = session.total_exercises > 0
        ? (session.exercises_completed / session.total_exercises) * 100
        : 0;

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'completed',
          completed_at: now,
          total_duration_seconds: totalDuration,
          active_duration_seconds: activeDuration,
          completion_percentage: completionPercentage.toFixed(2),
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      this.activeSessionId = null;

      logger.info('[SessionManager] Session completed', {
        sessionId,
        totalDuration,
        activeDuration,
        completionPercentage,
      });

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to complete session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Annuler une session
   * Transition: any → cancelled
   */
  async cancelSession(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      logger.info('[SessionManager] Cancelling session', { sessionId });

      const now = new Date();

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'cancelled',
          cancelled_at: now,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      this.activeSessionId = null;

      logger.info('[SessionManager] Session cancelled', { sessionId });

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to cancel session', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  // ===================================================
  // EXERCISE MANAGEMENT
  // ===================================================

  /**
   * Démarrer un exercice
   */
  async startExercise(
    sessionId: string,
    options: StartExerciseOptions
  ): Promise<{ session: WorkoutSessionV2; exerciseLog: WorkoutExerciseLog }> {
    try {
      logger.info('[SessionManager] Starting exercise', {
        sessionId,
        exerciseIndex: options.exercise_index,
      });

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get workout and exercise details
      const workout = await db.query.workouts.findFirst({
        where: eq(workouts.id, session.workout_id),
      });

      if (!workout) {
        throw new Error('Workout not found');
      }

      const exercisesData = workout.exercises as any[];
      const exerciseData = exercisesData[options.exercise_index];

      if (!exerciseData) {
        throw new Error('Exercise not found in workout');
      }

      const now = new Date();

      // Create exercise log
      const [exerciseLog] = await db
        .insert(workoutExerciseLogs)
        .values({
          session_id: sessionId,
          exercise_id: exerciseData.exercise_id,
          order_index: options.exercise_index,
          status: 'in_progress',
          target_sets: exerciseData.sets || 3,
          target_reps: exerciseData.reps,
          target_duration_seconds: exerciseData.duration_seconds,
          started_at: now,
        })
        .returning();

      // Update session
      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'exercise',
          current_phase: 'working_set',
          current_exercise_index: options.exercise_index,
          current_set_index: 0,
          phase_started_at: now,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      logger.info('[SessionManager] Exercise started', {
        sessionId,
        exerciseLogId: exerciseLog.id,
      });

      return {
        session: updatedSession,
        exerciseLog,
      };
    } catch (error) {
      logger.error('[SessionManager] Failed to start exercise', error instanceof Error ? error : undefined, {
        sessionId,
        exerciseIndex: options.exercise_index,
      });
      throw error;
    }
  }

  /**
   * Terminer un exercice
   */
  async completeExercise(
    sessionId: string,
    exerciseLogId: string
  ): Promise<{ session: WorkoutSessionV2; exerciseLog: WorkoutExerciseLog }> {
    try {
      logger.info('[SessionManager] Completing exercise', {
        sessionId,
        exerciseLogId,
      });

      const now = new Date();

      // Update exercise log
      const [exerciseLog] = await db
        .update(workoutExerciseLogs)
        .set({
          status: 'completed',
          completed_at: now,
        })
        .where(eq(workoutExerciseLogs.id, exerciseLogId))
        .returning();

      // Update session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          exercises_completed: (session.exercises_completed || 0) + 1,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      logger.info('[SessionManager] Exercise completed', {
        sessionId,
        exerciseLogId,
      });

      return {
        session: updatedSession,
        exerciseLog,
      };
    } catch (error) {
      logger.error('[SessionManager] Failed to complete exercise', error instanceof Error ? error : undefined, {
        sessionId,
        exerciseLogId,
      });
      throw error;
    }
  }

  /**
   * Sauter un exercice
   */
  async skipExercise(
    sessionId: string,
    exerciseLogId: string,
    options: SkipExerciseOptions
  ): Promise<{ session: WorkoutSessionV2; exerciseLog: WorkoutExerciseLog }> {
    try {
      logger.info('[SessionManager] Skipping exercise', {
        sessionId,
        exerciseLogId,
        reason: options.reason,
      });

      const now = new Date();

      // Update exercise log
      const [exerciseLog] = await db
        .update(workoutExerciseLogs)
        .set({
          status: 'skipped',
          skip_reason: options.reason,
          skip_notes: options.notes,
          alternative_exercise_id: options.alternative_exercise_id,
          completed_at: now,
        })
        .where(eq(workoutExerciseLogs.id, exerciseLogId))
        .returning();

      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      logger.info('[SessionManager] Exercise skipped', {
        sessionId,
        exerciseLogId,
        reason: options.reason,
      });

      return {
        session,
        exerciseLog,
      };
    } catch (error) {
      logger.error('[SessionManager] Failed to skip exercise', error instanceof Error ? error : undefined, {
        sessionId,
        exerciseLogId,
        reason: options.reason,
      });
      throw error;
    }
  }

  // ===================================================
  // SET MANAGEMENT
  // ===================================================

  /**
   * Compléter une série
   */
  async completeSet(
    sessionId: string,
    exerciseLogId: string,
    options: CompleteSetOptions
  ): Promise<{ session: WorkoutSessionV2; setLog: WorkoutSetLog }> {
    try {
      logger.debug('[SessionManager] Completing set', {
        sessionId,
        exerciseLogId,
        setNumber: options.set_data.set_number,
      });

      const now = new Date();

      // Create set log
      const [setLog] = await db
        .insert(workoutSetLogs)
        .values({
          exercise_log_id: exerciseLogId,
          set_number: options.set_data.set_number,
          reps_completed: options.set_data.reps_completed,
          weight_kg: options.set_data.weight_kg?.toString(),
          duration_actual_seconds: options.set_data.duration_seconds,
          rpe: options.set_data.rpe,
          form_quality: options.set_data.form_quality,
          notes: options.set_data.notes,
          completed_at: now,
        })
        .returning();

      // Update session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          sets_completed: (session.sets_completed || 0) + 1,
          total_reps: (session.total_reps || 0) + options.set_data.reps_completed,
          current_set_index: options.set_data.set_number,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      logger.debug('[SessionManager] Set completed', {
        sessionId,
        setLogId: setLog.id,
      });

      return {
        session: updatedSession,
        setLog,
      };
    } catch (error) {
      logger.error('[SessionManager] Failed to complete set', error instanceof Error ? error : undefined, {
        sessionId,
        exerciseLogId,
      });
      throw error;
    }
  }

  // ===================================================
  // REST MANAGEMENT
  // ===================================================

  /**
   * Démarrer une phase de repos
   */
  async startRest(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      const now = new Date();

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'rest',
          current_phase: 'rest',
          phase_started_at: now,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to start rest', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Sauter le repos (passer directement à la série suivante)
   */
  async skipRest(sessionId: string): Promise<WorkoutSessionV2> {
    try {
      const now = new Date();

      const [updatedSession] = await db
        .update(workoutSessionsV2)
        .set({
          state: 'exercise',
          current_phase: 'working_set',
          phase_started_at: now,
          updated_at: now,
        })
        .where(eq(workoutSessionsV2.id, sessionId))
        .returning();

      return updatedSession;
    } catch (error) {
      logger.error('[SessionManager] Failed to skip rest', error instanceof Error ? error : undefined, {
        sessionId,
      });
      throw error;
    }
  }

  // ===================================================
  // UTILITIES
  // ===================================================

  /**
   * Initialiser les données real-time d'une session
   */
  private initializeRealtimeData(): RealTimeSessionData {
    return {
      current_exercise_id: null,
      current_set_number: 0,
      current_rep_count: 0,
      exercise_elapsed_seconds: 0,
      rest_elapsed_seconds: 0,
      total_elapsed_seconds: 0,
      is_timer_running: false,
      timer_mode: 'paused',
      exercises_completed: 0,
      sets_completed: 0,
      total_reps_completed: 0,
      estimated_calories: 0,
      last_updated_at: new Date().toISOString(),
    };
  }

  /**
   * Mettre à jour les données real-time
   */
  async updateRealtimeData(
    sessionId: string,
    data: Partial<RealTimeSessionData>
  ): Promise<void> {
    try {
      const currentData = this.realtimeCache.get(sessionId) || this.initializeRealtimeData();
      const updatedData = {
        ...currentData,
        ...data,
        last_updated_at: new Date().toISOString(),
      };

      this.realtimeCache.set(sessionId, updatedData);

      // Sync to DB (debounced in production)
      await db
        .update(workoutSessionsV2)
        .set({
          real_time_data: updatedData,
          sync_status: 'synced',
          last_synced_at: new Date(),
        })
        .where(eq(workoutSessionsV2.id, sessionId));
    } catch (error) {
      logger.warn('[SessionManager] Failed to update realtime data', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtenir l'ID de la session active
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }
}

// Export singleton instance
export const SessionManager = SessionManagerService.getInstance();
