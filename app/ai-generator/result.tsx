/**
 * AI Workout Result Screen - Display generated workout
 *
 * Features:
 * - Display AI-generated workout details
 * - Exercise list with instructions
 * - Save to Supabase option
 * - Start workout button
 * - Share workout option
 * - Regenerate option
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Badge } from '@components/ui';
import type { AIGeneratedWorkout } from '@services/ai/openai';
import { db } from '@/db';
import { useClerkAuth } from '@/hooks/useClerkAuth';

export default function AIWorkoutResultScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useClerkAuth();

  const [result, setResult] = useState<AIGeneratedWorkout | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark
      ? theme.colors.dark.text.secondary
      : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  useEffect(() => {
    if (params.workout) {
      try {
        const parsed = JSON.parse(params.workout as string);
        setResult(parsed);
      } catch (error) {
        console.error('Error parsing workout:', error);
        Alert.alert('Error', 'Failed to load workout result');
        router.back();
      }
    }
  }, [params]);

  const handleSaveWorkout = async () => {
    if (!result || !user) return;

    setSaving(true);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Save AI-generated workout to database with Drizzle
      const { workouts } = await import('@/db');

      // Map exercises to JSONB format for storage
      const exercisesData = result.exercises.map((exercise, index) => ({
        order: index + 1,
        name: exercise.name || 'Unnamed Exercise',
        sets: exercise.sets || 3,
        reps: exercise.reps,
        duration_seconds: exercise.duration_seconds,
        rest_seconds: exercise.rest_seconds || 60,
        instructions: exercise.instructions || [],
        tips: exercise.tips || [],
      }));

      // Map workout category to workout_type enum
      const workoutTypeMap: Record<string, string> = {
        'strength': 'strength',
        'cardio': 'cardio',
        'hiit': 'hiit',
        'HIIT': 'hiit',
        'yoga': 'yoga',
        'pilates': 'pilates',
        'stretching': 'stretching',
        'sports': 'sports',
      };
      const workoutType = workoutTypeMap[result.workout.category || ''] || 'custom';

      // Map difficulty to difficulty_level enum
      const difficultyMap: Record<string, string> = {
        'beginner': 'beginner',
        'intermediate': 'intermediate',
        'advanced': 'advanced',
        'expert': 'expert',
        'elite': 'expert', // Map elite to expert
      };
      const difficultyLevel = difficultyMap[result.workout.difficulty || 'beginner'] || 'beginner';

      // Insert workout into database
      await db.insert(workouts).values({
        name: result.workout.title || 'AI Generated Workout',
        description: result.workout.description || result.explanation || '',
        workout_type: workoutType as any,
        difficulty_level: difficultyLevel as any,
        estimated_duration: result.workout.estimated_duration_minutes || 30,
        calories_burned_estimate: result.workout.estimated_calories || 200,
        exercises: exercisesData as any, // JSONB array
        is_premium: false,
        created_by: user.id,
      });

      setSaved(true);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Workout Saved! 🎉',
        `"${result.workout.title}" has been added to your workouts.`,
        [
          {
            text: 'View in Library',
            onPress: () => router.push('/(tabs)/workouts'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        'Save Failed',
        'Failed to save workout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStartWorkout = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Navigate to workout player with AI-generated workout
    router.push({
      pathname: '/workout-player/[id]' as any,
      params: {
        id: 'ai-generated',
        aiWorkout: JSON.stringify(result),
      },
    });
  };

  const handleRegenerate = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(
      'Regenerate Workout?',
      'This will create a new workout with the same preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (!result) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
        <Text style={[styles.loadingText, { color: textColors.secondary }]}>
          Loading workout...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={
          theme.isDark
            ? ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.7)', 'transparent']
            : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.7)', 'transparent']
        }
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={28} color={textColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRegenerate} style={styles.regenerateButton}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Badge variant="success" icon="sparkles">
            AI Generated
          </Badge>
          <Text style={[styles.workoutTitle, { color: textColors.primary }]}>
            {result.workout.title}
          </Text>
          <Text style={[styles.workoutDescription, { color: textColors.secondary }]}>
            {result.workout.description}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {result.workout.estimated_duration_minutes}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>minutes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="flame-outline" size={20} color={theme.colors.warning[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {result.workout.estimated_calories}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>calories</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: bgColors.card }]}>
            <Ionicons name="barbell-outline" size={20} color={theme.colors.secondary[500]} />
            <Text style={[styles.statValue, { color: textColors.primary }]}>
              {result.exercises.length}
            </Text>
            <Text style={[styles.statLabel, { color: textColors.tertiary }]}>exercises</Text>
          </View>
        </View>

        {/* Explanation */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
            Why This Workout?
          </Text>
          <Text style={[styles.explanation, { color: textColors.secondary }]}>
            {result.explanation}
          </Text>
        </View>

        {/* Training Tips */}
        {result.tips && result.tips.length > 0 && (
          <View style={[styles.section, { backgroundColor: bgColors.card }]}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              💡 Training Tips
            </Text>
            {result.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={[styles.tipBullet, { color: theme.colors.primary[500] }]}>•</Text>
                <Text style={[styles.tipText, { color: textColors.secondary }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
            Exercises ({result.exercises.length})
          </Text>

          {result.exercises.map((exercise, index) => (
            <View key={index} style={[styles.exerciseCard, { backgroundColor: bgColors.card }]}>
              {/* Exercise header */}
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseNumber, { backgroundColor: theme.colors.primary[500] }]}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseHeaderContent}>
                  <Text style={[styles.exerciseName, { color: textColors.primary }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseDescription, { color: textColors.tertiary }]}>
                    {exercise.description}
                  </Text>
                </View>
              </View>

              {/* Exercise details */}
              <View style={styles.exerciseDetails}>
                {exercise.sets && (
                  <View style={[styles.detailPill, { backgroundColor: bgColors.surface }]}>
                    <Text style={[styles.detailText, { color: textColors.secondary }]}>
                      {exercise.sets} sets
                    </Text>
                  </View>
                )}
                {exercise.reps && (
                  <View style={[styles.detailPill, { backgroundColor: bgColors.surface }]}>
                    <Text style={[styles.detailText, { color: textColors.secondary }]}>
                      {exercise.reps} reps
                    </Text>
                  </View>
                )}
                {exercise.duration_seconds && (
                  <View style={[styles.detailPill, { backgroundColor: bgColors.surface }]}>
                    <Text style={[styles.detailText, { color: textColors.secondary }]}>
                      {exercise.duration_seconds}s
                    </Text>
                  </View>
                )}
                {exercise.rest_seconds && (
                  <View style={[styles.detailPill, { backgroundColor: bgColors.surface }]}>
                    <Text style={[styles.detailText, { color: textColors.tertiary }]}>
                      Rest: {exercise.rest_seconds}s
                    </Text>
                  </View>
                )}
              </View>

              {/* Instructions */}
              {exercise.instructions && exercise.instructions.length > 0 && (
                <View style={styles.instructions}>
                  <Text style={[styles.instructionsTitle, { color: textColors.secondary }]}>
                    How to:
                  </Text>
                  {exercise.instructions.map((instruction, i) => (
                    <Text key={i} style={[styles.instructionText, { color: textColors.tertiary }]}>
                      {i + 1}. {instruction}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer CTAs */}
      <View style={[styles.footer, { backgroundColor: bgColors.primary }]}>
        <Button
          variant="secondary"
          size="lg"
          onPress={handleSaveWorkout}
          loading={saving}
          disabled={saved}
          style={{ flex: 1 }}
        >
          {saved ? 'Saved ✓' : 'Save Workout'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onPress={handleStartWorkout}
          style={{ flex: 1 }}
        >
          Start Now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    gap: 12,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  workoutDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  explanation: {
    fontSize: 15,
    lineHeight: 24,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  // Exercises
  exercisesSection: {
    gap: 16,
  },
  exerciseCard: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseHeaderContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  instructions: {
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },

  // Loading
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
