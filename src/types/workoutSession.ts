/**
 * 🚀 WORKOUT SESSION TYPES - Advanced
 *
 * Types avancés pour le Workout Session System
 * Compatible avec schema-workout-sessions.ts
 */

import type { Exercise } from './workout';

// =====================================================
// SESSION STATE MACHINE
// =====================================================

/**
 * Session State - États possibles de la session
 */
export type SessionState =
  | 'idle'       // Créée mais pas démarrée
  | 'warmup'     // Phase d'échauffement
  | 'exercise'   // Exercice en cours
  | 'rest'       // Phase de repos
  | 'paused'     // Mis en pause
  | 'completed'  // Terminée
  | 'cancelled'; // Annulée

/**
 * Exercise Phase - Phase actuelle dans l'exercice
 */
export type ExercisePhase =
  | 'warmup'
  | 'working_set'
  | 'rest'
  | 'cooldown';

/**
 * Exercise Status - Statut d'un exercice
 */
export type ExerciseStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed';

/**
 * Skip Reason - Raisons de skip (pour ML)
 */
export type SkipReason =
  | 'injury'
  | 'equipment'
  | 'difficulty'
  | 'preference'
  | 'time'
  | 'fatigue'
  | 'other';

/**
 * Recommendation Type - Types de recommandations IA
 */
export type RecommendationType =
  | 'alternative'
  | 'progression'
  | 'regression'
  | 'similar'
  | 'recovery';

// =====================================================
// REAL-TIME SESSION DATA
// =====================================================

/**
 * Real-Time Session Data - Données synchronisées en temps réel
 * Stockées en JSONB dans workout_sessions_v2.real_time_data
 */
export interface RealTimeSessionData {
  // Current State
  current_exercise_id: string | null;
  current_set_number: number;
  current_rep_count: number;

  // Timers
  exercise_elapsed_seconds: number;
  rest_elapsed_seconds: number;
  total_elapsed_seconds: number;

  // Player State
  is_timer_running: boolean;
  timer_mode: 'exercise' | 'rest' | 'paused';

  // Quick Stats
  exercises_completed: number;
  sets_completed: number;
  total_reps_completed: number;
  estimated_calories: number;

  // Last Update
  last_updated_at: string; // ISO timestamp
}

/**
 * Pause Timestamp - Structure des pauses
 */
export interface PauseTimestamp {
  paused_at: string;    // ISO timestamp
  resumed_at?: string;  // ISO timestamp
  duration_seconds: number;
  reason?: string;      // Optional: pourquoi la pause
}

// =====================================================
// EXERCISE & SET TRACKING
// =====================================================

/**
 * Planned Exercise - Exercice planifié dans le workout
 */
export interface PlannedExercise {
  exercise_id: string;
  exercise: Exercise;
  order_index: number;
  target_sets: number;
  target_reps?: number;
  target_duration_seconds?: number;
  rest_seconds: number;
  notes?: string;
}

/**
 * Set Data - Données d'une série en cours
 */
export interface SetData {
  set_number: number;
  reps_completed: number;
  weight_kg?: number;
  duration_seconds?: number;
  rpe?: number; // 1-10
  form_quality?: number; // 1-5
  notes?: string;
}

/**
 * Exercise Log Data - Données agrégées d'un exercice
 */
export interface ExerciseLogData {
  exercise_id: string;
  exercise_name: string;
  status: ExerciseStatus;
  completed_sets: number;
  total_sets: number;
  sets: SetData[];
  skip_reason?: SkipReason;
  skip_notes?: string;
  performance_score?: number;
}

// =====================================================
// ADAPTIVE & ML DATA
// =====================================================

/**
 * Adaptive Rest Calculation - Données pour calcul intelligent du repos
 */
export interface AdaptiveRestCalculation {
  base_rest_seconds: number;        // Repos de base de l'exercice
  user_preferred_rest: number;      // Repos préféré historique
  current_fatigue_factor: number;   // 0-1 (0 = frais, 1 = épuisé)
  set_difficulty_factor: number;    // 0-1 based on RPE
  recommended_rest_seconds: number; // Résultat final
  confidence: number;               // 0-1
  reasoning: string;                // Explication pour UI
}

/**
 * Exercise Recommendation Data - Recommandation IA
 */
export interface ExerciseRecommendationData {
  original_exercise_id: string;
  original_exercise_name: string;
  recommended_exercise_id: string;
  recommended_exercise_name: string;
  type: RecommendationType;
  reason: string;
  confidence: number; // 0-1
  benefits?: string[];
  difficulty_comparison?: 'easier' | 'same' | 'harder';
}

/**
 * Performance Insights - Insights IA pour la session
 */
export interface PerformanceInsights {
  overall_score: number; // 0-100
  volume_comparison: {
    vs_average: number;      // % difference
    vs_previous: number;     // % difference
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  intensity_assessment: {
    average_rpe: number;
    intensity_level: 'low' | 'moderate' | 'high' | 'very_high';
    recommendation: string;
  };
  form_quality: {
    average_score: number;
    exercises_with_issues: string[];
    improvement_tips: string[];
  };
  recovery_recommendation: {
    estimated_recovery_hours: number;
    next_workout_recommendation: string;
    rest_day_suggested: boolean;
  };
  achievements: {
    personal_records: number;
    milestones_reached: string[];
    progress_notes: string[];
  };
}

/**
 * Adaptive Metrics Summary - Résumé des métriques adaptatives
 */
export interface AdaptiveMetricsSummary {
  exercise_id: string;
  exercise_name: string;

  // Strength
  estimated_1rm_kg?: number;
  progression_rate_percent: number;
  volume_trend: 'increasing' | 'stable' | 'decreasing';

  // Rest
  optimal_rest_seconds: number;
  rest_consistency_score: number; // 0-100

  // Performance
  average_rpe: number;
  average_form_quality: number;
  consistency_score: number; // 0-100

  // Recommendations
  suggested_progression?: string;
  next_milestone?: {
    type: 'weight' | 'reps' | 'sets' | 'volume';
    current_value: number;
    target_value: number;
    estimated_weeks: number;
  };
}

// =====================================================
// SESSION ANALYTICS
// =====================================================

/**
 * Live Session Stats - Stats calculées en temps réel
 */
export interface LiveSessionStats {
  // Progress
  completion_percentage: number;
  exercises_completed: number;
  exercises_total: number;
  sets_completed: number;
  sets_total: number;

  // Time
  elapsed_seconds: number;
  estimated_remaining_seconds: number;
  active_time_seconds: number;
  paused_time_seconds: number;

  // Volume & Intensity
  total_volume_kg: number;
  total_reps: number;
  average_intensity: number; // 0-1
  average_rpe: number;

  // Calories
  calories_burned: number;
  calories_per_minute: number;

  // Performance
  current_performance_score: number; // 0-100
  vs_previous_session_percent: number;
}

/**
 * Session Summary - Résumé final de la session
 */
export interface SessionSummary {
  // Metadata
  session_id: string;
  workout_name: string;
  completed_at: string;

  // Time
  total_duration_seconds: number;
  active_duration_seconds: number;
  paused_duration_seconds: number;

  // Volume & Work
  total_volume_kg: number;
  total_reps: number;
  total_sets: number;
  exercises_completed: number;
  exercises_skipped: number;

  // Performance
  performance_score: number; // 0-100
  average_rpe: number;
  average_form_quality: number;
  calories_burned: number;

  // Comparisons
  vs_previous: {
    volume_change_percent: number;
    duration_change_percent: number;
    performance_change_percent: number;
  };

  // Personal Records
  personal_records: Array<{
    exercise_name: string;
    type: 'weight' | 'reps' | 'volume' | '1rm';
    previous_value: number;
    new_value: number;
  }>;

  // Insights
  insights: PerformanceInsights;

  // Next Steps
  recommendations: {
    recovery_hours: number;
    next_workout_type?: string;
    focus_areas: string[];
  };

  // Exercise Breakdown (for charts)
  exercise_breakdown: Array<{
    exercise_name: string;
    total_volume_kg: number;
    completion_rate: number;
    set_logs: Array<{
      weight_kg: string | null;
      reps_completed: number;
      rpe: number | null;
    }>;
  }>;

  // Performance Summary (for scoring)
  performance_summary: {
    final_score: number;
    breakdown: {
      completion_score: number;
      volume_score: number;
      intensity_score: number;
      consistency_score: number;
      efficiency_score: number;
      progression_score: number;
    };
  };

  // Historical Comparison (for trends)
  historical_comparison?: {
    recent_sessions: Array<{
      completed_at: string;
      final_score: number;
    }>;
  };
}

// =====================================================
// PLAYER CONTROLS & ACTIONS
// =====================================================

/**
 * Session Action - Actions disponibles dans le player
 */
export type SessionAction =
  | { type: 'START_SESSION'; payload: { workout_id: string } }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'CANCEL_SESSION' }
  | { type: 'START_EXERCISE'; payload: { exercise_index: number } }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'SKIP_EXERCISE'; payload: { reason: SkipReason; notes?: string } }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'START_SET'; payload: { set_number: number } }
  | { type: 'COMPLETE_SET'; payload: SetData }
  | { type: 'START_REST' }
  | { type: 'SKIP_REST' }
  | { type: 'UPDATE_TIMER'; payload: { elapsed_seconds: number } }
  | { type: 'SYNC_TO_DB' };

/**
 * Player Controls Interface
 */
export interface SessionControls {
  // Session Level
  startSession: (workoutId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  cancelSession: () => Promise<void>;

  // Exercise Level
  startExercise: (exerciseIndex: number) => Promise<void>;
  completeExercise: () => Promise<void>;
  skipExercise: (reason: SkipReason, notes?: string) => Promise<void>;
  goToPreviousExercise: () => Promise<void>;
  goToNextExercise: () => Promise<void>;

  // Set Level
  startSet: (setNumber: number) => Promise<void>;
  completeSet: (setData: SetData) => Promise<void>;

  // Rest Management
  startRest: () => Promise<void>;
  skipRest: () => Promise<void>;

  // Real-time
  updateTimer: (elapsedSeconds: number) => void;
  syncToDatabase: () => Promise<void>;
}

// =====================================================
// PLAYER SETTINGS & CONFIG
// =====================================================

/**
 * Player Settings - Configuration utilisateur
 */
export interface PlayerSettings {
  // Auto-advance
  auto_advance_exercises: boolean;
  auto_advance_sets: boolean;
  auto_start_rest: boolean;

  // Audio & Haptics
  sound_effects_enabled: boolean;
  voice_coaching_enabled: boolean;
  voice_language: string;
  haptic_feedback_enabled: boolean;

  // Timer
  timer_style: 'countdown' | 'countup';
  show_milliseconds: boolean;
  rest_timer_alerts: boolean;
  rest_timer_alert_seconds: number[];

  // Display
  keep_screen_on: boolean;
  show_video_demos: boolean;
  show_live_analytics: boolean;
  analytics_position: 'top' | 'bottom' | 'overlay';

  // Adaptive Features
  adaptive_rest_enabled: boolean;
  exercise_recommendations_enabled: boolean;
  form_feedback_enabled: boolean;
}

/**
 * Timer Config - Configuration d'un timer
 */
export interface TimerConfig {
  type: 'countdown' | 'countup';
  duration_seconds?: number;
  max_duration_seconds?: number;
  auto_advance: boolean;
  alerts_at_seconds?: number[];
}

// =====================================================
// VOICE & ACCESSIBILITY
// =====================================================

/**
 * Voice Command - Commandes vocales supportées
 */
export type VoiceCommand =
  | 'start'
  | 'pause'
  | 'resume'
  | 'skip'
  | 'next'
  | 'previous'
  | 'complete'
  | 'repeat_set'
  | 'increase_weight'
  | 'decrease_weight'
  | 'what_next';

/**
 * Voice Feedback - Feedback vocal
 */
export interface VoiceFeedback {
  text: string;
  priority: 'low' | 'medium' | 'high';
  interrupt_current: boolean;
}

/**
 * Accessibility Config - Configuration accessibilité
 */
export interface AccessibilityConfig {
  screen_reader_enabled: boolean;
  high_contrast_mode: boolean;
  large_text_mode: boolean;
  voice_commands_enabled: boolean;
  gesture_controls_enabled: boolean;
  haptic_intensity: 'light' | 'medium' | 'strong';
}

// =====================================================
// OFFLINE SYNC
// =====================================================

/**
 * Sync Status - État de synchronisation
 */
export type SyncStatus =
  | 'synced'
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'offline';

/**
 * Sync Queue Item - Item dans la queue de sync
 */
export interface SyncQueueItem {
  id: string;
  action: SessionAction;
  timestamp: string;
  retry_count: number;
  status: SyncStatus;
  error?: string;
}

/**
 * Offline Session Data - Données stockées localement
 */
export interface OfflineSessionData {
  session_id: string;
  workout_id: string;
  state: SessionState;
  real_time_data: RealTimeSessionData;
  exercise_logs: ExerciseLogData[];
  pending_sync: SyncQueueItem[];
  last_synced_at: string;
}
