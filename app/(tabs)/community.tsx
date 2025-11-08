/**
 * 🌐 COMMUNITY TAB - Social Hub
 *
 * Features:
 * - Social Feed (workout posts, achievements, photos)
 * - Active Challenges (weekly/monthly)
 * - Leaderboards (top performers)
 * - Friends Activity
 *
 * Strategic Impact:
 * - 2-3x retention improvement
 * - Viral growth through social sharing
 * - Gamification engagement
 * - Community building
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as communityService from '@/services/drizzle/community';

const { width } = Dimensions.get('window');

// =====================================================
// TYPES
// =====================================================

type TabType = 'feed' | 'challenges' | 'leaderboard';

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  type: 'workout' | 'achievement' | 'transformation';
  content: string;
  image?: string;
  workout?: {
    name: string;
    duration: number;
    calories: number;
  };
  achievement?: {
    title: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  type: 'weekly' | 'monthly';
  progress: number;
  target: number;
  participants: number;
  reward: string;
  endsIn: string;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  score: number;
  trend: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

// =====================================================
// MOCK DATA
// =====================================================

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
      level: 12,
    },
    type: 'workout',
    content: 'Crushed leg day! 💪 New PR on squats!',
    workout: {
      name: 'Legs Day - Week 3',
      duration: 65,
      calories: 420,
    },
    likes: 24,
    comments: 5,
    timestamp: '2h ago',
    isLiked: false,
  },
  {
    id: '2',
    user: {
      name: 'Mike Chen',
      avatar: 'https://i.pravatar.cc/150?img=2',
      level: 18,
    },
    type: 'achievement',
    content: 'Just unlocked Iron Will! 100 workouts completed 🏆',
    achievement: {
      title: 'Iron Will',
      icon: 'trophy',
      rarity: 'epic',
    },
    likes: 89,
    comments: 12,
    timestamp: '5h ago',
    isLiked: true,
  },
  {
    id: '3',
    user: {
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?img=3',
      level: 8,
    },
    type: 'transformation',
    content: '3 months progress! Consistency is key 🔥',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    likes: 156,
    comments: 28,
    timestamp: '1d ago',
    isLiked: true,
  },
];

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: '100 Pushups Challenge',
    description: 'Complete 100 pushups this week',
    icon: 'fitness',
    gradient: ['#FF6B6B', '#FF8E53'],
    type: 'weekly',
    progress: 67,
    target: 100,
    participants: 1234,
    reward: '50 XP + Badge',
    endsIn: '3 days',
  },
  {
    id: '2',
    title: 'Cardio King',
    description: 'Burn 2000 calories this week',
    icon: 'flame',
    gradient: ['#4E54C8', '#8F94FB'],
    type: 'weekly',
    progress: 1420,
    target: 2000,
    participants: 892,
    reward: '100 XP + Title',
    endsIn: '3 days',
  },
  {
    id: '3',
    title: 'Consistency Master',
    description: 'Workout 20 days this month',
    icon: 'calendar',
    gradient: ['#11998E', '#38EF7D'],
    type: 'monthly',
    progress: 14,
    target: 20,
    participants: 2341,
    reward: '500 XP + Legendary Badge',
    endsIn: '12 days',
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    user: { name: 'Alex Rodriguez', avatar: 'https://i.pravatar.cc/150?img=4', level: 24 },
    score: 15420,
    trend: 'up',
  },
  {
    rank: 2,
    user: { name: 'Jessica Kim', avatar: 'https://i.pravatar.cc/150?img=5', level: 22 },
    score: 14890,
    trend: 'same',
  },
  {
    rank: 3,
    user: { name: 'David Miller', avatar: 'https://i.pravatar.cc/150?img=6', level: 21 },
    score: 14230,
    trend: 'up',
  },
  {
    rank: 12,
    user: { name: 'You', avatar: 'https://i.pravatar.cc/150?img=7', level: 12 },
    score: 8450,
    trend: 'up',
    isCurrentUser: true,
  },
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function CommunityScreen() {
  const theme = useStyledTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
  const [loading, setLoading] = useState(true);

  // Theme helpers
  const colors = {
    text: {
      primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
      secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
      tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
    },
    surface: {
      primary: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
      secondary: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    },
    background: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
  };

  // =====================================================
  // LOAD DATA FROM BACKEND
  // =====================================================

  useEffect(() => {
    loadCommunityData();
  }, [user]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);

      // Load data even if user not logged in (public mode)
      const userId = user?.id;

      // Load in parallel
      const [postsData, challengesData, leaderboardData] = await Promise.all([
        communityService.getFeedPosts(userId, 20),
        communityService.getActiveChallenges(userId),
        communityService.getLeaderboard('weekly', 50),
      ]);

      // Map backend data to UI format
      console.log('📊 Community data loaded:', {
        posts: postsData.length,
        challenges: challengesData.length,
        leaderboard: leaderboardData.length
      });

      console.log('📝 Posts data:', postsData);
      console.log('🎯 Challenges data:', challengesData);
      console.log('🏆 Leaderboard data:', leaderboardData);

      // Posts
      console.log('📦 Mapping posts...');
      const mappedPosts = postsData.map((post: any) => ({
        id: post.id,
        user: {
          name: post.user?.full_name || 'Anonymous',
          avatar: post.user?.avatar_url || 'https://i.pravatar.cc/150',
          level: 12,
        },
        type: post.type as any,
        content: post.content,
        image: post.image_url || undefined,
        workout: post.workout_data || undefined,
        achievement: post.achievement_data || undefined,
        likes: post.likes_count,
        comments: post.comments_count,
        timestamp: getRelativeTime(post.created_at),
        isLiked: post.is_liked || false,
      }));
      console.log('✅ Mapped posts:', mappedPosts.length);
      if (mappedPosts.length > 0) {
        setPosts(mappedPosts);
        console.log('✅ Set posts state');
      } else {
        console.log('⚠️  No posts to set (mappedPosts.length === 0)');
      }

      // Challenges
      console.log('📦 Mapping challenges...');
      const mappedChallenges = challengesData.map((challenge: any) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        icon: challenge.icon,
        gradient: [challenge.gradient_start, challenge.gradient_end],
        type: challenge.type as any,
        progress: challenge.user_progress || 0,
        target: challenge.target,
        participants: challenge.participants_count,
        reward: `${challenge.reward_xp} XP${challenge.reward_badge ? ' + Badge' : ''}`,
        endsIn: getTimeUntil(challenge.end_date),
      }));
      console.log('✅ Mapped challenges:', mappedChallenges.length);
      if (mappedChallenges.length > 0) {
        setChallenges(mappedChallenges);
        console.log('✅ Set challenges state');
      } else {
        console.log('⚠️  No challenges to set (mappedChallenges.length === 0)');
      }

      // Leaderboard
      console.log('📦 Mapping leaderboard...');
      const mappedLeaderboard = leaderboardData.map((entry: any) => ({
        rank: entry.rank,
        user: {
          name: entry.user?.full_name || 'Anonymous',
          avatar: entry.user?.avatar_url || 'https://i.pravatar.cc/150',
          level: 12,
        },
        score: entry.score,
        trend: entry.trend || 'same',
        isCurrentUser: entry.user_id === userId,
      }));
      console.log('✅ Mapped leaderboard:', mappedLeaderboard.length);
      if (mappedLeaderboard.length > 0) {
        setLeaderboard(mappedLeaderboard);
        console.log('✅ Set leaderboard state');
      } else {
        console.log('⚠️  No leaderboard to set (mappedLeaderboard.length === 0)');
      }
    } catch (error) {
      console.error('❌ Error loading community data:', error);
      // Keep mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get relative time (e.g., "2h ago")
  const getRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Helper: Get time until date (e.g., "3 days")
  const getTimeUntil = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffDays > 0) return `${diffDays} days`;
    return `${diffHours} hours`;
  };

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleLikePost = async (postId: string) => {
    if (!user?.id) return;

    try {
      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );

      // Backend update
      await communityService.togglePostLike(postId, user.id);
    } catch (error) {
      console.error('❌ Error liking post:', error);
      // Revert optimistic update
      loadCommunityData();
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user?.id) return;

    try {
      await communityService.joinChallenge(challengeId, user.id);
      console.log('✅ Joined challenge:', challengeId);
      // Reload challenges
      const challengesData = await communityService.getActiveChallenges(user.id);
      if (challengesData.length > 0) {
        const mappedChallenges = challengesData.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          icon: challenge.icon,
          gradient: [challenge.gradient_start, challenge.gradient_end],
          type: challenge.type as any,
          progress: challenge.user_progress || 0,
          target: challenge.target,
          participants: challenge.participants_count,
          reward: `${challenge.reward_xp} XP${challenge.reward_badge ? ' + Badge' : ''}`,
          endsIn: getTimeUntil(challenge.end_date),
        }));
        setChallenges(mappedChallenges);
      }
    } catch (error) {
      console.error('❌ Error joining challenge:', error);
    }
  };


  // =====================================================
  // RENDER SECTIONS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Community
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Connect, compete, conquer
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.notificationButton, { backgroundColor: colors.surface.secondary }]}
        onPress={() => console.log('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.surface.secondary }]}>
      {[
        { key: 'feed', label: 'Feed', icon: 'home' },
        { key: 'challenges', label: 'Challenges', icon: 'trophy' },
        { key: 'leaderboard', label: 'Leaderboard', icon: 'podium' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && [
              styles.tabActive,
              { backgroundColor: theme.colors.primary[500] + '20' },
            ],
          ]}
          onPress={() => setActiveTab(tab.key as TabType)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? theme.colors.primary[500] : colors.text.tertiary}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  activeTab === tab.key ? theme.colors.primary[500] : colors.text.tertiary,
              },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPost = (post: Post) => (
    <View key={post.id} style={[styles.postCard, { backgroundColor: colors.surface.primary }]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
          <View>
            <View style={styles.postUserNameRow}>
              <Text style={[styles.postUserName, { color: colors.text.primary }]}>
                {post.user.name}
              </Text>
              <View style={[styles.postUserLevel, { backgroundColor: theme.colors.primary[500] }]}>
                <Text style={styles.postUserLevelText}>Lv {post.user.level}</Text>
              </View>
            </View>
            <Text style={[styles.postTimestamp, { color: colors.text.tertiary }]}>
              {post.timestamp}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={[styles.postContent, { color: colors.text.secondary }]}>
        {post.content}
      </Text>

      {/* Workout Info */}
      {post.workout && (
        <View style={[styles.postWorkout, { backgroundColor: colors.surface.secondary }]}>
          <View style={styles.postWorkoutHeader}>
            <Ionicons name="barbell" size={18} color={theme.colors.primary[500]} />
            <Text style={[styles.postWorkoutName, { color: colors.text.primary }]}>
              {post.workout.name}
            </Text>
          </View>
          <View style={styles.postWorkoutStats}>
            <View style={styles.postWorkoutStat}>
              <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
              <Text style={[styles.postWorkoutStatText, { color: colors.text.tertiary }]}>
                {post.workout.duration} min
              </Text>
            </View>
            <View style={styles.postWorkoutStat}>
              <Ionicons name="flame-outline" size={14} color={colors.text.tertiary} />
              <Text style={[styles.postWorkoutStatText, { color: colors.text.tertiary }]}>
                {post.workout.calories} cal
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Achievement */}
      {post.achievement && (
        <View
          style={[
            styles.postAchievement,
            {
              backgroundColor:
                post.achievement.rarity === 'legendary'
                  ? '#FFD700'
                  : post.achievement.rarity === 'epic'
                  ? '#9B59B6'
                  : post.achievement.rarity === 'rare'
                  ? '#3498DB'
                  : '#95A5A6',
            },
          ]}
        >
          <Ionicons name={post.achievement.icon as any} size={24} color="#fff" />
          <Text style={styles.postAchievementTitle}>{post.achievement.title}</Text>
          <Text style={styles.postAchievementRarity}>
            {post.achievement.rarity.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Transformation Image */}
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => handleLikePost(post.id)}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.isLiked ? '#FF6B6B' : colors.text.tertiary}
          />
          <Text style={[styles.postActionText, { color: colors.text.tertiary }]}>
            {post.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text.tertiary} />
          <Text style={[styles.postActionText, { color: colors.text.tertiary }]}>
            {post.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Ionicons name="share-outline" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChallenge = (challenge: Challenge) => {
    const progress = (challenge.progress / challenge.target) * 100;

    return (
      <View key={challenge.id} style={styles.challengeCard}>
        <LinearGradient colors={challenge.gradient as any} style={styles.challengeGradient}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIcon}>
              <Ionicons name={challenge.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.challengeType}>
              <Text style={styles.challengeTypeText}>
                {challenge.type.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>

          {/* Progress Bar */}
          <View style={styles.challengeProgressContainer}>
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.challengeProgressText}>
              {challenge.progress} / {challenge.target}
            </Text>
          </View>

          <View style={styles.challengeFooter}>
            <View>
              <Text style={styles.challengeFooterLabel}>Participants</Text>
              <Text style={styles.challengeFooterValue}>
                {challenge.participants.toLocaleString()}
              </Text>
            </View>
            <View>
              <Text style={styles.challengeFooterLabel}>Reward</Text>
              <Text style={styles.challengeFooterValue}>{challenge.reward}</Text>
            </View>
            <View>
              <Text style={styles.challengeFooterLabel}>Ends in</Text>
              <Text style={styles.challengeFooterValue}>{challenge.endsIn}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.challengeJoinButton}
            onPress={() => handleJoinChallenge(challenge.id)}
          >
            <Text style={styles.challengeJoinButtonText}>Join Challenge</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    const trendColor = entry.trend === 'up' ? '#27AE60' : entry.trend === 'down' ? '#E74C3C' : colors.text.tertiary;
    const trendIcon = entry.trend === 'up' ? 'trending-up' : entry.trend === 'down' ? 'trending-down' : 'remove';

    return (
      <View
        key={entry.rank}
        style={[
          styles.leaderboardEntry,
          {
            backgroundColor: entry.isCurrentUser
              ? theme.colors.primary[500] + '20'
              : colors.surface.primary,
            borderColor: entry.isCurrentUser ? theme.colors.primary[500] : 'transparent',
            borderWidth: entry.isCurrentUser ? 2 : 0,
          },
        ]}
      >
        {/* Rank */}
        <View style={styles.leaderboardRank}>
          {entry.rank <= 3 ? (
            <View
              style={[
                styles.leaderboardMedal,
                {
                  backgroundColor:
                    entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                },
              ]}
            >
              <Ionicons name="trophy" size={16} color="#fff" />
            </View>
          ) : (
            <Text style={[styles.leaderboardRankText, { color: colors.text.secondary }]}>
              #{entry.rank}
            </Text>
          )}
        </View>

        {/* User Info */}
        <Image source={{ uri: entry.user.avatar }} style={styles.leaderboardAvatar} />
        <View style={styles.leaderboardUserInfo}>
          <Text style={[styles.leaderboardUserName, { color: colors.text.primary }]}>
            {entry.user.name}
          </Text>
          <View style={styles.leaderboardUserLevel}>
            <Ionicons name="shield" size={12} color={colors.text.tertiary} />
            <Text style={[styles.leaderboardUserLevelText, { color: colors.text.tertiary }]}>
              Level {entry.user.level}
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.leaderboardScore}>
          <Text style={[styles.leaderboardScoreText, { color: colors.text.primary }]}>
            {entry.score.toLocaleString()}
          </Text>
          <Text style={[styles.leaderboardScoreLabel, { color: colors.text.tertiary }]}>
            XP
          </Text>
        </View>

        {/* Trend */}
        <Ionicons name={trendIcon as any} size={20} color={trendColor} />
      </View>
    );
  };

  const renderFeed = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {posts.map(renderPost)}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Active Challenges
      </Text>
      {challenges.map(renderChallenge)}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.leaderboardHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Weekly Leaderboard
        </Text>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.surface.secondary }]}>
          <Text style={[styles.filterButtonText, { color: colors.text.primary }]}>
            This Week
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {leaderboard.map(renderLeaderboardEntry)}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      {renderTabBar()}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'challenges' && renderChallenges()}
      {activeTab === 'leaderboard' && renderLeaderboard()}
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    // backgroundColor set dynamically
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  // ===== POST STYLES =====
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
  },
  postUserLevel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postUserLevelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  postTimestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postWorkout: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  postWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  postWorkoutName: {
    fontSize: 14,
    fontWeight: '600',
  },
  postWorkoutStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postWorkoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postWorkoutStatText: {
    fontSize: 13,
  },
  postAchievement: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  postAchievementTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  postAchievementRarity: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== CHALLENGE STYLES =====
  challengeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  challengeGradient: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeType: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  challengeTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  challengeTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  challengeDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 20,
  },
  challengeProgressContainer: {
    marginBottom: 20,
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  challengeProgressText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  challengeFooterLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 4,
  },
  challengeFooterValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  challengeJoinButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  challengeJoinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ===== LEADERBOARD STYLES =====
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  leaderboardMedal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  leaderboardUserInfo: {
    flex: 1,
  },
  leaderboardUserName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  leaderboardUserLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderboardUserLevelText: {
    fontSize: 12,
  },
  leaderboardScore: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  leaderboardScoreText: {
    fontSize: 18,
    fontWeight: '800',
  },
  leaderboardScoreLabel: {
    fontSize: 11,
  },
});


