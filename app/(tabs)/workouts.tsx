/**
 * Workouts Screen - REVOLUTIONARY 2-SEGMENT ARCHITECTURE
 *
 * INNOVATION:
 * - Dual-mode view: Programs ↔️ Exercises (Segment Control)
 * - Programs: Browse curated workout programs (beginner → elite)
 * - Exercises: Comprehensive exercise library with advanced filters
 * - Seamless transitions, 60fps animations
 * - Apple-grade UX with haptic feedback
 *
 * Features:
 * - Segment control to switch modes
 * - Programs: Visual cards with difficulty badges, enrolled count
 * - Exercises: FlashList with search, category/difficulty filters
 * - Pull-to-refresh both modes
 * - Skeleton loaders
 * - Dark mode support
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useStyledTheme } from '@theme/ThemeProvider';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import {
  getWorkoutPrograms,
  getExercises,
  type WorkoutProgram,
  type Exercise,
  type WorkoutProgramFilters,
  type ExerciseFilters,
} from '@/services/drizzle/workouts';
import { getUserPrograms, type UserProgram } from '@/services/drizzle/user-programs';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

const { width } = Dimensions.get('window');

// Segment options
type SegmentType = 'programs' | 'exercises';

// Exercise filters
const EXERCISE_CATEGORIES = [
  { value: 'all', label: 'All', icon: 'apps-outline' },
  { value: 'chest', label: 'Chest', icon: 'fitness-outline' },
  { value: 'back', label: 'Back', icon: 'reorder-four-outline' },
  { value: 'shoulders', label: 'Shoulders', icon: 'diamond-outline' },
  { value: 'arms', label: 'Arms', icon: 'barbell-outline' },
  { value: 'legs', label: 'Legs', icon: 'walk-outline' },
  { value: 'core', label: 'Core', icon: 'radio-button-off-outline' },
  { value: 'cardio', label: 'Cardio', icon: 'heart-outline' },
];

const DIFFICULTIES = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

// Quick filter options (shortcuts for common use cases)
const QUICK_FILTERS = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'popular', label: 'Popular', icon: 'flame' },
  { value: 'free', label: 'Free', icon: 'gift' },
  { value: 'quick', label: 'Quick', icon: 'flash' },
  { value: 'intense', label: 'Intense', icon: 'fitness' },
];

export default function WorkoutsScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { profile } = useClerkAuth();

  // INNOVATION: Dual-mode state
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('programs');

  // My Programs state (active programs)
  const [myPrograms, setMyPrograms] = useState<UserProgram[]>([]);
  const [myProgramsLoading, setMyProgramsLoading] = useState(true);
  const [myProgramsRefreshing, setMyProgramsRefreshing] = useState(false);

  // Store program data for thumbnails
  const [programsMap, setProgramsMap] = useState<Map<string, WorkoutProgram>>(new Map());

  // Animation value for card entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Collapsible header animation - PROGRESSIVE & SMOOTH
  const scrollYAnimated = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerVisible = useRef(true);

  // Thresholds for smooth behavior
  const SCROLL_THRESHOLD_HIDE = 100; // Start hiding after 100px scroll
  const SCROLL_THRESHOLD_SHOW = 50; // Show when scrolling up 50px
  const HEADER_MAX_HEIGHT = 200; // Total header height when visible
  const MY_PROGRAMS_MAX_HEIGHT = 180; // My Programs section height

  // Programs state
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsRefreshing, setProgramsRefreshing] = useState(false);
  const [programsPage, setProgramsPage] = useState(0);
  const [programsHasMore, setProgramsHasMore] = useState(true);
  const [programsLoadingMore, setProgramsLoadingMore] = useState(false);

  // Exercises state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesRefreshing, setExercisesRefreshing] = useState(false);
  const [exercisesPage, setExercisesPage] = useState(0);
  const [exercisesHasMore, setExercisesHasMore] = useState(true);
  const [exercisesLoadingMore, setExercisesLoadingMore] = useState(false);

  // Filters
  const [programSearch, setProgramSearch] = useState('');
  const [programDifficulty, setProgramDifficulty] = useState<string>('all');
  const [programQuickFilter, setProgramQuickFilter] = useState<string>('all');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState<string>('all');
  const [exerciseDifficulty, setExerciseDifficulty] = useState<string>('all');
  const [exerciseQuickFilter, setExerciseQuickFilter] = useState<string>('all');

  const [error, setError] = useState<string | null>(null);

  // Pagination constants
  const PROGRAMS_PAGE_SIZE = 20;
  const EXERCISES_PAGE_SIZE = 30;

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

  // Fetch programs (with pagination)
  const fetchPrograms = async (isRefresh = false) => {
    const filters: WorkoutProgramFilters = {
      difficulty: programDifficulty !== 'all' ? programDifficulty : undefined,
      search: programSearch || undefined,
      limit: PROGRAMS_PAGE_SIZE,
      offset: 0,
    };

    try {
      if (isRefresh) setProgramsRefreshing(true);
      else setProgramsLoading(true);

      setError(null);

      logger.debug('[Workouts] Fetching programs', { filters });
      const data = await getWorkoutPrograms(filters);
      logger.debug('[Workouts] Programs fetched', { count: data.length });

      setPrograms(data);
      setProgramsPage(0);
      setProgramsHasMore(data.length === PROGRAMS_PAGE_SIZE);
    } catch (err) {
      logger.error('[Workouts] Failed to fetch programs', err instanceof Error ? err : undefined, { filters });
      setError('Failed to load programs. Please try again.');
    } finally {
      setProgramsLoading(false);
      setProgramsRefreshing(false);
    }
  };

  // Fetch exercises (with pagination)
  const fetchExercises = async (isRefresh = false) => {
    const filters: ExerciseFilters = {
      category: exerciseCategory !== 'all' ? exerciseCategory : undefined,
      difficulty: exerciseDifficulty !== 'all' ? exerciseDifficulty : undefined,
      limit: EXERCISES_PAGE_SIZE,
      offset: 0,
    };

    try {
      if (isRefresh) setExercisesRefreshing(true);
      else setExercisesLoading(true);

      setError(null);

      logger.debug('[Workouts] Fetching exercises', { filters });
      const data = await getExercises(filters);
      logger.debug('[Workouts] Exercises fetched', { count: data.length });

      setExercises(data);
      setExercisesPage(0);
      setExercisesHasMore(data.length === EXERCISES_PAGE_SIZE);
    } catch (err) {
      logger.error('[Workouts] Failed to fetch exercises', err instanceof Error ? err : undefined, { filters });
      setError('Failed to load exercises. Please try again.');
    } finally {
      setExercisesLoading(false);
      setExercisesRefreshing(false);
    }
  };

  // Load more programs (infinite scroll)
  const loadMorePrograms = async () => {
    if (!programsHasMore || programsLoadingMore) return;

    try {
      setProgramsLoadingMore(true);

      const nextPage = programsPage + 1;
      const filters: WorkoutProgramFilters = {
        difficulty: programDifficulty !== 'all' ? programDifficulty : undefined,
        search: programSearch || undefined,
        limit: PROGRAMS_PAGE_SIZE,
        offset: nextPage * PROGRAMS_PAGE_SIZE,
      };

      logger.debug('[Workouts] Loading more programs', { page: nextPage, filters });
      const data = await getWorkoutPrograms(filters);
      logger.debug('[Workouts] More programs fetched', { count: data.length });

      setPrograms((prev) => [...prev, ...data]);
      setProgramsPage(nextPage);
      setProgramsHasMore(data.length === PROGRAMS_PAGE_SIZE);
    } catch (err) {
      logger.error('[Workouts] Failed to load more programs', err instanceof Error ? err : undefined);
    } finally {
      setProgramsLoadingMore(false);
    }
  };

  // Load more exercises (infinite scroll)
  const loadMoreExercises = async () => {
    if (!exercisesHasMore || exercisesLoadingMore) return;

    try {
      setExercisesLoadingMore(true);

      const nextPage = exercisesPage + 1;
      const filters: ExerciseFilters = {
        category: exerciseCategory !== 'all' ? exerciseCategory : undefined,
        difficulty: exerciseDifficulty !== 'all' ? exerciseDifficulty : undefined,
        limit: EXERCISES_PAGE_SIZE,
        offset: nextPage * EXERCISES_PAGE_SIZE,
      };

      logger.debug('[Workouts] Loading more exercises', { page: nextPage, filters });
      const data = await getExercises(filters);
      logger.debug('[Workouts] More exercises fetched', { count: data.length });

      setExercises((prev) => [...prev, ...data]);
      setExercisesPage(nextPage);
      setExercisesHasMore(data.length === EXERCISES_PAGE_SIZE);
    } catch (err) {
      logger.error('[Workouts] Failed to load more exercises', err instanceof Error ? err : undefined);
    } finally {
      setExercisesLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (selectedSegment === 'programs') {
      fetchPrograms();
    } else {
      fetchExercises();
    }
  }, [selectedSegment]);

  // Fetch user's active programs
  useEffect(() => {
    fetchMyPrograms();
  }, [profile?.id]);

  const fetchMyPrograms = async (isRefresh = false) => {
    if (!profile?.id) {
      setMyProgramsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setMyProgramsRefreshing(true);
        Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setMyProgramsLoading(true);
      }

      // Fetch user programs and all program data
      const [userPrograms, allPrograms] = await Promise.all([
        getUserPrograms(profile.id),
        getWorkoutPrograms(),
      ]);

      // Filter only active programs
      const activePrograms = userPrograms.filter(
        (p) => p.status === 'active' || p.status === 'paused'
      );

      // Create map of program_id -> WorkoutProgram for fast lookup
      const map = new Map<string, WorkoutProgram>();
      allPrograms.forEach((program) => {
        map.set(program.id, program);
      });

      setMyPrograms(activePrograms);
      setProgramsMap(map);
      console.log('✅ My Programs loaded:', activePrograms.length);

      // Animate cards entrance
      if (!isRefresh && activePrograms.length > 0) {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error fetching my programs:', error);
    } finally {
      setMyProgramsLoading(false);
      setMyProgramsRefreshing(false);
    }
  };

  // Refetch on filter change
  useEffect(() => {
    if (selectedSegment === 'programs' && !programsLoading) {
      fetchPrograms();
    }
  }, [programDifficulty, programSearch]);

  useEffect(() => {
    if (selectedSegment === 'exercises' && !exercisesLoading) {
      fetchExercises();
    }
  }, [exerciseCategory, exerciseDifficulty]);

  // Filter programs by quick filter
  const filteredPrograms = useMemo(() => {
    let result = [...programs];

    // Apply quick filter
    switch (programQuickFilter) {
      case 'popular':
        // Sort by enrolled_count (highest first)
        result.sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0));
        break;
      case 'free':
        // Only non-premium programs
        result = result.filter(p => !p.is_premium);
        break;
      case 'quick':
        // Programs with duration <= 6 weeks
        result = result.filter(p => p.duration_weeks <= 6);
        break;
      case 'intense':
        // Advanced or expert difficulty
        result = result.filter(p => p.difficulty_level === 'advanced' || p.difficulty_level === 'expert');
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    return result;
  }, [programs, programQuickFilter]);

  // Filter exercises by search and quick filter
  const filteredExercises = useMemo(() => {
    let result = [...exercises];

    // Apply quick filter first
    switch (exerciseQuickFilter) {
      case 'popular':
        // Assuming exercises don't have enrolled_count, we can use a placeholder logic
        // For now, just return as-is (can be enhanced later)
        break;
      case 'free':
        // Only non-premium exercises
        result = result.filter(e => !e.is_premium);
        break;
      case 'quick':
        // Exercises with no equipment or bodyweight
        result = result.filter(e => !e.equipment || e.equipment === 'bodyweight');
        break;
      case 'intense':
        // Advanced or expert difficulty
        result = result.filter(e => e.difficulty_level === 'advanced' || e.difficulty_level === 'expert');
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Then apply search filter
    if (exerciseSearch.trim()) {
      const query = exerciseSearch.toLowerCase();
      result = result.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(query) ||
          exercise.description?.toLowerCase().includes(query) ||
          exercise.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [exercises, exerciseSearch, exerciseQuickFilter]);

  // PROGRESSIVE INTERPOLATIONS for smooth animations (defined early for use in render functions)
  const headerTranslateY = useMemo(
    () =>
      scrollYAnimated.interpolate({
        inputRange: [0, SCROLL_THRESHOLD_HIDE, SCROLL_THRESHOLD_HIDE + 100],
        outputRange: [0, -HEADER_MAX_HEIGHT, -HEADER_MAX_HEIGHT],
        extrapolate: 'clamp',
      }),
    [scrollYAnimated]
  );

  const headerOpacity = useMemo(
    () =>
      scrollYAnimated.interpolate({
        inputRange: [0, SCROLL_THRESHOLD_HIDE - 50, SCROLL_THRESHOLD_HIDE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      }),
    [scrollYAnimated]
  );

  const myProgramsTranslateY = useMemo(
    () =>
      scrollYAnimated.interpolate({
        inputRange: [0, SCROLL_THRESHOLD_HIDE, SCROLL_THRESHOLD_HIDE + 100],
        outputRange: [0, -MY_PROGRAMS_MAX_HEIGHT, -MY_PROGRAMS_MAX_HEIGHT],
        extrapolate: 'clamp',
      }),
    [scrollYAnimated]
  );

  const myProgramsOpacity = useMemo(
    () =>
      scrollYAnimated.interpolate({
        inputRange: [0, SCROLL_THRESHOLD_HIDE - 50, SCROLL_THRESHOLD_HIDE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      }),
    [scrollYAnimated]
  );

  // Render footer with loading indicator
  const renderListFooter = (isLoading: boolean) => {
    if (!isLoading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        <Text style={[styles.footerText, { color: textColors.secondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  // Handle scroll - SMOOTH & PROGRESSIVE (Apple/Instagram style)
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollYAnimated } } }],
      {
        useNativeDriver: false,
        listener: (event: any) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          const delta = currentScrollY - lastScrollY.current;

          // Scrolling down
          if (delta > 0) {
            if (currentScrollY > SCROLL_THRESHOLD_HIDE && headerVisible.current) {
              // Start hiding header progressively
              headerVisible.current = false;
            }
          }
          // Scrolling up
          else if (delta < 0) {
            // Show header if scrolled up significantly OR if at top
            if (currentScrollY < SCROLL_THRESHOLD_SHOW || !headerVisible.current) {
              headerVisible.current = true;
            }
          }

          lastScrollY.current = currentScrollY;
        },
      }
    ),
    [scrollYAnimated]
  );

  // Handlers
  const handleSegmentChange = (segment: SegmentType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSegment(segment);
  };

  const handleRefresh = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedSegment === 'programs') {
      fetchPrograms(true);
    } else {
      fetchExercises(true);
    }
  };

  const handleProgramPress = (programId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/programs/${programId}` as any);
  };

  const handleExercisePress = (exerciseId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/exercises/${exerciseId}` as any);
  };

  // INNOVATION: Render Segment Control
  const renderSegmentControl = () => {
    return (
      <View style={[styles.segmentControl, { backgroundColor: bgColors.surface }]}>
        <TouchableOpacity
          onPress={() => handleSegmentChange('programs')}
          style={[
            styles.segmentButton,
            selectedSegment === 'programs' && [
              styles.segmentButtonActive,
              { backgroundColor: theme.colors.primary[500] },
            ],
          ]}
        >
          <Ionicons
            name="list"
            size={14}
            color={selectedSegment === 'programs' ? '#FFFFFF' : textColors.secondary}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: selectedSegment === 'programs' ? '#FFFFFF' : textColors.secondary,
              },
            ]}
          >
            Programs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSegmentChange('exercises')}
          style={[
            styles.segmentButton,
            selectedSegment === 'exercises' && [
              styles.segmentButtonActive,
              { backgroundColor: theme.colors.primary[500] },
            ],
          ]}
        >
          <Ionicons
            name="fitness"
            size={14}
            color={selectedSegment === 'exercises' ? '#FFFFFF' : textColors.secondary}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: selectedSegment === 'exercises' ? '#FFFFFF' : textColors.secondary,
              },
            ]}
          >
            Exercises
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // INNOVATION: Render Program Card
  const renderProgramCard = useCallback(
    ({ item, index }: { item: WorkoutProgram; index: number }) => {
      const difficultyColors = {
        beginner: theme.colors.success[500],
        intermediate: theme.colors.warning[500],
        advanced: theme.colors.error[500],
        expert: theme.colors.primary[500],
      };

      return (
        <TouchableOpacity
          onPress={() => handleProgramPress(item.id)}
          activeOpacity={0.9}
          style={{ marginBottom: 20 }}
        >
          <View style={[styles.premiumProgramCard, { backgroundColor: bgColors.card }]}>
            {/* Hero Image with Gradient Overlay */}
            <View style={styles.programImageContainer}>
              {item.thumbnail_url && (
                <>
                  <Image
                    source={{ uri: item.thumbnail_url }}
                    style={styles.programImagePremium}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.programImageGradient}
                  />
                </>
              )}

              {/* Floating Badges */}
              <View style={styles.floatingBadges}>
                <BlurView
                  intensity={80}
                  tint={theme.isDark ? 'dark' : 'light'}
                  style={[
                    styles.difficultyBadge,
                    { borderColor: difficultyColors[item.difficulty_level] },
                  ]}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: difficultyColors[item.difficulty_level],
                      marginRight: 6,
                    }}
                  />
                  <Text style={[styles.difficultyTextPremium, { color: difficultyColors[item.difficulty_level] }]}>
                    {item.difficulty_level.toUpperCase()}
                  </Text>
                </BlurView>

                {item.is_premium && (
                  <BlurView intensity={80} tint={theme.isDark ? 'dark' : 'light'} style={styles.premiumBadgeBlur}>
                    <Ionicons name="star" size={12} color={theme.colors.warning[500]} />
                    <Text style={[styles.premiumBadgeText, { color: theme.colors.warning[500] }]}>PREMIUM</Text>
                  </BlurView>
                )}
              </View>

              {/* Image Overlay Content */}
              <View style={styles.imageOverlayContent}>
                <Text style={styles.programNamePremium} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <Ionicons name="calendar" size={14} color="#FFFFFF" />
                    <Text style={styles.quickStatText}>{item.duration_weeks}w</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="barbell" size={14} color="#FFFFFF" />
                    <Text style={styles.quickStatText}>{item.workouts_per_week}x/wk</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="time" size={14} color="#FFFFFF" />
                    <Text style={styles.quickStatText}>{item.estimated_time_per_workout}min</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card Content */}
            <View style={styles.premiumProgramContent}>
              {/* Description */}
              {item.description && (
                <Text style={[styles.programDescriptionPremium, { color: textColors.secondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {/* Stats Grid */}
              <View style={styles.statsGridPremium}>
                {item.average_rating && (
                  <View style={[styles.statBubble, { backgroundColor: bgColors.surface }]}>
                    <Ionicons name="star" size={16} color={theme.colors.warning[500]} />
                    <Text style={[styles.statBubbleValue, { color: textColors.primary }]}>
                      {parseFloat(item.average_rating).toFixed(1)}
                    </Text>
                    <Text style={[styles.statBubbleLabel, { color: textColors.tertiary }]}>Rating</Text>
                  </View>
                )}

                {item.completion_rate && (
                  <View style={[styles.statBubble, { backgroundColor: bgColors.surface }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />
                    <Text style={[styles.statBubbleValue, { color: textColors.primary }]}>
                      {parseFloat(item.completion_rate).toFixed(0)}%
                    </Text>
                    <Text style={[styles.statBubbleLabel, { color: textColors.tertiary }]}>Done</Text>
                  </View>
                )}

                <View style={[styles.statBubble, { backgroundColor: bgColors.surface }]}>
                  <Ionicons name="people" size={16} color={theme.colors.primary[500]} />
                  <Text style={[styles.statBubbleValue, { color: textColors.primary }]}>
                    {item.enrolled_count && item.enrolled_count > 1000
                      ? `${(item.enrolled_count / 1000).toFixed(1)}k`
                      : item.enrolled_count || 0}
                  </Text>
                  <Text style={[styles.statBubbleLabel, { color: textColors.tertiary }]}>Joined</Text>
                </View>
              </View>
            </View>

            {/* Chevron */}
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [theme, bgColors, textColors, router]
  );

  // Render Exercise Card
  const renderExerciseCard = useCallback(
    ({ item }: { item: Exercise }) => {
      return (
        <Pressable
          onPress={() => handleExercisePress(item.id)}
          style={({ pressed }) => [
            styles.exerciseCard,
            {
              backgroundColor: bgColors.card,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {/* Exercise Image */}
          {item.thumbnail_url && (
            <Image source={{ uri: item.thumbnail_url }} style={styles.exerciseImage} />
          )}

          {/* Exercise Info */}
          <View style={styles.exerciseContent}>
            <View style={styles.exerciseHeader}>
              <Text style={[styles.exerciseName, { color: textColors.primary }]} numberOfLines={2}>
                {item.name}
              </Text>
              {item.is_premium && (
                <View style={[styles.premiumBadge, { backgroundColor: theme.colors.warning[500] }]}>
                  <Ionicons name="star" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            {item.description && (
              <Text style={[styles.exerciseDescription, { color: textColors.secondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Exercise Stats */}
            <View style={styles.exerciseStats}>
              <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                <Ionicons name="fitness-outline" size={14} color={textColors.secondary} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {item.category}
                </Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                <Ionicons name="speedometer-outline" size={14} color={textColors.secondary} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {item.difficulty_level}
                </Text>
              </View>

              {item.equipment && (
                <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                  <Ionicons name="barbell-outline" size={14} color={textColors.secondary} />
                  <Text style={[styles.statText, { color: textColors.secondary }]}>
                    {item.equipment}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
        </Pressable>
      );
    },
    [theme, bgColors, textColors, router]
  );

  // Render Compact Filters (Dropdown style)
  const renderCompactFilters = () => {
    const isPrograms = selectedSegment === 'programs';

    return (
      <View style={styles.compactFiltersContainer}>
        {/* Category Filter (Exercises only) */}
        {!isPrograms && (
          <TouchableOpacity
            style={[styles.filterDropdown, { backgroundColor: bgColors.surface, borderColor: bgColors.border }]}
            onPress={() => {
              // Cycle through categories
              const currentIndex = EXERCISE_CATEGORIES.findIndex((c) => c.value === exerciseCategory);
              const nextIndex = (currentIndex + 1) % EXERCISE_CATEGORIES.length;
              setExerciseCategory(EXERCISE_CATEGORIES[nextIndex].value);
              Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons
              name={EXERCISE_CATEGORIES.find((c) => c.value === exerciseCategory)?.icon as any || 'apps-outline'}
              size={16}
              color={exerciseCategory === 'all' ? textColors.tertiary : theme.colors.primary[500]}
            />
            <Text
              style={[
                styles.filterDropdownText,
                { color: exerciseCategory === 'all' ? textColors.secondary : textColors.primary },
              ]}
              numberOfLines={1}
            >
              {EXERCISE_CATEGORIES.find((c) => c.value === exerciseCategory)?.label || 'All'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={textColors.tertiary} />
          </TouchableOpacity>
        )}

        {/* Difficulty Filter */}
        <TouchableOpacity
          style={[styles.filterDropdown, { backgroundColor: bgColors.surface, borderColor: bgColors.border }]}
          onPress={() => {
            const difficulty = isPrograms ? programDifficulty : exerciseDifficulty;
            const setDifficulty = isPrograms ? setProgramDifficulty : setExerciseDifficulty;
            const currentIndex = DIFFICULTIES.findIndex((d) => d.value === difficulty);
            const nextIndex = (currentIndex + 1) % DIFFICULTIES.length;
            setDifficulty(DIFFICULTIES[nextIndex].value);
            Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={
              (isPrograms ? programDifficulty : exerciseDifficulty) === 'all'
                ? textColors.tertiary
                : theme.colors.secondary[500]
            }
          />
          <Text
            style={[
              styles.filterDropdownText,
              {
                color:
                  (isPrograms ? programDifficulty : exerciseDifficulty) === 'all'
                    ? textColors.secondary
                    : textColors.primary,
              },
            ]}
            numberOfLines={1}
          >
            {DIFFICULTIES.find((d) => d.value === (isPrograms ? programDifficulty : exerciseDifficulty))?.label ||
              'All'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={textColors.tertiary} />
        </TouchableOpacity>

        {/* Quick Filter */}
        <TouchableOpacity
          style={[styles.filterDropdown, { backgroundColor: bgColors.surface, borderColor: bgColors.border }]}
          onPress={() => {
            const quickFilter = isPrograms ? programQuickFilter : exerciseQuickFilter;
            const setQuickFilter = isPrograms ? setProgramQuickFilter : setExerciseQuickFilter;
            const currentIndex = QUICK_FILTERS.findIndex((f) => f.value === quickFilter);
            const nextIndex = (currentIndex + 1) % QUICK_FILTERS.length;
            setQuickFilter(QUICK_FILTERS[nextIndex].value);
            Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name={QUICK_FILTERS.find((f) => f.value === (isPrograms ? programQuickFilter : exerciseQuickFilter))?.icon as any || 'apps'}
            size={16}
            color={
              (isPrograms ? programQuickFilter : exerciseQuickFilter) === 'all'
                ? textColors.tertiary
                : theme.colors.primary[500]
            }
          />
          <Text
            style={[
              styles.filterDropdownText,
              {
                color:
                  (isPrograms ? programQuickFilter : exerciseQuickFilter) === 'all'
                    ? textColors.secondary
                    : textColors.primary,
              },
            ]}
            numberOfLines={1}
          >
            {QUICK_FILTERS.find((f) => f.value === (isPrograms ? programQuickFilter : exerciseQuickFilter))?.label || 'All'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={textColors.tertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render Program Skeleton Loader
  const renderProgramSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(3)].map((_, index) => (
          <View key={index} style={[styles.programCard, { backgroundColor: bgColors.card }]}>
            {/* Thumbnail skeleton */}
            <Skeleton variant="rect" width={100} height={100} borderRadius={12} />

            <View style={styles.programContent}>
              {/* Header with badges */}
              <View style={styles.programHeader}>
                <Skeleton variant="rect" width={80} height={22} borderRadius={12} />
                <Skeleton variant="rect" width={60} height={22} borderRadius={12} />
              </View>

              {/* Title */}
              <Skeleton variant="text" width="85%" height={22} style={{ marginTop: 12, marginBottom: 8 }} />

              {/* Description (2 lines) */}
              <Skeleton variant="text" width="100%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton variant="text" width="70%" height={14} style={{ marginBottom: 12 }} />

              {/* Stats */}
              <View style={styles.programStats}>
                <View style={styles.programStat}>
                  <Skeleton variant="circle" width={14} height={14} />
                  <Skeleton variant="text" width={50} height={14} style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.programStat}>
                  <Skeleton variant="circle" width={14} height={14} />
                  <Skeleton variant="text" width={50} height={14} style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.programStat}>
                  <Skeleton variant="circle" width={14} height={14} />
                  <Skeleton variant="text" width={30} height={14} style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render Exercise Skeleton Loader
  const renderExerciseSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={[styles.exerciseCard, { backgroundColor: bgColors.card }]}>
            {/* Thumbnail skeleton */}
            <Skeleton variant="rect" width={80} height={80} borderRadius={12} />

            {/* Content */}
            <View style={styles.exerciseContent}>
              {/* Title */}
              <View style={styles.exerciseHeader}>
                <Skeleton variant="text" width="70%" height={18} style={{ marginBottom: 8 }} />
              </View>

              {/* Description (2 lines) */}
              <Skeleton variant="text" width="100%" height={14} style={{ marginBottom: 4 }} />
              <Skeleton variant="text" width="60%" height={14} style={{ marginBottom: 12 }} />

              {/* Stats pills */}
              <View style={styles.exerciseStats}>
                <Skeleton variant="rect" width={80} height={24} borderRadius={12} />
                <Skeleton variant="rect" width={70} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
                <Skeleton variant="rect" width={60} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
              </View>
            </View>

            {/* Chevron */}
            <Skeleton variant="circle" width={20} height={20} />
          </View>
        ))}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const isPrograms = selectedSegment === 'programs';
    const loading = isPrograms ? programsLoading : exercisesLoading;

    if (loading) return null;

    // Check if user has active filters (including quick filters)
    const hasActiveFilters = isPrograms
      ? programSearch.length > 0 || programDifficulty !== 'all' || programQuickFilter !== 'all'
      : exerciseSearch.length > 0 || exerciseCategory !== 'all' || exerciseDifficulty !== 'all' || exerciseQuickFilter !== 'all';

    return (
      <View style={styles.emptyState}>
        {/* Large illustration icon */}
        <View style={[styles.emptyIconCircle, { backgroundColor: bgColors.surface }]}>
          <Ionicons
            name={isPrograms ? 'fitness-outline' : 'barbell-outline'}
            size={80}
            color={theme.colors.primary[400]}
          />
        </View>

        {/* Title */}
        <Text style={[styles.emptyTitle, { color: textColors.primary }]}>
          {hasActiveFilters
            ? `No ${isPrograms ? 'programs' : 'exercises'} match your filters`
            : `No ${isPrograms ? 'programs' : 'exercises'} available yet`
          }
        </Text>

        {/* Subtitle with contextual message */}
        <Text style={[styles.emptySubtitle, { color: textColors.secondary }]}>
          {hasActiveFilters
            ? `Try adjusting your ${isPrograms ? 'difficulty level or search' : 'category, difficulty, or search'} to find more results`
            : `${isPrograms ? 'Workout programs' : 'Exercises'} will appear here once the database is populated`
          }
        </Text>

        {/* CTA Buttons */}
        <View style={styles.emptyCTAContainer}>
          {hasActiveFilters ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Clear all filters including quick filters
                  if (isPrograms) {
                    setProgramSearch('');
                    setProgramDifficulty('all');
                    setProgramQuickFilter('all');
                  } else {
                    setExerciseSearch('');
                    setExerciseCategory('all');
                    setExerciseDifficulty('all');
                    setExerciseQuickFilter('all');
                  }
                }}
                style={[styles.emptyCTAPrimary, { backgroundColor: theme.colors.primary[500] }]}
              >
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                <Text style={styles.emptyCTAPrimaryText}>Clear Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleRefresh();
                }}
                style={[styles.emptyCTASecondary, { borderColor: bgColors.border }]}
              >
                <Ionicons name="reload-outline" size={20} color={textColors.primary} />
                <Text style={[styles.emptyCTASecondaryText, { color: textColors.primary }]}>Refresh</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => {
                Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleRefresh();
              }}
              style={[styles.emptyCTAPrimary, { backgroundColor: theme.colors.primary[500] }]}
            >
              <Ionicons name="reload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyCTAPrimaryText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render My Programs section
  const renderMyPrograms = () => {
    if (!profile) return null;

    if (myProgramsLoading) {
      return (
        <View style={styles.myProgramsSection}>
          <Text style={[styles.myProgramsTitle, { color: textColors.primary }]}>My Programs</Text>
          <View style={{ height: 140 }}>
            <Skeleton width={width - 40} height={140} borderRadius={16} />
          </View>
        </View>
      );
    }

    if (myPrograms.length === 0) {
      return null; // Don't show if no active programs
    }

    const showViewAll = myPrograms.length > 3;

    return (
      <Animated.View
        style={[
          styles.myProgramsSection,
          {
            transform: [{ translateY: myProgramsTranslateY }],
            opacity: myProgramsOpacity,
          },
        ]}
      >
        <View style={styles.myProgramsHeader}>
          <Text style={[styles.myProgramsTitle, { color: textColors.primary }]}>My Programs</Text>
          <View style={styles.myProgramsHeaderActions}>
            <TouchableOpacity
              onPress={() => fetchMyPrograms(true)}
              disabled={myProgramsRefreshing}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={myProgramsRefreshing ? textColors.tertiary : theme.colors.primary[500]}
              />
            </TouchableOpacity>
            {showViewAll && (
              <TouchableOpacity
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // TODO: Navigate to full My Programs screen
                  alert('View All Programs\n\nComing soon: Full list view of all your active programs!');
                }}
                style={[styles.viewAllButton, { backgroundColor: theme.colors.primary[500] }]}
              >
                <Text style={styles.viewAllButtonText}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <FlashList
            data={myPrograms}
            renderItem={({ item, index }) => {
              const completionPercentage = Math.round(
                (item.workouts_completed / item.total_workouts) * 100
              );
              const program = programsMap.get(item.program_id);

              return (
                <TouchableOpacity
                  onPress={async () => {
                    Platform.OS === 'ios' &&
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                    // Navigate directly to Dashboard
                    if (program) {
                      router.push({
                        pathname: `/programs/${program.id}/dashboard` as any,
                        params: {
                          userProgramId: item.id,
                        },
                      });
                    }
                  }}
                  activeOpacity={0.9}
                  style={[styles.myProgramCard, { backgroundColor: bgColors.card }]}
                >
                  {/* Program Thumbnail Background */}
                  {program?.thumbnail_url && (
                    <Image
                      source={{ uri: program.thumbnail_url }}
                      style={styles.myProgramThumbnail}
                      resizeMode="cover"
                    />
                  )}

                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={
                      program?.thumbnail_url
                        ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']
                        : [theme.colors.primary[500], theme.colors.primary[600]]
                    }
                    style={styles.myProgramGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    {/* Top Row: Progress Circle + Program Name */}
                    <View style={styles.myProgramTopRow}>
                      <View style={styles.myProgramProgress}>
                        <View style={styles.myProgramProgressCircle}>
                          <Text style={styles.myProgramProgressText}>{completionPercentage}%</Text>
                        </View>
                      </View>

                      <View style={styles.myProgramTopInfo}>
                        {program && (
                          <Text style={styles.myProgramProgramName} numberOfLines={2}>
                            {program.name}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Bottom Row: Week + Stats + Arrow */}
                    <View style={styles.myProgramBottomRow}>
                      <View style={styles.myProgramBottomInfo}>
                        <Text style={styles.myProgramWeek}>Week {item.current_week}</Text>
                        <Text style={styles.myProgramStats}>
                          {item.workouts_completed}/{item.total_workouts} completed
                        </Text>
                      </View>

                      {/* Arrow Button */}
                      <View style={styles.myProgramArrow}>
                        <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.9)" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={myProgramsRefreshing}
                onRefresh={() => fetchMyPrograms(true)}
                tintColor={theme.colors.primary[500]}
                colors={[theme.colors.primary[500]]}
              />
            }
          />
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* SIMPLE HEADER - Normal layout (no absolute positioning) */}
      <View style={[styles.simpleHeader, { backgroundColor: bgColors.primary }]}>
        {/* Title + Segment Control */}
        <View style={styles.headerTopRow}>
          <Text style={[styles.compactTitle, { color: textColors.primary }]}>Workouts</Text>
          {renderSegmentControl()}
        </View>

        {/* Search + Filters Row */}
        <View style={styles.searchFilterRow}>
          {/* Search Bar */}
          <View style={[styles.compactSearchBar, { backgroundColor: bgColors.surface }]}>
            <Ionicons name="search-outline" size={18} color={textColors.tertiary} />
            <TextInput
              value={selectedSegment === 'programs' ? programSearch : exerciseSearch}
              onChangeText={selectedSegment === 'programs' ? setProgramSearch : setExerciseSearch}
              placeholder={`Search...`}
              placeholderTextColor={textColors.tertiary}
              style={[styles.compactSearchInput, { color: textColors.primary }]}
            />
            {((selectedSegment === 'programs' && programSearch.length > 0) ||
              (selectedSegment === 'exercises' && exerciseSearch.length > 0)) && (
              <TouchableOpacity
                onPress={() =>
                  selectedSegment === 'programs' ? setProgramSearch('') : setExerciseSearch('')
                }
              >
                <Ionicons name="close-circle" size={18} color={textColors.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          {renderCompactFilters()}
        </View>
      </View>

      {/* MY PROGRAMS Section (if has programs) */}
      {myPrograms.length > 0 && renderMyPrograms()}

      {/* Content List */}
      {selectedSegment === 'programs' ? (
        programsLoading ? (
          renderProgramSkeleton()
        ) : (
          <FlashList
            data={filteredPrograms}
            renderItem={renderProgramCard}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={() => renderListFooter(programsLoadingMore)}
            onEndReached={loadMorePrograms}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            estimatedItemSize={200}
            refreshControl={
              <RefreshControl
                refreshing={programsRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary[500]}
                colors={[theme.colors.primary[500]]}
              />
            }
          />
        )
      ) : exercisesLoading ? (
        renderExerciseSkeleton()
      ) : (
        <FlashList
          data={filteredExercises}
          renderItem={renderExerciseCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => renderListFooter(exercisesLoadingMore)}
          onEndReached={loadMoreExercises}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          estimatedItemSize={120}
          refreshControl={
            <RefreshControl
              refreshing={exercisesRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary[500]}
              colors={[theme.colors.primary[500]]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // COMPACT HEADER (Saves ~100px!)
  compactHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // Compact Segment Control (inline with title)
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    gap: 4,
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Search + Filters Row (COMPACT!)
  searchFilterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  compactSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  // Compact Filters (Dropdown style)
  compactFiltersContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    minWidth: 70,
  },
  filterDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 60,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  // Program Card
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    gap: 12,
  },
  programImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  programContent: {
    flex: 1,
    gap: 6,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  programBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  programDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  programStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  programStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Exercise Card
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    gap: 12,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  exerciseContent: {
    flex: 1,
    gap: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyCTAContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  emptyCTAPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCTAPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCTASecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  emptyCTASecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ========================================
  // PREMIUM PROGRAM CARD STYLES
  // ========================================
  premiumProgramCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  programImageContainer: {
    height: 200,
    position: 'relative',
  },
  programImagePremium: {
    width: '100%',
    height: '100%',
  },
  programImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  floatingBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  difficultyTextPremium: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  premiumBadgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  imageOverlayContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  programNamePremium: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 28,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumProgramContent: {
    padding: 20,
  },
  programDescriptionPremium: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsGridPremium: {
    flexDirection: 'row',
    gap: 12,
  },
  statBubble: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
  },
  statBubbleValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statBubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevronContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },

  // My Programs section styles (COMPACT)
  myProgramsSection: {
    marginBottom: 8,
  },
  myProgramsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  myProgramsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myProgramsTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  myProgramCard: {
    width: 280,
    height: 140,
    marginRight: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  myProgramThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  myProgramGradient: {
    width: '100%',
    height: '100%',
    padding: 16,
    justifyContent: 'space-between',
  },
  myProgramTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  myProgramProgress: {
    // Progress circle container
  },
  myProgramProgressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  myProgramProgressText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myProgramTopInfo: {
    flex: 1,
    paddingTop: 4,
  },
  myProgramProgramName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  myProgramBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  myProgramBottomInfo: {
    flex: 1,
  },
  myProgramWeek: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  myProgramStats: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  myProgramArrow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  myProgramInfo: {
    flex: 1,
  },
  myProgramName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  // Footer loader (pagination)
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
