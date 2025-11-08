/**
 * 🏆 DRIZZLE ACHIEVEMENTS SERVICE
 *
 * CRUD operations pour le système d'achievements
 * Sauvegarde, récupération, statistiques
 *
 * Features:
 * - Unlock achievements (évite duplicates)
 * - Get user achievements (avec filtres)
 * - Get achievement stats (total points, rarity distribution)
 * - Check if achievement already unlocked
 */

import { db, userAchievements, profiles } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import type { Achievement } from '@/services/achievements/AchievementEngine';
import { logger } from '@/utils/logger';

// =====================================================
// INTERFACES
// =====================================================

export interface UnlockedAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  type: 'performance' | 'milestone' | 'streak' | 'volume' | 'speed' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  title: string;
  description: string;
  icon: string;
  points: number;
  session_id: string | null;
  workout_id: string | null;
  unlocked_at: string;
}

export interface AchievementStats {
  total_achievements: number;
  total_points: number;
  rarity_distribution: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  type_distribution: {
    performance: number;
    milestone: number;
    streak: number;
    volume: number;
    speed: number;
    special: number;
  };
  recent_achievements: UnlockedAchievement[];
}

// =====================================================
// UNLOCK ACHIEVEMENT
// =====================================================

/**
 * Unlock an achievement for a user
 * Prevents duplicates
 */
export async function unlockAchievement(
  userId: string,
  achievement: Achievement,
  sessionId?: string,
  workoutId?: string
): Promise<UnlockedAchievement | null> {
  try {
    // Check if already unlocked
    const existing = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.user_id, userId),
          eq(userAchievements.achievement_id, achievement.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      logger.debug('[Achievements] Already unlocked', { userId, achievementId: achievement.id });
      return null; // Already unlocked
    }

    // Insert new achievement
    const [inserted] = await db
      .insert(userAchievements)
      .values({
        user_id: userId,
        achievement_id: achievement.id,
        type: achievement.type,
        rarity: achievement.rarity,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        session_id: sessionId || null,
        workout_id: workoutId || null,
      })
      .returning();

    logger.info('[Achievements] Unlocked!', {
      userId,
      achievementId: achievement.id,
      title: achievement.title,
      points: achievement.points
    });

    return {
      ...inserted,
      unlocked_at: inserted.unlocked_at.toISOString(),
    };
  } catch (error) {
    logger.error('[Achievements] Failed to unlock', error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Unlock multiple achievements at once
 */
export async function unlockAchievements(
  userId: string,
  achievements: Achievement[],
  sessionId?: string,
  workoutId?: string
): Promise<UnlockedAchievement[]> {
  const unlocked: UnlockedAchievement[] = [];

  for (const achievement of achievements) {
    const result = await unlockAchievement(userId, achievement, sessionId, workoutId);
    if (result) {
      unlocked.push(result);
    }
  }

  logger.info('[Achievements] Batch unlock complete', {
    userId,
    total: achievements.length,
    new: unlocked.length
  });

  return unlocked;
}

// =====================================================
// GET USER ACHIEVEMENTS
// =====================================================

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(
  userId: string,
  filters?: {
    type?: UnlockedAchievement['type'];
    rarity?: UnlockedAchievement['rarity'];
    limit?: number;
  }
): Promise<UnlockedAchievement[]> {
  try {
    let query = db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.user_id, userId))
      .orderBy(desc(userAchievements.unlocked_at));

    // Apply filters
    if (filters?.type) {
      query = query.where(
        and(
          eq(userAchievements.user_id, userId),
          eq(userAchievements.type, filters.type)
        )
      );
    }

    if (filters?.rarity) {
      query = query.where(
        and(
          eq(userAchievements.user_id, userId),
          eq(userAchievements.rarity, filters.rarity)
        )
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const results = await query;

    return results.map((r: typeof results[0]) => ({
      ...r,
      unlocked_at: r.unlocked_at.toISOString(),
    }));
  } catch (error) {
    logger.error('[Achievements] Failed to fetch', error instanceof Error ? error : undefined);
    return [];
  }
}

/**
 * Get achievement statistics for a user
 */
export async function getAchievementStats(userId: string): Promise<AchievementStats> {
  try {
    const achievements = await getUserAchievements(userId);

    // Calculate stats
    const stats: AchievementStats = {
      total_achievements: achievements.length,
      total_points: achievements.reduce((sum: number, a: UnlockedAchievement) => sum + a.points, 0),
      rarity_distribution: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      },
      type_distribution: {
        performance: 0,
        milestone: 0,
        streak: 0,
        volume: 0,
        speed: 0,
        special: 0,
      },
      recent_achievements: achievements.slice(0, 5), // Last 5
    };

    // Count by rarity
    achievements.forEach((a: UnlockedAchievement) => {
      stats.rarity_distribution[a.rarity]++;
      stats.type_distribution[a.type]++;
    });

    return stats;
  } catch (error) {
    logger.error('[Achievements] Failed to get stats', error instanceof Error ? error : undefined);
    return {
      total_achievements: 0,
      total_points: 0,
      rarity_distribution: { common: 0, rare: 0, epic: 0, legendary: 0 },
      type_distribution: { performance: 0, milestone: 0, streak: 0, volume: 0, speed: 0, special: 0 },
      recent_achievements: [],
    };
  }
}

/**
 * Check if user has unlocked a specific achievement
 */
export async function hasAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.user_id, userId),
          eq(userAchievements.achievement_id, achievementId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    logger.error('[Achievements] Failed to check', error instanceof Error ? error : undefined);
    return false;
  }
}
