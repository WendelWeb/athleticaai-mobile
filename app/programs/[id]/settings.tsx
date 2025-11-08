/**
 * Program Settings Screen
 *
 * Comprehensive program management:
 * - Pause/Resume program
 * - Restart program (reset progress)
 * - Delete/Unenroll from program
 * - Set as primary (active) program
 * - Adjust daily workout target
 * - Edit rest days
 * - Customize schedule
 *
 * INCLUDES:
 * - Confirmation dialogs for destructive actions
 * - Reason input for pausing
 * - Visual feedback with haptics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useStyledTheme } from '@theme/ThemeProvider';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import {
  pauseProgram,
  resumeProgram,
  restartProgram,
  deleteUserProgram,
  setPrimaryProgram,
  setDailyTarget,
  getUserPrograms,
  type UserProgram,
} from '@/services/drizzle/user-programs';
import { getWorkoutPrograms, type WorkoutProgram } from '@/services/drizzle/workouts';

export default function ProgramSettingsScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id, userProgramId } = useLocalSearchParams<{ id: string; userProgramId: string }>();
  const { profile } = useClerkAuth();

  // State
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTargetValue] = useState('1');
  const [isPrimary, setIsPrimary] = useState(false);

  // Colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // Load data
  useEffect(() => {
    loadData();
  }, [id, userProgramId]);

  const loadData = async () => {
    if (!profile?.id || !id || !userProgramId) return;

    try {
      setLoading(true);

      const [userPrograms, allPrograms] = await Promise.all([
        getUserPrograms(profile.id),
        getWorkoutPrograms(),
      ]);

      const foundUserProgram = userPrograms.find((p) => p.id === userProgramId);
      const foundProgram = allPrograms.find((p) => p.id === id);

      if (foundUserProgram) {
        setUserProgram(foundUserProgram);
        setDailyTargetValue(String(foundUserProgram.daily_workouts_target || 1));
        setIsPrimary(foundUserProgram.is_primary);
      }

      if (foundProgram) {
        setProgram(foundProgram);
      }
    } catch (error) {
      console.error('Error loading program settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pause Program
  const handlePause = () => {
    Alert.prompt(
      'Pause Program',
      'Why are you pausing? (Optional)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pause',
          onPress: async (reason?: string) => {
            Platform.OS === 'ios' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            try {
              await pauseProgram(userProgramId, reason);
              Alert.alert('Success', 'Program paused successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to pause program');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Resume Program
  const handleResume = () => {
    Alert.alert(
      'Resume Program',
      'Are you ready to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            Platform.OS === 'ios' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            try {
              await resumeProgram(userProgramId);
              Alert.alert('Success', 'Program resumed successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to resume program');
            }
          },
        },
      ]
    );
  };

  // Restart Program
  const handleRestart = () => {
    Alert.alert(
      'Restart Program',
      'This will reset all your progress to Week 1. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            Platform.OS === 'ios' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            try {
              await restartProgram(userProgramId);
              Alert.alert('Success', 'Program restarted from Week 1');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to restart program');
            }
          },
        },
      ]
    );
  };

  // Delete Program
  const handleDelete = () => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Platform.OS === 'ios' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            try {
              await deleteUserProgram(userProgramId);
              Alert.alert('Success', 'Program deleted successfully');
              router.replace('/(tabs)/workouts');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
  };

  // Toggle Primary
  const handleTogglePrimary = async (value: boolean) => {
    if (!profile?.id) return;

    try {
      setIsPrimary(value);
      Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (value) {
        await setPrimaryProgram(userProgramId, profile.id);
      } else {
        // Unset primary by setting another program or none
        // For simplicity, we'll show a message
        Alert.alert('Info', 'You can set another program as primary from My Programs');
        setIsPrimary(true); // Revert
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set primary program');
      setIsPrimary(!value); // Revert
    }
  };

  // Save Daily Target
  const handleSaveDailyTarget = async () => {
    const target = parseInt(dailyTarget, 10);

    if (isNaN(target) || target < 1 || target > 10) {
      Alert.alert('Invalid Target', 'Please enter a number between 1 and 10');
      return;
    }

    try {
      Platform.OS === 'ios' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await setDailyTarget(userProgramId, target);
      Alert.alert('Success', `Daily target set to ${target} workout(s)`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update daily target');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
        <Stack.Screen
          options={{
            title: 'Program Settings',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!userProgram || !program) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
        <Stack.Screen options={{ title: 'Program Settings', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.error[500]} />
          <Text style={[styles.errorText, { color: textColors.primary }]}>
            Program not found
          </Text>
        </View>
      </View>
    );
  }

  const isPaused = userProgram.status === 'paused';

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      <Stack.Screen
        options={{
          title: 'Program Settings',
          headerShown: true,
          headerStyle: { backgroundColor: bgColors.primary },
          headerTintColor: textColors.primary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Program Info */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.programName, { color: textColors.primary }]}>{program.name}</Text>
          <View style={styles.programMeta}>
            <View style={[styles.statusBadge, {
              backgroundColor: isPaused
                ? theme.colors.warning[100]
                : theme.colors.success[100]
            }]}>
              <Text style={[styles.statusText, {
                color: isPaused
                  ? theme.colors.warning[700]
                  : theme.colors.success[700]
              }]}>
                {userProgram.status.toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.progressText, { color: textColors.secondary }]}>
              Week {userProgram.current_week} • {userProgram.workouts_completed}/{userProgram.total_workouts} workouts
            </Text>
          </View>
        </View>

        {/* Primary Program Toggle */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="star" size={24} color={theme.colors.primary[500]} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: textColors.primary }]}>
                  Primary Program
                </Text>
                <Text style={[styles.settingDescription, { color: textColors.secondary }]}>
                  Your main active program for today
                </Text>
              </View>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={handleTogglePrimary}
              trackColor={{
                false: bgColors.border,
                true: theme.colors.primary[500]
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Daily Target */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar" size={24} color={theme.colors.primary[500]} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: textColors.primary }]}>
                  Daily Workout Target
                </Text>
                <Text style={[styles.settingDescription, { color: textColors.secondary }]}>
                  Number of workouts per day
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, {
                backgroundColor: bgColors.surface,
                color: textColors.primary,
                borderColor: bgColors.border,
              }]}
              value={dailyTarget}
              onChangeText={setDailyTargetValue}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="1"
              placeholderTextColor={textColors.tertiary}
            />
            <TouchableOpacity
              onPress={handleSaveDailyTarget}
              style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Program Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>
            PROGRAM ACTIONS
          </Text>

          {/* Pause/Resume */}
          {isPaused ? (
            <TouchableOpacity
              onPress={handleResume}
              style={[styles.actionButton, { backgroundColor: theme.colors.success[500] }]}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Resume Program</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handlePause}
              style={[styles.actionButton, { backgroundColor: theme.colors.warning[500] }]}
              activeOpacity={0.8}
            >
              <Ionicons name="pause" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Pause Program</Text>
            </TouchableOpacity>
          )}

          {/* Restart */}
          <TouchableOpacity
            onPress={handleRestart}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary[500] }]}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Restart from Week 1</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.colors.error[500] }]}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete Program</Text>
          </TouchableOpacity>
        </View>

        {/* Pause Reason (if paused) */}
        {isPaused && userProgram.paused_reason && (
          <View style={[styles.section, { backgroundColor: bgColors.card }]}>
            <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>
              PAUSE REASON
            </Text>
            <Text style={[styles.pauseReason, { color: textColors.primary }]}>
              {userProgram.paused_reason}
            </Text>
          </View>
        )}
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
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },

  // Sections
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Program Info
  programName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Actions
  actionsSection: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    marginTop: 8,
  },

  // Pause Reason
  pauseReason: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});
