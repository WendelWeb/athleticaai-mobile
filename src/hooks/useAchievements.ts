/**
 * useAchievements Hook
 *
 * React hook for achievement system integration:
 * - Load achievements with progress
 * - Auto-check and unlock on mount
 * - Real-time progress updates
 * - Achievement notifications
 *
 * USAGE:
 * ```tsx
 * const { achievements, loading, unlockedCount, refresh } = useAchievements();
 *
 * if (loading) return <Skeleton />;
 *
 * return achievements.map((achievement) => (
 *   <AchievementCard
 *     key={achievement.id}
 *     achievement={achievement}
 *     progress={achievement.progress}
 *     unlocked={achievement.unlocked}
 *   />
 * ));
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAchievementsWithProgress,
  checkAndUnlockAchievements,
  getUnlockedCount,
  ACHIEVEMENTS,
  type AchievementWithProgress,
  type UserStatsForAchievements,
  type UnlockedAchievement,
} from '@services/achievements';
import { useUserStats } from './useUserStats';

export interface UseAchievementsReturn {
  achievements: AchievementWithProgress[];
  loading: boolean;
  error: string | null;
  unlockedCount: number;
  totalCount: number;
  refresh: () => Promise<void>;
  checkForNewUnlocks: () => Promise<UnlockedAchievement[]>;
}

export const useAchievements = (): UseAchievementsReturn => {
  const { stats: userStats, loading: statsLoading } = useUserStats();

  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(0);

  // Load achievements with progress
  const loadAchievements = useCallback(async () => {
    if (!userStats || statsLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Map userStats to achievement stats format
      const achievementStats: UserStatsForAchievements = {
        currentStreak: userStats.current_streak || 0,
        longestStreak: userStats.best_streak || 0,
        totalWorkouts: userStats.total_workouts || 0,
        totalHours: userStats.total_hours || 0,
        currentLevel: userStats.current_level || 1,
        totalXP: userStats.total_xp || 0,
        morningRitualsCompleted: 0, // TODO: Track morning rituals in user stats
        friendsInvited: 0, // TODO: Track friends invited
      };

      // Get achievements with progress
      const achievementsWithProgress = await getAchievementsWithProgress(achievementStats);
      setAchievements(achievementsWithProgress);

      // Get unlocked count
      const count = await getUnlockedCount();
      setUnlockedCount(count);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [userStats, statsLoading]);

  // Check for new unlocks
  const checkForNewUnlocks = useCallback(async (): Promise<UnlockedAchievement[]> => {
    if (!userStats) {
      return [];
    }

    try {
      const achievementStats: UserStatsForAchievements = {
        currentStreak: userStats.current_streak || 0,
        longestStreak: userStats.best_streak || 0,
        totalWorkouts: userStats.total_workouts || 0,
        totalHours: userStats.total_hours || 0,
        currentLevel: userStats.current_level || 1,
        totalXP: userStats.total_xp || 0,
        morningRitualsCompleted: 0,
        friendsInvited: 0,
      };

      const newlyUnlocked = await checkAndUnlockAchievements(achievementStats);

      if (newlyUnlocked.length > 0) {
        // Reload achievements to get updated state
        await loadAchievements();
      }

      return newlyUnlocked;
    } catch (err) {
      console.error('Error checking for new unlocks:', err);
      return [];
    }
  }, [userStats, loadAchievements]);

  // Refresh achievements
  const refresh = useCallback(async () => {
    await loadAchievements();
  }, [loadAchievements]);

  // Load on mount and when userStats change
  useEffect(() => {
    if (userStats && !statsLoading) {
      loadAchievements();

      // Auto-check for new unlocks
      checkForNewUnlocks();
    }
  }, [userStats, statsLoading]);

  return {
    achievements,
    loading,
    error,
    unlockedCount,
    totalCount: ACHIEVEMENTS.length,
    refresh,
    checkForNewUnlocks,
  };
};

/**
 * useAchievementAutoUnlock Hook
 *
 * Automatically checks for new achievement unlocks when stats change.
 * Use this hook in root-level components (e.g., Layout, App) to enable
 * automatic achievement unlocking throughout the app.
 *
 * USAGE:
 * ```tsx
 * // In _layout.tsx or App.tsx
 * useAchievementAutoUnlock();
 * ```
 */
export const useAchievementAutoUnlock = () => {
  const { checkForNewUnlocks } = useAchievements();
  const { stats } = useUserStats();

  useEffect(() => {
    if (stats) {
      // Check for new unlocks whenever stats change
      checkForNewUnlocks();
    }
  }, [stats?.current_streak, stats?.total_workouts, stats?.current_level]);
};
