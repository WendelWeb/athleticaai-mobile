/**
 * 🏆 ATHLETICAAI - SOCIAL LEADERBOARD
 * Compare performance with other users on the same program
 * Features: Weekly rankings, stats comparison, achievements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getWorkoutProgramById, type WorkoutProgram } from '@services/drizzle/workouts';
import { getUserProgram, type UserProgram } from '@services/drizzle/user-programs';
import { useClerkAuth } from '@hooks/useClerkAuth';

const { width } = Dimensions.get('window');

type LeaderboardUser = {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  isCurrentUser: boolean;
  stats: {
    workoutsCompleted: number;
    totalVolume: number;
    avgRPE: number;
    completionRate: number;
    streak: number;
  };
  badges: string[];
};

type LeaderboardPeriod = 'week' | 'month' | 'allTime';

export default function LeaderboardScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id, userProgramId } = useLocalSearchParams<{ id: string; userProgramId: string }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('week');

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  useEffect(() => {
    loadData();
  }, [id, userProgramId, selectedPeriod]);

  const loadData = async () => {
    if (!id || !userProgramId || !profile?.id) return;

    setLoading(true);
    try {
      const [programData, userProgramData] = await Promise.all([
        getWorkoutProgramById(id as string),
        getUserProgram(profile.id, id as string),
      ]);

      setProgram(programData);
      setUserProgram(userProgramData);

      // Generate mock leaderboard (replace with real API call)
      const mockLeaderboard = generateMockLeaderboard(profile.id, userProgramData);
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock leaderboard generator (replace with real API)
  const generateMockLeaderboard = (
    currentUserId: string,
    currentUserProgram: UserProgram | null
  ): LeaderboardUser[] => {
    const mockUsers: LeaderboardUser[] = [
      {
        rank: 1,
        userId: 'user_1',
        username: 'FitnessBeast',
        avatar: undefined,
        isCurrentUser: false,
        stats: {
          workoutsCompleted: 28,
          totalVolume: 42500,
          avgRPE: 8.2,
          completionRate: 95,
          streak: 14,
        },
        badges: ['first_place', 'consistency_king'],
      },
      {
        rank: 2,
        userId: 'user_2',
        username: 'IronWarrior',
        avatar: undefined,
        isCurrentUser: false,
        stats: {
          workoutsCompleted: 26,
          totalVolume: 39800,
          avgRPE: 8.5,
          completionRate: 92,
          streak: 12,
        },
        badges: ['strength_master'],
      },
      {
        rank: 3,
        userId: 'user_3',
        username: 'GymNinja',
        avatar: undefined,
        isCurrentUser: false,
        stats: {
          workoutsCompleted: 25,
          totalVolume: 38200,
          avgRPE: 7.8,
          completionRate: 89,
          streak: 10,
        },
        badges: ['volume_beast'],
      },
      {
        rank: 4,
        userId: currentUserId,
        username: profile?.full_name || 'You',
        avatar: profile?.avatar_url || undefined,
        isCurrentUser: true,
        stats: {
          workoutsCompleted: currentUserProgram?.workouts_completed || 0,
          totalVolume: 35400, // Mock data
          avgRPE: 7.5,
          completionRate: currentUserProgram
            ? Math.round((currentUserProgram.workouts_completed / currentUserProgram.total_workouts) * 100)
            : 0,
          streak: 8,
        },
        badges: ['rising_star'],
      },
      {
        rank: 5,
        userId: 'user_5',
        username: 'PowerLifter',
        avatar: undefined,
        isCurrentUser: false,
        stats: {
          workoutsCompleted: 23,
          totalVolume: 34100,
          avgRPE: 8.0,
          completionRate: 85,
          streak: 9,
        },
        badges: [],
      },
    ];

    return mockUsers;
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handlePeriodChange = (period: LeaderboardPeriod) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPeriod(period);
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return textColors.secondary;
  };

  const getRankIcon = (rank: number): any => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal-outline';
    return 'person';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      </View>
    );
  }

  const currentUser = leaderboard.find((u) => u.isCurrentUser);

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColors.surface }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColors.primary }]}>Leaderboard</Text>
          <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
            {program?.name}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'allTime'] as LeaderboardPeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => handlePeriodChange(period)}
              style={[
                styles.periodTab,
                {
                  backgroundColor:
                    selectedPeriod === period ? theme.colors.primary[500] : bgColors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodTabText,
                  {
                    color: selectedPeriod === period ? '#FFFFFF' : textColors.primary,
                  },
                ]}
              >
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current User Rank Card */}
        {currentUser && (
          <View style={styles.currentUserSection}>
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.currentUserCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.currentUserLabel}>Your Ranking</Text>

              <View style={styles.currentUserContent}>
                <View style={styles.currentUserRank}>
                  <Text style={styles.currentUserRankNumber}>#{currentUser.rank}</Text>
                  <Ionicons name={getRankIcon(currentUser.rank)} size={32} color="#FFFFFF" />
                </View>

                <View style={styles.currentUserStats}>
                  <View style={styles.currentUserStat}>
                    <Text style={styles.currentUserStatValue}>
                      {currentUser.stats.workoutsCompleted}
                    </Text>
                    <Text style={styles.currentUserStatLabel}>Workouts</Text>
                  </View>

                  <View style={styles.currentUserStat}>
                    <Text style={styles.currentUserStatValue}>
                      {currentUser.stats.totalVolume.toLocaleString()}
                    </Text>
                    <Text style={styles.currentUserStatLabel}>Volume</Text>
                  </View>

                  <View style={styles.currentUserStat}>
                    <Text style={styles.currentUserStatValue}>{currentUser.stats.streak}</Text>
                    <Text style={styles.currentUserStatLabel}>Streak</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.currentUserEncouragement}>
                {currentUser.rank <= 3
                  ? '🔥 Amazing! Keep pushing!'
                  : currentUser.rank <= 10
                  ? "💪 You're in the top 10!"
                  : `📈 You're ahead of ${100 - currentUser.rank}% of users!`}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Leaderboard List */}
        <View style={styles.leaderboardSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Rankings</Text>

          {leaderboard.map((user, index) => (
            <View
              key={user.userId}
              style={[
                styles.leaderboardItem,
                {
                  backgroundColor: user.isCurrentUser
                    ? theme.colors.primary[100]
                    : bgColors.surface,
                },
              ]}
            >
              {/* Rank */}
              <View style={styles.leaderboardRank}>
                <Text style={[styles.leaderboardRankText, { color: getRankColor(user.rank) }]}>
                  {user.rank}
                </Text>
                {user.rank <= 3 && (
                  <Ionicons
                    name={getRankIcon(user.rank)}
                    size={16}
                    color={getRankColor(user.rank)}
                  />
                )}
              </View>

              {/* Avatar */}
              <View style={styles.leaderboardAvatar}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.leaderboardAvatarImage} />
                ) : (
                  <View
                    style={[
                      styles.leaderboardAvatarPlaceholder,
                      { backgroundColor: theme.colors.primary[200] },
                    ]}
                  >
                    <Text style={[styles.leaderboardAvatarText, { color: theme.colors.primary[600] }]}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* User Info */}
              <View style={styles.leaderboardInfo}>
                <Text style={[styles.leaderboardUsername, { color: textColors.primary }]}>
                  {user.username}
                  {user.isCurrentUser && ' (You)'}
                </Text>
                <View style={styles.leaderboardBadges}>
                  {user.badges.slice(0, 2).map((badge) => (
                    <View
                      key={badge}
                      style={[styles.badge, { backgroundColor: theme.colors.warning[100] }]}
                    >
                      <Ionicons name="star" size={10} color={theme.colors.warning[600]} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Stats */}
              <View style={styles.leaderboardStats}>
                <Text style={[styles.leaderboardStatValue, { color: textColors.primary }]}>
                  {user.stats.workoutsCompleted}
                </Text>
                <Text style={[styles.leaderboardStatLabel, { color: textColors.secondary }]}>
                  workouts
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Current User Card
  currentUserSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  currentUserCard: {
    padding: 20,
    borderRadius: 20,
  },
  currentUserLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  currentUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentUserRank: {
    alignItems: 'center',
    marginRight: 24,
  },
  currentUserRankNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  currentUserStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currentUserStat: {
    alignItems: 'center',
  },
  currentUserStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentUserStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  currentUserEncouragement: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Leaderboard List
  leaderboardSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  leaderboardAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  leaderboardAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardUsername: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaderboardBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  leaderboardStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardStatLabel: {
    fontSize: 11,
  },
});
