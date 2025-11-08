/**
 * Workout & Exercise Types
 *
 * Core types for workout system
 */

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type WorkoutCategory =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'mobility'
  | 'recovery'
  | 'sport_specific';

export type EquipmentType =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'bench'
  | 'yoga_mat'
  | 'foam_roller';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'legs'
  | 'glutes'
  | 'calves'
  | 'full_body';

/**
 * Exercise - Single movement/exercise
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;

  // Media
  thumbnail_url?: string;
  video_url?: string;
  gif_url?: string;

  // Categorization
  muscle_groups: MuscleGroup[];
  equipment: EquipmentType[];
  difficulty: FitnessLevel;

  // Instructions
  instructions: string[];
  tips?: string[];
  common_mistakes?: string[];

  // Tracking
  has_reps: boolean;
  has_duration: boolean;
  has_distance: boolean;
  has_weight: boolean;

  // Defaults
  default_reps?: number;
  default_duration_seconds?: number;
  default_sets?: number;
  rest_seconds?: number;

  // Metadata
  calories_per_rep?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Workout Exercise - Exercise instance in a workout
 */
export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise; // Populated exercise data

  // Order
  order: number;

  // Sets & Reps
  sets: number;
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;

  // Rest
  rest_seconds: number;

  // Notes
  notes?: string;
}

/**
 * Workout - Complete workout session
 */
export interface Workout {
  id: string;
  title: string;
  description: string;

  // Media
  thumbnail_url?: string;
  video_preview_url?: string;

  // Categorization
  category: WorkoutCategory;
  difficulty: FitnessLevel;
  muscle_groups: MuscleGroup[];
  equipment: EquipmentType[];

  // Duration
  estimated_duration_minutes: number;

  // Calories
  estimated_calories: number;

  // Exercises
  exercises: WorkoutExercise[];

  // Stats
  total_exercises: number;
  completion_count: number;
  average_rating?: number;

  // Metadata
  is_premium: boolean;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Program - Multi-week training program
 */
export interface Program {
  id: string;
  title: string;
  description: string;

  // Media
  thumbnail_url?: string;

  // Categorization
  goal: 'lose_weight' | 'build_muscle' | 'get_stronger' | 'improve_endurance' | 'athletic_performance';
  difficulty: FitnessLevel;

  // Duration
  duration_weeks: number;
  workouts_per_week: number;

  // Workouts
  workout_ids: string[];

  // Stats
  enrollment_count: number;
  completion_rate?: number;
  average_rating?: number;

  // Metadata
  is_premium: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * User Workout Progress - Tracking user's workout session
 */
export interface UserWorkoutProgress {
  id: string;
  user_id: string;
  workout_id: string;

  // Status
  status: 'in_progress' | 'completed' | 'abandoned';

  // Progress
  current_exercise_index: number;
  completed_exercises: number;

  // Performance
  duration_seconds: number;
  calories_burned: number;

  // Exercise logs
  exercise_logs: ExerciseLog[];

  // Timestamps
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Exercise Log - Individual exercise performance
 */
export interface ExerciseLog {
  id: string;
  exercise_id: string;

  // Performance
  sets_completed: number;
  reps_completed?: number;
  duration_seconds?: number;
  distance_meters?: number;
  weight_kg?: number;

  // Rating
  difficulty_rating?: 1 | 2 | 3 | 4 | 5;

  // Notes
  notes?: string;

  // Timestamp
  completed_at: string;
}
