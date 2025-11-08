/**
 * Daily Limits Storage Service
 *
 * Tracks free user limits (AI generations, etc.) with daily reset
 *
 * INNOVATION:
 * - Auto-reset at midnight
 * - Multiple limit types support
 * - Type-safe with TypeScript
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AI_GENERATIONS: '@athletica/daily_ai_generations',
} as const;

interface DailyLimitData {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // "2025-10-24"
}

/**
 * Get current count for a limit type
 * Returns 0 if it's a new day or no data exists
 */
export async function getDailyCount(key: keyof typeof STORAGE_KEYS): Promise<number> {
  try {
    const storageKey = STORAGE_KEYS[key];
    const jsonValue = await AsyncStorage.getItem(storageKey);

    if (!jsonValue) {
      return 0; // No data yet
    }

    const data: DailyLimitData = JSON.parse(jsonValue);
    const today = getTodayString();

    // Check if it's the same day
    if (data.date === today) {
      return data.count;
    } else {
      // New day! Reset count
      await resetDailyCount(key);
      return 0;
    }
  } catch (error) {
    console.error('Error getting daily count:', error);
    return 0; // Return 0 on error (safe fallback)
  }
}

/**
 * Increment count for a limit type
 * Auto-resets if it's a new day
 */
export async function incrementDailyCount(key: keyof typeof STORAGE_KEYS): Promise<number> {
  try {
    const currentCount = await getDailyCount(key); // Auto-resets if new day
    const newCount = currentCount + 1;

    const data: DailyLimitData = {
      date: getTodayString(),
      count: newCount,
    };

    const storageKey = STORAGE_KEYS[key];
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));

    return newCount;
  } catch (error) {
    console.error('Error incrementing daily count:', error);
    return 0;
  }
}

/**
 * Reset count for a limit type
 */
export async function resetDailyCount(key: keyof typeof STORAGE_KEYS): Promise<void> {
  try {
    const storageKey = STORAGE_KEYS[key];
    const data: DailyLimitData = {
      date: getTodayString(),
      count: 0,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error resetting daily count:', error);
  }
}

/**
 * Check if user has reached limit
 */
export async function hasReachedLimit(
  key: keyof typeof STORAGE_KEYS,
  limit: number
): Promise<boolean> {
  const count = await getDailyCount(key);
  return count >= limit;
}

/**
 * Get remaining count before hitting limit
 */
export async function getRemainingCount(
  key: keyof typeof STORAGE_KEYS,
  limit: number
): Promise<number> {
  const count = await getDailyCount(key);
  return Math.max(0, limit - count);
}

/**
 * INNOVATION: Get all daily stats (for analytics/debugging)
 */
export async function getAllDailyStats(): Promise<Record<string, DailyLimitData>> {
  const stats: Record<string, DailyLimitData> = {};

  try {
    for (const [name, storageKey] of Object.entries(STORAGE_KEYS)) {
      const jsonValue = await AsyncStorage.getItem(storageKey);
      if (jsonValue) {
        stats[name] = JSON.parse(jsonValue);
      }
    }
  } catch (error) {
    console.error('Error getting all daily stats:', error);
  }

  return stats;
}

/**
 * Clear all daily limits (use for testing)
 */
export async function clearAllDailyLimits(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('✅ All daily limits cleared');
  } catch (error) {
    console.error('Error clearing daily limits:', error);
  }
}
