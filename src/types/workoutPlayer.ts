/**
 * Workout Player Types
 *
 * Types for real-time workout session tracking and player state
 */

import type { WorkoutExercise } from './workout';

/**
 * Player State - Current state of the workout player
 */
export type PlayerState = 'idle' | 'playing' | 'paused' | 'resting' | 'completed';

/**
 * Exercise Phase - Current phase of exercise execution
 */
export type ExercisePhase = 'exercise' | 'rest';

/**
 * Set Status - Status of a single set
 */
export interface SetStatus {
  setNumber: number;
  completed: boolean;
  reps?: number;
  weight?: number;
  duration?: number;
}

/**
 * Exercise Session - Real-time exercise tracking
 */
export interface ExerciseSession {
  exerciseId: string;
  workoutExercise: WorkoutExercise;

  // Progress
  currentSet: number;
  totalSets: number;
  sets: SetStatus[];

  // Timers
  elapsedTime: number; // Total time on this exercise (seconds)
  restTimeRemaining: number; // Rest countdown (seconds)

  // State
  phase: ExercisePhase;
  completed: boolean;

  // Performance
  repsCompleted?: number;
  durationSeconds?: number;
  weight?: number;

  // Timestamps
  startedAt: string;
  completedAt?: string;
}

/**
 * Workout Session - Real-time workout tracking
 */
export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;

  // Progress
  currentExerciseIndex: number;
  totalExercises: number;
  exerciseSessions: ExerciseSession[];

  // State
  playerState: PlayerState;

  // Timers
  totalElapsedTime: number; // Total workout duration (seconds)

  // Performance
  caloriesBurned: number;
  completedExercises: number;

  // Timestamps
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
}

/**
 * Player Controls - Actions available in player
 */
export interface PlayerControls {
  play: () => void;
  pause: () => void;
  resume: () => void;
  skipExercise: () => void;
  previousExercise: () => void;
  completeSet: () => void;
  skipRest: () => void;
  exit: () => void;
}

/**
 * Timer Config - Configuration for different timers
 */
export interface TimerConfig {
  type: 'countdown' | 'countup';
  duration?: number; // For countdown (seconds)
  maxDuration?: number; // For countup (seconds)
  autoAdvance?: boolean;
}

/**
 * Player Settings - User preferences for player
 */
export interface PlayerSettings {
  autoAdvance: boolean;
  restTimerSound: boolean;
  hapticFeedback: boolean;
  voiceGuidance: boolean;
  musicDuringRest: boolean;
  keepScreenOn: boolean;
}
