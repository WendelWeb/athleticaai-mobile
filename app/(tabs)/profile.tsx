/**
 * Profile Tab - Apple-Grade Design
 *
 * Features:
 * - User profile header with avatar
 * - Stats overview (workouts, streak, level)
 * - Settings menu
 * - Premium status
 * - Sign out
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme, useTheme } from '@theme/ThemeProvider';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LevelBadge } from '@components/ui/LevelBadge';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { toggleCoachMode } from '@/services/drizzle/coaching';
import { toISOString } from '@/utils';

export default function ProfileScreen() {
  const theme = useStyledTheme();
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useClerkAuth();

  // Real stats from Supabase
  const { stats: userStats, loading: statsLoading, error: statsError, refresh: refreshStats, refreshing: statsRefreshing } = useUserStats();

  // Premium status from RevenueCat
  const { isPremium } = useRevenueCat();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(theme.isDark);
  const [isCoach, setIsCoach] = useState(profile?.is_coach || false);
  const [isTogglingCoachMode, setIsTogglingCoachMode] = useState(false);

  const { showSuccess, showError } = useToast();

  // Sync local state with profile when it updates
  useEffect(() => {
    console.log('🔄 Profile changed, is_coach:', profile?.is_coach);
    if (profile?.is_coach !== undefined) {
      setIsCoach(profile.is_coach);
      console.log('✅ Synced isCoach to:', profile.is_coach);
    }
  }, [profile?.is_coach]);

  // Theme colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // INNOVATION: Real stats with fallback to defaults
  const stats = {
    workoutsCompleted: userStats?.total_workouts || 0,
    currentStreak: userStats?.current_streak || 0,
    longestStreak: userStats?.best_streak || 0,
    totalHours: userStats?.total_hours || 0,
    currentLevel: userStats?.current_level || 1,
    currentXP: userStats?.total_xp || 0,
    nextLevelXP: userStats?.xp_for_next_level || 150,
    followers: 0, // TODO: Implement social features
    following: 0, // TODO: Implement social features
  };

  const onRefresh = async () => {
    await refreshStats();
  };

  const handleSignOut = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/sign-in-apple');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/edit-profile' as any);
  };

  const handleUpgradeToPremium = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/paywall' as any);
  };

  const handleMenuPress = (action: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(action, 'Coming soon!');
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNotificationsEnabled(value);

    // Update notification preferences in database
    if (user) {
      try {
        const { db, profiles } = await import('@/db');
        const { eq } = await import('drizzle-orm');

        await db.update(profiles)
          .set({
            notifications_enabled: value,
            updated_at: toISOString(new Date()),
          })
          .where(eq(profiles.id, user.id));
      } catch (error) {
        // Revert UI if save failed
        setNotificationsEnabled(!value);
      }
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDarkModeEnabled(value);

    // Toggle theme in ThemeProvider
    toggleTheme();

    // Note: Theme preference is stored in AsyncStorage by ThemeProvider
    // Could sync to DB for cross-device support in future
  };

  const handleCoachModeToggle = async (value: boolean) => {
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    console.log('🎯 Toggle coach mode:', { userId: user.id, value });

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsTogglingCoachMode(true);

    try {
      console.log('📡 Calling toggleCoachMode API...');
      const success = await toggleCoachMode(user.id, value);
      console.log('✅ toggleCoachMode result:', success);

      if (success) {
        // Update local state immediately for responsive UI
        setIsCoach(value);
        console.log('✅ Local state updated to:', value);

        // Refresh profile from database to get updated is_coach value
        console.log('🔄 Refreshing profile...');
        await refreshProfile();
        console.log('✅ Profile refreshed');

        showSuccess(
          value ? 'Coach Mode Enabled!' : 'Coach Mode Disabled',
          value ? 'You can now create programs for clients' : 'You are no longer in coach mode'
        );
      } else {
        console.error('❌ toggleCoachMode returned false');
        throw new Error('Failed to toggle coach mode');
      }
    } catch (error) {
      console.error('❌ Coach mode toggle error:', error);
      showError(
        'Failed to Update',
        'Could not toggle coach mode. Please try again.'
      );
      // Revert on error
      setIsCoach(!value);
    } finally {
      setIsTogglingCoachMode(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColors.primary }} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={statsRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
      {/* Profile Header */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={[styles.avatarInner, { backgroundColor: bgColors.surface }]}>
              <Text style={[styles.avatarText, { color: theme.colors.primary[500] }]}>
                {profile?.full_name
                  ? profile.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.primaryEmailAddress?.emailAddress?.[0].toUpperCase() || 'W'}
              </Text>
            </View>
          </LinearGradient>

          {/* Premium Badge */}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>

        {/* Name & Username */}
        <Text style={[styles.name, { color: textColors.primary }]}>
          {profile?.full_name || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Warrior'}
        </Text>
        <Text style={[styles.username, { color: textColors.tertiary }]}>
          @{user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'warrior'}
        </Text>

        {/* Stats Row (Social Preview) */}
        {statsError ? (
          <ErrorState
            error={statsError}
            onRetry={refreshStats}
            compact
          />
        ) : (
          <View style={styles.socialStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColors.primary }]}>
                {stats.workoutsCompleted}
              </Text>
              <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Workouts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: bgColors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColors.primary }]}>
                {stats.followers}
              </Text>
              <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: bgColors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColors.primary }]}>
                {stats.following}
              </Text>
              <Text style={[styles.statLabel, { color: textColors.tertiary }]}>Following</Text>
            </View>
          </View>
        )}

        {/* Edit Profile Button */}
        <Button variant="secondary" size="md" onPress={handleEditProfile}>
          Edit Profile
        </Button>
      </View>

      <View style={{ height: theme.spacing.lg }} />

      {/* BETA MODE: Premium Status Badge */}
      {isPremium && (
        <>
          <View
            style={[
              styles.betaModeCard,
              {
                backgroundColor: theme.colors.primary[500] + '20',
                borderColor: theme.colors.primary[500],
              },
            ]}
          >
            <View style={styles.betaModeContent}>
              <View
                style={[
                  styles.betaModeIcon,
                  { backgroundColor: theme.colors.primary[500] },
                ]}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.betaModeTitle,
                    { color: theme.colors.primary[500] },
                  ]}
                >
                  BETA MODE
                </Text>
                <Text style={[styles.betaModeSubtitle, { color: textColors.secondary }]}>
                  All premium features unlocked for testing
                </Text>
              </View>
              <View style={[styles.betaBadge, { backgroundColor: theme.colors.success[500] }]}>
                <Text style={styles.betaBadgeText}>Premium Active</Text>
              </View>
            </View>
          </View>
          <View style={{ height: theme.spacing.lg }} />
        </>
      )}

      {/* Premium Upsell (if not premium) */}
      {!isPremium && (
        <>
          <TouchableOpacity onPress={handleUpgradeToPremium} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="star" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    Unlock AI Coach, custom programs, and more
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: theme.spacing.lg }} />
        </>
      )}

      {/* INNOVATION: Level Badge (8-tier system from ULTIMATE_FEATURES.md) */}
      <Card shadow="md" padding="lg" style={{ marginBottom: theme.spacing.lg }}>
        {statsLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton variant="rect" width={60} height={60} borderRadius={12} />
            <View style={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={18} style={{ marginBottom: 8 }} />
              <Skeleton variant="text" width="100%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton variant="rect" width="100%" height={8} borderRadius={4} />
            </View>
          </View>
        ) : (
          <LevelBadge
            level={stats.currentLevel}
            currentXP={stats.currentXP}
            nextLevelXP={stats.nextLevelXP}
            size="large"
            showXP={true}
          />
        )}
      </Card>

      {/* Stats Grid */}
      {statsLoading ? (
        // INNOVATION: Skeleton loaders for better UX during stats fetch
        <View style={styles.statsGrid}>
          {[...Array(4)].map((_, index) => (
            <Card key={index} shadow="sm" padding="md" style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Skeleton variant="circle" width={40} height={40} />
                <Skeleton variant="text" width={60} height={28} />
              </View>
              <Skeleton variant="text" width={80} height={13} style={{ marginBottom: 2 }} />
              <Skeleton variant="text" width={60} height={12} />
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {/* Streak */}
          <Card shadow="sm" padding="md" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View
                style={[styles.statCardIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}
              >
                <Ionicons name="flame" size={24} color={theme.colors.primary[500]} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.colors.primary[500] }]}>
                {stats.currentStreak}
              </Text>
            </View>
            <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Day Streak</Text>
            <Text style={[styles.statCardSubtext, { color: textColors.tertiary }]}>
              Best: {stats.longestStreak}
            </Text>
          </Card>

          {/* Level */}
          <Card shadow="sm" padding="md" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View
                style={[styles.statCardIcon, { backgroundColor: theme.colors.secondary[500] + '20' }]}
              >
                <Ionicons name="trophy" size={24} color={theme.colors.secondary[500]} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.colors.secondary[500] }]}>
                {stats.currentLevel}
              </Text>
            </View>
            <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Level</Text>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpBarFill,
                  {
                    backgroundColor: theme.colors.secondary[500],
                    width: `${(stats.currentXP / stats.nextLevelXP) * 100}%`,
                  },
                ]}
              />
            </View>
          </Card>

          {/* Total Hours */}
          <Card shadow="sm" padding="md" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View
                style={[styles.statCardIcon, { backgroundColor: theme.colors.success[500] + '20' }]}
              >
                <Ionicons name="time" size={24} color={theme.colors.success[500]} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.colors.success[500] }]}>
                {stats.totalHours}
              </Text>
            </View>
            <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Hours</Text>
            <Text style={[styles.statCardSubtext, { color: textColors.tertiary }]}>Trained</Text>
          </Card>

          {/* Workouts Completed */}
          <Card shadow="sm" padding="md" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View
                style={[styles.statCardIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}
              >
                <Ionicons name="barbell" size={24} color={theme.colors.warning[500]} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.colors.warning[500] }]}>
                {stats.workoutsCompleted}
              </Text>
            </View>
            <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Workouts</Text>
            <Text style={[styles.statCardSubtext, { color: textColors.tertiary }]}>Completed</Text>
          </Card>
        </View>
      )}

      <View style={{ height: theme.spacing.lg }} />

      {/* Settings Section */}
      <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Settings</Text>
      <Card shadow="sm" padding="none">
        {/* Notifications */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}>
              <Ionicons name="notifications" size={20} color={theme.colors.primary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: bgColors.border, true: theme.colors.primary[500] + '80' }}
            thumbColor={notificationsEnabled ? theme.colors.primary[500] : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Dark Mode */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.secondary[500] + '20' }]}>
              <Ionicons name="moon" size={20} color={theme.colors.secondary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: bgColors.border, true: theme.colors.secondary[500] + '80' }}
            thumbColor={darkModeEnabled ? theme.colors.secondary[500] : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Become a Coach */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          activeOpacity={0.7}
          disabled={isTogglingCoachMode}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="school" size={20} color={theme.colors.warning[500]} />
            </View>
            <View>
              <Text style={[styles.menuLabel, { color: textColors.primary }]}>
                Become a Coach
              </Text>
              <Text style={{ fontSize: 12, color: textColors.tertiary, marginTop: 2 }}>
                Create programs and manage clients
              </Text>
            </View>
          </View>
          <Switch
            value={isCoach}
            onValueChange={handleCoachModeToggle}
            disabled={isTogglingCoachMode}
            trackColor={{ false: bgColors.border, true: theme.colors.warning[500] + '80' }}
            thumbColor={isCoach ? theme.colors.warning[500] : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Units */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => handleMenuPress('Units')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="speedometer" size={20} color={theme.colors.warning[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Units</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={[styles.menuValue, { color: textColors.tertiary }]}>Metric</Text>
            <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Workout Reminders */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => handleMenuPress('Workout Reminders')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.success[500] + '20' }]}>
              <Ionicons name="alarm" size={20} color={theme.colors.success[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>
              Workout Reminders
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      {/* INNOVATION: Community Section (Warrior Culture) */}
      <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Community</Text>
      <Card shadow="sm" padding="none">
        {/* Achievements Gallery */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/achievements' as any);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="trophy" size={20} color={theme.colors.warning[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>
              Achievements
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Badge variant="primary" size="sm">
              {stats.workoutsCompleted > 10 ? '3' : '1'}
            </Badge>
            <View style={{ width: theme.spacing.sm }} />
            <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Morning Ritual */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/morning-ritual' as any);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="sunny" size={20} color={theme.colors.warning[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>
              Morning Ritual
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Badge variant="warning" size="sm">
              5:00 AM
            </Badge>
            <View style={{ width: theme.spacing.sm }} />
            <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Warrior Manifesto */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/manifesto' as any);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}>
              <Ionicons name="shield" size={20} color={theme.colors.primary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>
              Warrior Manifesto
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      {/* Account Section */}
      <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Account</Text>
      <Card shadow="sm" padding="none">
        {/* Privacy */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => handleMenuPress('Privacy')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>

        {/* Data & Storage */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => handleMenuPress('Data & Storage')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="server" size={20} color={theme.colors.warning[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Data & Storage</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>

        {/* Connected Apps */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => handleMenuPress('Connected Apps')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.success[500] + '20' }]}>
              <Ionicons name="link" size={20} color={theme.colors.success[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Connected Apps</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Badge variant="primary" size="sm">
              2
            </Badge>
            <View style={{ width: theme.spacing.sm }} />
            <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
          </View>
        </TouchableOpacity>
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      {/* Support Section */}
      <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Support</Text>
      <Card shadow="sm" padding="none">
        {/* Help Center */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => handleMenuPress('Help Center')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}>
              <Ionicons name="help-circle" size={20} color={theme.colors.primary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>

        {/* Contact Us */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
          onPress={() => handleMenuPress('Contact Us')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.secondary[500] + '20' }]}>
              <Ionicons name="chatbubbles" size={20} color={theme.colors.secondary[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>Contact Us</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => handleMenuPress('About')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning[500] + '20' }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.warning[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: textColors.primary }]}>About</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={[styles.menuValue, { color: textColors.tertiary }]}>v1.0.0</Text>
            <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
          </View>
        </TouchableOpacity>
      </Card>

      <View style={{ height: theme.spacing.xl }} />

      {/* Sign Out Button */}
      <Button variant="danger" size="lg" onPress={handleSignOut}>
        Sign Out
      </Button>

      <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    // paddingTop is set dynamically with safe area insets
    paddingBottom: 100, // Safety space to avoid tab bar overlap
  },
  header: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    marginBottom: 24,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  premiumCard: {
    borderRadius: 20,
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statCardLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  statCardSubtext: {
    fontSize: 12,
  },
  xpBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 15,
  },
  betaModeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 24,
  },
  betaModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  betaModeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betaModeTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  betaModeSubtitle: {
    fontSize: 13,
  },
  betaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  betaBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
