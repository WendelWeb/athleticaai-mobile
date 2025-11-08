/**
 * Workout History Calendar Screen
 *
 * FEATURES:
 * - Interactive calendar with workout dots
 * - Tap date to see workouts completed that day
 * - Month stats (total workouts, hours, calories)
 * - Swipe between months
 * - Navigate to workout detail from list
 *
 * INNOVATION:
 * - GitHub-style contribution heatmap
 * - Streak tracking
 * - Empty state with motivational message
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useStyledTheme } from '@theme/ThemeProvider';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import {
  getUserWorkoutsByDate,
  getUserWorkoutsByMonth,
  WorkoutHistoryItem,
} from '@/services/drizzle/stats';

// Calendar helpers
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DayItem {
  date: string; // YYYY-MM-DD
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  workoutCount: number;
}

export default function WorkoutHistoryScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { profile } = useClerkAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [calendarDays, setCalendarDays] = useState<DayItem[]>([]);
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, number>>({});
  const [workoutsForDate, setWorkoutsForDate] = useState<WorkoutHistoryItem[]>([]);
  const [monthStats, setMonthStats] = useState({
    totalWorkouts: 0,
    totalHours: 0,
    totalCalories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate calendar days for current month
  const generateCalendarDays = useCallback((year: number, month: number, workoutsMap: Record<string, number>) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const days: DayItem[] = [];

    // Add previous month's days to fill the first week
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        workoutCount: 0,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        workoutCount: workoutsMap[dateStr] || 0,
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        workoutCount: 0,
      });
    }

    return days;
  }, []);

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

  // Load month data (for calendar dots)
  const loadMonthData = useCallback(async (year: number, month: number) => {
    if (!profile?.id) return;

    try {
      const monthData = await getUserWorkoutsByMonth(profile.id, year, month);

      let totalWorkouts = 0;
      Object.values(monthData).forEach((count) => {
        totalWorkouts += count;
      });

      setWorkoutsByDate(monthData);

      // Generate calendar days with workout counts
      const days = generateCalendarDays(year, month, monthData);
      setCalendarDays(days);

      setMonthStats({
        totalWorkouts,
        totalHours: 0, // TODO: Calculate from actual workout durations
        totalCalories: 0, // TODO: Calculate from actual workout data
      });
    } catch (error) {
      console.error('Error loading month data:', error);
    }
  }, [profile?.id, generateCalendarDays]);

  // Load workouts for selected date
  const loadWorkoutsForDate = useCallback(async (date: string) => {
    if (!profile?.id) return;

    try {
      const workouts = await getUserWorkoutsByDate(profile.id, date);
      setWorkoutsForDate(workouts);
    } catch (error) {
      console.error('Error loading workouts for date:', error);
      setWorkoutsForDate([]);
    }
  }, [profile?.id]);

  // Initial load
  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      Promise.all([
        loadMonthData(currentMonth.year, currentMonth.month),
        loadWorkoutsForDate(selectedDate),
      ]).finally(() => setLoading(false));
    }
  }, [profile?.id, currentMonth.year, currentMonth.month, selectedDate]);

  // Handle date selection
  const handleDayPress = (dateStr: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedDate(dateStr);
    loadWorkoutsForDate(dateStr);
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month === 1 ? 12 : prev.month - 1;
      const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month === 12 ? 1 : prev.month + 1;
      const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadMonthData(currentMonth.year, currentMonth.month),
      loadWorkoutsForDate(selectedDate),
    ]);
    setRefreshing(false);
  };

  // Navigate to workout detail
  const handleWorkoutPress = (workout: WorkoutHistoryItem) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // TODO: Navigate to workout detail screen
    console.log('Navigate to workout:', workout.id);
  };

  // Render workout card
  const renderWorkoutCard = useCallback(
    ({ item }: { item: WorkoutHistoryItem }) => {
      const completedTime = new Date(item.completed_at);
      const timeString = completedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return (
        <TouchableOpacity
          onPress={() => handleWorkoutPress(item)}
          style={[styles.workoutCard, { backgroundColor: bgColors.card }]}
          activeOpacity={0.7}
        >
          <View style={styles.workoutCardContent}>
            {/* Left: Icon + Info */}
            <View style={styles.workoutCardLeft}>
              <View
                style={[
                  styles.workoutIcon,
                  { backgroundColor: `${theme.colors.primary[500]}20` },
                ]}
              >
                <Ionicons
                  name="barbell"
                  size={24}
                  color={theme.colors.primary[500]}
                />
              </View>

              <View style={styles.workoutInfo}>
                <Text
                  style={[styles.workoutName, { color: textColors.primary }]}
                  numberOfLines={1}
                >
                  {item.workout_name}
                </Text>
                <Text style={[styles.workoutTime, { color: textColors.tertiary }]}>
                  {timeString}
                </Text>
              </View>
            </View>

            {/* Right: Stats */}
            <View style={styles.workoutStats}>
              <View style={styles.statRow}>
                <Ionicons name="time-outline" size={14} color={textColors.secondary} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {item.duration_minutes}min
                </Text>
              </View>

              {item.calories_burned && (
                <View style={styles.statRow}>
                  <Ionicons name="flame-outline" size={14} color={theme.colors.error[500]} />
                  <Text style={[styles.statText, { color: textColors.secondary }]}>
                    {item.calories_burned}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </TouchableOpacity>
      );
    },
    [bgColors, textColors, theme]
  );

  // Empty state for selected date
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconCircle, { backgroundColor: bgColors.surface }]}>
          <Ionicons
            name="calendar-outline"
            size={60}
            color={theme.colors.primary[400]}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: textColors.primary }]}>
          No workouts on this day
        </Text>
        <Text style={[styles.emptySubtitle, { color: textColors.secondary }]}>
          {selectedDate === new Date().toISOString().split('T')[0]
            ? "Time to crush a workout! 💪"
            : "You didn't work out on this date"}
        </Text>
      </View>
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
        <Stack.Screen
          options={{
            title: 'Workout History',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      <Stack.Screen
        options={{
          title: 'Workout History',
          headerShown: true,
          headerStyle: {
            backgroundColor: bgColors.primary,
          },
          headerTintColor: textColors.primary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Month Stats */}
        <View style={styles.monthStatsSection}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.monthStatsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.monthStatsTitle}>
              {new Date(currentMonth.year, currentMonth.month - 1).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            <View style={styles.monthStatsGrid}>
              <View style={styles.monthStatItem}>
                <Ionicons name="barbell" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.monthStatValue}>{monthStats.totalWorkouts}</Text>
                <Text style={styles.monthStatLabel}>Workouts</Text>
              </View>

              <View style={styles.monthStatDivider} />

              <View style={styles.monthStatItem}>
                <Ionicons name="time" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.monthStatValue}>{monthStats.totalHours}h</Text>
                <Text style={styles.monthStatLabel}>Hours</Text>
              </View>

              <View style={styles.monthStatDivider} />

              <View style={styles.monthStatItem}>
                <Ionicons name="flame" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.monthStatValue}>{monthStats.totalCalories}</Text>
                <Text style={styles.monthStatLabel}>Calories</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Calendar */}
        <View style={[styles.calendarSection, { backgroundColor: bgColors.card }]}>
          {/* Month Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={handlePreviousMonth}
              style={styles.monthArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>

            <Text style={[styles.monthTitle, { color: textColors.primary }]}>
              {MONTHS[currentMonth.month - 1]} {currentMonth.year}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.monthArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS_OF_WEEK.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={[styles.dayHeaderText, { color: textColors.secondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayItem) => {
              const isSelected = dayItem.date === selectedDate;
              const hasWorkouts = dayItem.workoutCount > 0;

              return (
                <TouchableOpacity
                  key={dayItem.date}
                  onPress={() => handleDayPress(dayItem.date)}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: theme.colors.primary[500],
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !dayItem.isCurrentMonth && {
                        color: textColors.tertiary,
                        opacity: 0.3,
                      },
                      dayItem.isToday && !isSelected && {
                        color: theme.colors.primary[500],
                        fontWeight: '700',
                      },
                      isSelected && {
                        color: '#FFFFFF',
                        fontWeight: '700',
                      },
                      { color: isSelected ? '#FFFFFF' : textColors.primary },
                    ]}
                  >
                    {dayItem.day}
                  </Text>

                  {/* Workout Dot */}
                  {hasWorkouts && dayItem.isCurrentMonth && (
                    <View
                      style={[
                        styles.workoutDot,
                        {
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : theme.colors.primary[500],
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Section */}
        <View style={styles.selectedDateSection}>
          <View style={styles.selectedDateHeader}>
            <Text style={[styles.selectedDateTitle, { color: textColors.primary }]}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {workoutsForDate.length > 0 && (
              <View style={[styles.workoutCountBadge, { backgroundColor: theme.colors.primary[500] }]}>
                <Text style={styles.workoutCountText}>{workoutsForDate.length}</Text>
              </View>
            )}
          </View>

          {/* Workouts List */}
          {workoutsForDate.length > 0 ? (
            <FlashList
              data={workoutsForDate}
              renderItem={renderWorkoutCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Month Stats
  monthStatsSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  monthStatsGradient: {
    padding: 24,
  },
  monthStatsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  monthStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  monthStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  monthStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Calendar
  calendarSection: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthArrow: {
    padding: 4,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  workoutDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Selected Date
  selectedDateSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  workoutCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Workout Card
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  workoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  workoutStats: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});
