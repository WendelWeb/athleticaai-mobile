/**
 * Nutrition Calculation Service
 *
 * Science-based formulas for:
 * - BMR (Basal Metabolic Rate)
 * - TDEE (Total Daily Energy Expenditure)
 * - Macro calculations (Protein, Carbs, Fat)
 * - Meal planning
 * - Hydration needs
 *
 * Formulas used:
 * - Mifflin-St Jeor (BMR) - Most accurate for general population
 * - Activity multipliers based on training frequency
 * - Protein: 2.2g/kg for lifters (research-backed)
 * - Fat: 25% calories (hormone production)
 * - Carbs: Remainder (fuel for training)
 */

import type {
  Gender,
  FitnessGoal,
  DaysPerWeek,
  MealsPerDay,
  NutritionPlan,
  PersonalProfile,
  AIGeneratorFormData,
} from '@/types/aiGenerator';

// ============================================
// BMR Calculation (Mifflin-St Jeor Equation)
// ============================================

/**
 * Calculate Basal Metabolic Rate
 * Most accurate formula for modern populations
 *
 * Male: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Female: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(profile: PersonalProfile): number {
  const { age, gender, height_cm, current_weight_kg } = profile;

  const baseBMR =
    10 * current_weight_kg + 6.25 * height_cm - 5 * age;

  if (gender === 'male') {
    return baseBMR + 5;
  } else if (gender === 'female') {
    return baseBMR - 161;
  } else {
    // For 'other', use average of male/female
    return baseBMR - 78;
  }
}

// ============================================
// Activity Multipliers
// ============================================

/**
 * Get activity multiplier based on training frequency
 *
 * Research-backed multipliers:
 * - 2-3 days: Light (1.375)
 * - 4-5 days: Moderate (1.55)
 * - 6-7 days: Very Active (1.725)
 */
function getActivityMultiplier(days_per_week: DaysPerWeek): number {
  if (days_per_week <= 3) return 1.375; // Light activity
  if (days_per_week <= 5) return 1.55; // Moderate activity
  return 1.725; // Very active
}

// ============================================
// TDEE Calculation
// ============================================

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(
  bmr: number,
  days_per_week: DaysPerWeek
): number {
  const multiplier = getActivityMultiplier(days_per_week);
  return Math.round(bmr * multiplier);
}

// ============================================
// Calorie Target Based on Goal
// ============================================

/**
 * Adjust calories based on fitness goal
 *
 * - Fat Loss: -500 cal (1 lb/week loss)
 * - Hypertrophy: +300 cal (lean bulk)
 * - Strength: +400 cal (strength gains)
 * - Recomposition: Maintenance (TDEE)
 * - Endurance: Maintenance or slight surplus
 */
export function calculateCalorieTarget(
  tdee: number,
  goal: FitnessGoal
): number {
  switch (goal) {
    case 'fat_loss':
      return tdee - 500; // 1 lb/week fat loss
    case 'hypertrophy':
      return tdee + 300; // Lean bulk
    case 'strength':
      return tdee + 400; // Strength gains need more fuel
    case 'recomposition':
      return tdee; // Maintenance
    case 'endurance':
      return tdee + 100; // Slight surplus for recovery
    default:
      return tdee;
  }
}

// ============================================
// Macro Calculations
// ============================================

/**
 * Calculate daily protein needs
 *
 * Research: 2.2g/kg optimal for muscle building
 * - Fat Loss: 2.4g/kg (preserve muscle in deficit)
 * - Hypertrophy: 2.2g/kg
 * - Strength: 2.0g/kg
 * - Endurance: 1.6g/kg
 */
export function calculateProtein(
  weight_kg: number,
  goal: FitnessGoal
): number {
  let multiplier: number;

  switch (goal) {
    case 'fat_loss':
      multiplier = 2.4; // Higher to preserve muscle
      break;
    case 'hypertrophy':
      multiplier = 2.2; // Optimal for growth
      break;
    case 'strength':
      multiplier = 2.0;
      break;
    case 'endurance':
      multiplier = 1.6;
      break;
    case 'recomposition':
      multiplier = 2.3;
      break;
    default:
      multiplier = 2.0;
  }

  return Math.round(weight_kg * multiplier);
}

/**
 * Calculate daily fat needs
 *
 * Fat = 25% of total calories (hormone production, vitamin absorption)
 * Minimum: 0.8g/kg (health minimum)
 */
export function calculateFat(
  calories: number,
  weight_kg: number
): number {
  const fatFromCalories = (calories * 0.25) / 9; // 9 cal per gram fat
  const minimumFat = weight_kg * 0.8; // Minimum for health

  return Math.round(Math.max(fatFromCalories, minimumFat));
}

/**
 * Calculate daily carbs needs
 *
 * Carbs = Remainder calories after protein & fat
 */
export function calculateCarbs(
  calories: number,
  protein_g: number,
  fat_g: number
): number {
  const proteinCalories = protein_g * 4; // 4 cal per gram
  const fatCalories = fat_g * 9; // 9 cal per gram
  const remainingCalories = calories - proteinCalories - fatCalories;

  return Math.round(remainingCalories / 4); // 4 cal per gram carbs
}

// ============================================
// Hydration Needs
// ============================================

/**
 * Calculate daily water needs
 *
 * Formula: 0.045L × body weight in kg
 * (Adjust for activity level)
 */
export function calculateHydration(
  weight_kg: number,
  days_per_week: DaysPerWeek
): number {
  let baseWater = weight_kg * 0.045; // Liters

  // Add more for high training frequency
  if (days_per_week >= 6) {
    baseWater *= 1.2; // +20% for very active
  } else if (days_per_week >= 4) {
    baseWater *= 1.1; // +10% for active
  }

  return Math.round(baseWater * 10) / 10; // Round to 1 decimal
}

// ============================================
// Supplement Recommendations
// ============================================

/**
 * Get evidence-based supplement recommendations
 */
export function getSupplementRecommendations(
  goal: FitnessGoal
): string[] {
  const base = [
    'Whey Protein (30g post-workout)',
    'Creatine Monohydrate (5g daily)',
    'Omega-3 Fish Oil (2g daily)',
    'Vitamin D (2000 IU daily)',
  ];

  const goalSpecific: Record<FitnessGoal, string[]> = {
    hypertrophy: [...base, 'Citrulline Malate (6g pre-workout)'],
    strength: [...base, 'Beta-Alanine (3-5g daily)', 'Caffeine (200-400mg pre-workout)'],
    fat_loss: [
      ...base,
      'Caffeine (200-400mg)',
      'Green Tea Extract (400-500mg)',
    ],
    endurance: [...base, 'Beta-Alanine (3-5g daily)', 'Beetroot Extract'],
    recomposition: [...base],
  };

  return goalSpecific[goal] || base;
}

// ============================================
// Complete Nutrition Plan Generator
// ============================================

/**
 * Generate complete nutrition plan from user profile
 */
export function generateNutritionPlan(
  formData: AIGeneratorFormData
): NutritionPlan {
  const {
    personal_profile,
    experience_goal,
    availability,
    nutrition,
  } = formData;

  // Step 1: Calculate BMR
  const bmr = calculateBMR(personal_profile);

  // Step 2: Calculate TDEE
  const tdee = calculateTDEE(bmr, availability.days_per_week);

  // Step 3: Adjust calories for goal
  const daily_calories = calculateCalorieTarget(tdee, experience_goal.goal);

  // Step 4: Calculate macros
  const daily_protein_g = calculateProtein(
    personal_profile.current_weight_kg,
    experience_goal.goal
  );
  const daily_fat_g = calculateFat(
    daily_calories,
    personal_profile.current_weight_kg
  );
  const daily_carbs_g = calculateCarbs(
    daily_calories,
    daily_protein_g,
    daily_fat_g
  );

  // Step 5: Calculate per-meal breakdown
  const meals = nutrition.meals_per_day;
  const calories_per_meal = Math.round(daily_calories / meals);
  const protein_per_meal_g = Math.round(daily_protein_g / meals);
  const carbs_per_meal_g = Math.round(daily_carbs_g / meals);
  const fat_per_meal_g = Math.round(daily_fat_g / meals);

  // Step 6: Calculate macro percentages
  const total_calories =
    daily_protein_g * 4 + daily_carbs_g * 4 + daily_fat_g * 9;
  const protein_percent = Math.round(
    (daily_protein_g * 4) / total_calories * 100
  );
  const carbs_percent = Math.round(
    (daily_carbs_g * 4) / total_calories * 100
  );
  const fat_percent = Math.round(
    (daily_fat_g * 9) / total_calories * 100
  );

  // Step 7: Hydration
  const daily_water_liters = calculateHydration(
    personal_profile.current_weight_kg,
    availability.days_per_week
  );

  // Step 8: Activity multiplier
  const activity_multiplier = getActivityMultiplier(
    availability.days_per_week
  );

  // Step 9: Supplements
  const supplements = getSupplementRecommendations(experience_goal.goal);

  return {
    // Daily totals
    daily_calories,
    daily_protein_g,
    daily_carbs_g,
    daily_fat_g,

    // Metabolic data
    bmr,
    tdee,
    activity_multiplier,

    // Meal breakdown
    calories_per_meal,
    protein_per_meal_g,
    carbs_per_meal_g,
    fat_per_meal_g,

    // Hydration
    daily_water_liters,

    // Macros breakdown
    macro_split: {
      protein_percent,
      carbs_percent,
      fat_percent,
    },

    // Recommendations
    supplements,
  };
}

// ============================================
// BMI Calculator (Bonus)
// ============================================

/**
 * Calculate BMI (Body Mass Index)
 * BMI = weight (kg) / (height (m))^2
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// ============================================
// Weight Change Estimator
// ============================================

/**
 * Estimate time to reach goal weight
 * Assumes:
 * - Fat loss: 0.5-1 kg/week (500 cal deficit)
 * - Muscle gain: 0.25-0.5 kg/week (300-400 cal surplus)
 */
export function estimateTimeToGoal(
  current_weight_kg: number,
  goal_weight_kg: number,
  goal: FitnessGoal
): { weeks: number; months: number; rate_per_week_kg: number } {
  const diff = Math.abs(goal_weight_kg - current_weight_kg);

  let rate_per_week_kg: number;

  if (goal === 'fat_loss' && current_weight_kg > goal_weight_kg) {
    rate_per_week_kg = 0.75; // 0.75 kg/week fat loss (sustainable)
  } else if (goal === 'hypertrophy' && current_weight_kg < goal_weight_kg) {
    rate_per_week_kg = 0.35; // 0.35 kg/week muscle gain (realistic)
  } else {
    rate_per_week_kg = 0.5; // Default
  }

  const weeks = Math.round(diff / rate_per_week_kg);
  const months = Math.round((weeks / 4) * 10) / 10;

  return {
    weeks,
    months,
    rate_per_week_kg,
  };
}
