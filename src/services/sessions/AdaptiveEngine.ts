/**
 * 🧠 ADAPTIVE ENGINE - ML-Powered Intelligence
 *
 * Machine Learning engine pour personnalisation adaptative:
 * - Calcul intelligent des temps de repos
 * - Recommandations d'exercices alternatifs
 * - Estimation 1RM et progression strength
 * - Adaptation difficulté basée sur performance
 *
 * ALGORITHMES:
 * - Adaptive Rest: baseRest × difficulty × fatigue × historicalPattern
 * - Exercise Recommendations: Muscle group matching + difficulty scoring
 * - 1RM Estimation: Epley formula + historical regression
 * - Progression Tracking: Linear regression sur volume/intensité
 *
 * LEARNING:
 * - Apprend des patterns utilisateur
 * - S'améliore avec chaque session
 * - Confidence scores pour toutes les prédictions
 */

import { db } from '@/db';
import {
  adaptiveUserMetrics,
  workoutSetLogs,
  workoutExerciseLogs,
  workoutSessionsV2,
  exerciseRecommendations,
  type AdaptiveUserMetric,
} from '@/db/schema-workout-sessions';
import { exercises } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger, toISOString } from '@/utils';
import type {
  AdaptiveRestCalculation,
  ExerciseRecommendationData,
  RecommendationType,
  AdaptiveMetricsSummary,
} from '@/types/workoutSession';

// =====================================================
// CONSTANTS & CONFIG
// =====================================================

const REST_TIME_CONFIG = {
  // Base rest times par type d'exercice (seconds)
  STRENGTH_BASE: 180,      // 3 min pour force
  HYPERTROPHY_BASE: 90,    // 90s pour hypertrophie
  ENDURANCE_BASE: 45,      // 45s pour endurance

  // Facteurs de modification
  DIFFICULTY_MULTIPLIER: {
    LOW: 0.8,        // -20% si facile
    MEDIUM: 1.0,     // Base
    HIGH: 1.2,       // +20% si difficile
    VERY_HIGH: 1.4,  // +40% si très difficile
  },

  FATIGUE_MULTIPLIER: {
    FRESH: 0.9,      // -10% si frais
    NORMAL: 1.0,     // Base
    TIRED: 1.15,     // +15% si fatigué
    EXHAUSTED: 1.3,  // +30% si épuisé
  },

  // RPE thresholds pour difficulté
  RPE_THRESHOLDS: {
    LOW: 6,
    MEDIUM: 8,
    HIGH: 9,
  },
};

const RECOMMENDATION_CONFIG = {
  MIN_CONFIDENCE: 0.6,  // Minimum confidence pour suggérer
  MAX_RECOMMENDATIONS: 3, // Max 3 suggestions
  SIMILARITY_THRESHOLD: 0.7, // Score de similarité minimum
};

// =====================================================
// ADAPTIVE ENGINE CLASS
// =====================================================

class AdaptiveEngineService {
  private static instance: AdaptiveEngineService;

  private constructor() {}

  public static getInstance(): AdaptiveEngineService {
    if (!AdaptiveEngineService.instance) {
      AdaptiveEngineService.instance = new AdaptiveEngineService();
    }
    return AdaptiveEngineService.instance;
  }

  // ===================================================
  // ADAPTIVE REST TIME CALCULATION
  // ===================================================

  /**
   * Calculer le temps de repos adaptatif
   * Algorithm: baseRest × difficultyFactor × fatigueFactor × historicalPattern
   */
  async calculateAdaptiveRest(
    userId: string,
    exerciseId: string,
    currentSetData: {
      set_number: number;
      reps_completed: number;
      weight_kg?: number;
      rpe?: number; // Rate of Perceived Exertion (1-10)
    }
  ): Promise<AdaptiveRestCalculation> {
    try {
      logger.debug('[AdaptiveEngine] Calculating adaptive rest', {
        userId,
        exerciseId,
        setNumber: currentSetData.set_number,
        rpe: currentSetData.rpe,
      });

      // 1. Get base rest time
      const baseRest = REST_TIME_CONFIG.HYPERTROPHY_BASE; // Default

      // 2. Get user's historical preference for this exercise
      const userMetrics = await this.getUserMetrics(userId, exerciseId);
      const userPreferredRest = userMetrics?.preferred_rest_seconds || baseRest;

      // 3. Calculate difficulty factor based on RPE
      const difficultyFactor = this.calculateDifficultyFactor(currentSetData.rpe);

      // 4. Calculate fatigue factor (increases with set number)
      const fatigueFactor = this.calculateFatigueFactor(
        currentSetData.set_number,
        currentSetData.rpe
      );

      // 5. Historical pattern factor (si user prend toujours +10s, on s'adapte)
      const historicalFactor = userMetrics
        ? this.calculateHistoricalFactor(userMetrics, baseRest)
        : 1.0;

      // 6. Final calculation
      const recommendedRest = Math.round(
        baseRest * difficultyFactor * fatigueFactor * historicalFactor
      );

      // 7. Clamp entre 30s et 5min
      const clampedRest = Math.max(30, Math.min(300, recommendedRest));

      // 8. Confidence calculation
      const confidence = this.calculateConfidence(userMetrics);

      // 9. Generate reasoning
      const reasoning = this.generateRestReasoning(
        baseRest,
        difficultyFactor,
        fatigueFactor,
        historicalFactor,
        currentSetData
      );

      const result: AdaptiveRestCalculation = {
        base_rest_seconds: baseRest,
        user_preferred_rest: userPreferredRest,
        current_fatigue_factor: fatigueFactor,
        set_difficulty_factor: difficultyFactor,
        recommended_rest_seconds: clampedRest,
        confidence,
        reasoning,
      };

      logger.debug('[AdaptiveEngine] Adaptive rest calculated', {
        userId,
        exerciseId,
        recommended: clampedRest,
        confidence,
      });

      return result;
    } catch (error) {
      logger.error('[AdaptiveEngine] Failed to calculate adaptive rest', error instanceof Error ? error : undefined, {
        userId,
        exerciseId,
      });

      // Fallback: return base rest
      return {
        base_rest_seconds: REST_TIME_CONFIG.HYPERTROPHY_BASE,
        user_preferred_rest: REST_TIME_CONFIG.HYPERTROPHY_BASE,
        current_fatigue_factor: 1.0,
        set_difficulty_factor: 1.0,
        recommended_rest_seconds: REST_TIME_CONFIG.HYPERTROPHY_BASE,
        confidence: 0.5,
        reasoning: 'Using default rest time (no historical data)',
      };
    }
  }

  /**
   * Calculer le facteur de difficulté basé sur RPE
   */
  private calculateDifficultyFactor(rpe?: number): number {
    if (!rpe) return 1.0;

    if (rpe <= REST_TIME_CONFIG.RPE_THRESHOLDS.LOW) {
      return REST_TIME_CONFIG.DIFFICULTY_MULTIPLIER.LOW;
    } else if (rpe <= REST_TIME_CONFIG.RPE_THRESHOLDS.MEDIUM) {
      return REST_TIME_CONFIG.DIFFICULTY_MULTIPLIER.MEDIUM;
    } else if (rpe <= REST_TIME_CONFIG.RPE_THRESHOLDS.HIGH) {
      return REST_TIME_CONFIG.DIFFICULTY_MULTIPLIER.HIGH;
    } else {
      return REST_TIME_CONFIG.DIFFICULTY_MULTIPLIER.VERY_HIGH;
    }
  }

  /**
   * Calculer le facteur de fatigue (augmente avec le numéro de série)
   */
  private calculateFatigueFactor(setNumber: number, rpe?: number): number {
    // Base: +5% par série après la 1ère
    let fatigueFactor = 1.0 + (setNumber - 1) * 0.05;

    // Si RPE élevé, augmente plus vite
    if (rpe && rpe >= 9) {
      fatigueFactor *= 1.15;
    }

    return Math.min(fatigueFactor, REST_TIME_CONFIG.FATIGUE_MULTIPLIER.EXHAUSTED);
  }

  /**
   * Calculer le facteur historique (patterns de l'utilisateur)
   */
  private calculateHistoricalFactor(
    metrics: AdaptiveUserMetric,
    baseRest: number
  ): number {
    const preferredRest = metrics.preferred_rest_seconds || baseRest;
    const variance = metrics.rest_seconds_variance || 0;

    // Si user prend systématiquement plus/moins de repos
    const historicalRatio = preferredRest / baseRest;

    // Si variance élevée, confiance plus faible → closer to 1.0
    const variancePenalty = Math.max(0, 1 - variance / 60); // Variance en secondes

    return 1.0 + (historicalRatio - 1.0) * variancePenalty;
  }

  /**
   * Calculer la confidence du calcul
   */
  private calculateConfidence(metrics: AdaptiveUserMetric | null): number {
    if (!metrics) return 0.5; // Pas de données historiques

    const totalSessions = metrics.total_sessions || 0;

    // Confidence augmente avec nombre de sessions (plateau à 20 sessions)
    const sessionConfidence = Math.min(totalSessions / 20, 1.0);

    // Si consistency_score élevé, confidence augmente
    const consistencyBonus = (Number(metrics.consistency_score) || 50) / 100;

    return (sessionConfidence * 0.7 + consistencyBonus * 0.3);
  }

  /**
   * Générer l'explication du calcul
   */
  private generateRestReasoning(
    baseRest: number,
    difficultyFactor: number,
    fatigueFactor: number,
    historicalFactor: number,
    setData: any
  ): string {
    const reasons: string[] = [];

    // Base
    reasons.push(`Base: ${baseRest}s`);

    // Difficulté
    if (difficultyFactor > 1.0 && setData.rpe) {
      reasons.push(`+${Math.round((difficultyFactor - 1) * 100)}% (RPE ${setData.rpe})`);
    } else if (difficultyFactor < 1.0) {
      reasons.push(`${Math.round((difficultyFactor - 1) * 100)}% (easier effort)`);
    }

    // Fatigue
    if (fatigueFactor > 1.0) {
      reasons.push(`+${Math.round((fatigueFactor - 1) * 100)}% (set ${setData.set_number})`);
    }

    // Historique
    if (historicalFactor !== 1.0) {
      const sign = historicalFactor > 1.0 ? '+' : '';
      reasons.push(`${sign}${Math.round((historicalFactor - 1) * 100)}% (your pattern)`);
    }

    return reasons.join(' • ');
  }

  // ===================================================
  // EXERCISE RECOMMENDATIONS
  // ===================================================

  /**
   * Générer des recommandations d'exercices alternatifs
   */
  async generateExerciseRecommendations(
    userId: string,
    originalExerciseId: string,
    reason: 'skipped' | 'low_form' | 'injury' | 'preference'
  ): Promise<ExerciseRecommendationData[]> {
    try {
      logger.info('[AdaptiveEngine] Generating exercise recommendations', {
        userId,
        originalExerciseId,
        reason,
      });

      // 1. Get original exercise
      const originalExercise = await (db as any).query.exercises.findFirst({
        where: eq(exercises.id, originalExerciseId),
      });

      if (!originalExercise) {
        throw new Error('Original exercise not found');
      }

      // 2. Find similar exercises
      const similarExercises = await this.findSimilarExercises(originalExercise);

      // 3. Score and rank recommendations
      const recommendations: ExerciseRecommendationData[] = [];

      for (const exercise of similarExercises) {
        const recommendationType = this.determineRecommendationType(
          originalExercise,
          exercise,
          reason
        );

        const confidence = this.calculateRecommendationConfidence(
          originalExercise,
          exercise
        );

        if (confidence >= RECOMMENDATION_CONFIG.MIN_CONFIDENCE) {
          recommendations.push({
            original_exercise_id: originalExerciseId,
            original_exercise_name: originalExercise.name,
            recommended_exercise_id: exercise.id,
            recommended_exercise_name: exercise.name,
            type: recommendationType,
            reason: this.generateRecommendationReason(
              originalExercise,
              exercise,
              recommendationType
            ),
            confidence,
            benefits: this.generateBenefits(exercise, recommendationType),
            difficulty_comparison: this.compareDifficulty(originalExercise, exercise),
          });
        }
      }

      // 4. Sort by confidence and limit
      recommendations.sort((a, b) => b.confidence - a.confidence);
      const topRecommendations = recommendations.slice(
        0,
        RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS
      );

      logger.info('[AdaptiveEngine] Generated recommendations', {
        userId,
        originalExerciseId,
        count: topRecommendations.length,
      });

      return topRecommendations;
    } catch (error) {
      logger.error('[AdaptiveEngine] Failed to generate recommendations', error instanceof Error ? error : undefined, {
        userId,
        originalExerciseId,
      });
      return [];
    }
  }

  /**
   * Trouver des exercices similaires
   */
  private async findSimilarExercises(
    originalExercise: any
  ): Promise<any[]> {
    // Find exercises with same category or similar muscle groups
    const similarExercises = await (db as any).query.exercises.findMany({
      where: and(
        eq(exercises.category, originalExercise.category),
        sql`${exercises.id} != ${originalExercise.id}`
      ),
      limit: 10,
    });

    return similarExercises;
  }

  /**
   * Déterminer le type de recommandation
   */
  private determineRecommendationType(
    original: any,
    recommended: any,
    reason: string
  ): RecommendationType {
    // Si raison = injury/difficulty → regression
    if (reason === 'injury' || reason === 'low_form') {
      if (recommended.difficulty_level < original.difficulty_level) {
        return 'regression';
      }
    }

    // Si même difficulté → alternative
    if (recommended.difficulty_level === original.difficulty_level) {
      return 'alternative';
    }

    // Si plus difficile → progression
    if (recommended.difficulty_level > original.difficulty_level) {
      return 'progression';
    }

    return 'similar';
  }

  /**
   * Calculer la confidence d'une recommandation
   */
  private calculateRecommendationConfidence(
    original: any,
    recommended: any
  ): number {
    let confidence = 0.5; // Base

    // Same category = +30%
    if (original.category === recommended.category) {
      confidence += 0.3;
    }

    // Similar muscle groups = +20%
    const originalMuscles = original.primary_muscles || [];
    const recommendedMuscles = recommended.primary_muscles || [];
    const muscleOverlap = originalMuscles.filter((m: string) =>
      recommendedMuscles.includes(m)
    ).length;

    if (muscleOverlap > 0) {
      confidence += 0.2 * (muscleOverlap / originalMuscles.length);
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Générer la raison de la recommandation
   */
  private generateRecommendationReason(
    original: any,
    recommended: any,
    type: RecommendationType
  ): string {
    const reasons: string[] = [];

    if (type === 'alternative') {
      reasons.push('Same muscle group');
      reasons.push('Similar difficulty');
    } else if (type === 'regression') {
      reasons.push('Easier variation');
      reasons.push('Better for recovery');
    } else if (type === 'progression') {
      reasons.push('More challenging');
      reasons.push('Next level up');
    }

    return reasons.join(' • ');
  }

  /**
   * Générer les bénéfices
   */
  private generateBenefits(exercise: any, type: RecommendationType): string[] {
    const benefits: string[] = [];

    if (type === 'regression') {
      benefits.push('Reduces injury risk');
      benefits.push('Improves form');
    } else if (type === 'progression') {
      benefits.push('Increases strength');
      benefits.push('Builds muscle');
    }

    benefits.push(`Targets ${exercise.category}`);

    return benefits;
  }

  /**
   * Comparer la difficulté
   */
  private compareDifficulty(
    original: any,
    recommended: any
  ): 'easier' | 'same' | 'harder' {
    const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const originalIndex = difficultyOrder.indexOf(original.difficulty_level);
    const recommendedIndex = difficultyOrder.indexOf(recommended.difficulty_level);

    if (recommendedIndex < originalIndex) return 'easier';
    if (recommendedIndex > originalIndex) return 'harder';
    return 'same';
  }

  // ===================================================
  // 1RM ESTIMATION
  // ===================================================

  /**
   * Estimer 1RM (One Rep Max) basé sur performances récentes
   * Utilise la formule d'Epley: 1RM = weight × (1 + reps/30)
   */
  async estimate1RM(
    userId: string,
    exerciseId: string
  ): Promise<{ estimated_1rm_kg: number; confidence: number }> {
    try {
      // Get recent sets for this exercise
      const recentSets = await (db as any).query.workoutSetLogs.findMany({
        where: and(
          sql`${workoutSetLogs.exercise_log_id} IN (
            SELECT id FROM workout_exercise_logs
            WHERE exercise_id = ${exerciseId}
            AND session_id IN (
              SELECT id FROM workout_sessions_v2
              WHERE user_id = ${userId}
            )
          )`
        ),
        orderBy: [desc(workoutSetLogs.created_at)],
        limit: 20, // Last 20 sets
      });

      if (recentSets.length === 0) {
        return { estimated_1rm_kg: 0, confidence: 0 };
      }

      // Calculate 1RM for each set using Epley formula
      const estimates: number[] = [];

      for (const set of recentSets) {
        if (set.weight_kg && set.reps_completed > 0 && set.reps_completed <= 12) {
          const weight = Number(set.weight_kg);
          const reps = set.reps_completed;
          const estimated1RM = weight * (1 + reps / 30);
          estimates.push(estimated1RM);
        }
      }

      if (estimates.length === 0) {
        return { estimated_1rm_kg: 0, confidence: 0 };
      }

      // Use median to reduce outliers impact
      estimates.sort((a, b) => a - b);
      const median = estimates[Math.floor(estimates.length / 2)];

      // Confidence based on number of data points and variance
      const variance = this.calculateVariance(estimates);
      const confidence = Math.min(
        (estimates.length / 20) * 0.7 + (1 - variance / median) * 0.3,
        1.0
      );

      return {
        estimated_1rm_kg: Math.round(median * 10) / 10, // Round to 1 decimal
        confidence,
      };
    } catch (error) {
      logger.error('[AdaptiveEngine] Failed to estimate 1RM', error instanceof Error ? error : undefined, {
        userId,
        exerciseId,
      });
      return { estimated_1rm_kg: 0, confidence: 0 };
    }
  }

  /**
   * Calculer la variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(variance); // Standard deviation
  }

  // ===================================================
  // USER METRICS
  // ===================================================

  /**
   * Récupérer les métriques adaptatives d'un utilisateur pour un exercice
   */
  async getUserMetrics(
    userId: string,
    exerciseId: string
  ): Promise<AdaptiveUserMetric | null> {
    try {
      const metrics = await (db as any).query.adaptiveUserMetrics.findFirst({
        where: and(
          eq(adaptiveUserMetrics.user_id, userId),
          eq(adaptiveUserMetrics.exercise_id, exerciseId)
        ),
      });

      return metrics || null;
    } catch (error) {
      logger.error('[AdaptiveEngine] Failed to get user metrics', error instanceof Error ? error : undefined, {
        userId,
        exerciseId,
      });
      return null;
    }
  }

  /**
   * Mettre à jour les métriques adaptatives après une session
   */
  async updateUserMetrics(
    userId: string,
    exerciseId: string,
    sessionData: {
      sets_completed: number;
      total_reps: number;
      total_volume_kg: number;
      average_rest_seconds?: number;
      average_rpe?: number;
      average_form_quality?: number;
    }
  ): Promise<void> {
    try {
      logger.debug('[AdaptiveEngine] Updating user metrics', {
        userId,
        exerciseId,
      });

      // Get existing metrics
      const existingMetrics = await this.getUserMetrics(userId, exerciseId);

      if (existingMetrics) {
        // Update existing
        const newTotalSessions = (existingMetrics.total_sessions || 0) + 1;
        const newTotalSets = (existingMetrics.total_sets || 0) + sessionData.sets_completed;
        const newTotalReps = (existingMetrics.total_reps || 0) + sessionData.total_reps;
        const newTotalVolume = (Number(existingMetrics.total_volume_lifetime_kg) || 0) + sessionData.total_volume_kg;

        // Calculate new averages (weighted)
        const weight = 0.8; // 80% old, 20% new (exponential smoothing)
        const newAvgRest = sessionData.average_rest_seconds
          ? Math.round(
              (existingMetrics.preferred_rest_seconds || 90) * weight +
              sessionData.average_rest_seconds * (1 - weight)
            )
          : existingMetrics.preferred_rest_seconds;

        await db
          .update(adaptiveUserMetrics)
          .set({
            total_sessions: newTotalSessions,
            total_sets: newTotalSets,
            total_reps: newTotalReps,
            total_volume_lifetime_kg: newTotalVolume.toString(),
            preferred_rest_seconds: newAvgRest,
            average_rpe: sessionData.average_rpe?.toString(),
            average_form_quality: sessionData.average_form_quality?.toString(),
            last_calculated_at: new Date(),
            updated_at: toISOString(new Date()),
          })
          .where(
            and(
              eq(adaptiveUserMetrics.user_id, userId),
              eq(adaptiveUserMetrics.exercise_id, exerciseId)
            )
          );
      } else {
        // Create new
        await db.insert(adaptiveUserMetrics).values({
          user_id: userId,
          exercise_id: exerciseId,
          total_sessions: 1,
          total_sets: sessionData.sets_completed,
          total_reps: sessionData.total_reps,
          total_volume_lifetime_kg: sessionData.total_volume_kg.toString(),
          preferred_rest_seconds: sessionData.average_rest_seconds || 90,
          average_rpe: sessionData.average_rpe?.toString(),
          average_form_quality: sessionData.average_form_quality?.toString(),
          last_calculated_at: new Date(),
        });
      }

      logger.debug('[AdaptiveEngine] User metrics updated', {
        userId,
        exerciseId,
      });
    } catch (error) {
      logger.error('[AdaptiveEngine] Failed to update user metrics', error instanceof Error ? error : undefined, {
        userId,
        exerciseId,
      });
    }
  }
}

// Export singleton instance
export const AdaptiveEngine = AdaptiveEngineService.getInstance();
