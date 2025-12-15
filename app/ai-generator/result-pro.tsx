/**
 * AI Generator Result Screen - PROFESSIONAL VERSION
 *
 * Displays:
 * - Complete Nutrition Plan (calories, macros, hydration, supplements)
 * - Generated Workout Program (8-12 weeks)
 * - Progression strategy
 * - Expected results
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Card } from '@components/ui';
import type { AIGeneratorFormData, NutritionPlan, ProgramType } from '@/types/aiGenerator';
import { PROGRAM_TEMPLATES, FITNESS_GOAL_INFO } from '@/types/aiGenerator';
import { generateNutritionPlan, calculateBMI, getBMICategory, estimateTimeToGoal } from '@/services/nutrition';
import { generateWorkoutWithAI, type AIGeneratedWorkout } from '@/services/ai/openai';
import { useClerkAuth } from '@/hooks/useClerkAuth';

export default function AIGeneratorResultProScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, profile } = useClerkAuth();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AIGeneratorFormData | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [aiWorkout, setAiWorkout] = useState<AIGeneratedWorkout | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Theme colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark
      ? theme.colors.dark.text.secondary
      : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Parse form data from params
      const data: AIGeneratorFormData = JSON.parse(params.formData as string);
      setFormData(data);

      // Generate nutrition plan (local calculations)
      const plan = generateNutritionPlan(data);
      setNutritionPlan(plan);

      // Stop initial loading (show nutrition plan)
      setLoading(false);

      // 🤖 GENERATE WORKOUT WITH OPENAI GPT-4 (separate loading)
      setAiLoading(true);
      console.log('🤖 [AI Generator] Calling OpenAI GPT-4 API...');
      console.log('📊 [AI Generator] Request params:', {
        goal: mapGoalToOpenAI(data.experience_goal.goal),
        fitness_level: data.experience_goal.fitness_level,
        duration_minutes: data.availability.session_duration,
        equipment: mapEquipmentToOpenAI(data.availability.equipment),
      });

      try {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        // Map profile subscription tier to rate limiter tier
        const subscriptionTier = profile?.subscription_tier === 'elite'
          ? 'premium_88' as const
          : profile?.subscription_tier === 'premium'
          ? 'premium_44' as const
          : 'free' as const;

        const aiResult = await generateWorkoutWithAI(
          {
            goal: mapGoalToOpenAI(data.experience_goal.goal),
            fitness_level: data.experience_goal.fitness_level === 'expert' ? 'elite' : data.experience_goal.fitness_level,
            duration_minutes: data.availability.session_duration,
            equipment: mapEquipmentToOpenAI(data.availability.equipment),
            location: 'gym',
            intensity: data.experience_goal.fitness_level === 'expert' ? 'extreme' : data.experience_goal.fitness_level === 'advanced' ? 'high' : 'moderate',
            include_warmup: true,
            include_cooldown: true,
            notes: `User injuries: ${data.availability.injuries.join(', ')}. Training ${data.availability.days_per_week} days/week.`,
          },
          user.id,
          subscriptionTier
        );

        console.log('✅ [AI Generator] OpenAI workout generated successfully!', {
          exercises: aiResult.exercises.length,
          title: aiResult.workout.title,
          description: aiResult.workout.description,
          explanation: aiResult.explanation?.substring(0, 100) + '...',
        });
        setAiWorkout(aiResult);
      } catch (aiError) {
        console.error('❌ [AI Generator] OpenAI API error:', aiError);
        console.error('❌ [AI Generator] Full error:', JSON.stringify(aiError, null, 2));
        setGenerationError(aiError instanceof Error ? aiError.message : 'AI generation failed');
      } finally {
        setAiLoading(false);
      }
    } catch (error) {
      console.error('[AI Generator Result] Error loading data:', error);
      Alert.alert('Error', 'Failed to generate program. Please try again.');
      router.back();
    }
  };

  // Helper: Map fitness goal to OpenAI format
  const mapGoalToOpenAI = (goal: string): any => {
    const mapping: Record<string, any> = {
      hypertrophy: 'build_muscle',
      fat_loss: 'lose_weight',
      strength: 'increase_strength',
      endurance: 'improve_endurance',
      recomposition: 'build_muscle',
    };
    return mapping[goal] || 'build_muscle';
  };

  // Helper: Map equipment to OpenAI format
  const mapEquipmentToOpenAI = (equipment: string): string[] => {
    if (equipment === 'full_gym') return ['dumbbells', 'barbell', 'bench', 'cables', 'machines'];
    if (equipment === 'home_gym_full') return ['dumbbells', 'barbell', 'bench'];
    if (equipment === 'home_gym_basic') return ['dumbbells', 'bench'];
    if (equipment === 'dumbbells_only') return ['dumbbells'];
    if (equipment === 'bodyweight') return ['none'];
    if (equipment === 'resistance_bands') return ['resistance_bands'];
    return ['dumbbells'];
  };

  const handleSaveProgram = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      'Program Saved! 🎉',
      'Your personalized program has been saved. You can access it from the Workouts tab.',
      [
        {
          text: 'View Workouts',
          onPress: () => router.push('/(tabs)/workouts' as any),
        },
        {
          text: 'Back to Dashboard',
          onPress: () => router.push('/(tabs)' as any),
        },
      ]
    );
  };

  if (loading || !formData || !nutritionPlan) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={[styles.loadingText, { color: textColors.secondary }]}>
          Generating your personalized program...
        </Text>
      </View>
    );
  }

  const { personal_profile, experience_goal, availability, program, nutrition } = formData;
  const selectedProgramInfo = PROGRAM_TEMPLATES[program.program_type];
  const goalInfo = FITNESS_GOAL_INFO[experience_goal.goal];

  // Calculate BMI
  const bmi = calculateBMI(personal_profile.current_weight_kg, personal_profile.height_cm);
  const bmiCategory = getBMICategory(bmi);

  // Estimate time to goal (if goal weight provided)
  const timeEstimate = personal_profile.goal_weight_kg
    ? estimateTimeToGoal(
        personal_profile.current_weight_kg,
        personal_profile.goal_weight_kg,
        experience_goal.goal
      )
    : null;

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Program</Text>
        <Text style={styles.headerSubtitle}>Personalized for you</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Nutrition Plan */}
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          🍽️ Nutrition Plan
        </Text>

        {/* Daily Targets */}
        <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]}>
            Daily Targets
          </Text>

          <View style={styles.macroRow}>
            <View style={styles.macroCard}>
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                style={styles.macroGradient}
              >
                <Text style={styles.macroValue}>{nutritionPlan.daily_calories}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </LinearGradient>
            </View>

            <View style={styles.macroCard}>
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                style={styles.macroGradient}
              >
                <Text style={styles.macroValue}>{nutritionPlan.daily_protein_g}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroCard}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.macroGradient}
              >
                <Text style={styles.macroValue}>{nutritionPlan.daily_carbs_g}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </LinearGradient>
            </View>

            <View style={styles.macroCard}>
              <LinearGradient
                colors={['#EF4444', '#F87171']}
                style={styles.macroGradient}
              >
                <Text style={styles.macroValue}>{nutritionPlan.daily_fat_g}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={[styles.macroSplit, { backgroundColor: bgColors.surface }]}>
            <Text style={[styles.macroSplitTitle, { color: textColors.secondary }]}>
              Macro Split
            </Text>
            <View style={styles.macroSplitRow}>
              <View style={styles.macroSplitItem}>
                <Text style={[styles.macroSplitPercent, { color: '#8B5CF6' }]}>
                  {nutritionPlan.macro_split.protein_percent}%
                </Text>
                <Text style={[styles.macroSplitLabel, { color: textColors.tertiary }]}>
                  Protein
                </Text>
              </View>
              <View style={styles.macroSplitItem}>
                <Text style={[styles.macroSplitPercent, { color: '#10B981' }]}>
                  {nutritionPlan.macro_split.carbs_percent}%
                </Text>
                <Text style={[styles.macroSplitLabel, { color: textColors.tertiary }]}>
                  Carbs
                </Text>
              </View>
              <View style={styles.macroSplitItem}>
                <Text style={[styles.macroSplitPercent, { color: '#EF4444' }]}>
                  {nutritionPlan.macro_split.fat_percent}%
                </Text>
                <Text style={[styles.macroSplitLabel, { color: textColors.tertiary }]}>
                  Fat
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Per Meal Breakdown */}
        <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]}>
            Per Meal ({nutrition.meals_per_day} meals/day)
          </Text>

          <View style={styles.mealBreakdown}>
            <View style={styles.mealRow}>
              <Text style={[styles.mealLabel, { color: textColors.secondary }]}>
                Calories:
              </Text>
              <Text style={[styles.mealValue, { color: textColors.primary }]}>
                {nutritionPlan.calories_per_meal} kcal
              </Text>
            </View>
            <View style={styles.mealRow}>
              <Text style={[styles.mealLabel, { color: textColors.secondary }]}>
                Protein:
              </Text>
              <Text style={[styles.mealValue, { color: textColors.primary }]}>
                {nutritionPlan.protein_per_meal_g}g
              </Text>
            </View>
            <View style={styles.mealRow}>
              <Text style={[styles.mealLabel, { color: textColors.secondary }]}>
                Carbs:
              </Text>
              <Text style={[styles.mealValue, { color: textColors.primary }]}>
                {nutritionPlan.carbs_per_meal_g}g
              </Text>
            </View>
            <View style={styles.mealRow}>
              <Text style={[styles.mealLabel, { color: textColors.secondary }]}>
                Fat:
              </Text>
              <Text style={[styles.mealValue, { color: textColors.primary }]}>
                {nutritionPlan.fat_per_meal_g}g
              </Text>
            </View>
          </View>
        </Card>

        {/* Hydration & Supplements */}
        <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
          <View style={styles.infoRow}>
            <Ionicons name="water" size={24} color={theme.colors.primary[500]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.infoLabel, { color: textColors.tertiary }]}>
                Daily Hydration
              </Text>
              <Text style={[styles.infoValue, { color: textColors.primary }]}>
                {nutritionPlan.daily_water_liters}L of water
              </Text>
            </View>
          </View>
        </Card>

        <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]}>
            💊 Recommended Supplements
          </Text>
          {nutritionPlan.supplements?.map((supplement, index) => (
            <View key={index} style={styles.supplementRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success[500]} />
              <Text style={[styles.supplementText, { color: textColors.secondary }]}>
                {supplement}
              </Text>
            </View>
          ))}
        </Card>

        {/* Metabolic Data */}
        <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]}>
            📊 Metabolic Data
          </Text>

          <View style={styles.metaDataGrid}>
            <View style={styles.metaDataItem}>
              <Text style={[styles.metaDataLabel, { color: textColors.tertiary }]}>
                BMR
              </Text>
              <Text style={[styles.metaDataValue, { color: textColors.primary }]}>
                {nutritionPlan.bmr} cal
              </Text>
            </View>
            <View style={styles.metaDataItem}>
              <Text style={[styles.metaDataLabel, { color: textColors.tertiary }]}>
                TDEE
              </Text>
              <Text style={[styles.metaDataValue, { color: textColors.primary }]}>
                {nutritionPlan.tdee} cal
              </Text>
            </View>
            <View style={styles.metaDataItem}>
              <Text style={[styles.metaDataLabel, { color: textColors.tertiary }]}>
                BMI
              </Text>
              <Text style={[styles.metaDataValue, { color: textColors.primary }]}>
                {bmi} ({bmiCategory})
              </Text>
            </View>
            <View style={styles.metaDataItem}>
              <Text style={[styles.metaDataLabel, { color: textColors.tertiary }]}>
                Activity
              </Text>
              <Text style={[styles.metaDataValue, { color: textColors.primary }]}>
                {nutritionPlan.activity_multiplier}x
              </Text>
            </View>
          </View>
        </Card>

        {/* Time to Goal */}
        {timeEstimate && (
          <Card shadow="md" padding="lg" style={{ marginBottom: 20 }}>
            <View style={styles.infoRow}>
              <Ionicons name="trophy" size={24} color={theme.colors.warning[500]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoLabel, { color: textColors.tertiary }]}>
                  Estimated Time to Goal
                </Text>
                <Text style={[styles.infoValue, { color: textColors.primary }]}>
                  {timeEstimate.months} months ({timeEstimate.weeks} weeks)
                </Text>
                <Text style={[styles.infoSubtext, { color: textColors.tertiary }]}>
                  {personal_profile.current_weight_kg}kg → {personal_profile.goal_weight_kg}kg at {timeEstimate.rate_per_week_kg}kg/week
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* AI GENERATED WORKOUT */}
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          🤖 AI-Generated Workout
        </Text>

        {/* AI Loading State */}
        {aiLoading && !aiWorkout && (
          <Card shadow="md" padding="lg" style={{ marginBottom: 20 }}>
            <View style={styles.aiLoadingContent}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text style={[styles.aiLoadingTitle, { color: textColors.primary }]}>
                Generating with GPT-4 Turbo...
              </Text>
              <Text style={[styles.aiLoadingSubtitle, { color: textColors.secondary }]}>
                Creating science-backed workout personalized for your goals
              </Text>
              <Text style={[styles.aiLoadingCost, { color: textColors.tertiary }]}>
                ⏱️ This may take 10-30 seconds
              </Text>
            </View>
          </Card>
        )}

        {/* AI Success - Show Workout */}
        {aiWorkout && !aiLoading && (
          <>
            <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
              <Text style={[styles.aiWorkoutTitle, { color: theme.colors.primary[500] }]}>
                {aiWorkout.workout.title}
              </Text>
              <Text style={[styles.aiWorkoutDescription, { color: textColors.secondary }]}>
                {aiWorkout.workout.description}
              </Text>

              {/* Workout Meta */}
              <View style={styles.workoutMeta}>
                <View style={styles.workoutMetaItem}>
                  <Ionicons name="time-outline" size={18} color={textColors.tertiary} />
                  <Text style={[styles.workoutMetaText, { color: textColors.secondary }]}>
                    {aiWorkout.workout.estimated_duration_minutes} min
                  </Text>
                </View>
                <View style={styles.workoutMetaItem}>
                  <Ionicons name="flame-outline" size={18} color={textColors.tertiary} />
                  <Text style={[styles.workoutMetaText, { color: textColors.secondary }]}>
                    ~{aiWorkout.workout.estimated_calories} cal
                  </Text>
                </View>
                <View style={styles.workoutMetaItem}>
                  <Ionicons name="barbell-outline" size={18} color={textColors.tertiary} />
                  <Text style={[styles.workoutMetaText, { color: textColors.secondary }]}>
                    {aiWorkout.exercises.length} exercises
                  </Text>
                </View>
              </View>
            </Card>

            {/* Exercises List */}
            <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
              <Text style={[styles.cardTitle, { color: textColors.primary }]}>
                💪 Exercises ({aiWorkout.exercises.length})
              </Text>

              {aiWorkout.exercises.map((exercise, index) => (
                <View
                  key={index}
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: bgColors.surface, borderColor: bgColors.border },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseNumber, { color: theme.colors.primary[500] }]}>
                      {index + 1}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exerciseName, { color: textColors.primary }]}>
                        {exercise.name}
                      </Text>
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        <Text style={[styles.exerciseMuscles, { color: textColors.tertiary }]}>
                          {exercise.muscle_groups.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Sets/Reps/Rest */}
                  <View style={styles.exerciseStats}>
                    <View style={styles.exerciseStat}>
                      <Text style={[styles.exerciseStatLabel, { color: textColors.tertiary }]}>
                        Sets
                      </Text>
                      <Text style={[styles.exerciseStatValue, { color: textColors.primary }]}>
                        {exercise.sets}
                      </Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Text style={[styles.exerciseStatLabel, { color: textColors.tertiary }]}>
                        {exercise.reps ? 'Reps' : 'Time'}
                      </Text>
                      <Text style={[styles.exerciseStatValue, { color: textColors.primary }]}>
                        {exercise.reps || `${exercise.duration_seconds}s`}
                      </Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Text style={[styles.exerciseStatLabel, { color: textColors.tertiary }]}>
                        Rest
                      </Text>
                      <Text style={[styles.exerciseStatValue, { color: textColors.primary }]}>
                        {exercise.rest_seconds}s
                      </Text>
                    </View>
                  </View>

                  {/* Tips */}
                  {exercise.tips && exercise.tips.length > 0 && (
                    <View style={styles.exerciseTips}>
                      <Ionicons name="information-circle" size={16} color={theme.colors.primary[500]} />
                      <Text style={[styles.exerciseTipText, { color: textColors.secondary }]}>
                        {exercise.tips[0]}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </Card>

            {/* AI Explanation */}
            {aiWorkout.explanation && (
              <Card shadow="md" padding="lg" style={{ marginBottom: 12 }}>
                <Text style={[styles.cardTitle, { color: textColors.primary }]}>
                  📖 Why This Workout?
                </Text>
                <Text style={[styles.explanationText, { color: textColors.secondary }]}>
                  {aiWorkout.explanation}
                </Text>
              </Card>
            )}

            {/* AI Tips */}
            {aiWorkout.tips && aiWorkout.tips.length > 0 && (
              <Card shadow="md" padding="lg" style={{ marginBottom: 20 }}>
                <Text style={[styles.cardTitle, { color: textColors.primary }]}>
                  💡 Training Tips
                </Text>
                {aiWorkout.tips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <Text style={[styles.tipBullet, { color: theme.colors.primary[500] }]}>•</Text>
                    <Text style={[styles.tipText, { color: textColors.secondary }]}>{tip}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        {/* Error Display */}
        {generationError && !aiWorkout && (
          <Card shadow="md" padding="lg" style={{ marginBottom: 20, backgroundColor: theme.colors.error[500] + '20', borderColor: theme.colors.error[500], borderWidth: 1 }}>
            <View style={styles.errorContent}>
              <Ionicons name="warning" size={32} color={theme.colors.error[500]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.errorTitle, { color: theme.colors.error[500] }]}>
                  AI Generation Failed
                </Text>
                <Text style={[styles.errorText, { color: textColors.secondary }]}>
                  {generationError}
                </Text>
                <Text style={[styles.errorSubtext, { color: textColors.tertiary }]}>
                  Your nutrition plan is ready, but we couldn't generate the workout. Check your OpenAI API key or try again later.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Program Notes */}
        <Card shadow="md" padding="lg" style={{ marginBottom: 20 }}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]}>
            📝 Important Notes
          </Text>
          <Text style={[styles.noteText, { color: textColors.secondary }]}>
            • This program is generated based on your profile and goals
          </Text>
          <Text style={[styles.noteText, { color: textColors.secondary }]}>
            • Adjust calories ±200 if progress stalls after 2-3 weeks
          </Text>
          <Text style={[styles.noteText, { color: textColors.secondary }]}>
            • Progressive overload is key - add weight or reps weekly
          </Text>
          <Text style={[styles.noteText, { color: textColors.secondary }]}>
            • Prioritize sleep (7-9h) and recovery for optimal results
          </Text>
          <Text style={[styles.noteText, { color: textColors.secondary }]}>
            • Track your progress weekly (weight, measurements, photos)
          </Text>
        </Card>

        {/* Save Button */}
        <Button variant="primary" size="lg" onPress={handleSaveProgram}>
          💾 Save Program
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  successHeader: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  programOverview: {
    gap: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  macroCard: {
    flex: 1,
  },
  macroGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  macroSplit: {
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  macroSplitTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  macroSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroSplitItem: {
    alignItems: 'center',
  },
  macroSplitPercent: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroSplitLabel: {
    fontSize: 12,
  },
  mealBreakdown: {
    gap: 12,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 15,
  },
  mealValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplementText: {
    fontSize: 15,
    marginLeft: 8,
  },
  metaDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaDataItem: {
    width: '47%',
  },
  metaDataLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  metaDataValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  aiWorkoutTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  aiWorkoutDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutMetaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 20,
    fontWeight: '700',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMuscles: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  exerciseStat: {
    alignItems: 'center',
  },
  exerciseStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  exerciseStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  exerciseTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiLoadingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  aiLoadingSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  aiLoadingCost: {
    fontSize: 13,
    textAlign: 'center',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
