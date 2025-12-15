/**
 * useUserStats Hook - Real-time user statistics
 *
 * INNOVATION FEATURES:
 * - Smart caching (reduce DB queries)
 * - Auto-refresh on mount
 * - Pull-to-refresh support
 * - Optimistic updates
 * - Loading & error states
 * - Background refresh (silently updates cache)
 *
 * USAGE:
 * ```tsx
 * const { stats, loading, error, refresh } = useUserStats();
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Error />;
 *
 * return <Text>{stats.total_workouts} workouts</Text>;
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserStats, getWeeklyActivity } from '@/services/drizzle/stats';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import type { UserStats, WeeklyActivity } from '@/services/drizzle/stats';
import { logger } from '@/utils/logger';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let statsCache: {
  data: UserStats | null;
  timestamp: number;
} | null = null;

let weeklyCache: {
  data: WeeklyActivity[];
  timestamp: number;
} | null = null;

export function useUserStats() {
  const { user } = useClerkAuth();

  // State
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stats (with cache)
  const fetchStats = useCallback(
    async (forceRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check cache first (unless force refresh)
        if (!forceRefresh && statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
          setStats(statsCache.data);
          setLoading(false);
          return;
        }

        // Fetch from DB (service throws on error after Phase 2)
        const data = await getUserStats(user.id);

        if (data) {
          setStats(data);
          setError(null);

          // Update cache
          statsCache = {
            data,
            timestamp: Date.now(),
          };
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        logger.error('[Stats] Failed to fetch user stats', err instanceof Error ? err : undefined, { userId: user?.id });
        setError('Failed to load stats');
        throw err; // Let error propagate for React Query or error boundaries
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Refresh stats (for pull-to-refresh)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats(true); // Force refresh
    setRefreshing(false);
  }, [fetchStats]);

  // Background refresh (silent, updates cache)
  const backgroundRefresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getUserStats(user.id);
      if (data) {
        setStats(data);
        statsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      logger.warn('[Stats] Background refresh failed', { userId: user?.id, error: err instanceof Error ? err.message : String(err) });
      // Silent fail - don't show error to user
    }
  }, [user?.id]);

  // Invalidate cache (call after workout completion)
  const invalidateCache = useCallback(() => {
    statsCache = null;
    fetchStats(true);
  }, [fetchStats]);

  // Fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshing,
    refresh,
    backgroundRefresh,
    invalidateCache,
  };
}

/**
 * useWeeklyActivity Hook - Last 7 days activity data
 */
export function useWeeklyActivity() {
  const { user } = useClerkAuth();

  const [weeklyData, setWeeklyData] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyData = useCallback(
    async (forceRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check cache
        if (!forceRefresh && weeklyCache && Date.now() - weeklyCache.timestamp < CACHE_DURATION) {
          setWeeklyData(weeklyCache.data);
          setLoading(false);
          return;
        }

        // Fetch from DB (service throws on error after Phase 2)
        const data = await getWeeklyActivity(user.id);

        setWeeklyData(data);
        setError(null);

        // Update cache
        weeklyCache = {
          data,
          timestamp: Date.now(),
        };
      } catch (err) {
        logger.error('[Stats] Failed to fetch weekly activity', err instanceof Error ? err : undefined, { userId: user?.id });
        setError('Failed to load weekly data');
        throw err; // Let error propagate for React Query or error boundaries
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Refresh
  const refresh = useCallback(async () => {
    await fetchWeeklyData(true);
  }, [fetchWeeklyData]);

  // Fetch on mount
  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  return {
    weeklyData,
    loading,
    error,
    refresh,
  };
}

/**
 * Clear all stats caches (call on sign out)
 */
export function clearStatsCache() {
  statsCache = null;
  weeklyCache = null;
}
