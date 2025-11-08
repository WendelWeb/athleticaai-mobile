/**
 * 🔥 ATHLETICAAI - WORKOUT PROGRAM DETAIL SCREEN
 * Apple Fitness+ level UI/UX
 * Full program overview with stats, goals, and start action
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Badge } from '@components/ui';
import { SkeletonCard, AnimatedCard } from '@components/ui';
import {
  getWorkoutProgramById,
  getWorkoutsByProgramId,
  type WorkoutProgram,
} from '@services/drizzle/workouts';

// Extended type with workouts array (from JSONB column)
type WorkoutProgramWithWorkouts = WorkoutProgram & {
  workouts?: Array<{
    workout_id: string;
    week_number: number;
    day_number: number;
    name: string;
    description?: string;
  }>;
};
import {
  enrollInProgram,
  saveProgram,
  getUserProgram,
  type UserProgram,
} from '@services/drizzle/user-programs';
import { useClerkAuth } from '@hooks/useClerkAuth';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 380;

export default function ProgramDetailScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgramWithWorkouts | null>(null);
  const [programWorkouts, setProgramWorkouts] = useState<any[]>([]);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Derived state
  const isSaved = userProgram?.is_saved || false;
  const isEnrolled = userProgram !== null;
  const isActive = userProgram?.status === 'active';

  // Fetch program data
  useEffect(() => {
    loadProgram();
  }, [id, profile]);

  const loadProgram = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Load program
      const programData = await getWorkoutProgramById(id as string);
      setProgram(programData as WorkoutProgramWithWorkouts);

      // ✅ Load workouts from new table (not JSONB)
      if (programData) {
        const workoutsData = await getWorkoutsByProgramId(programData.id);
        setProgramWorkouts(workoutsData);
        console.log(`✅ Loaded ${workoutsData.length} workouts for program`);
      }

      // Load user enrollment if logged in
      if (profile?.id && programData) {
        const userProgramData = await getUserProgram(profile.id, programData.id);
        setUserProgram(userProgramData);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProgram = async () => {
    if (!profile || !program) {
      alert('Please sign in to start a program');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setEnrolling(true);
    try {
      const result = await enrollInProgram({
        userId: profile.id,
        programId: program.id,
        totalWorkouts: program.total_workouts,
      });

      if (result) {
        setUserProgram(result);
        // TODO: Navigate to first workout or program dashboard
        console.log('Successfully enrolled in program!');
        alert('Program started! Ready to crush it? 💪');
      } else {
        alert('Failed to start program. Please try again.');
      }
    } catch (error) {
      console.error('Error starting program:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinueProgram = async () => {
    console.log('🚀 Continue Program clicked!');
    console.log('📝 Profile:', profile?.id);
    console.log('📝 Program:', program?.id, program?.name);
    console.log('📝 UserProgram:', userProgram?.id, userProgram?.status);

    if (!profile || !program || !userProgram) {
      console.log('❌ Missing data for continue:', {
        hasProfile: !!profile,
        hasProgram: !!program,
        hasUserProgram: !!userProgram,
      });
      alert('Unable to continue program');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Navigate to Program Dashboard (complete with insights)
    const navigationPath = `/programs/${program.id}/dashboard`;
    const navigationParams = {
      userProgramId: userProgram.id,
    };

    console.log('🧭 Navigating to:', navigationPath);
    console.log('📦 With params:', navigationParams);

    router.push({
      pathname: navigationPath as any,
      params: navigationParams,
    });

    console.log('✅ Navigation called');
  };

  const handleSaveProgram = async () => {
    if (!profile || !program) {
      alert('Please sign in to save programs');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSaving(true);
    try {
      const result = await saveProgram({
        userId: profile.id,
        programId: program.id,
      });

      if (result) {
        setUserProgram(result);
        console.log(result.is_saved ? 'Program saved!' : 'Program unsaved!');
      } else {
        alert('Failed to save program. Please try again.');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const difficultyColors = {
    beginner: theme.colors.success[500],
    intermediate: theme.colors.warning[500],
    advanced: theme.colors.error[500],
    expert: theme.colors.primary[500],
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

        {/* Header Skeleton */}
        <View style={{ height: HEADER_HEIGHT, backgroundColor: bgColors.surface }}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BlurView intensity={80} tint={theme.isDark ? 'dark' : 'light'} style={styles.backButtonBlur}>
              <Ionicons name="chevron-back" size={24} color={textColors.primary} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Content Skeleton */}
        <ScrollView style={styles.content} contentContainerStyle={{ padding: 24 }}>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="alert-circle-outline" size={64} color={textColors.tertiary} />
        <Text style={[styles.errorText, { color: textColors.secondary }]}>Program not found</Text>
        <Button onPress={handleBack} style={{ marginTop: 24 }}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.header}>
          {/* Background Image with Gradient Overlay */}
          {program.thumbnail_url && (
            <>
              <Image
                source={{ uri: program.thumbnail_url }}
                style={styles.headerImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                style={styles.headerGradient}
              />
            </>
          )}

          {/* Back Button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BlurView intensity={80} tint="dark" style={styles.backButtonBlur}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>

          {/* Header Content */}
          <View style={styles.headerContent}>
            {/* Badges */}
            <View style={styles.headerBadges}>
              <View
                style={{
                  backgroundColor: (difficultyColors[program.difficulty_level as keyof typeof difficultyColors] || theme.colors.primary[500]) + '30',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: difficultyColors[program.difficulty_level as keyof typeof difficultyColors] || theme.colors.primary[500],
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                  {program.difficulty_level}
                </Text>
              </View>
              {program.is_premium && (
                <View
                  style={{
                    backgroundColor: theme.colors.warning[500] + '30',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.warning[500],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="star" size={14} color={theme.colors.warning[500]} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>PREMIUM</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.headerTitle}>{program.name}</Text>

            {/* Quick Stats */}
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Ionicons name="calendar" size={16} color="#FFFFFF" />
                <Text style={styles.headerStatText}>{program.duration_weeks} weeks</Text>
              </View>
              <View style={styles.headerStat}>
                <Ionicons name="barbell" size={16} color="#FFFFFF" />
                <Text style={styles.headerStatText}>{program.workouts_per_week}x/week</Text>
              </View>
              <View style={styles.headerStat}>
                <Ionicons name="time" size={16} color="#FFFFFF" />
                <Text style={styles.headerStatText}>{program.estimated_time_per_workout} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <AnimatedCard index={0} variant="glass" style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="star" size={24} color={theme.colors.warning[500]} />
                <Text style={[styles.statCardValue, { color: textColors.primary }]}>
                  {parseFloat(program.average_rating).toFixed(1)}
                </Text>
                <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Rating</Text>
              </View>
            </AnimatedCard>

            <AnimatedCard index={1} variant="glass" style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success[500]} />
                <Text style={[styles.statCardValue, { color: textColors.primary }]}>
                  {parseFloat(program.completion_rate).toFixed(0)}%
                </Text>
                <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Completion</Text>
              </View>
            </AnimatedCard>

            <AnimatedCard index={2} variant="glass" style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="people" size={24} color={theme.colors.primary[500]} />
                <Text style={[styles.statCardValue, { color: textColors.primary }]}>
                  {program.enrolled_count || 0}
                </Text>
                <Text style={[styles.statCardLabel, { color: textColors.tertiary }]}>Enrolled</Text>
              </View>
            </AnimatedCard>
          </View>

          {/* Description */}
          <AnimatedCard index={3} variant="glass" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={theme.colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>About This Program</Text>
            </View>
            <Text style={[styles.description, { color: textColors.secondary }]}>
              {program.description}
            </Text>
          </AnimatedCard>

          {/* Target Goals */}
          {program.target_goals && program.target_goals.length > 0 && (
            <AnimatedCard index={4} variant="glass" style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flag" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Target Goals</Text>
              </View>
              <View style={styles.goalsList}>
                {program.target_goals.map((goal: string, index: number) => (
                  <View key={index} style={[styles.goalChip, { backgroundColor: bgColors.surface }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />
                    <Text style={[styles.goalText, { color: textColors.primary }]}>
                      {goal.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Fitness Levels */}
          {program.target_fitness_levels && program.target_fitness_levels.length > 0 && (
            <AnimatedCard index={5} variant="glass" style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="fitness" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Fitness Levels</Text>
              </View>
              <View style={styles.goalsList}>
                {program.target_fitness_levels.map((level: string, index: number) => (
                  <View key={index} style={[styles.goalChip, { backgroundColor: bgColors.surface }]}>
                    <Ionicons name="body" size={16} color={theme.colors.primary[500]} />
                    <Text style={[styles.goalText, { color: textColors.primary }]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Program Details */}
          <AnimatedCard index={6} variant="glass" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Program Details</Text>
            </View>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColors.tertiary }]}>Total Workouts</Text>
                <Text style={[styles.detailValue, { color: textColors.primary }]}>
                  {program.total_workouts}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: bgColors.border }]}>
                <Text style={[styles.detailLabel, { color: textColors.tertiary }]}>Duration</Text>
                <Text style={[styles.detailValue, { color: textColors.primary }]}>
                  {program.duration_weeks} weeks
                </Text>
              </View>
              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: bgColors.border }]}>
                <Text style={[styles.detailLabel, { color: textColors.tertiary }]}>Frequency</Text>
                <Text style={[styles.detailValue, { color: textColors.primary }]}>
                  {program.workouts_per_week} times per week
                </Text>
              </View>
              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: bgColors.border }]}>
                <Text style={[styles.detailLabel, { color: textColors.tertiary }]}>Time per Session</Text>
                <Text style={[styles.detailValue, { color: textColors.primary }]}>
                  ~{program.estimated_time_per_workout} minutes
                </Text>
              </View>
            </View>
          </AnimatedCard>

          {/* Workouts List */}
          {programWorkouts && programWorkouts.length > 0 && (
            <View style={[{ backgroundColor: bgColors.surface, borderRadius: 20, padding: 20, marginTop: 16 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="barbell-outline" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
                  Program Workouts ({programWorkouts.length})
                </Text>
              </View>

              <View style={styles.workoutsList}>
                {programWorkouts?.map((workout: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.workoutItem,
                      index < (programWorkouts?.length || 0) - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: bgColors.border,
                      }
                    ]}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      // Navigate to workout detail with program context
                      router.push({
                        pathname: `/workouts/[id]`,
                        params: {
                          id: workout.workout_id,
                          programId: program?.id,
                          programName: program?.name,
                          weekNumber: workout.week_number,
                          dayNumber: workout.day_number,
                          workoutName: workout.name,
                          workoutDescription: workout.description || '',
                        }
                      } as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.workoutItemLeft}>
                      <View style={[styles.workoutWeekBadge, { backgroundColor: theme.colors.primary[500] + '20' }]}>
                        <Text style={[styles.workoutWeekText, { color: theme.colors.primary[500] }]}>
                          W{workout.week_number}D{workout.day_number}
                        </Text>
                      </View>
                      <View style={styles.workoutItemContent}>
                        <Text style={[styles.workoutItemName, { color: textColors.primary }]}>
                          {workout.name}
                        </Text>
                        {workout.description && (
                          <Text style={[styles.workoutItemDesc, { color: textColors.secondary }]} numberOfLines={1}>
                            {workout.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating CTA Buttons */}
      <View style={[styles.ctaContainer, { backgroundColor: bgColors.bg }]}>
        <LinearGradient
          colors={['transparent', bgColors.bg]}
          style={styles.ctaGradient}
        />

        <View style={styles.ctaButtonsRow}>
          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveProgram}
            style={styles.saveButton}
            activeOpacity={0.8}
            disabled={saving}
          >
            <BlurView
              intensity={80}
              tint={theme.isDark ? 'dark' : 'light'}
              style={styles.saveButtonBlur}
            >
              {saving ? (
                <ActivityIndicator size="small" color={textColors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={isSaved ? theme.colors.primary[500] : textColors.primary}
                  />
                  <Text style={[styles.saveButtonText, { color: textColors.primary }]}>
                    {isSaved ? 'Saved' : 'Save'}
                  </Text>
                </>
              )}
            </BlurView>
          </TouchableOpacity>

          {/* Start/Continue Button */}
          <TouchableOpacity
            onPress={isActive ? handleContinueProgram : handleStartProgram}
            style={styles.startButton}
            activeOpacity={0.8}
            disabled={enrolling}
          >
            <LinearGradient
              colors={
                isActive
                  ? [theme.colors.success[500], theme.colors.success[600]]
                  : [theme.colors.primary[500], theme.colors.primary[600]]
              }
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {enrolling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.startButtonText}>
                    {isActive ? 'Continue Program' : 'Start Program'}
                  </Text>
                  <Ionicons name={isActive ? 'play' : 'arrow-forward'} size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 0,
  },
  header: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT * 0.7,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 16,
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 38,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 20,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    marginTop: -30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 0,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  goalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsList: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  ctaGradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  ctaButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  startButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  workoutsList: {
    marginTop: 12,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  workoutItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutWeekBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workoutWeekText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  workoutItemContent: {
    flex: 1,
  },
  workoutItemName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  workoutItemDesc: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
});
