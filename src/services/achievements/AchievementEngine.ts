/**
 * 🏆 ACHIEVEMENT ENGINE - Real-time Workout Achievements
 *
 * INNOVATION:
 * - Détecte accomplissements en temps réel pendant le workout
 * - Affiche badges animés (Apple Fitness+ style)
 * - Sauvegarde historique dans database
 * - Gamification pour motivation
 *
 * Types d'achievements:
 * - Performance (Perfect Form, Beast Mode, Consistent)
 * - Milestones (First Workout, 10th Workout, 100 Workouts)
 * - Streaks (7 Day Streak, 30 Day Streak)
 * - Volume (1000kg lifted, 10000 reps)
 * - Speed (Fastest Workout, Under 30min)
 */

export interface Achievement {
  id: string;
  type: 'performance' | 'milestone' | 'streak' | 'volume' | 'speed' | 'special';
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked_at?: string;
}

export interface AchievementTrigger {
  achievement: Achievement;
  message: string;
  animation: 'slide' | 'pop' | 'confetti';
}

// =====================================================
// ACHIEVEMENT DEFINITIONS
// =====================================================

const ACHIEVEMENTS: Record<string, Achievement> = {
  // Performance Achievements
  perfect_form: {
    id: 'perfect_form',
    type: 'performance',
    title: 'Perfect Form',
    description: 'Completed all sets with excellent form (RPE ≤ 7)',
    icon: '💎',
    rarity: 'rare',
    points: 50,
  },
  beast_mode: {
    id: 'beast_mode',
    type: 'performance',
    title: 'Beast Mode',
    description: 'All sets at RPE 9+',
    icon: '🔥',
    rarity: 'epic',
    points: 100,
  },
  consistent: {
    id: 'consistent',
    type: 'performance',
    title: 'Consistency King',
    description: 'Completed all sets without skipping rest',
    icon: '👑',
    rarity: 'rare',
    points: 75,
  },
  speed_demon: {
    id: 'speed_demon',
    type: 'speed',
    title: 'Speed Demon',
    description: 'Finished workout 20% faster than estimated',
    icon: '⚡',
    rarity: 'epic',
    points: 100,
  },

  // Milestone Achievements
  first_workout: {
    id: 'first_workout',
    type: 'milestone',
    title: 'First Steps',
    description: 'Completed your first workout!',
    icon: '🎯',
    rarity: 'common',
    points: 25,
  },
  tenth_workout: {
    id: 'tenth_workout',
    type: 'milestone',
    title: 'Double Digits',
    description: 'Completed 10 workouts',
    icon: '🔟',
    rarity: 'rare',
    points: 100,
  },
  hundredth_workout: {
    id: 'hundredth_workout',
    type: 'milestone',
    title: 'Century Club',
    description: 'Completed 100 workouts!',
    icon: '💯',
    rarity: 'legendary',
    points: 500,
  },

  // Streak Achievements
  week_streak: {
    id: 'week_streak',
    type: 'streak',
    title: '7 Day Warrior',
    description: 'Worked out 7 days in a row',
    icon: '📅',
    rarity: 'rare',
    points: 150,
  },
  month_streak: {
    id: 'month_streak',
    type: 'streak',
    title: 'Monthly Grind',
    description: '30 day workout streak!',
    icon: '🔥',
    rarity: 'epic',
    points: 300,
  },

  // Volume Achievements
  ton_lifted: {
    id: 'ton_lifted',
    type: 'volume',
    title: 'Ton Moved',
    description: 'Lifted 1000kg total volume',
    icon: '🏋️',
    rarity: 'rare',
    points: 100,
  },
  ten_thousand_reps: {
    id: 'ten_thousand_reps',
    type: 'volume',
    title: '10K Club',
    description: 'Completed 10,000 reps lifetime',
    icon: '💪',
    rarity: 'epic',
    points: 200,
  },

  // Special Achievements
  early_bird: {
    id: 'early_bird',
    type: 'special',
    title: 'Early Bird',
    description: 'Workout completed before 6 AM',
    icon: '🌅',
    rarity: 'rare',
    points: 75,
  },
  night_owl: {
    id: 'night_owl',
    type: 'special',
    title: 'Night Owl',
    description: 'Workout completed after 10 PM',
    icon: '🦉',
    rarity: 'rare',
    points: 75,
  },
  no_rest_needed: {
    id: 'no_rest_needed',
    type: 'performance',
    title: 'No Rest Needed',
    description: 'Skipped all rest periods',
    icon: '⚡',
    rarity: 'epic',
    points: 150,
  },
};

// =====================================================
// ACHIEVEMENT ENGINE
// =====================================================

export class AchievementEngine {
  /**
   * Check performance-based achievements during workout
   */
  static checkPerformanceAchievements(data: {
    sets_completed: number;
    sets_skipped: number;
    average_rpe: number;
    rest_periods_skipped: number;
    all_sets_good_form: boolean;
  }): Achievement[] {
    const unlocked: Achievement[] = [];

    // Perfect Form (all sets with good form, RPE ≤ 7)
    if (data.all_sets_good_form && data.average_rpe <= 7) {
      unlocked.push(ACHIEVEMENTS.perfect_form);
    }

    // Beast Mode (all sets RPE 9+)
    if (data.average_rpe >= 9) {
      unlocked.push(ACHIEVEMENTS.beast_mode);
    }

    // Consistency King (no skipped sets)
    if (data.sets_skipped === 0 && data.sets_completed > 0) {
      unlocked.push(ACHIEVEMENTS.consistent);
    }

    // No Rest Needed (skipped all rest periods)
    if (data.rest_periods_skipped > 0 && data.sets_completed > 0) {
      unlocked.push(ACHIEVEMENTS.no_rest_needed);
    }

    return unlocked;
  }

  /**
   * Check speed achievements
   */
  static checkSpeedAchievements(data: {
    duration_seconds: number;
    estimated_duration_seconds: number;
  }): Achievement[] {
    const unlocked: Achievement[] = [];
    const timeSaved = data.estimated_duration_seconds - data.duration_seconds;
    const percentFaster = (timeSaved / data.estimated_duration_seconds) * 100;

    // Speed Demon (20% faster)
    if (percentFaster >= 20) {
      unlocked.push(ACHIEVEMENTS.speed_demon);
    }

    return unlocked;
  }

  /**
   * Check milestone achievements
   */
  static checkMilestoneAchievements(data: {
    total_workouts_completed: number;
  }): Achievement[] {
    const unlocked: Achievement[] = [];
    const count = data.total_workouts_completed;

    if (count === 1) {
      unlocked.push(ACHIEVEMENTS.first_workout);
    } else if (count === 10) {
      unlocked.push(ACHIEVEMENTS.tenth_workout);
    } else if (count === 100) {
      unlocked.push(ACHIEVEMENTS.hundredth_workout);
    }

    return unlocked;
  }

  /**
   * Check streak achievements
   */
  static checkStreakAchievements(data: {
    current_streak_days: number;
  }): Achievement[] {
    const unlocked: Achievement[] = [];

    if (data.current_streak_days === 7) {
      unlocked.push(ACHIEVEMENTS.week_streak);
    } else if (data.current_streak_days === 30) {
      unlocked.push(ACHIEVEMENTS.month_streak);
    }

    return unlocked;
  }

  /**
   * Check volume achievements
   */
  static checkVolumeAchievements(data: {
    total_volume_kg: number;
    total_reps_lifetime: number;
  }): Achievement[] {
    const unlocked: Achievement[] = [];

    if (data.total_volume_kg >= 1000) {
      unlocked.push(ACHIEVEMENTS.ton_lifted);
    }

    if (data.total_reps_lifetime >= 10000) {
      unlocked.push(ACHIEVEMENTS.ten_thousand_reps);
    }

    return unlocked;
  }

  /**
   * Check special time-based achievements
   */
  static checkSpecialAchievements(data: {
    workout_start_time: Date;
  }): Achievement[] {
    const unlocked: Achievement[] = [];
    const hour = data.workout_start_time.getHours();

    // Early Bird (before 6 AM)
    if (hour < 6) {
      unlocked.push(ACHIEVEMENTS.early_bird);
    }

    // Night Owl (after 10 PM)
    if (hour >= 22) {
      unlocked.push(ACHIEVEMENTS.night_owl);
    }

    return unlocked;
  }

  /**
   * Master function: check ALL achievements for a completed workout
   */
  static async checkAllAchievements(sessionData: {
    sets_completed: number;
    sets_skipped: number;
    average_rpe: number;
    rest_periods_skipped: number;
    all_sets_good_form: boolean;
    duration_seconds: number;
    estimated_duration_seconds: number;
    total_workouts_completed: number;
    current_streak_days: number;
    total_volume_kg: number;
    total_reps_lifetime: number;
    workout_start_time: Date;
  }): Promise<Achievement[]> {
    const allUnlocked: Achievement[] = [];

    // Check each category
    allUnlocked.push(...this.checkPerformanceAchievements(sessionData));
    allUnlocked.push(...this.checkSpeedAchievements(sessionData));
    allUnlocked.push(...this.checkMilestoneAchievements(sessionData));
    allUnlocked.push(...this.checkStreakAchievements(sessionData));
    allUnlocked.push(...this.checkVolumeAchievements(sessionData));
    allUnlocked.push(...this.checkSpecialAchievements(sessionData));

    // Add timestamp
    const now = new Date().toISOString();
    allUnlocked.forEach(achievement => {
      achievement.unlocked_at = now;
    });

    return allUnlocked;
  }

  /**
   * Get rarity color
   */
  static getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return '#9CA3AF'; // Gray
      case 'rare': return '#3B82F6'; // Blue
      case 'epic': return '#A855F7'; // Purple
      case 'legendary': return '#F59E0B'; // Gold
      default: return '#9CA3AF';
    }
  }

  /**
   * Get total points for achievements
   */
  static calculateTotalPoints(achievements: Achievement[]): number {
    return achievements.reduce((sum, ach) => sum + ach.points, 0);
  }
}
