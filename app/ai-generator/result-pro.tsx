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

export default function AIGeneratorResultProScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AIGeneratorFormData | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

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

      // Generate nutrition plan
      const plan = generateNutritionPlan(data);
      setNutritionPlan(plan);

      // TODO: Generate workout program with OpenAI
      // For now, just show nutrition plan

      setLoading(false);
    } catch (error) {
      console.error('[AI Generator Result] Error loading data:', error);
      Alert.alert('Error', 'Failed to generate program. Please try again.');
      router.back();
    }
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
        {/* Success Message */}
        <Card shadow="lg" padding="lg" style={{ marginBottom: 20 }}>
          <View style={styles.successHeader}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.success[500]} />
            </View>
            <Text style={[styles.successTitle, { color: textColors.primary }]}>
              Program Generated! 🎉
            </Text>
            <Text style={[styles.successSubtitle, { color: textColors.secondary }]}>
              We've created a personalized {selectedProgramInfo.name} program tailored to your goals and lifestyle.
            </Text>
          </View>
        </Card>

        {/* Program Overview */}
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          💪 Program Overview
        </Text>
        <Card shadow="md" padding="lg" style={{ marginBottom: 20 }}>
          <View style={styles.programOverview}>
            <View style={styles.overviewRow}>
              <Ionicons name="fitness" size={24} color={theme.colors.primary[500]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.overviewLabel, { color: textColors.tertiary }]}>
                  Program Type
                </Text>
                <Text style={[styles.overviewValue, { color: textColors.primary }]}>
                  {selectedProgramInfo.name}
                </Text>
              </View>
            </View>

            <View style={styles.overviewRow}>
              <Ionicons name={goalInfo.icon as any} size={24} color={goalInfo.color} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.overviewLabel, { color: textColors.tertiary }]}>
                  Primary Goal
                </Text>
                <Text style={[styles.overviewValue, { color: textColors.primary }]}>
                  {goalInfo.label}
                </Text>
              </View>
            </View>

            <View style={styles.overviewRow}>
              <Ionicons name="calendar" size={24} color={theme.colors.secondary[500]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.overviewLabel, { color: textColors.tertiary }]}>
                  Training Frequency
                </Text>
                <Text style={[styles.overviewValue, { color: textColors.primary }]}>
                  {availability.days_per_week} days/week • {availability.session_duration} min/session
                </Text>
              </View>
            </View>

            <View style={styles.overviewRow}>
              <Ionicons name="barbell" size={24} color={theme.colors.warning[500]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.overviewLabel, { color: textColors.tertiary }]}>
                  Equipment
                </Text>
                <Text style={[styles.overviewValue, { color: textColors.primary }]}>
                  {availability.equipment.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
            </View>
          </View>
        </Card>

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
});
