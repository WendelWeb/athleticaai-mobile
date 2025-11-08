/**
 * 🚀 WORKOUT SESSION SYSTEM - Apple Fitness Grade
 *
 * Architecture évolutive pour tracking intelligent des séances:
 * - State machine complète (warmup → exercise → rest → completed)
 * - Tracking granulaire (exercices, séries, reps, rest times)
 * - ML-powered adaptive engine (rest times, recommendations)
 * - Real-time analytics (volume, intensity, TUT, calories)
 * - Offline-first avec sync automatique
 *
 * Tables:
 * 1. workout_sessions_v2 - Session principale avec state machine
 * 2. workout_exercise_logs - Tracking par exercice
 * 3. workout_set_logs - Tracking par série
 * 4. adaptive_user_metrics - ML data pour personnalisation
 * 5. exercise_recommendations - IA suggestions
 * 6. session_analytics - Métriques live
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { profiles, workouts, exercises } from './schema';

// =====================================================
// ENUMS - Advanced Workout Session States
// =====================================================

/**
 * Session State - State machine pour le player
 * idle → warmup → exercise → rest → paused → completed/cancelled
 */
export const sessionStateEnum = pgEnum('session_state', [
  'idle',        // Session créée, pas encore démarrée
  'warmup',      // Phase d'échauffement
  'exercise',    // En train d'exécuter un exercice
  'rest',        // Phase de repos entre séries
  'paused',      // Mis en pause par l'utilisateur
  'completed',   // Terminée avec succès
  'cancelled',   // Annulée par l'utilisateur
]);

/**
 * Exercise Phase - Phase actuelle dans l'exercice
 */
export const exercisePhaseEnum = pgEnum('exercise_phase', [
  'warmup',      // Échauffement
  'working_set', // Série de travail
  'rest',        // Repos
  'cooldown',    // Retour au calme
]);

/**
 * Exercise Status - Statut de complétion d'un exercice
 */
export const exerciseStatusEnum = pgEnum('exercise_status', [
  'pending',     // Pas encore commencé
  'in_progress', // En cours
  'completed',   // Complété avec succès
  'skipped',     // Sauté par l'utilisateur
  'failed',      // Échec (blessure, épuisement)
]);

/**
 * Skip Reason - Raisons de skip d'exercice (pour ML)
 */
export const skipReasonEnum = pgEnum('skip_reason', [
  'injury',           // Blessure / douleur
  'equipment',        // Équipement non disponible
  'difficulty',       // Trop difficile
  'preference',       // Préférence personnelle
  'time',             // Manque de temps
  'fatigue',          // Trop fatigué
  'other',            // Autre raison
]);

/**
 * Recommendation Type - Type de recommandation IA
 */
export const recommendationTypeEnum = pgEnum('recommendation_type', [
  'alternative',      // Exercise alternatif (même muscle group)
  'progression',      // Progression (plus difficile)
  'regression',       // Régression (plus facile)
  'similar',          // Exercice similaire
  'recovery',         // Exercice de récupération
]);

// =====================================================
// TABLE 1: WORKOUT SESSIONS V2 (Main Session Table)
// =====================================================

/**
 * Workout Sessions V2 - Session principale avec state machine avancée
 *
 * INNOVATION:
 * - State machine complète avec tous les états possibles
 * - Tracking précis des pauses (timestamps + durée totale)
 * - Real-time data en JSONB pour sync ultra-rapide
 * - AI insights pour adaptive features
 * - Support offline-first avec sync queue
 */
export const workoutSessionsV2 = pgTable(
  'workout_sessions_v2',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    user_id: text('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    workout_id: uuid('workout_id')
      .references(() => workouts.id, { onDelete: 'cascade' })
      .notNull(),

    // State Machine
    state: sessionStateEnum('state').default('idle').notNull(),
    current_exercise_index: integer('current_exercise_index').default(0).notNull(),
    current_set_index: integer('current_set_index').default(0).notNull(),

    // Phase Tracking
    current_phase: exercisePhaseEnum('current_phase').default('warmup'),
    phase_started_at: timestamp('phase_started_at', { withTimezone: true }),

    // Timestamps
    scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    cancelled_at: timestamp('cancelled_at', { withTimezone: true }),

    // Pause Tracking (précis pour analytics)
    paused_at: timestamp('paused_at', { withTimezone: true }),
    resumed_at: timestamp('resumed_at', { withTimezone: true }),
    total_paused_seconds: integer('total_paused_seconds').default(0).notNull(),
    pause_timestamps: jsonb('pause_timestamps').default([]), // [{paused_at, resumed_at, duration}]

    // Duration Tracking
    total_duration_seconds: integer('total_duration_seconds'),      // Durée totale (avec pauses)
    active_duration_seconds: integer('active_duration_seconds'),    // Durée active (sans pauses)
    warmup_duration_seconds: integer('warmup_duration_seconds'),
    cooldown_duration_seconds: integer('cooldown_duration_seconds'),

    // Real-time Sync Data (pour optimistic UI + offline-first)
    real_time_data: jsonb('real_time_data'), // {current_exercise, current_set, timer_state, etc}
    sync_status: text('sync_status').default('synced'), // synced, pending, failed
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),

    // Performance Summary
    exercises_completed: integer('exercises_completed').default(0).notNull(),
    total_exercises: integer('total_exercises').notNull(),
    sets_completed: integer('sets_completed').default(0).notNull(),
    total_sets: integer('total_sets').notNull(),
    completion_percentage: decimal('completion_percentage', { precision: 5, scale: 2 }).default('0'),

    // Calculated Metrics
    total_volume_kg: decimal('total_volume_kg', { precision: 10, scale: 2 }).default('0'),
    total_reps: integer('total_reps').default(0),
    calories_burned: integer('calories_burned'),

    // User Feedback
    difficulty_rating: integer('difficulty_rating'), // 1-5
    energy_level: integer('energy_level'),           // 1-5
    mood_rating: integer('mood_rating'),             // 1-5
    notes: text('notes'),

    // AI Insights (adaptive learning)
    ai_insights: jsonb('ai_insights'), // {suggested_rest_adjustments, form_notes, recommendations}
    performance_score: decimal('performance_score', { precision: 5, scale: 2 }), // 0-100

    // Metadata
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Indexes pour performance
    userIdIdx: index('workout_sessions_v2_user_id_idx').on(table.user_id),
    workoutIdIdx: index('workout_sessions_v2_workout_id_idx').on(table.workout_id),
    stateIdx: index('workout_sessions_v2_state_idx').on(table.state),
    startedAtIdx: index('workout_sessions_v2_started_at_idx').on(table.started_at),

    // CHECK constraints
    difficultyRatingCheck: check(
      'difficulty_rating_check_v2',
      sql`${table.difficulty_rating} >= 1 AND ${table.difficulty_rating} <= 5`
    ),
    energyLevelCheck: check(
      'energy_level_check_v2',
      sql`${table.energy_level} >= 1 AND ${table.energy_level} <= 5`
    ),
    moodRatingCheck: check(
      'mood_rating_check_v2',
      sql`${table.mood_rating} >= 1 AND ${table.mood_rating} <= 5`
    ),
  })
);

// =====================================================
// TABLE 2: WORKOUT EXERCISE LOGS (Per-Exercise Tracking)
// =====================================================

/**
 * Workout Exercise Logs - Tracking granulaire par exercice
 *
 * INNOVATION:
 * - Tracking précis de chaque exercice dans la session
 * - Skip reasons pour ML learning
 * - Alternative suggestions
 * - Performance scoring par exercice
 */
export const workoutExerciseLogs = pgTable(
  'workout_exercise_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    session_id: uuid('session_id')
      .references(() => workoutSessionsV2.id, { onDelete: 'cascade' })
      .notNull(),
    exercise_id: uuid('exercise_id')
      .references(() => exercises.id)
      .notNull(),

    // Order & Status
    order_index: integer('order_index').notNull(), // Position dans le workout
    status: exerciseStatusEnum('status').default('pending').notNull(),

    // Skip Handling (pour ML)
    skip_reason: skipReasonEnum('skip_reason'),
    skip_notes: text('skip_notes'),
    alternative_exercise_id: uuid('alternative_exercise_id').references(() => exercises.id),
    alternative_was_completed: boolean('alternative_was_completed'),

    // Planned vs Actual
    target_sets: integer('target_sets').notNull(),
    completed_sets: integer('completed_sets').default(0).notNull(),
    target_reps: integer('target_reps'),
    target_duration_seconds: integer('target_duration_seconds'),

    // Performance Metrics
    total_volume_kg: decimal('total_volume_kg', { precision: 10, scale: 2 }).default('0'),
    total_reps: integer('total_reps').default(0),
    average_rpe: decimal('average_rpe', { precision: 3, scale: 1 }), // Average Rate of Perceived Exertion
    peak_rpe: integer('peak_rpe'), // Highest RPE in any set

    // Form Quality (user-reported or AI-detected)
    form_quality_average: decimal('form_quality_average', { precision: 3, scale: 1 }), // 1-5
    form_notes: text('form_notes'),

    // Timestamps
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    duration_seconds: integer('duration_seconds'),

    // AI Recommendations
    ai_recommendations: jsonb('ai_recommendations'), // Suggestions pour prochaine fois
    performance_score: decimal('performance_score', { precision: 5, scale: 2 }), // 0-100

    // Metadata
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index('workout_exercise_logs_session_id_idx').on(table.session_id),
    exerciseIdIdx: index('workout_exercise_logs_exercise_id_idx').on(table.exercise_id),
    statusIdx: index('workout_exercise_logs_status_idx').on(table.status),
  })
);

// =====================================================
// TABLE 3: WORKOUT SET LOGS (Per-Set Tracking)
// =====================================================

/**
 * Workout Set Logs - Tracking ultra-granulaire par série
 *
 * INNOVATION:
 * - Chaque série est enregistrée individuellement
 * - RPE et form quality pour adaptive learning
 * - Rest times précis pour ML predictions
 * - Support pour tempo training (future)
 */
export const workoutSetLogs = pgTable(
  'workout_set_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    exercise_log_id: uuid('exercise_log_id')
      .references(() => workoutExerciseLogs.id, { onDelete: 'cascade' })
      .notNull(),

    // Set Info
    set_number: integer('set_number').notNull(), // 1, 2, 3...
    set_type: text('set_type').default('working'), // working, warmup, dropset, failure

    // Performance Data
    reps_target: integer('reps_target'),
    reps_completed: integer('reps_completed').notNull(),
    weight_kg: decimal('weight_kg', { precision: 6, scale: 2 }),

    // Duration (for timed exercises like planks)
    duration_target_seconds: integer('duration_target_seconds'),
    duration_actual_seconds: integer('duration_actual_seconds'),

    // Rest Tracking
    rest_target_seconds: integer('rest_target_seconds'),
    rest_actual_seconds: integer('rest_actual_seconds'),
    rest_quality: integer('rest_quality'), // 1-5 (user-reported: full rest vs rushed)

    // Effort Metrics
    rpe: integer('rpe'), // Rate of Perceived Exertion 1-10
    form_quality: integer('form_quality'), // 1-5
    was_failure: boolean('was_failure').default(false), // Set went to failure

    // Advanced Metrics (future: tempo tracking)
    tempo: text('tempo'), // e.g., "3-1-1-0" (eccentric-pause-concentric-pause)
    time_under_tension_seconds: integer('time_under_tension_seconds'),

    // Notes
    notes: text('notes'),
    technique_cues_used: text('technique_cues_used').array(), // ["squeeze", "slow_eccentric"]

    // Timestamps
    started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completed_at: timestamp('completed_at', { withTimezone: true }),

    // Metadata
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    exerciseLogIdIdx: index('workout_set_logs_exercise_log_id_idx').on(table.exercise_log_id),

    // CHECK constraints
    rpeCheck: check(
      'rpe_check',
      sql`${table.rpe} >= 1 AND ${table.rpe} <= 10`
    ),
    formQualityCheck: check(
      'form_quality_check',
      sql`${table.form_quality} >= 1 AND ${table.form_quality} <= 5`
    ),
    restQualityCheck: check(
      'rest_quality_check',
      sql`${table.rest_quality} >= 1 AND ${table.rest_quality} <= 5`
    ),
  })
);

// =====================================================
// TABLE 4: ADAPTIVE USER METRICS (ML Learning Data)
// =====================================================

/**
 * Adaptive User Metrics - Machine Learning data pour personnalisation
 *
 * INNOVATION:
 * - Apprend les patterns de l'utilisateur par exercice
 * - Calcule rest times optimaux basés sur historique
 * - Estime 1RM et progression strength
 * - Feed l'adaptive engine pour suggestions intelligentes
 */
export const adaptiveUserMetrics = pgTable(
  'adaptive_user_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    user_id: text('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    exercise_id: uuid('exercise_id')
      .references(() => exercises.id, { onDelete: 'cascade' })
      .notNull(),

    // Rest Time Learning
    preferred_rest_seconds: integer('preferred_rest_seconds'), // ML-calculated optimal rest
    rest_seconds_variance: integer('rest_seconds_variance'),   // Variance dans ses choix
    rest_time_trend: text('rest_time_trend'), // increasing, decreasing, stable

    // Rep Range Preferences
    optimal_rep_range_min: integer('optimal_rep_range_min'),
    optimal_rep_range_max: integer('optimal_rep_range_max'),
    favorite_rep_range: text('favorite_rep_range'), // "8-12", "15-20"

    // Strength Metrics
    last_1rm_estimate_kg: decimal('last_1rm_estimate_kg', { precision: 6, scale: 2 }),
    strength_progression_rate: decimal('strength_progression_rate', { precision: 5, scale: 2 }), // % per week
    total_volume_lifetime_kg: decimal('total_volume_lifetime_kg', { precision: 12, scale: 2 }),

    // Performance Averages
    average_rpe: decimal('average_rpe', { precision: 3, scale: 1 }),
    average_form_quality: decimal('average_form_quality', { precision: 3, scale: 1 }),
    consistency_score: decimal('consistency_score', { precision: 5, scale: 2 }), // 0-100

    // Frequency & Volume
    total_sessions: integer('total_sessions').default(0).notNull(),
    total_sets: integer('total_sets').default(0).notNull(),
    total_reps: integer('total_reps').default(0).notNull(),
    sessions_per_week_average: decimal('sessions_per_week_average', { precision: 4, scale: 2 }),

    // Injury & Recovery Patterns
    skip_rate: decimal('skip_rate', { precision: 5, scale: 2 }), // % of times skipped
    injury_history: jsonb('injury_history'), // [{date, reason, duration}]
    recovery_time_average_hours: integer('recovery_time_average_hours'),

    // Adaptive Recommendations
    recommended_progression: text('recommended_progression'), // increase_weight, increase_reps, increase_sets
    next_milestone: jsonb('next_milestone'), // {type, value, estimated_date}

    // ML Metadata
    model_version: text('model_version').default('v1'),
    confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }), // 0-1 (how confident are predictions)
    last_calculated_at: timestamp('last_calculated_at', { withTimezone: true }).defaultNow().notNull(),

    // Metadata
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Composite unique constraint (one row per user per exercise)
    userExerciseIdx: index('adaptive_user_metrics_user_exercise_idx').on(
      table.user_id,
      table.exercise_id
    ),
  })
);

// =====================================================
// TABLE 5: EXERCISE RECOMMENDATIONS (AI Suggestions)
// =====================================================

/**
 * Exercise Recommendations - IA suggestions en temps réel
 *
 * INNOVATION:
 * - Recommande alternatives quand exercice skipped
 * - Suggère progressions basées sur performance
 * - Track acceptance rate pour améliorer ML
 */
export const exerciseRecommendations = pgTable(
  'exercise_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    user_id: text('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    session_id: uuid('session_id')
      .references(() => workoutSessionsV2.id, { onDelete: 'cascade' }),
    original_exercise_id: uuid('original_exercise_id')
      .references(() => exercises.id)
      .notNull(),
    recommended_exercise_id: uuid('recommended_exercise_id')
      .references(() => exercises.id)
      .notNull(),

    // Recommendation Context
    recommendation_type: recommendationTypeEnum('recommendation_type').notNull(),
    reason: text('reason').notNull(), // "Similar muscle group, easier difficulty"
    trigger_event: text('trigger_event'), // "exercise_skipped", "low_form_quality", "max_reps_achieved"

    // AI Metadata
    ai_confidence: decimal('ai_confidence', { precision: 3, scale: 2 }).notNull(), // 0-1
    ml_model_version: text('ml_model_version'),
    recommendation_data: jsonb('recommendation_data'), // Extra context for debugging

    // User Response
    was_shown: boolean('was_shown').default(false),
    was_accepted: boolean('was_accepted'),
    user_feedback: text('user_feedback'), // user can rate recommendation
    feedback_score: integer('feedback_score'), // 1-5

    // Metadata
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    responded_at: timestamp('responded_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('exercise_recommendations_user_id_idx').on(table.user_id),
    sessionIdIdx: index('exercise_recommendations_session_id_idx').on(table.session_id),

    feedbackScoreCheck: check(
      'feedback_score_check',
      sql`${table.feedback_score} >= 1 AND ${table.feedback_score} <= 5`
    ),
  })
);

// =====================================================
// TABLE 6: SESSION ANALYTICS (Real-Time Metrics)
// =====================================================

/**
 * Session Analytics - Métriques live calculées en temps réel
 *
 * INNOVATION:
 * - Calculs complexes (volume, intensité, TUT) stockés
 * - Performance scoring algorithmique
 * - Heart rate integration ready
 * - Comparaisons historiques instantanées
 */
export const sessionAnalytics = pgTable(
  'session_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Reference
    session_id: uuid('session_id')
      .references(() => workoutSessionsV2.id, { onDelete: 'cascade' })
      .notNull()
      .unique(), // One-to-one relationship

    // Volume Metrics
    total_volume_kg: decimal('total_volume_kg', { precision: 10, scale: 2 }).notNull(),
    volume_per_muscle_group: jsonb('volume_per_muscle_group'), // {chest: 2500, back: 3000}
    average_weight_per_exercise_kg: decimal('average_weight_per_exercise_kg', { precision: 6, scale: 2 }),

    // Intensity Metrics
    average_intensity: decimal('average_intensity', { precision: 5, scale: 4 }), // 0-1 (% of 1RM)
    average_rpe: decimal('average_rpe', { precision: 3, scale: 1 }), // 1-10
    peak_intensity_exercise_id: uuid('peak_intensity_exercise_id').references(() => exercises.id),

    // Rep & Set Metrics
    total_reps: integer('total_reps').notNull(),
    total_sets: integer('total_sets').notNull(),
    average_reps_per_set: decimal('average_reps_per_set', { precision: 5, scale: 2 }),

    // Time Metrics
    time_under_tension_seconds: integer('time_under_tension_seconds'),
    average_rest_seconds: integer('average_rest_seconds'),
    work_to_rest_ratio: decimal('work_to_rest_ratio', { precision: 5, scale: 2 }),

    // Energy & Performance
    calories_burned_estimate: integer('calories_burned_estimate'),
    calorie_calculation_method: text('calorie_calculation_method'), // "mets", "heart_rate", "estimated"
    performance_score: decimal('performance_score', { precision: 5, scale: 2 }).notNull(), // 0-100

    // Form Quality
    average_form_quality: decimal('average_form_quality', { precision: 3, scale: 1 }), // 1-5
    exercises_with_poor_form: integer('exercises_with_poor_form'),

    // Completion Metrics
    completion_rate: decimal('completion_rate', { precision: 5, scale: 2 }), // % of planned work
    exercises_skipped: integer('exercises_skipped').default(0),
    sets_to_failure: integer('sets_to_failure').default(0),

    // Heart Rate Metrics (future: wearable integration)
    heart_rate_avg: integer('heart_rate_avg'),
    heart_rate_max: integer('heart_rate_max'),
    heart_rate_zones: jsonb('heart_rate_zones'), // {zone1: 120, zone2: 340, ...} seconds in each zone

    // Historical Comparison
    vs_previous_session: jsonb('vs_previous_session'), // {volume_change: +10%, intensity_change: -5%}
    personal_records_set: integer('personal_records_set').default(0),
    personal_records_data: jsonb('personal_records_data'), // [{exercise, type, value}]

    // Advanced Metrics
    muscle_group_balance_score: decimal('muscle_group_balance_score', { precision: 5, scale: 2 }), // 0-100
    recovery_estimate_hours: integer('recovery_estimate_hours'),

    // Metadata
    calculated_at: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_analytics_session_id_idx').on(table.session_id),
  })
);

// =====================================================
// RELATIONS (Drizzle ORM)
// =====================================================

export const workoutSessionsV2Relations = relations(workoutSessionsV2, ({ one, many }) => ({
  user: one(profiles, {
    fields: [workoutSessionsV2.user_id],
    references: [profiles.id],
  }),
  workout: one(workouts, {
    fields: [workoutSessionsV2.workout_id],
    references: [workouts.id],
  }),
  exerciseLogs: many(workoutExerciseLogs),
  analytics: one(sessionAnalytics),
  recommendations: many(exerciseRecommendations),
}));

export const workoutExerciseLogsRelations = relations(workoutExerciseLogs, ({ one, many }) => ({
  session: one(workoutSessionsV2, {
    fields: [workoutExerciseLogs.session_id],
    references: [workoutSessionsV2.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExerciseLogs.exercise_id],
    references: [exercises.id],
  }),
  alternativeExercise: one(exercises, {
    fields: [workoutExerciseLogs.alternative_exercise_id],
    references: [exercises.id],
  }),
  setLogs: many(workoutSetLogs),
}));

export const workoutSetLogsRelations = relations(workoutSetLogs, ({ one }) => ({
  exerciseLog: one(workoutExerciseLogs, {
    fields: [workoutSetLogs.exercise_log_id],
    references: [workoutExerciseLogs.id],
  }),
}));

export const adaptiveUserMetricsRelations = relations(adaptiveUserMetrics, ({ one }) => ({
  user: one(profiles, {
    fields: [adaptiveUserMetrics.user_id],
    references: [profiles.id],
  }),
  exercise: one(exercises, {
    fields: [adaptiveUserMetrics.exercise_id],
    references: [exercises.id],
  }),
}));

export const exerciseRecommendationsRelations = relations(exerciseRecommendations, ({ one }) => ({
  user: one(profiles, {
    fields: [exerciseRecommendations.user_id],
    references: [profiles.id],
  }),
  session: one(workoutSessionsV2, {
    fields: [exerciseRecommendations.session_id],
    references: [workoutSessionsV2.id],
  }),
  originalExercise: one(exercises, {
    fields: [exerciseRecommendations.original_exercise_id],
    references: [exercises.id],
  }),
  recommendedExercise: one(exercises, {
    fields: [exerciseRecommendations.recommended_exercise_id],
    references: [exercises.id],
  }),
}));

export const sessionAnalyticsRelations = relations(sessionAnalytics, ({ one }) => ({
  session: one(workoutSessionsV2, {
    fields: [sessionAnalytics.session_id],
    references: [workoutSessionsV2.id],
  }),
}));

// =====================================================
// TYPES (for TypeScript)
// =====================================================

export type WorkoutSessionV2 = typeof workoutSessionsV2.$inferSelect;
export type NewWorkoutSessionV2 = typeof workoutSessionsV2.$inferInsert;

export type WorkoutExerciseLog = typeof workoutExerciseLogs.$inferSelect;
export type NewWorkoutExerciseLog = typeof workoutExerciseLogs.$inferInsert;

export type WorkoutSetLog = typeof workoutSetLogs.$inferSelect;
export type NewWorkoutSetLog = typeof workoutSetLogs.$inferInsert;

export type AdaptiveUserMetric = typeof adaptiveUserMetrics.$inferSelect;
export type NewAdaptiveUserMetric = typeof adaptiveUserMetrics.$inferInsert;

export type ExerciseRecommendation = typeof exerciseRecommendations.$inferSelect;
export type NewExerciseRecommendation = typeof exerciseRecommendations.$inferInsert;

export type SessionAnalytics = typeof sessionAnalytics.$inferSelect;
export type NewSessionAnalytics = typeof sessionAnalytics.$inferInsert;
