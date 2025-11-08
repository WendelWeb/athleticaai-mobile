/**
 * LevelBadge Component - Display user's level with XP progress
 *
 * 8 Levels System (from ULTIMATE_FEATURES.md):
 * 1. 🌱 Newbie (0-100 XP) - Gray
 * 2. 🔰 Apprentice (101-500 XP) - Green
 * 3. ⚔️ Warrior (501-1500 XP) - Blue
 * 4. 🏆 Champion (1501-3000 XP) - Purple
 * 5. 👑 Master (3001-5000 XP) - Gold
 * 6. ⭐ Legend (5001-10000 XP) - Bright Gold
 * 7. 💎 Icon (10001-20000 XP) - Diamond
 * 8. 🔥 Hall of Fame (20001+ XP) - Rainbow animated
 *
 * Features:
 * - Visual level indicator with icon
 * - XP progress bar
 * - Color-coded by tier
 * - Animated based on level
 * - Compact and large variants
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';

// Level configuration
interface LevelConfig {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  minXP: number;
  maxXP: number;
  color: string;
  gradientColors: readonly [string, string, ...string[]];
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Newbie',
    icon: 'leaf',
    minXP: 0,
    maxXP: 100,
    color: '#9CA3AF', // Gray
    gradientColors: ['#9CA3AF', '#6B7280'],
  },
  {
    id: 2,
    name: 'Apprentice',
    icon: 'shield',
    minXP: 101,
    maxXP: 500,
    color: '#10B981', // Green
    gradientColors: ['#10B981', '#059669'],
  },
  {
    id: 3,
    name: 'Warrior',
    icon: 'fitness',
    minXP: 501,
    maxXP: 1500,
    color: '#3B82F6', // Blue
    gradientColors: ['#3B82F6', '#2563EB'],
  },
  {
    id: 4,
    name: 'Champion',
    icon: 'trophy',
    minXP: 1501,
    maxXP: 3000,
    color: '#8B5CF6', // Purple
    gradientColors: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 5,
    name: 'Master',
    icon: 'ribbon',
    minXP: 3001,
    maxXP: 5000,
    color: '#F59E0B', // Gold
    gradientColors: ['#F59E0B', '#D97706'],
  },
  {
    id: 6,
    name: 'Legend',
    icon: 'star',
    minXP: 5001,
    maxXP: 10000,
    color: '#FBBF24', // Bright Gold
    gradientColors: ['#FBBF24', '#F59E0B'],
  },
  {
    id: 7,
    name: 'Icon',
    icon: 'diamond',
    minXP: 10001,
    maxXP: 20000,
    color: '#06B6D4', // Diamond (Cyan)
    gradientColors: ['#06B6D4', '#0891B2'],
  },
  {
    id: 8,
    name: 'Hall of Fame',
    icon: 'flame',
    minXP: 20001,
    maxXP: 999999,
    color: '#EF4444', // Rainbow (using red as base)
    gradientColors: ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#3B82F6', '#8B5CF6'],
  },
];

export interface LevelBadgeProps {
  /** Current level (1-8) */
  level: number;

  /** Current XP */
  currentXP: number;

  /** XP needed for next level (optional, will be calculated) */
  nextLevelXP?: number;

  /** Size variant */
  size?: 'compact' | 'large';

  /** Show XP numbers */
  showXP?: boolean;

  /** Custom style */
  style?: ViewStyle;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  currentXP,
  nextLevelXP,
  size = 'large',
  showXP = true,
  style,
}) => {
  const theme = useStyledTheme();

  // Get level config (cap at 8)
  const normalizedLevel = Math.min(Math.max(level, 1), 8);
  const levelConfig = LEVELS[normalizedLevel - 1];

  // Calculate progress
  const xpInCurrentLevel = currentXP - levelConfig.minXP;
  const xpNeededForLevel = levelConfig.maxXP - levelConfig.minXP;
  const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

  // Next level XP (if not provided, use config)
  const targetXP = nextLevelXP || levelConfig.maxXP;

  const isCompact = size === 'compact';

  return (
    <View style={[styles.container, style]}>
      {/* Level Badge with Gradient */}
      <LinearGradient
        colors={levelConfig.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          isCompact ? styles.badgeCompact : styles.badgeLarge,
        ]}
      >
        <Ionicons
          name={levelConfig.icon}
          size={isCompact ? 20 : 28}
          color="#FFFFFF"
        />
        {!isCompact && (
          <Text style={styles.levelNumber}>{normalizedLevel}</Text>
        )}
      </LinearGradient>

      {/* Level Info */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text
            style={[
              styles.levelName,
              isCompact && styles.levelNameCompact,
              { color: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary },
            ]}
          >
            {levelConfig.name}
          </Text>
          {showXP && (
            <Text
              style={[
                styles.xpText,
                isCompact && styles.xpTextCompact,
                { color: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary },
              ]}
            >
              {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        <View
          style={[
            styles.progressBarContainer,
            {
              backgroundColor: theme.isDark
                ? theme.colors.dark.surface
                : theme.colors.light.surface,
            },
          ]}
        >
          <LinearGradient
            colors={[levelConfig.gradientColors[0], levelConfig.gradientColors[1] || levelConfig.gradientColors[0]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>

        {/* Next level preview (only on large) */}
        {!isCompact && normalizedLevel < 8 && (
          <Text
            style={[
              styles.nextLevel,
              { color: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary },
            ]}
          >
            {Math.round(targetXP - currentXP)} XP to {LEVELS[normalizedLevel]?.name || 'Max Level'}
          </Text>
        )}
      </View>
    </View>
  );
};

// Helper function to get level from XP
export const getLevelFromXP = (xp: number): number => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i].id;
    }
  }
  return 1;
};

// Helper function to get level config
export const getLevelConfig = (level: number): LevelConfig => {
  const normalizedLevel = Math.min(Math.max(level, 1), 8);
  return LEVELS[normalizedLevel - 1];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeLarge: {
    width: 60,
    height: 60,
    gap: 4,
  },
  badgeCompact: {
    width: 40,
    height: 40,
  },
  levelNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelName: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelNameCompact: {
    fontSize: 16,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '600',
  },
  xpTextCompact: {
    fontSize: 11,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
