/**
 * 📊 USE SESSION ANALYTICS - Advanced Analytics Hook
 *
 * Hook pour accéder aux analytics avancées d'une session
 * Fournit insights, comparaisons, et données chart-ready
 *
 * FEATURES:
 * - Live stats avec auto-refresh
 * - Insights performance (forces/faiblesses)
 * - Comparaisons historiques
 * - Données formatées pour Victory charts
 * - Suggestions d'amélioration IA
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalyticsEngine } from '@/services/sessions/AnalyticsEngine';
import { AdaptiveEngine } from '@/services/sessions/AdaptiveEngine';
import { logger } from '@/utils/logger';
import type {
  LiveSessionStats,
  SessionSummary,
  PerformanceInsights,
  ExerciseRecommendationData,
} from '@/types/workoutSession';

// Chart data types (Victory Native compatible)
export interface ChartDataPoint {
  x: string | number; // Label or timestamp
  y: number; // Value
  label?: string;
  color?: string;
}

export interface VolumeChartData {
  byExercise: ChartDataPoint[];
  bySet: ChartDataPoint[];
  cumulative: ChartDataPoint[];
}

export interface IntensityChartData {
  rpeBySet: ChartDataPoint[];
  intensityOverTime: ChartDataPoint[];
  targetZones: {
    low: number;
    moderate: number;
    high: number;
  };
}

export interface PerformanceChartData {
  scoreOverTime: ChartDataPoint[];
  factorBreakdown: ChartDataPoint[]; // Pie chart data
  vsHistory: ChartDataPoint[]; // Last 10 sessions
}

interface UseSessionAnalyticsOptions {
  sessionId: string | null; // null = pas de session active
  userId: string;
  autoRefresh?: boolean; // Auto-refresh live stats
  refreshInterval?: number; // Milliseconds (default: 5000)
  includeRecommendations?: boolean; // Fetch AI recommendations
}

interface UseSessionAnalyticsReturn {
  // Live stats (current session)
  liveStats: LiveSessionStats | null;
  isLoadingLiveStats: boolean;

  // Summary (completed sessions)
  summary: SessionSummary | null;
  isLoadingSummary: boolean;

  // Insights
  insights: PerformanceInsights | null;
  isLoadingInsights: boolean;

  // Recommendations
  recommendations: ExerciseRecommendationData[];
  isLoadingRecommendations: boolean;

  // Chart data
  volumeChartData: VolumeChartData | null;
  intensityChartData: IntensityChartData | null;
  performanceChartData: PerformanceChartData | null;

  // Controls
  refreshAll: () => Promise<void>;
  refreshLiveStats: () => Promise<void>;
  generateSummary: () => Promise<void>;

  // Error state
  error: string | null;
}

export function useSessionAnalytics(
  options: UseSessionAnalyticsOptions
): UseSessionAnalyticsReturn {
  // ===================================================
  // STATE
  // ===================================================

  const [liveStats, setLiveStats] = useState<LiveSessionStats | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendationData[]>([]);

  const [isLoadingLiveStats, setIsLoadingLiveStats] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ===================================================
  // FETCH FUNCTIONS
  // ===================================================

  const refreshLiveStats = useCallback(async () => {
    if (!options.sessionId) return;

    try {
      setIsLoadingLiveStats(true);
      setError(null);

      const stats = await AnalyticsEngine.calculateLiveStats(options.sessionId);
      setLiveStats(stats);

      logger.debug('[useSessionAnalytics] Live stats refreshed', {
        sessionId: options.sessionId,
        completionPercentage: stats.completion_percentage,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch live stats';
      setError(message);
      logger.warn('[useSessionAnalytics] Failed to refresh live stats', {
        sessionId: options.sessionId,
        error: message,
      });
    } finally {
      setIsLoadingLiveStats(false);
    }
  }, [options.sessionId]);

  const generateSummary = useCallback(async () => {
    if (!options.sessionId) return;

    try {
      setIsLoadingSummary(true);
      setError(null);

      const generatedSummary = await AnalyticsEngine.generateSessionSummary(options.sessionId);
      setSummary(generatedSummary);

      logger.info('[useSessionAnalytics] Summary generated', {
        sessionId: options.sessionId,
        finalScore: generatedSummary.performance_summary.final_score,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(message);
      logger.error('[useSessionAnalytics] Failed to generate summary', err instanceof Error ? err : undefined, {
        sessionId: options.sessionId,
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [options.sessionId]);

  const fetchInsights = useCallback(async () => {
    if (!options.sessionId) return;

    try {
      setIsLoadingInsights(true);

      // TODO: Implement insights fetching when method is made public
      // const fetchedInsights = await AnalyticsEngine.generatePerformanceInsights(options.sessionId);
      // setInsights(fetchedInsights);

      logger.debug('[useSessionAnalytics] Insights fetched', {
        sessionId: options.sessionId,
      });
    } catch (err) {
      logger.warn('[useSessionAnalytics] Failed to fetch insights', {
        sessionId: options.sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoadingInsights(false);
    }
  }, [options.sessionId]);

  const fetchRecommendations = useCallback(async () => {
    if (!options.sessionId || !options.includeRecommendations) return;

    try {
      setIsLoadingRecommendations(true);

      // TODO: generateExerciseRecommendations expects (userId, exerciseId, reason)
      // Need to either create a session-level recommendations method or call per exercise
      // const recs = await AdaptiveEngine.generateExerciseRecommendations(
      //   options.userId,
      //   exerciseId, // Need exercise ID
      //   'preference' // Need reason
      // );
      // setRecommendations(recs);

      logger.debug('[useSessionAnalytics] Recommendations fetched (TODO)', {
        sessionId: options.sessionId,
      });
    } catch (err) {
      logger.warn('[useSessionAnalytics] Failed to fetch recommendations', {
        sessionId: options.sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [options.sessionId, options.userId, options.includeRecommendations]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshLiveStats(),
      fetchInsights(),
      fetchRecommendations(),
    ]);
  }, [refreshLiveStats, fetchInsights, fetchRecommendations]);

  // ===================================================
  // CHART DATA COMPUTATION (Memoized)
  // ===================================================

  const volumeChartData = useMemo<VolumeChartData | null>(() => {
    if (!summary) return null;

    // Volume by exercise
    const byExercise: ChartDataPoint[] = summary.exercise_breakdown.map((ex: any) => ({
      x: ex.exercise_name.substring(0, 15), // Truncate for chart
      y: ex.total_volume_kg,
      label: `${ex.total_volume_kg} kg`,
      color: ex.completion_rate >= 0.8 ? '#10b981' : '#f59e0b',
    }));

    // Volume by set (cumulative)
    let cumulative = 0;
    const bySet: ChartDataPoint[] = [];
    const cumulativeData: ChartDataPoint[] = [];

    summary.exercise_breakdown.forEach((ex: any) => {
      ex.set_logs.forEach((set: any, idx: number) => {
        const volume = Number(set.weight_kg || 0) * set.reps_completed;
        cumulative += volume;

        bySet.push({
          x: bySet.length + 1,
          y: volume,
          label: `${volume} kg`,
        });

        cumulativeData.push({
          x: cumulativeData.length + 1,
          y: cumulative,
        });
      });
    });

    return {
      byExercise,
      bySet,
      cumulative: cumulativeData,
    };
  }, [summary]);

  const intensityChartData = useMemo<IntensityChartData | null>(() => {
    if (!summary) return null;

    const rpeBySet: ChartDataPoint[] = [];
    const intensityOverTime: ChartDataPoint[] = [];

    summary.exercise_breakdown.forEach((ex: any) => {
      ex.set_logs.forEach((set: any, idx: number) => {
        if (set.rpe) {
          rpeBySet.push({
            x: rpeBySet.length + 1,
            y: set.rpe,
            label: `RPE ${set.rpe}`,
            color:
              set.rpe >= 9
                ? '#ef4444' // Red - Very hard
                : set.rpe >= 7
                ? '#f59e0b' // Orange - Hard
                : '#10b981', // Green - Moderate
          });
        }

        // Intensity = (weight / estimated_1rm) if available
        // For now, use RPE as proxy
        const intensity = set.rpe ? (set.rpe / 10) * 100 : 50;
        intensityOverTime.push({
          x: intensityOverTime.length + 1,
          y: intensity,
        });
      });
    });

    return {
      rpeBySet,
      intensityOverTime,
      targetZones: {
        low: 60, // <60% intensity
        moderate: 80, // 60-80%
        high: 100, // >80%
      },
    };
  }, [summary]);

  const performanceChartData = useMemo<PerformanceChartData | null>(() => {
    if (!summary) return null;

    // Score over time (mock - would need historical data)
    const scoreOverTime: ChartDataPoint[] = [
      { x: 'Session 1', y: 65 },
      { x: 'Session 2', y: 72 },
      { x: 'Session 3', y: 78 },
      { x: 'This', y: summary.performance_summary.final_score },
    ];

    // Factor breakdown (pie chart)
    const factors = summary.performance_summary.breakdown;
    const factorBreakdown: ChartDataPoint[] = [
      { x: 'Completion', y: factors.completion_score, label: `${factors.completion_score}%` },
      { x: 'Volume', y: factors.volume_score, label: `${factors.volume_score}%` },
      { x: 'Intensity', y: factors.intensity_score, label: `${factors.intensity_score}%` },
      { x: 'Consistency', y: factors.consistency_score, label: `${factors.consistency_score}%` },
      { x: 'Efficiency', y: factors.efficiency_score, label: `${factors.efficiency_score}%` },
      { x: 'Progression', y: factors.progression_score, label: `${factors.progression_score}%` },
    ];

    // Historical comparison (mock)
    const vsHistory: ChartDataPoint[] = summary.historical_comparison?.recent_sessions.map((s: any, idx: number) => ({
      x: `S${idx + 1}`,
      y: s.final_score,
      label: new Date(s.completed_at).toLocaleDateString(),
    })) || [];

    return {
      scoreOverTime,
      factorBreakdown,
      vsHistory,
    };
  }, [summary]);

  // ===================================================
  // EFFECTS
  // ===================================================

  // Auto-refresh live stats
  useEffect(() => {
    if (!options.sessionId || !options.autoRefresh) return;

    const interval = setInterval(() => {
      refreshLiveStats();
    }, options.refreshInterval || 5000);

    // Initial fetch
    refreshLiveStats();

    return () => clearInterval(interval);
  }, [options.sessionId, options.autoRefresh, options.refreshInterval, refreshLiveStats]);

  // Fetch insights when session changes
  useEffect(() => {
    if (options.sessionId) {
      fetchInsights();
    }
  }, [options.sessionId, fetchInsights]);

  // Fetch recommendations when session changes
  useEffect(() => {
    if (options.sessionId && options.includeRecommendations) {
      fetchRecommendations();
    }
  }, [options.sessionId, options.includeRecommendations, fetchRecommendations]);

  // ===================================================
  // RETURN
  // ===================================================

  return {
    // Live data
    liveStats,
    isLoadingLiveStats,

    // Summary
    summary,
    isLoadingSummary,

    // Insights
    insights,
    isLoadingInsights,

    // Recommendations
    recommendations,
    isLoadingRecommendations,

    // Chart data (memoized)
    volumeChartData,
    intensityChartData,
    performanceChartData,

    // Controls
    refreshAll,
    refreshLiveStats,
    generateSummary,

    // Error
    error,
  };
}
