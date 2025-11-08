/**
 * Onboarding Types
 */

export type GoalType =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_endurance'
  | 'get_stronger'
  | 'increase_flexibility'
  | 'general_wellness';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type EquipmentType =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'bench'
  | 'yoga_mat'
  | 'foam_roller'
  | 'full_gym';

export type WorkoutMoment = 'morning' | 'afternoon' | 'evening' | 'flexible';

export type Unit = 'metric' | 'imperial';

/**
 * Onboarding Data collected across all steps
 */
export interface OnboardingData {
  // Step 1: Goal
  goal: GoalType | null;

  // Step 2: Fitness Level
  fitness_level: FitnessLevel | null;

  // Step 3: Physical Info
  age: number | null;
  gender: Gender | null;
  height_cm: number | null; // Always store in cm
  weight_kg: number | null; // Always store in kg

  // Step 4: Sports History
  sports_history: string[]; // Array of sport names
  current_activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

  // Step 5: Injuries & Limitations
  injuries: string[]; // Array of injury descriptions
  medical_conditions: string[]; // Array of conditions
  notes: string | null;

  // Step 6: Equipment
  equipment_available: EquipmentType[];
  workout_location: 'home' | 'gym' | 'outdoor' | 'mixed';

  // Step 7: Availability
  days_per_week: number; // 1-7
  minutes_per_session: number; // 15, 30, 45, 60, 90
  preferred_workout_time: WorkoutMoment;

  // Step 8: Preferences
  music_enabled: boolean;
  music_genres: string[]; // Array of genre preferences
  voice_coach_enabled: boolean;
  language: string; // 'en', 'fr', etc.
  units: Unit;

  // Step 9: Target
  target_weight_kg: number | null;
  target_date: string | null; // ISO date string
  motivation: string | null; // Main motivation text

  // Completion
  completed_at: string | null; // ISO timestamp when onboarding completed
}

/**
 * Goal Options with metadata
 */
export interface GoalOption {
  value: GoalType;
  label: string;
  description: string;
  icon: string; // Emoji or icon name
  color: string; // Hex color
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'lose_weight',
    label: 'Lose Weight',
    description: 'Burn fat and get leaner',
    icon: '🔥',
    color: '#FF6B6B',
  },
  {
    value: 'build_muscle',
    label: 'Build Muscle',
    description: 'Gain strength and size',
    icon: '💪',
    color: '#4ECDC4',
  },
  {
    value: 'improve_endurance',
    label: 'Improve Endurance',
    description: 'Boost stamina and cardio',
    icon: '🏃',
    color: '#FFE66D',
  },
  {
    value: 'get_stronger',
    label: 'Get Stronger',
    description: 'Increase maximum strength',
    icon: '⚡',
    color: '#FF8C42',
  },
  {
    value: 'increase_flexibility',
    label: 'Flexibility',
    description: 'Improve mobility and range',
    icon: '🧘',
    color: '#9B59B6',
  },
  {
    value: 'general_wellness',
    label: 'General Wellness',
    description: 'Overall health and fitness',
    icon: '✨',
    color: '#95E1D3',
  },
];

/**
 * Fitness Level Options
 */
export interface FitnessLevelOption {
  value: FitnessLevel;
  label: string;
  description: string;
  examples: string[];
}

export const FITNESS_LEVEL_OPTIONS: FitnessLevelOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to fitness or returning after a break',
    examples: [
      'Less than 6 months of training',
      'Can do 5-10 push-ups',
      'Need modifications for most exercises',
    ],
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Regular workout routine established',
    examples: [
      '6 months - 2 years of training',
      'Can do 15-25 push-ups',
      'Comfortable with most basic exercises',
    ],
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced with consistent training',
    examples: [
      '2+ years of consistent training',
      'Can do 30+ push-ups',
      'Can perform advanced movements',
    ],
  },
  {
    value: 'expert',
    label: 'Expert/Athlete',
    description: 'Competitive level or professional training',
    examples: [
      '5+ years of training',
      'Compete or train at elite level',
      'Master complex movements',
    ],
  },
];

/**
 * Equipment Options
 */
export interface EquipmentOption {
  value: EquipmentType;
  label: string;
  icon: string;
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'none', label: 'No Equipment', icon: '🏠' },
  { value: 'dumbbells', label: 'Dumbbells', icon: '💪' },
  { value: 'barbell', label: 'Barbell', icon: '🏋️‍♂️' },
  { value: 'kettlebell', label: 'Kettlebell', icon: '⚫' },
  { value: 'resistance_bands', label: 'Resistance Bands', icon: '🎗️' },
  { value: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔗' },
  { value: 'bench', label: 'Bench', icon: '🛋️' },
  { value: 'yoga_mat', label: 'Yoga Mat', icon: '🧘‍♀️' },
  { value: 'foam_roller', label: 'Foam Roller', icon: '🎯' },
  { value: 'full_gym', label: 'Full Gym Access', icon: '🏋️' },
];
