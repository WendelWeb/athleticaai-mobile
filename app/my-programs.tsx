/**
 * My Programs Screen - Manage All Enrolled Programs
 *
 * Features:
 * - List all user's programs (active, paused, completed)
 * - Filter by status
 * - Set primary program
 * - Quick actions (continue, pause, settings, delete)
 * - Progress indicators for each program
 * - Search by name
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useStyledTheme } from '@theme/ThemeProvider';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import {
  getUserPrograms,
  setPrimaryProgram,
  pauseProgram,
  resumeProgram,
  deleteUserProgram,
  type UserProgram,
  type ProgramStatus,
} from '@/services/drizzle/user-programs';
import { getWorkoutPrograms, type WorkoutProgram } from '@/services/drizzle/workouts';

type FilterType = 'all' | 'active' | 'paused' | 'completed';

export default function MyProgramsScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { profile } = useClerkAuth();

  // State
  const [myPrograms, setMyPrograms] = useState<UserProgram[]>([]);
  const [programsMap, setProgramsMap] = useState<Map<string, WorkoutProgram>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // Load programs
  const loadPrograms = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [userPrograms, allPrograms] = await Promise.all([
        getUserPrograms(profile.id),
        getWorkoutPrograms(),
      ]);

      const map = new Map<string, WorkoutProgram>();
      allPrograms.forEach((p) => map.set(p.id, p));

      setMyPrograms(userPrograms);
      setProgramsMap(map);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadPrograms();
  }, []);

  // Filter programs
  const filteredPrograms = myPrograms.filter((p) => {
    const program = programsMap.get(p.program_id);
    const matchesFilter =
      filter === 'all' || p.status === filter;
    const matchesSearch =
      !searchQuery ||
      program?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Quick Actions
  const handleSetPrimary = async (userProgramId: string) => {
    if (!profile?.id) return;
    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await setPrimaryProgram(userProgramId, profile.id);
      Alert.alert('Success', 'Primary program updated');
      loadPrograms();
    } catch (error) {
      Alert.alert('Error', 'Failed to set primary program');
    }
  };

  const handleTogglePause = async (userProgram: UserProgram) => {
    if (userProgram.status === 'paused') {
      try {
        await resumeProgram(userProgram.id);
        Alert.alert('Success', 'Program resumed');
        loadPrograms();
      } catch (error) {
        Alert.alert('Error', 'Failed to resume program');
      }
    } else {
      Alert.prompt(
        'Pause Program',
        'Reason (optional)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            onPress: async (reason?: string) => {
              try {
                await pauseProgram(userProgram.id, reason);
                Alert.alert('Success', 'Program paused');
                loadPrograms();
              } catch (error) {
                Alert.alert('Error', 'Failed to pause program');
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = (userProgramId: string, programName: string) => {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${programName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserProgram(userProgramId);
              Alert.alert('Success', 'Program deleted');
              loadPrograms();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
  };

  // Render program card
  const renderProgramCard = useCallback(
    ({ item }: { item: UserProgram }) => {
      const program = programsMap.get(item.program_id);
      if (!program) return null;

      const completionPercentage = Math.round(
        (item.workouts_completed / item.total_workouts) * 100
      );

      const statusColors = {
        active: theme.colors.success[500],
        paused: theme.colors.warning[500],
        completed: theme.colors.primary[500],
        saved: textColors.tertiary,
        abandoned: theme.colors.error[500],
      };

      return (
        <TouchableOpacity
          onPress={() => {
            Platform.OS === 'ios' &&
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: `/programs/${program.id}/dashboard` as any,
              params: { userProgramId: item.id },
            });
          }}
          style={[styles.programCard, { backgroundColor: bgColors.card }]}
          activeOpacity={0.8}
        >
          {/* Thumbnail */}
          {program.thumbnail_url && (
            <Image
              source={{ uri: program.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}

          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                {item.is_primary && (
                  <Ionicons name="star" size={16} color={theme.colors.warning[500]} />
                )}
                <Text style={[styles.programName, { color: textColors.primary }]} numberOfLines={2}>
                  {program.name}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${statusColors[item.status]}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor: theme.colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: textColors.secondary }]}>
                {completionPercentage}% • {item.workouts_completed}/{item.total_workouts}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={14} color={textColors.secondary} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  Week {item.current_week}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={14} color={textColors.secondary} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {item.daily_workouts_completed}/{item.daily_workouts_target} today
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              {!item.is_primary && (
                <TouchableOpacity
                  onPress={() => handleSetPrimary(item.id)}
                  style={[
                    styles.quickAction,
                    { backgroundColor: `${theme.colors.primary[500]}15` },
                  ]}
                >
                  <Ionicons name="star-outline" size={16} color={theme.colors.primary[500]} />
                  <Text style={[styles.quickActionText, { color: theme.colors.primary[500] }]}>
                    Set Primary
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleTogglePause(item)}
                style={[
                  styles.quickAction,
                  {
                    backgroundColor:
                      item.status === 'paused'
                        ? `${theme.colors.success[500]}15`
                        : `${theme.colors.warning[500]}15`,
                  },
                ]}
              >
                <Ionicons
                  name={item.status === 'paused' ? 'play' : 'pause'}
                  size={16}
                  color={
                    item.status === 'paused'
                      ? theme.colors.success[500]
                      : theme.colors.warning[500]
                  }
                />
                <Text
                  style={[
                    styles.quickActionText,
                    {
                      color:
                        item.status === 'paused'
                          ? theme.colors.success[500]
                          : theme.colors.warning[500],
                    },
                  ]}
                >
                  {item.status === 'paused' ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: `/programs/${program.id}/settings` as any,
                    params: { userProgramId: item.id },
                  })
                }
                style={[styles.quickAction, { backgroundColor: `${textColors.tertiary}15` }]}
              >
                <Ionicons name="settings-outline" size={16} color={textColors.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id, program.name)}
                style={[styles.quickAction, { backgroundColor: `${theme.colors.error[500]}15` }]}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [programsMap, theme, textColors, bgColors]
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      <Stack.Screen
        options={{
          title: 'My Programs',
          headerShown: true,
          headerStyle: { backgroundColor: bgColors.primary },
          headerTintColor: textColors.primary,
        }}
      />

      {/* Search & Filter */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: bgColors.surface }]}>
          <Ionicons name="search" size={20} color={textColors.tertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search programs..."
            placeholderTextColor={textColors.tertiary}
            style={[styles.searchInput, { color: textColors.primary }]}
          />
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'paused', 'completed'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filter === f ? theme.colors.primary[500] : bgColors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? '#FFFFFF' : textColors.primary },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Programs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : filteredPrograms.length > 0 ? (
        <FlashList
          data={filteredPrograms}
          renderItem={renderProgramCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPrograms(true)}
              tintColor={theme.colors.primary[500]}
            />
          }
          contentContainerStyle={{ padding: 20 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={80} color={textColors.tertiary} />
          <Text style={[styles.emptyText, { color: textColors.primary }]}>
            {searchQuery ? 'No programs match your search' : 'No programs found'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16 },
  filters: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  programCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: { width: '100%', height: 120 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  programName: { fontSize: 18, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressSection: { marginBottom: 12 },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickActionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' },
});
