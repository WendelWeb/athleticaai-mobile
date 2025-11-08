/**
 * <� ACHIEVEMENT HISTORY SCREEN
 *
 * Apple Fitness+ style achievement gallery
 *
 * Features:
 * - Grid layout avec achievements unlocked/locked
 * - Filter par type (Performance, Milestone, Streak, etc.)
 * - Total points & rarity distribution
 * - Animations unlock reveal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { getUserAchievements, getAchievementStats, type UnlockedAchievement, type AchievementStats } from '@/services/drizzle/achievements';
import { AchievementEngine } from '@/services/achievements/AchievementEngine';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 columns avec gaps

type FilterType = 'all' | 'performance' | 'milestone' | 'streak' | 'volume' | 'speed' | 'special';

export default function AchievementsScreen() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { profile } = useClerkAuth();

  // State
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Theme colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // ===================================================
  // DATA FETCHING
  // ===================================================

  const fetchAchievements = async (isRefresh = false) => {
    if (!profile?.id) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [achievementsData, statsData] = await Promise.all([
        getUserAchievements(profile.id),
        getAchievementStats(profile.id),
      ]);

      setUnlockedAchievements(achievementsData);
      setStats(statsData);

      logger.info('[Achievements] Data fetched', {
        unlocked: achievementsData.length,
        totalPoints: statsData.total_points
      });
    } catch (err) {
      logger.error('[Achievements] Failed to fetch', err instanceof Error ? err : undefined);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [profile?.id]);

  // ===================================================
  // HELPERS
  // ===================================================

  // Get all possible achievements from AchievementEngine
  const ALL_ACHIEVEMENTS = [
    AchievementEngine.checkPerformanceAchievements({
      sets_completed: 10,
      sets_skipped: 0,
      average_rpe: 7,
      rest_periods_skipped: 0,
      all_sets_good_form: true,
    }),
    AchievementEngine.checkMilestoneAchievements({ total_workouts_completed: 1 }),
    AchievementEngine.checkMilestoneAchievements({ total_workouts_completed: 10 }),
    AchievementEngine.checkMilestoneAchievements({ total_workouts_completed: 100 }),
    AchievementEngine.checkStreakAchievements({ current_streak_days: 7 }),
    AchievementEngine.checkStreakAchievements({ current_streak_days: 30 }),
    AchievementEngine.checkVolumeAchievements({ total_volume_kg: 1000, total_reps_lifetime: 0 }),
    AchievementEngine.checkVolumeAchievements({ total_volume_kg: 0, total_reps_lifetime: 10000 }),
    AchievementEngine.checkSpeedAchievements({ duration_seconds: 1000, estimated_duration_seconds: 2000 }),
    AchievementEngine.checkSpecialAchievements({ workout_start_time: new Date('2024-01-01T05:00:00') }),
    AchievementEngine.checkSpecialAchievements({ workout_start_time: new Date('2024-01-01T22:00:00') }),
  ].flat();

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some((a) => a.achievement_id === achievementId);
  };

  // Filter achievements
  const getFilteredAchievements = () => {
    if (selectedFilter === 'all') {
      return ALL_ACHIEVEMENTS;
    }
    return ALL_ACHIEVEMENTS.filter((a) => a.type === selectedFilter);
  };

  // Get rarity gradient colors
  const getRarityGradient = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'legendary': return ['#F59E0B', '#D97706'];
      case 'epic': return ['#A855F7', '#9333EA'];
      case 'rare': return ['#3B82F6', '#2563EB'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  // ===================================================
  // RENDER COMPONENTS
  // ===================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.back();
        }}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: textColors.primary }]}>Achievements</Text>
      <View style={{ width: 28 }} />
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={[styles.statsCard, { backgroundColor: bgColors.surface }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary[500] }]}>
              {stats.total_achievements}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Unlocked</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.primary[500] + '20' }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.total_points.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Points</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.primary[500] + '20' }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#A855F7' }]}>
              {stats.rarity_distribution.legendary}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Legendary</Text>
          </View>
        </View>

        {/* Rarity distribution bar */}
        <View style={styles.rarityBarContainer}>
          {stats.rarity_distribution.legendary > 0 && (
            <View
              style={[
                styles.rarityBar,
                {
                  flex: stats.rarity_distribution.legendary,
                  backgroundColor: '#F59E0B',
                },
              ]}
            />
          )}
          {stats.rarity_distribution.epic > 0 && (
            <View
              style={[
                styles.rarityBar,
                {
                  flex: stats.rarity_distribution.epic,
                  backgroundColor: '#A855F7',
                },
              ]}
            />
          )}
          {stats.rarity_distribution.rare > 0 && (
            <View
              style={[
                styles.rarityBar,
                {
                  flex: stats.rarity_distribution.rare,
                  backgroundColor: '#3B82F6',
                },
              ]}
            />
          )}
          {stats.rarity_distribution.common > 0 && (
            <View
              style={[
                styles.rarityBar,
                {
                  flex: stats.rarity_distribution.common,
                  backgroundColor: '#6B7280',
                },
              ]}
            />
          )}
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const filters: FilterType[] = ['all', 'performance', 'milestone', 'streak', 'volume', 'speed', 'special'];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedFilter(filter);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary[500]
                    : bgColors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? '#FFFFFF' : textColors.secondary,
                  },
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderAchievementGrid = () => {
    const filtered = getFilteredAchievements();

    return (
      <View style={styles.gridContainer}>
        {filtered.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          const [gradientStart, gradientEnd] = getRarityGradient(achievement.rarity);

          return (
            <TouchableOpacity
              key={achievement.id}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // TODO: Show achievement detail modal
              }}
              style={[
                styles.achievementCard,
                { width: ITEM_SIZE, height: ITEM_SIZE },
              ]}
            >
              <LinearGradient
                colors={unlocked ? [gradientStart, gradientEnd] : ['#2C2C2E', '#1C1C1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.achievementGradient}
              >
                {/* Icon */}
                <Text style={[styles.achievementIcon, { opacity: unlocked ? 1 : 0.3 }]}>
                  {unlocked ? achievement.icon : '='}
                </Text>

                {/* Title */}
                <Text
                  style={[
                    styles.achievementTitle,
                    { opacity: unlocked ? 1 : 0.4 },
                  ]}
                  numberOfLines={2}
                >
                  {unlocked ? achievement.title : '???'}
                </Text>

                {/* Points */}
                {unlocked && (
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{achievement.points}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAchievements(true)}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {renderStats()}
        {renderFilters()}
        {renderAchievementGrid()}
      </ScrollView>
    </View>
  );
}

// ===================================================
// STYLES
// ===================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  rarityBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rarityBar: {
    height: '100%',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  achievementCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  pointsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FCD34D',
    letterSpacing: 0.3,
  },
});
