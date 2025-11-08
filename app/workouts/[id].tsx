/**
 * 🔥 ATHLETICAAI - WORKOUT DETAIL SCREEN
 * Apple Fitness+ level UI/UX
 * Full workout overview before starting
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
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Badge } from '@components/ui';
import { getWorkoutById } from '@services/workouts';
import type { Workout } from '@/types/workout';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 400;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function WorkoutDetailScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    programId?: string;
    programName?: string;
    weekNumber?: string;
    dayNumber?: string;
    workoutName?: string;
    workoutDescription?: string;
  }>();
  const { id } = params;

  // State
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const scrollY = useSharedValue(0);

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Fetch workout data
  useEffect(() => {
    loadWorkout();
  }, [id]);

  const loadWorkout = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Try to get workout by ID first (if it's a UUID)
      const data = await getWorkoutById(id);

      if (data) {
        setWorkout(data);
      } else if (params.workoutName) {
        // If no workout found but we have params (slug case), create a virtual workout
        console.log('⚠️ [Workout Detail] Creating virtual workout from program data');
        const virtualWorkout: Workout = {
          id: id,
          title: params.workoutName,
          description: params.workoutDescription || `Week ${params.weekNumber}, Day ${params.dayNumber}`,
          category: 'strength' as any,
          difficulty: 'intermediate' as any,
          muscle_groups: ['full_body' as any],
          estimated_duration_minutes: 60,
          estimated_calories: 300,
          equipment: ['none' as any],
          exercises: [],
          total_exercises: 0,
          tags: ['program'],
          completion_count: 0,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setWorkout(virtualWorkout);
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
    }

    setLoading(false);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header parallax animation
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT - 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0, HEADER_HEIGHT],
      [1.2, 1, 0.8],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  // Toolbar fade-in animation
  const toolbarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT - 100, HEADER_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Navigate to NEW WorkoutPlayer V2 (Apple Fitness+ level with ML/Analytics)
    router.push(`/workout-player/${id}` as any);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (loading || !workout) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <Text style={{ color: textColors.primary }}>Loading...</Text>
      </View>
    );
  }

  const difficultyColors: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
    elite: '#8B5CF6',
  };

  // Helper to get workout image (fallback to placeholder)
  const workoutImage = workout?.thumbnail_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Animated Toolbar */}
      <Animated.View
        style={[
          styles.toolbar,
          {
            backgroundColor: bgColors.bg,
            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          },
          toolbarAnimatedStyle,
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.toolbarButton}>
          <Ionicons name="arrow-back" size={24} color={textColors.primary} />
        </TouchableOpacity>
        <Text
          style={[styles.toolbarTitle, { color: textColors.primary }]}
          numberOfLines={1}
        >
          {workout.title}
        </Text>
        <TouchableOpacity style={styles.toolbarButton}>
          <Ionicons name="heart-outline" size={24} color={textColors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <AnimatedLinearGradient
          colors={
            theme.isDark
              ? ['#000000', '#1a1a1a']
              : [theme.colors.primary[100], '#ffffff']
          }
          style={[styles.heroSection, headerAnimatedStyle]}
        >
          <Image
            source={{ uri: workoutImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Floating Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.floatingBackButton,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Floating Favorite Button */}
          <TouchableOpacity
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={[
              styles.floatingFavoriteButton,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
            ]}
          >
            <Ionicons name="heart-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </AnimatedLinearGradient>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColors.bg }]}>
          {/* Title & Meta */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: textColors.primary }]}>
                {workout.title}
              </Text>
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
              <Badge
                variant="primary"
                size="sm"
                icon="flame"
              >
                {workout.category}
              </Badge>
              <Badge
                variant="info"
                size="sm"
              >
                {workout.difficulty}
              </Badge>
              {workout.is_premium && (
                <Badge variant="warning" size="sm" icon="star">
                  Premium
                </Badge>
              )}
            </View>

            {/* Stats Pills */}
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                <Ionicons name="time" size={16} color={theme.colors.primary[500]} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {workout.estimated_duration_minutes} min
                </Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                <Ionicons name="flame" size={16} color={theme.colors.secondary[500]} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {workout.estimated_calories} cal
                </Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
                <Ionicons name="barbell" size={16} color={theme.colors.accent[500]} />
                <Text style={[styles.statText, { color: textColors.secondary }]}>
                  {workout.total_exercises} exercises
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Description */}
          {workout.description && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
                About This Workout
              </Text>
              <Text style={[styles.description, { color: textColors.secondary }]}>
                {workout.description}
              </Text>
            </Animated.View>
          )}

          {/* Equipment Needed */}
          {workout.equipment && workout.equipment.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
                Equipment Needed
              </Text>
              <View style={styles.equipmentGrid}>
                {workout.equipment.map((item: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.equipmentChip,
                      { backgroundColor: bgColors.surface },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.colors.success[500]}
                    />
                    <Text
                      style={[styles.equipmentText, { color: textColors.secondary }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Targeted Muscles */}
          {workout.muscle_groups && workout.muscle_groups.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
                Targeted Muscles
              </Text>
              <View style={styles.musclesRow}>
                {workout.muscle_groups.map((muscle: string, index: number) => (
                  <Badge
                    key={index}
                    variant="primary"
                    size="sm"
                  >
                    {muscle}
                  </Badge>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Spacer for CTA Button */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Floating CTA Button */}
      <Animated.View
        entering={SlideInRight.delay(500).springify()}
        style={[
          styles.ctaContainer,
          {
            backgroundColor: bgColors.bg,
            borderTopColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          },
        ]}
      >
        <Button
          onPress={handleStartWorkout}
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
        >
          ▶ Start Workout
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  heroSection: {
    width,
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingFavoriteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  equipmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
});
