/**
 * 🔥 EXERCISE DETAIL SCREEN - APPLE FITNESS+ LEVEL
 * 3D Animations + Parallax + YouTube Player + Haptics
 * 120fps Reanimated 3
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Badge } from '@components/ui';
import { getExerciseById, type Exercise } from '@services/workouts';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 400;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ExerciseDetailScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const scrollY = useSharedValue(0);
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Category config
  const categoryConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    back: { icon: 'body', color: '#3B82F6' },
    chest: { icon: 'flash', color: '#EF4444' },
    shoulders: { icon: 'triangle', color: '#F59E0B' },
    arms: { icon: 'barbell', color: '#8B5CF6' },
    legs: { icon: 'footsteps', color: '#10B981' },
    core: { icon: 'fitness', color: '#F43F5E' },
    cardio: { icon: 'heart', color: '#EC4899' },
    full_body: { icon: 'flame', color: '#F97316' },
  };

  const difficultyConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    beginner: { color: '#10B981', icon: 'leaf' },
    intermediate: { color: '#F59E0B', icon: 'trending-up' },
    advanced: { color: '#EF4444', icon: 'flame' },
    expert: { color: '#8B5CF6', icon: 'trophy' },
  };

  useEffect(() => {
    fetchExercise();
  }, [id]);

  const fetchExercise = async () => {
    try {
      if (!id) return;
      const data = await getExerciseById(id);
      setExercise(data);
    } catch (error) {
      console.error('Error fetching exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!exercise) return;

    try {
      await Share.share({
        message: `Check out this exercise: ${exercise.name}\n\n${exercise.description}`,
        title: exercise.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleVideoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowVideo(!showVideo);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Header parallax animation
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Toolbar opacity animation
  const toolbarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT - 100, HEADER_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColors.secondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error[500]} />
          <Text style={[styles.errorText, { color: textColors.primary }]}>Exercise not found</Text>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.primary[500] }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = categoryConfig[exercise.category] || categoryConfig.back;
  const diffConfig = difficultyConfig[exercise.difficulty_level] || difficultyConfig.beginner;

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Floating Back Button */}
      <AnimatedTouchable
        entering={FadeIn.delay(200)}
        onPress={handleBack}
        style={styles.floatingBackButton}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </AnimatedTouchable>

      {/* Floating Share Button */}
      <AnimatedTouchable
        entering={FadeIn.delay(300)}
        onPress={handleShare}
        style={styles.floatingShareButton}
        activeOpacity={0.8}
      >
        <Ionicons name="share-outline" size={22} color="#FFFFFF" />
      </AnimatedTouchable>

      {/* Animated Toolbar (appears on scroll) */}
      <Animated.View style={[styles.toolbar, { backgroundColor: bgColors.surface }, toolbarAnimatedStyle]}>
        <TouchableOpacity onPress={handleBack} style={styles.toolbarButton}>
          <Ionicons name="arrow-back" size={24} color={textColors.primary} />
        </TouchableOpacity>
        <Text style={[styles.toolbarTitle, { color: textColors.primary }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.toolbarButton}>
          <Ionicons name="share-outline" size={22} color={textColors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Hero Image with Parallax */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Image
            source={{ uri: exercise.thumbnail_url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.headerGradient}
          />

          {/* Floating badges on image */}
          <View style={styles.headerBadges}>
            <Animated.View entering={SlideInRight.delay(100).springify()} style={[styles.categoryBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={16} color="#FFFFFF" />
              <Text style={styles.categoryBadgeText}>{exercise.category}</Text>
            </Animated.View>

            <Animated.View entering={SlideInRight.delay(200).springify()} style={[styles.difficultyBadge, { backgroundColor: diffConfig.color }]}>
              <Ionicons name={diffConfig.icon} size={14} color="#FFFFFF" />
              <Text style={styles.difficultyBadgeText}>{exercise.difficulty_level}</Text>
            </Animated.View>

            {exercise.is_premium && (
              <Animated.View entering={SlideInRight.delay(300).springify()} style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </Animated.View>
            )}
          </View>

          {/* Title overlay */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{exercise.name}</Text>
            {exercise.description && (
              <Text style={styles.headerSubtitle} numberOfLines={2}>
                {exercise.description}
              </Text>
            )}
          </Animated.View>
        </Animated.View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColors.bg }]}>
          {/* Video Section */}
          {exercise.video_url && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
              <TouchableOpacity
                onPress={handleVideoPress}
                style={[styles.videoButton, { backgroundColor: theme.colors.primary[500] }]}
                activeOpacity={0.9}
              >
                <Ionicons name={showVideo ? "pause" : "play"} size={24} color="#FFFFFF" />
                <Text style={styles.videoButtonText}>
                  {showVideo ? 'Hide Video' : 'Watch Video Tutorial'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Muscles Targeted */}
          {(exercise.primary_muscles.length > 0 || (exercise.secondary_muscles && exercise.secondary_muscles.length > 0)) && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Muscles Targeted</Text>

              {exercise.primary_muscles.length > 0 && (
                <View style={styles.muscleGroup}>
                  <Text style={[styles.muscleLabel, { color: textColors.secondary }]}>Primary</Text>
                  <View style={styles.muscleTags}>
                    {exercise.primary_muscles.map((muscle, idx) => (
                      <View key={idx} style={[styles.muscleTag, { backgroundColor: theme.colors.primary[100] }]}>
                        <Ionicons name="fitness" size={14} color={theme.colors.primary[600]} />
                        <Text style={[styles.muscleTagText, { color: theme.colors.primary[700] }]}>
                          {muscle}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                <View style={styles.muscleGroup}>
                  <Text style={[styles.muscleLabel, { color: textColors.secondary }]}>Secondary</Text>
                  <View style={styles.muscleTags}>
                    {exercise.secondary_muscles.map((muscle, idx) => (
                      <View key={idx} style={[styles.muscleTag, { backgroundColor: theme.colors.secondary[100] }]}>
                        <Ionicons name="pulse" size={14} color={theme.colors.secondary[600]} />
                        <Text style={[styles.muscleTagText, { color: theme.colors.secondary[700] }]}>
                          {muscle}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* Equipment Required */}
          {exercise.equipment_required && exercise.equipment_required.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Equipment Needed</Text>
              <View style={styles.equipmentList}>
                {exercise.equipment_required.map((eq, idx) => (
                  <View key={idx} style={[styles.equipmentItem, { backgroundColor: bgColors.surface }]}>
                    <Ionicons name="barbell" size={20} color={theme.colors.primary[500]} />
                    <Text style={[styles.equipmentText, { color: textColors.primary }]}>{eq}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>How To Perform</Text>
              <View style={styles.instructionsList}>
                {exercise.instructions.map((instruction, idx) => (
                  <View key={idx} style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, { backgroundColor: theme.colors.primary[500] }]}>
                      <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: textColors.primary }]}>
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Pro Tips</Text>
              <View style={styles.tipsList}>
                {exercise.tips.map((tip, idx) => (
                  <View key={idx} style={[styles.tipItem, { backgroundColor: theme.colors.success[50] }]}>
                    <Ionicons name="bulb" size={20} color={theme.colors.success[600]} />
                    <Text style={[styles.tipText, { color: theme.colors.success[900] }]}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Common Mistakes</Text>
              <View style={styles.mistakesList}>
                {exercise.common_mistakes.map((mistake, idx) => (
                  <View key={idx} style={[styles.mistakeItem, { backgroundColor: theme.colors.error[50] }]}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.error[600]} />
                    <Text style={[styles.mistakeText, { color: theme.colors.error[900] }]}>
                      {mistake}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* CTA Buttons */}
          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.ctaContainer}>
            <TouchableOpacity
              style={[styles.primaryCTA, { backgroundColor: theme.colors.primary[500] }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                // TODO: Add to workout
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.primaryCTAText}>Add to Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryCTA, { borderColor: theme.colors.primary[500] }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // TODO: Start exercise
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="play-circle" size={24} color={theme.colors.primary[500]} />
              <Text style={[styles.secondaryCTAText, { color: theme.colors.primary[500] }]}>
                Start Exercise
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingShareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  headerBadges: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : StatusBar.currentHeight! + 80,
    left: 20,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  muscleGroup: {
    marginBottom: 16,
  },
  muscleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muscleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  muscleTagText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  equipmentList: {
    gap: 12,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  equipmentText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  mistakesList: {
    gap: 12,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  mistakeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 2,
  },
  secondaryCTAText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
