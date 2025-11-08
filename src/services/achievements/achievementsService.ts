/**
 * Achievements Service
 *
 * Backend logic for achievement system:
 * - Check achievement eligibility based on user stats
 * - Auto-unlock achievements when conditions met
 * - Award XP on unlock
 * - Persist unlock status (AsyncStorage MVP, Supabase production)
 * - Achievement notifications
 *
 * INNOVATION FEATURES:
 * - Real-time progress tracking
 * - Smart unlock detection
 * - XP auto-award integration
 * - Offline-first with AsyncStorage
 * - Background sync ready
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'workout' | 'level' | 'social' | 'special';
  icon: string;
  color: string;
  requirement: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // Unlock condition function
  checkUnlock: (stats: UserStatsForAchievements) => boolean;

  // Progress calculation (0-100)
  calculateProgress?: (stats: UserStatsForAchievements) => number;
}

// User stats needed for achievement checks
export interface UserStatsForAchievements {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalHours: number;
  currentLevel: number;
  totalXP: number;
  morningRitualsCompleted: number;
  friendsInvited: number;
}

// Unlocked achievement record
export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string; // ISO date
  xpAwarded: number;
}

// Storage keys
const STORAGE_KEY_UNLOCKED = '@athletica/unlocked_achievements';
const STORAGE_KEY_SEEN_NOTIFICATIONS = '@athletica/seen_achievement_notifications';

/**
 * All available achievements with unlock conditions
 */
export const ACHIEVEMENTS: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'first-week',
    name: 'First Week Warrior',
    description: 'Complete 7 days streak',
    category: 'streak',
    icon: 'flame',
    color: '#F59E0B',
    requirement: '7 day streak',
    xpReward: 100,
    rarity: 'common',
    checkUnlock: (stats) => stats.currentStreak >= 7,
    calculateProgress: (stats) => Math.min((stats.currentStreak / 7) * 100, 100),
  },
  {
    id: 'monthly-warrior',
    name: 'Monthly Warrior',
    description: 'Complete 30 days streak',
    category: 'streak',
    icon: 'calendar',
    color: '#8B5CF6',
    requirement: '30 day streak',
    xpReward: 500,
    rarity: 'rare',
    checkUnlock: (stats) => stats.currentStreak >= 30,
    calculateProgress: (stats) => Math.min((stats.currentStreak / 30) * 100, 100),
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 days streak',
    category: 'streak',
    icon: 'trophy',
    color: '#F59E0B',
    requirement: '100 day streak',
    xpReward: 2000,
    rarity: 'epic',
    checkUnlock: (stats) => stats.currentStreak >= 100,
    calculateProgress: (stats) => Math.min((stats.currentStreak / 100) * 100, 100),
  },
  {
    id: 'hall-of-fame',
    name: 'Hall of Fame',
    description: 'Complete 365 days streak',
    category: 'streak',
    icon: 'star',
    color: '#10B981',
    requirement: '365 day streak',
    xpReward: 10000,
    rarity: 'legendary',
    checkUnlock: (stats) => stats.currentStreak >= 365,
    calculateProgress: (stats) => Math.min((stats.currentStreak / 365) * 100, 100),
  },

  // WORKOUT ACHIEVEMENTS
  {
    id: 'first-workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: 'workout',
    icon: 'barbell',
    color: '#3B82F6',
    requirement: '1 workout',
    xpReward: 50,
    rarity: 'common',
    checkUnlock: (stats) => stats.totalWorkouts >= 1,
  },
  {
    id: 'workout-rookie',
    name: 'Workout Rookie',
    description: 'Complete 10 workouts',
    category: 'workout',
    icon: 'fitness',
    color: '#3B82F6',
    requirement: '10 workouts',
    xpReward: 200,
    rarity: 'common',
    checkUnlock: (stats) => stats.totalWorkouts >= 10,
    calculateProgress: (stats) => Math.min((stats.totalWorkouts / 10) * 100, 100),
  },
  {
    id: 'workout-veteran',
    name: 'Workout Veteran',
    description: 'Complete 50 workouts',
    category: 'workout',
    icon: 'medal',
    color: '#8B5CF6',
    requirement: '50 workouts',
    xpReward: 800,
    rarity: 'rare',
    checkUnlock: (stats) => stats.totalWorkouts >= 50,
    calculateProgress: (stats) => Math.min((stats.totalWorkouts / 50) * 100, 100),
  },
  {
    id: 'centurion-workouts',
    name: 'Workout Centurion',
    description: 'Complete 100 workouts',
    category: 'workout',
    icon: 'trophy',
    color: '#F59E0B',
    requirement: '100 workouts',
    xpReward: 2000,
    rarity: 'epic',
    checkUnlock: (stats) => stats.totalWorkouts >= 100,
    calculateProgress: (stats) => Math.min((stats.totalWorkouts / 100) * 100, 100),
  },

  // LEVEL ACHIEVEMENTS
  {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach level 5',
    category: 'level',
    icon: 'star-half',
    color: '#F59E0B',
    requirement: 'Level 5',
    xpReward: 250,
    rarity: 'common',
    checkUnlock: (stats) => stats.currentLevel >= 5,
  },
  {
    id: 'level-10',
    name: 'Elite Warrior',
    description: 'Reach level 10',
    category: 'level',
    icon: 'star',
    color: '#8B5CF6',
    requirement: 'Level 10',
    xpReward: 1000,
    rarity: 'rare',
    checkUnlock: (stats) => stats.currentLevel >= 10,
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: '5am-club',
    name: '5:00 AM Club',
    description: 'Complete 30 morning rituals',
    category: 'special',
    icon: 'sunny',
    color: '#F59E0B',
    requirement: '30 morning rituals',
    xpReward: 500,
    rarity: 'rare',
    checkUnlock: (stats) => stats.morningRitualsCompleted >= 30,
    calculateProgress: (stats) => Math.min((stats.morningRitualsCompleted / 30) * 100, 100),
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Invite 5 friends',
    category: 'social',
    icon: 'people',
    color: '#EC4899',
    requirement: '5 friends invited',
    xpReward: 300,
    rarity: 'rare',
    checkUnlock: (stats) => stats.friendsInvited >= 5,
    calculateProgress: (stats) => Math.min((stats.friendsInvited / 5) * 100, 100),
  },
  {
    id: 'warrior-mentor',
    name: 'Warrior Mentor',
    description: 'Invite 10 friends',
    category: 'social',
    icon: 'school',
    color: '#8B5CF6',
    requirement: '10 friends invited',
    xpReward: 1000,
    rarity: 'epic',
    checkUnlock: (stats) => stats.friendsInvited >= 10,
    calculateProgress: (stats) => Math.min((stats.friendsInvited / 10) * 100, 100),
  },
];

/**
 * Get all unlocked achievements from AsyncStorage
 */
export const getUnlockedAchievements = async (): Promise<UnlockedAchievement[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_UNLOCKED);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('Error getting unlocked achievements:', error);
    return [];
  }
};

/**
 * Save unlocked achievements to AsyncStorage
 */
const saveUnlockedAchievements = async (unlocked: UnlockedAchievement[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlocked));
  } catch (error) {
    console.error('Error saving unlocked achievements:', error);
  }
};

/**
 * Check if achievement is unlocked
 */
export const isAchievementUnlocked = async (achievementId: string): Promise<boolean> => {
  const unlocked = await getUnlockedAchievements();
  return unlocked.some((a) => a.achievementId === achievementId);
};

/**
 * Unlock achievement and award XP
 * Returns true if newly unlocked, false if already unlocked
 */
export const unlockAchievement = async (
  achievementId: string
): Promise<{ success: boolean; newlyUnlocked: boolean; xpAwarded: number }> => {
  try {
    // Check if already unlocked
    if (await isAchievementUnlocked(achievementId)) {
      return { success: false, newlyUnlocked: false, xpAwarded: 0 };
    }

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) {
      console.error(`Achievement ${achievementId} not found`);
      return { success: false, newlyUnlocked: false, xpAwarded: 0 };
    }

    // Create unlock record
    const unlockRecord: UnlockedAchievement = {
      achievementId,
      unlockedAt: new Date().toISOString(),
      xpAwarded: achievement.xpReward,
    };

    // Save to storage
    const unlocked = await getUnlockedAchievements();
    unlocked.push(unlockRecord);
    await saveUnlockedAchievements(unlocked);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
    }

    // TODO: Award XP to user profile in Supabase
    // TODO: Trigger confetti animation
    // TODO: Show achievement notification modal

    console.log(`🎉 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);

    return { success: true, newlyUnlocked: true, xpAwarded: achievement.xpReward };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, newlyUnlocked: false, xpAwarded: 0 };
  }
};

/**
 * Check all achievements against current user stats
 * Auto-unlock eligible achievements
 * Returns list of newly unlocked achievements
 */
export const checkAndUnlockAchievements = async (
  stats: UserStatsForAchievements
): Promise<UnlockedAchievement[]> => {
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (await isAchievementUnlocked(achievement.id)) {
      continue;
    }

    // Check if eligible
    if (achievement.checkUnlock(stats)) {
      const result = await unlockAchievement(achievement.id);
      if (result.newlyUnlocked) {
        newlyUnlocked.push({
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
          xpAwarded: result.xpAwarded,
        });
      }
    }
  }

  return newlyUnlocked;
};

/**
 * Get achievement progress for all achievements
 */
export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  progress: number; // 0-100
  unlockedAt?: string;
}

export const getAchievementsWithProgress = async (
  stats: UserStatsForAchievements
): Promise<AchievementWithProgress[]> => {
  const unlocked = await getUnlockedAchievements();
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

  return ACHIEVEMENTS.map((achievement) => {
    const unlockedRecord = unlockedMap.get(achievement.id);
    const isUnlocked = !!unlockedRecord;

    let progress = 0;
    if (!isUnlocked && achievement.calculateProgress) {
      progress = achievement.calculateProgress(stats);
    } else if (isUnlocked) {
      progress = 100;
    }

    return {
      ...achievement,
      unlocked: isUnlocked,
      progress,
      unlockedAt: unlockedRecord?.unlockedAt,
    };
  });
};

/**
 * Get count of unlocked achievements
 */
export const getUnlockedCount = async (): Promise<number> => {
  const unlocked = await getUnlockedAchievements();
  return unlocked.length;
};

/**
 * Clear all achievements (for testing/reset)
 */
export const clearAllAchievements = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY_UNLOCKED);
  await AsyncStorage.removeItem(STORAGE_KEY_SEEN_NOTIFICATIONS);
};
