/**
 * AI Workout Generator - Professional Types
 *
 * Types for multi-step questionnaire and program generation
 */

// ============================================
// STEP 1: Personal Profile
// ============================================

export type Gender = 'male' | 'female' | 'other';

export interface PersonalProfile {
  age: number;
  gender: Gender;
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg?: number;
}

// ============================================
// STEP 2: Experience & Goal
// ============================================

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type FitnessGoal =
  | 'hypertrophy' // Muscle building
  | 'fat_loss' // Weight loss / cutting
  | 'strength' // Max strength
  | 'endurance' // Cardio / stamina
  | 'recomposition'; // Build muscle + lose fat

export interface ExperienceGoal {
  fitness_level: FitnessLevel;
  goal: FitnessGoal;
  years_training?: number; // Optional: how many years training
}

// ============================================
// STEP 3: Availability & Constraints
// ============================================

export type DaysPerWeek = 2 | 3 | 4 | 5 | 6 | 7;

export type SessionDuration = 30 | 45 | 60 | 90 | 120; // minutes

export type EquipmentAvailable =
  | 'full_gym' // Commercial gym (all equipment)
  | 'home_gym_full' // Home gym (barbell, dumbbells, rack, bench)
  | 'home_gym_basic' // Home gym (dumbbells, bench)
  | 'dumbbells_only' // Just dumbbells
  | 'bodyweight' // No equipment
  | 'resistance_bands'; // Bands only

export type Injury =
  | 'shoulders'
  | 'knees'
  | 'lower_back'
  | 'elbows'
  | 'wrists'
  | 'hips'
  | 'neck'
  | 'none';

export interface AvailabilityConstraints {
  days_per_week: DaysPerWeek;
  session_duration: SessionDuration;
  equipment: EquipmentAvailable;
  injuries: Injury[]; // Can have multiple
}

// ============================================
// STEP 4: Program Selection
// ============================================

export type ProgramType =
  // TIER 1 - Main Programs
  | 'ppl_3x' // Push/Pull/Legs 3 days
  | 'ppl_6x' // Push/Pull/Legs 6 days
  | 'upper_lower_4x' // Upper/Lower 4 days
  | 'upper_lower_6x' // Upper/Lower 6 days
  | 'arnold_split' // Arnold Split 6 days
  | 'bro_split' // Bro Split 5 days
  | 'full_body_3x' // Full Body 3 days
  // TIER 2 - Science-Based
  | 'phul' // Power Hypertrophy Upper Lower
  | 'phat' // Power Hypertrophy Adaptive Training
  | 'ulppl' // Upper/Lower/Push/Pull/Legs hybrid
  // TIER 3 - Strength Focus
  | '531' // Jim Wendler 5/3/1
  | 'nsuns' // nSuns progression
  | 'starting_strength' // Beginner strength
  // TIER 4 - Premium/Custom
  | 'custom_ai'; // AI decides based on profile

export interface ProgramInfo {
  type: ProgramType;
  name: string;
  description: string;
  days_per_week: DaysPerWeek;
  best_for_goal: FitnessGoal[];
  best_for_level: FitnessLevel[];
  split_structure?: string; // e.g., "Push, Pull, Legs"
}

export interface ProgramSelection {
  program_type: ProgramType;
}

// ============================================
// STEP 5: Nutrition Preferences
// ============================================

export type DietType =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'flexible';

export type Allergy =
  | 'dairy'
  | 'gluten'
  | 'nuts'
  | 'soy'
  | 'eggs'
  | 'fish'
  | 'shellfish'
  | 'none';

export type MealsPerDay = 3 | 4 | 5 | 6;

export interface NutritionPreferences {
  diet_type: DietType;
  allergies: Allergy[];
  meals_per_day: MealsPerDay;
  track_macros: boolean; // Does user want macro tracking?
}

// ============================================
// Complete AI Generator Form State
// ============================================

export interface AIGeneratorFormData {
  // Step 1
  personal_profile: PersonalProfile;
  // Step 2
  experience_goal: ExperienceGoal;
  // Step 3
  availability: AvailabilityConstraints;
  // Step 4
  program: ProgramSelection;
  // Step 5
  nutrition: NutritionPreferences;
}

// ============================================
// Nutrition Calculations
// ============================================

export interface NutritionPlan {
  // Daily totals
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;

  // Metabolic data
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  activity_multiplier: number;

  // Meal breakdown
  calories_per_meal: number;
  protein_per_meal_g: number;
  carbs_per_meal_g: number;
  fat_per_meal_g: number;

  // Hydration
  daily_water_liters: number;

  // Macros breakdown percentages
  macro_split: {
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };

  // Recommendations
  supplements?: string[]; // e.g., ["Whey Protein", "Creatine", "Omega-3"]
}

// ============================================
// Program Generation Result
// ============================================

export interface GeneratedProgramWorkout {
  day_number: number;
  day_name: string; // e.g., "Push Day 1", "Upper Body 1"
  muscle_groups: string[]; // e.g., ["Chest", "Shoulders", "Triceps"]
  exercises: Array<{
    name: string;
    sets: number;
    reps: string; // e.g., "8-12", "AMRAP", "3-5"
    rest_seconds: number;
    notes?: string; // Technique cues, progression tips
  }>;
  estimated_duration_minutes: number;
}

export interface GeneratedProgram {
  // Program metadata
  program_name: string; // e.g., "6-Day PPL Hypertrophy Program"
  program_type: ProgramType;
  weeks_duration: number; // e.g., 8 weeks, 12 weeks

  // Weekly structure
  workouts_per_week: GeneratedProgramWorkout[];

  // Progression strategy
  progression_notes: string; // How to progress (add weight, reps, etc.)

  // Expected results
  expected_results: string; // What user can expect

  // Nutrition plan
  nutrition_plan: NutritionPlan;

  // User profile (for reference)
  user_profile: AIGeneratorFormData;
}

// ============================================
// Program Templates (Constants)
// ============================================

export const PROGRAM_TEMPLATES: Record<ProgramType, ProgramInfo> = {
  // TIER 1
  ppl_3x: {
    type: 'ppl_3x',
    name: 'Push/Pull/Legs 3x',
    description: 'Train each muscle group once per week with high volume',
    days_per_week: 3,
    best_for_goal: ['hypertrophy', 'strength'],
    best_for_level: ['beginner', 'intermediate'],
    split_structure: 'Push, Pull, Legs',
  },
  ppl_6x: {
    type: 'ppl_6x',
    name: 'Push/Pull/Legs 6x',
    description: 'Train each muscle group twice per week - optimal frequency',
    days_per_week: 6,
    best_for_goal: ['hypertrophy'],
    best_for_level: ['intermediate', 'advanced'],
    split_structure: 'Push, Pull, Legs (x2)',
  },
  upper_lower_4x: {
    type: 'upper_lower_4x',
    name: 'Upper/Lower 4x',
    description: 'Balanced split with 2x frequency - most popular',
    days_per_week: 4,
    best_for_goal: ['hypertrophy', 'strength', 'recomposition'],
    best_for_level: ['beginner', 'intermediate', 'advanced'],
    split_structure: 'Upper, Lower, Upper, Lower',
  },
  upper_lower_6x: {
    type: 'upper_lower_6x',
    name: 'Upper/Lower 6x',
    description: 'High frequency Upper/Lower for advanced lifters',
    days_per_week: 6,
    best_for_goal: ['hypertrophy', 'strength'],
    best_for_level: ['advanced', 'expert'],
    split_structure: 'Upper, Lower, Upper, Lower, Upper, Lower',
  },
  arnold_split: {
    type: 'arnold_split',
    name: 'Arnold Split',
    description: 'Chest/Back, Shoulders/Arms, Legs - Golden Era classic',
    days_per_week: 6,
    best_for_goal: ['hypertrophy'],
    best_for_level: ['advanced', 'expert'],
    split_structure: 'Chest/Back, Shoulders/Arms, Legs (x2)',
  },
  bro_split: {
    type: 'bro_split',
    name: 'Bro Split',
    description: 'One muscle group per day - high volume per session',
    days_per_week: 5,
    best_for_goal: ['hypertrophy'],
    best_for_level: ['intermediate', 'advanced'],
    split_structure: 'Chest, Back, Shoulders, Arms, Legs',
  },
  full_body_3x: {
    type: 'full_body_3x',
    name: 'Full Body 3x',
    description: 'Train all muscle groups 3x/week - great for beginners',
    days_per_week: 3,
    best_for_goal: ['strength', 'recomposition', 'endurance'],
    best_for_level: ['beginner', 'intermediate'],
    split_structure: 'Full Body A, Full Body B, Full Body C',
  },

  // TIER 2
  phul: {
    type: 'phul',
    name: 'PHUL',
    description: 'Power Hypertrophy Upper Lower - strength + size',
    days_per_week: 4,
    best_for_goal: ['hypertrophy', 'strength'],
    best_for_level: ['intermediate', 'advanced'],
    split_structure: 'Power Upper, Power Lower, Hypertrophy Upper, Hypertrophy Lower',
  },
  phat: {
    type: 'phat',
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training by Layne Norton',
    days_per_week: 5,
    best_for_goal: ['hypertrophy', 'strength'],
    best_for_level: ['advanced', 'expert'],
    split_structure: 'Power Upper, Power Lower, Hyper Back/Shoulders, Hyper Legs, Hyper Chest/Arms',
  },
  ulppl: {
    type: 'ulppl',
    name: 'ULPPL Hybrid',
    description: 'Upper, Lower, Push, Pull, Legs - maximum frequency',
    days_per_week: 5,
    best_for_goal: ['hypertrophy'],
    best_for_level: ['advanced'],
    split_structure: 'Upper, Lower, Push, Pull, Legs',
  },

  // TIER 3
  '531': {
    type: '531',
    name: '5/3/1',
    description: 'Jim Wendler strength program with slow progression',
    days_per_week: 4,
    best_for_goal: ['strength'],
    best_for_level: ['intermediate', 'advanced'],
    split_structure: 'Squat, Bench, Deadlift, OHP (+ accessories)',
  },
  nsuns: {
    type: 'nsuns',
    name: 'nSuns',
    description: 'High volume strength program based on 531',
    days_per_week: 4,
    best_for_goal: ['strength', 'hypertrophy'],
    best_for_level: ['intermediate', 'advanced'],
    split_structure: 'Variable (based on variant)',
  },
  starting_strength: {
    type: 'starting_strength',
    name: 'Starting Strength',
    description: 'Mark Rippetoe beginner program - learn the basics',
    days_per_week: 3,
    best_for_goal: ['strength'],
    best_for_level: ['beginner'],
    split_structure: 'Squat/Bench/Deadlift 3x/week',
  },

  // TIER 4
  custom_ai: {
    type: 'custom_ai',
    name: 'Custom AI Program',
    description: 'AI analyzes your profile and creates optimal program',
    days_per_week: 3, // Variable
    best_for_goal: ['hypertrophy', 'strength', 'fat_loss', 'endurance', 'recomposition'],
    best_for_level: ['beginner', 'intermediate', 'advanced', 'expert'],
    split_structure: 'AI-determined based on your profile',
  },
};

// ============================================
// Fitness Level Descriptions
// ============================================

export const FITNESS_LEVEL_INFO: Record<
  FitnessLevel,
  { label: string; description: string; years: string }
> = {
  beginner: {
    label: 'Beginner',
    description: 'New to structured training',
    years: '0-1 year',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Comfortable with compound lifts',
    years: '1-3 years',
  },
  advanced: {
    label: 'Advanced',
    description: 'Experienced lifter with solid foundation',
    years: '3-5 years',
  },
  expert: {
    label: 'Expert',
    description: 'Elite level training experience',
    years: '5+ years',
  },
};

// ============================================
// Fitness Goal Descriptions
// ============================================

export const FITNESS_GOAL_INFO: Record<
  FitnessGoal,
  { label: string; description: string; icon: string; color: string }
> = {
  hypertrophy: {
    label: 'Build Muscle',
    description: 'Maximize muscle growth and size',
    icon: 'fitness-outline',
    color: '#8B5CF6',
  },
  fat_loss: {
    label: 'Lose Fat',
    description: 'Burn fat while preserving muscle',
    icon: 'flame-outline',
    color: '#F59E0B',
  },
  strength: {
    label: 'Get Stronger',
    description: 'Increase maximum strength',
    icon: 'barbell-outline',
    color: '#EF4444',
  },
  endurance: {
    label: 'Build Endurance',
    description: 'Improve cardiovascular fitness',
    icon: 'heart-outline',
    color: '#10B981',
  },
  recomposition: {
    label: 'Recomposition',
    description: 'Build muscle + lose fat simultaneously',
    icon: 'pulse-outline',
    color: '#3B82F6',
  },
};
