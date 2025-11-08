/**
 * 🍎 NUTRITION TAB - Complete Nutrition Hub
 *
 * Features:
 * - Daily Calorie Tracker
 * - Macro Tracking (Protein/Carbs/Fats)
 * - Water Intake Tracker
 * - Meal Planning with AI
 * - Recipe Library
 * - Nutrition Goals
 *
 * Strategic Impact:
 * - Completes fitness triangle (Workouts + Progress + Nutrition)
 * - Premium meal plans revenue stream
 * - Holistic approach differentiation
 * - Increased user engagement
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '@clerk/clerk-expo';
import * as nutritionService from '@/services/drizzle/nutrition';

const { width } = Dimensions.get('window');

// =====================================================
// TYPES
// =====================================================

interface DailyStats {
  calories: {
    consumed: number;
    target: number;
    remaining: number;
  };
  macros: {
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fats: { consumed: number; target: number };
  };
  water: {
    consumed: number; // in ml
    target: number; // in ml
    glasses: number; // number of glasses (250ml each)
  };
}

interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image?: string;
}

interface Recipe {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPremium: boolean;
}

// =====================================================
// MOCK DATA
// =====================================================

const MOCK_DAILY_STATS: DailyStats = {
  calories: {
    consumed: 1650,
    target: 2200,
    remaining: 550,
  },
  macros: {
    protein: { consumed: 120, target: 165 },
    carbs: { consumed: 180, target: 220 },
    fats: { consumed: 55, target: 73 },
  },
  water: {
    consumed: 1750,
    target: 2500,
    glasses: 7,
  },
};

const MOCK_MEALS: Meal[] = [
  {
    id: '1',
    type: 'breakfast',
    name: 'Protein Pancakes',
    time: '8:30 AM',
    calories: 420,
    protein: 35,
    carbs: 45,
    fats: 12,
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400',
  },
  {
    id: '2',
    type: 'lunch',
    name: 'Grilled Chicken Salad',
    time: '1:00 PM',
    calories: 580,
    protein: 48,
    carbs: 42,
    fats: 22,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  },
  {
    id: '3',
    type: 'snack',
    name: 'Protein Shake',
    time: '4:30 PM',
    calories: 250,
    protein: 30,
    carbs: 18,
    fats: 6,
  },
  {
    id: '4',
    type: 'dinner',
    name: 'Salmon with Rice',
    time: '7:00 PM',
    calories: 400,
    protein: 37,
    carbs: 75,
    fats: 15,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
];

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'High-Protein Overnight Oats',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400',
    calories: 380,
    protein: 28,
    prepTime: 5,
    difficulty: 'easy',
    tags: ['breakfast', 'high-protein', 'meal-prep'],
    isPremium: false,
  },
  {
    id: '2',
    name: 'Lean Beef Burrito Bowl',
    image: 'https://images.unsplash.com/photo-1623855244261-c4f8f0e9b880?w=400',
    calories: 520,
    protein: 42,
    prepTime: 20,
    difficulty: 'medium',
    tags: ['lunch', 'high-protein', 'muscle-building'],
    isPremium: false,
  },
  {
    id: '3',
    name: 'Keto Avocado Chicken',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400',
    calories: 460,
    protein: 38,
    prepTime: 25,
    difficulty: 'medium',
    tags: ['dinner', 'keto', 'low-carb'],
    isPremium: true,
  },
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function NutritionScreen() {
  const theme = useStyledTheme();
  const { user } = useUser();
  const [dailyStats, setDailyStats] = useState(MOCK_DAILY_STATS);
  const [meals, setMeals] = useState(MOCK_MEALS);
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [loading, setLoading] = useState(true);

  // Theme helpers
  const colors = {
    text: {
      primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
      secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
      tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
    },
    surface: {
      primary: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
      secondary: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    },
    background: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
  };

  // =====================================================
  // LOAD DATA FROM BACKEND
  // =====================================================

  useEffect(() => {
    loadNutritionData();
  }, [user]);

  const loadNutritionData = async () => {
    try {
      setLoading(true);

      // Load data even if user not logged in (demo mode with default data)
      const userId = user?.id || 'demo-user-1';
      const today = new Date();

      console.log('🍽️  Loading nutrition data for user:', userId);

      // Load daily nutrition log
      const dailyLog = await nutritionService.getDailyNutritionLog(userId, today);

      // Load meals for today
      const mealsData = await nutritionService.getMealLogsByDate(userId, today);

      // Load recipes (public, no user_id required)
      const recipesData = await nutritionService.getRecipes({ limit: 10 });

      console.log('📊 Nutrition data loaded:', {
        dailyLog: !!dailyLog,
        meals: mealsData.length,
        recipes: recipesData.length
      });

      console.log('🍽️  Recipes data:', recipesData);

      // Map to UI format
      setDailyStats({
        calories: {
          consumed: dailyLog.calories_consumed,
          target: dailyLog.calories_target || 2200,
          remaining: (dailyLog.calories_target || 2200) - dailyLog.calories_consumed,
        },
        macros: {
          protein: { consumed: dailyLog.protein_g, target: dailyLog.protein_target || 165 },
          carbs: { consumed: dailyLog.carbs_g, target: dailyLog.carbs_target || 220 },
          fats: { consumed: dailyLog.fats_g, target: dailyLog.fats_target || 73 },
        },
        water: {
          consumed: dailyLog.water_ml,
          target: dailyLog.water_target || 2500,
          glasses: dailyLog.water_glasses,
        },
      });

      if (mealsData.length > 0) {
        const mappedMeals = mealsData.map(meal => ({
          id: meal.id,
          type: meal.meal_type as any || 'snack',
          name: meal.meal_name,
          time: new Date(meal.meal_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          calories: meal.calories || 0,
          protein: meal.protein_g || 0,
          carbs: meal.carbs_g || 0,
          fats: meal.fats_g || 0,
          image: meal.photo_url || undefined,
        }));
        setMeals(mappedMeals);
      }

      // Map recipes
      if (recipesData.length > 0) {
        console.log('📦 Mapping recipes...');
        const mappedRecipes = recipesData.map((recipe: any) => ({
          id: recipe.id,
          name: recipe.name,
          image: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          calories: recipe.calories,
          protein: recipe.protein_g,
          prepTime: recipe.prep_time_minutes || 15,
          difficulty: recipe.difficulty || 'medium',
          tags: recipe.tags || [],
          isPremium: recipe.is_premium,
        }));
        console.log('✅ Mapped recipes:', mappedRecipes.length, 'recipes');
        setRecipes(mappedRecipes);
        console.log('✅ Set recipes state');
      } else {
        console.log('⚠️  No recipes data to map (recipesData.length === 0)');
      }

      console.log('✅ Loaded nutrition data for today');
    } catch (error) {
      console.error('❌ Error loading nutrition data:', error);
      // Keep mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleAddWaterGlass = async () => {
    if (!user?.id) return;

    try {
      // Optimistic update
      setDailyStats(prev => ({
        ...prev,
        water: {
          ...prev.water,
          consumed: prev.water.consumed + 250,
          glasses: prev.water.glasses + 1,
        },
      }));

      // Backend update
      await nutritionService.addWaterLog(user.id, 250);
      console.log('✅ Added water log');
    } catch (error) {
      console.error('❌ Error adding water:', error);
      // Revert optimistic update
      loadNutritionData();
    }
  };

  const handleOpenAIMealPlanner = () => {
    console.log('🤖 Opening AI Meal Planner');
    // TODO: Navigate to AI meal planner screen
  };

  const handleLogMeal = () => {
    console.log('📝 Logging new meal');
    // TODO: Navigate to meal logging screen
  };

  // =====================================================
  // RENDER COMPONENTS
  // =====================================================

  const renderCircularProgress = (
    percentage: number,
    size: number,
    strokeWidth: number,
    color: string
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface.secondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Nutrition
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Track your daily intake
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.aiButton, { backgroundColor: theme.colors.primary[500] }]}
        onPress={handleOpenAIMealPlanner}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.aiButtonText}>AI Planner</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalorieCard = () => {
    const percentage = (dailyStats.calories.consumed / dailyStats.calories.target) * 100;

    return (
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calorieCard}
      >
        <View style={styles.calorieHeader}>
          <View>
            <Text style={styles.calorieLabel}>Daily Calories</Text>
            <Text style={styles.calorieTarget}>
              Goal: {dailyStats.calories.target.toLocaleString()} cal
            </Text>
          </View>
          <View style={styles.calorieCircle}>
            {renderCircularProgress(percentage, 80, 8, '#fff')}
            <View style={styles.calorieCircleCenter}>
              <Text style={styles.caloriePercentage}>{Math.round(percentage)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.calorieStats}>
          <View style={styles.calorieStat}>
            <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
            <View style={styles.calorieStatContent}>
              <Text style={styles.calorieStatLabel}>Consumed</Text>
              <Text style={styles.calorieStatValue}>
                {dailyStats.calories.consumed.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.calorieStatDivider} />
          <View style={styles.calorieStat}>
            <Ionicons name="flame" size={20} color="#FB923C" />
            <View style={styles.calorieStatContent}>
              <Text style={styles.calorieStatLabel}>Remaining</Text>
              <Text style={styles.calorieStatValue}>
                {dailyStats.calories.remaining.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderMacrosCard = () => {
    const macros = [
      {
        name: 'Protein',
        value: dailyStats.macros.protein.consumed,
        target: dailyStats.macros.protein.target,
        color: '#EF4444',
        icon: 'fitness',
      },
      {
        name: 'Carbs',
        value: dailyStats.macros.carbs.consumed,
        target: dailyStats.macros.carbs.target,
        color: '#3B82F6',
        icon: 'nutrition',
      },
      {
        name: 'Fats',
        value: dailyStats.macros.fats.consumed,
        target: dailyStats.macros.fats.target,
        color: '#F59E0B',
        icon: 'water',
      },
    ];

    return (
      <View style={[styles.macrosCard, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Macros
        </Text>
        <View style={styles.macrosList}>
          {macros.map((macro, index) => {
            const percentage = (macro.value / macro.target) * 100;
            return (
              <View key={index} style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroInfo}>
                    <View style={[styles.macroIcon, { backgroundColor: macro.color + '20' }]}>
                      <Ionicons name={macro.icon as any} size={18} color={macro.color} />
                    </View>
                    <Text style={[styles.macroName, { color: colors.text.primary }]}>
                      {macro.name}
                    </Text>
                  </View>
                  <Text style={[styles.macroValue, { color: colors.text.primary }]}>
                    {macro.value}g / {macro.target}g
                  </Text>
                </View>
                <View style={[styles.macroProgressBar, { backgroundColor: colors.surface.secondary }]}>
                  <View
                    style={[
                      styles.macroProgressFill,
                      { width: `${Math.min(percentage, 100)}%`, backgroundColor: macro.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWaterCard = () => {
    const percentage = (dailyStats.water.consumed / dailyStats.water.target) * 100;
    const totalGlasses = Math.ceil(dailyStats.water.target / 250);

    return (
      <View style={[styles.waterCard, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.waterHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Water Intake
            </Text>
            <Text style={[styles.waterSubtitle, { color: colors.text.secondary }]}>
              {dailyStats.water.consumed}ml / {dailyStats.water.target}ml
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addWaterButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={handleAddWaterGlass}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Water Glasses */}
        <View style={styles.waterGlasses}>
          {Array.from({ length: totalGlasses }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.waterGlass,
                {
                  backgroundColor:
                    index < dailyStats.water.glasses
                      ? theme.colors.primary[500]
                      : colors.surface.secondary,
                },
              ]}
            >
              <Ionicons
                name="water"
                size={16}
                color={index < dailyStats.water.glasses ? '#fff' : colors.text.tertiary}
              />
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={[styles.waterProgressBar, { backgroundColor: colors.surface.secondary }]}>
          <View
            style={[
              styles.waterProgressFill,
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: theme.colors.primary[500] },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderMealsList = () => {
    const mealTypes = [
      { type: 'breakfast', icon: 'sunny', label: 'Breakfast', color: '#F59E0B' },
      { type: 'lunch', icon: 'restaurant', label: 'Lunch', color: '#10B981' },
      { type: 'dinner', icon: 'moon', label: 'Dinner', color: '#8B5CF6' },
      { type: 'snack', icon: 'fast-food', label: 'Snacks', color: '#EC4899' },
    ];

    return (
      <View style={[styles.mealsCard, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.mealsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Today's Meals
          </Text>
          <TouchableOpacity onPress={handleLogMeal}>
            <Ionicons name="add-circle" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {mealTypes.map(mealType => {
          const typeMeals = meals.filter(m => m.type === mealType.type);

          return (
            <View key={mealType.type} style={styles.mealTypeSection}>
              <View style={styles.mealTypeHeader}>
                <View style={[styles.mealTypeIcon, { backgroundColor: mealType.color + '20' }]}>
                  <Ionicons name={mealType.icon as any} size={18} color={mealType.color} />
                </View>
                <Text style={[styles.mealTypeLabel, { color: colors.text.primary }]}>
                  {mealType.label}
                </Text>
                {typeMeals.length > 0 && (
                  <Text style={[styles.mealTypeCount, { color: colors.text.tertiary }]}>
                    {typeMeals.reduce((sum, m) => sum + m.calories, 0)} cal
                  </Text>
                )}
              </View>

              {typeMeals.length > 0 ? (
                typeMeals.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.mealItem, { backgroundColor: colors.surface.secondary }]}
                  >
                    {meal.image && (
                      <Image source={{ uri: meal.image }} style={styles.mealImage} />
                    )}
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealName, { color: colors.text.primary }]}>
                        {meal.name}
                      </Text>
                      <Text style={[styles.mealTime, { color: colors.text.tertiary }]}>
                        {meal.time}
                      </Text>
                      <View style={styles.mealMacros}>
                        <Text style={[styles.mealMacro, { color: colors.text.secondary }]}>
                          P: {meal.protein}g
                        </Text>
                        <Text style={[styles.mealMacro, { color: colors.text.secondary }]}>
                          C: {meal.carbs}g
                        </Text>
                        <Text style={[styles.mealMacro, { color: colors.text.secondary }]}>
                          F: {meal.fats}g
                        </Text>
                      </View>
                    </View>
                    <View style={styles.mealCalories}>
                      <Text style={[styles.mealCaloriesValue, { color: colors.text.primary }]}>
                        {meal.calories}
                      </Text>
                      <Text style={[styles.mealCaloriesLabel, { color: colors.text.tertiary }]}>
                        cal
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={[styles.addMealButton, { backgroundColor: colors.surface.secondary }]}
                  onPress={handleLogMeal}
                >
                  <Ionicons name="add" size={20} color={colors.text.tertiary} />
                  <Text style={[styles.addMealText, { color: colors.text.tertiary }]}>
                    Add {mealType.label.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecipes = () => (
    <View style={styles.recipesSection}>
      <View style={styles.recipesHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recommended Recipes
        </Text>
        <TouchableOpacity>
          <Text style={[styles.viewAllText, { color: theme.colors.primary[500] }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesList}>
        {recipes.map(recipe => (
          <TouchableOpacity
            key={recipe.id}
            style={[styles.recipeCard, { backgroundColor: colors.surface.primary }]}
          >
            <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            {recipe.isPremium && (
              <View style={styles.recipePremiumBadge}>
                <Ionicons name="diamond" size={12} color="#FFD700" />
              </View>
            )}
            <View style={styles.recipeInfo}>
              <Text style={[styles.recipeName, { color: colors.text.primary }]} numberOfLines={2}>
                {recipe.name}
              </Text>
              <View style={styles.recipeStats}>
                <View style={styles.recipeStat}>
                  <Ionicons name="flame-outline" size={14} color={colors.text.tertiary} />
                  <Text style={[styles.recipeStatText, { color: colors.text.tertiary }]}>
                    {recipe.calories} cal
                  </Text>
                </View>
                <View style={styles.recipeStat}>
                  <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                  <Text style={[styles.recipeStatText, { color: colors.text.tertiary }]}>
                    {recipe.prepTime} min
                  </Text>
                </View>
              </View>
              <Text style={[styles.recipeProtein, { color: theme.colors.primary[500] }]}>
                {recipe.protein}g protein
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCalorieCard()}
        {renderMacrosCard()}
        {renderWaterCard()}
        {renderMealsList()}
        {renderRecipes()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  // ===== CALORIE CARD =====
  calorieCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  calorieTarget: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  calorieCircle: {
    position: 'relative',
  },
  calorieCircleCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriePercentage: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  calorieStats: {
    flexDirection: 'row',
    gap: 16,
  },
  calorieStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieStatContent: {
    flex: 1,
  },
  calorieStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  calorieStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  calorieStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ===== MACROS CARD =====
  macrosCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  macrosList: {
    gap: 16,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  macroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroName: {
    fontSize: 15,
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ===== WATER CARD =====
  waterCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addWaterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  waterGlass: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ===== MEALS CARD =====
  mealsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealTypeSection: {
    marginBottom: 20,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  mealTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  mealTypeCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  mealItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    marginBottom: 6,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  mealMacro: {
    fontSize: 11,
  },
  mealCalories: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  mealCaloriesValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  mealCaloriesLabel: {
    fontSize: 11,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  addMealText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== RECIPES =====
  recipesSection: {
    marginBottom: 16,
  },
  recipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recipesList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recipeCard: {
    width: 180,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  recipePremiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    minHeight: 36,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeStatText: {
    fontSize: 12,
  },
  recipeProtein: {
    fontSize: 13,
    fontWeight: '700',
  },
});


