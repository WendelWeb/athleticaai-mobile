/**
 * Drizzle Workouts Service
 *
 * Replaces Supabase workouts service with Drizzle ORM
 * Maintains EXACT same interface for seamless migration
 *
 * Features:
 * - Fetch workouts with filters
 * - Get workout by ID
 * - Get exercises
 * - Create/update workout sessions
 * - Track progress
 */

import { db, workouts, exercises, userWorkoutSessions, workoutPrograms } from '@/db';
import { eq, and, or, desc, asc, gte, like, inArray, sql } from 'drizzle-orm';
import type { Workout, FitnessLevel, WorkoutCategory, EquipmentType, MuscleGroup } from '@/types/workout';
import { handleError, logger, safeToISOString, toISOString } from '@/utils';

// =====================================================
// INTERFACES (re-export from Supabase service)
// =====================================================

export interface GetWorkoutsFilters {
  category?: WorkoutCategory;
  difficulty?: FitnessLevel;
  equipment?: string[];
  isPremium?: boolean;
  search?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  animation_url?: string;
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'full_body';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  equipment_required?: string[];
  primary_muscles: string[];
  secondary_muscles?: string[];
  instructions?: string[];
  tips?: string[];
  common_mistakes?: string[];
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  muscle_primary?: string;
  muscles_secondary?: string[];
  equipment?: string;
  difficulty?: string;
  image_url?: string;
  duration_minutes?: number;
  calories_burned?: number;
  sets_recommended?: number;
  reps_recommended?: string;
  rest_seconds?: number;
  tags?: string[];
}

export interface ExerciseFilters {
  category?: string;
  difficulty?: string;
  equipment?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_weeks: number;
  workouts_per_week: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_goals: string[];
  target_fitness_levels: string[];
  total_workouts: number;
  estimated_time_per_workout: number | null;
  is_premium: boolean;
  enrolled_count: number;
  completion_rate: string;
  average_rating: string;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutProgramFilters {
  difficulty?: string;
  goal?: string;
  isPremium?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// WORKOUT PROGRAMS - Fetch Functions
// =====================================================

/**
 * Get all workout programs with optional filters
 */
export const getWorkoutPrograms = async (filters?: WorkoutProgramFilters): Promise<WorkoutProgram[]> => {
  try {
    const conditions: any[] = [];

    if (filters?.difficulty) {
      conditions.push(eq(workoutPrograms.difficulty_level, filters.difficulty as any));
    }

    if (filters?.isPremium !== undefined) {
      conditions.push(eq(workoutPrograms.is_premium, filters.isPremium));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(workoutPrograms.name, `%${filters.search}%`),
          like(workoutPrograms.description, `%${filters.search}%`)
        )
      );
    }

    let query = conditions.length > 0
      ? db.select().from(workoutPrograms).where(and(...conditions)).orderBy(desc(workoutPrograms.enrolled_count))
      : db.select().from(workoutPrograms).orderBy(desc(workoutPrograms.enrolled_count));

    // Apply pagination
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as any;
    }

    const data = await query;

    // Debug logging
    logger.debug('[Workouts] getWorkoutPrograms', {
      filters,
      count: data.length,
      first: data[0]?.name,
      last: data[data.length - 1]?.name,
    });

    return data.map((program: any) => ({
      ...program,
      created_at: safeToISOString(program.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(program.updated_at) || new Date().toISOString(),
      completion_rate: program.completion_rate?.toString() || '0',
      average_rating: program.average_rating?.toString() || '0',
    })) as WorkoutProgram[];
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout programs',
      description: 'Please check your connection and try again',
      showToast: true,
      context: 'WorkoutsService.getWorkoutPrograms',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get popular workout programs
 */
export const getPopularWorkoutPrograms = async (limit: number = 5): Promise<WorkoutProgram[]> => {
  try {
    const data = await db
      .select()
      .from(workoutPrograms)
      .orderBy(desc(workoutPrograms.enrolled_count))
      .limit(limit);

    return data.map((program: any) => ({
      ...program,
      created_at: safeToISOString(program.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(program.updated_at) || new Date().toISOString(),
      completion_rate: program.completion_rate?.toString() || '0',
      average_rating: program.average_rating?.toString() || '0',
    })) as WorkoutProgram[];
  } catch (error) {
    handleError(error, {
      message: 'Failed to load popular programs',
      description: 'Unable to load featured programs',
      showToast: true,
      context: 'WorkoutsService.getPopularWorkoutPrograms',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get workout program by ID
 */
export const getWorkoutProgramById = async (id: string): Promise<WorkoutProgram | null> => {
  try {
    const data = await db.select().from(workoutPrograms).where(eq(workoutPrograms.id, id)).limit(1);

    if (data.length === 0) {
      return null;
    }

    const program = data[0];
    return {
      ...program,
      created_at: safeToISOString(program.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(program.updated_at) || new Date().toISOString(),
      completion_rate: program.completion_rate?.toString() || '0',
      average_rating: program.average_rating?.toString() || '0',
    } as WorkoutProgram;
  } catch (error) {
    handleError(error, {
      message: 'Failed to load program details',
      description: 'Please try again',
      showToast: true,
      context: 'WorkoutsService.getProgramById',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get workouts for a specific program
 */
export const getWorkoutsByProgramId = async (programId: string): Promise<any[]> => {
  try {
    const data = await db
      .select()
      .from(workouts)
      .where(eq(workouts.program_id, programId))
      .orderBy(asc(workouts.week_number), asc(workouts.day_number));

    return data.map((workout: any) => ({
      workout_id: workout.id, // Use real UUID now
      week_number: workout.week_number,
      day_number: workout.day_number,
      name: workout.name,
      description: workout.description,
      workout_type: workout.workout_type,
      difficulty_level: workout.difficulty_level,
      estimated_duration: workout.estimated_duration,
      calories_burned_estimate: workout.calories_burned_estimate,
      thumbnail_url: workout.thumbnail_url,
      is_premium: workout.is_premium,
      created_at: safeToISOString(workout.created_at) || new Date().toISOString(),
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load program workouts',
      description: 'Unable to load workout schedule',
      showToast: true,
      context: 'WorkoutsService.getWorkoutsByProgramId',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// WORKOUTS - Fetch Functions
// =====================================================

/**
 * Get all workouts with optional filters
 */
export const getWorkouts = async (filters?: GetWorkoutsFilters): Promise<Workout[]> => {
  try {
    // Build WHERE conditions
    const conditions: any[] = [];

    if (filters?.category) {
      conditions.push(eq(workouts.workout_type, filters.category as any));
    }

    if (filters?.difficulty) {
      conditions.push(eq(workouts.difficulty_level, filters.difficulty as any));
    }

    if (filters?.isPremium !== undefined) {
      conditions.push(eq(workouts.is_premium, filters.isPremium));
    }

    if (filters?.search) {
      // Search in name or description
      conditions.push(
        or(
          like(workouts.name, `%${filters.search}%`),
          like(workouts.description, `%${filters.search}%`)
        )
      );
    }

    // Execute query
    const query = conditions.length > 0
      ? db.select().from(workouts).where(and(...conditions)).orderBy(desc(workouts.completion_count))
      : db.select().from(workouts).orderBy(desc(workouts.completion_count));

    const data = await query;

    // Transform to app format
    return transformWorkoutsFromDB(data);
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workouts',
      description: 'Unable to load workout list',
      showToast: true,
      context: 'WorkoutsService.getWorkouts',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get single workout by ID
 */
export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  try {
    const data = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);

    if (data.length === 0) {
      return null;
    }

    return transformWorkoutFromDB(data[0]);
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout',
      description: 'Unable to load workout details',
      showToast: true,
      context: 'WorkoutsService.getWorkoutById',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get popular workouts
 */
export const getPopularWorkouts = async (limit: number = 5): Promise<Workout[]> => {
  try {
    const data = await db
      .select()
      .from(workouts)
      .orderBy(desc(workouts.completion_count))
      .limit(limit);

    return transformWorkoutsFromDB(data);
  } catch (error) {
    handleError(error, {
      message: 'Failed to load popular workouts',
      description: 'Unable to load featured workouts',
      showToast: true,
      context: 'WorkoutsService.getPopularWorkouts',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get recommended workouts based on user profile
 */
export const getRecommendedWorkouts = async (
  userLevel: FitnessLevel,
  limit: number = 5
): Promise<Workout[]> => {
  try {
    // Get workouts matching user's level or below
    const levels: FitnessLevel[] = ['beginner', 'intermediate', 'advanced', 'elite'];
    const userLevelIndex = levels.indexOf(userLevel);
    const allowedLevels = levels.slice(0, userLevelIndex + 1);

    const data = await db
      .select()
      .from(workouts)
      .where(inArray(workouts.difficulty_level, allowedLevels as any[]))
      .orderBy(desc(workouts.average_rating))
      .limit(limit);

    return transformWorkoutsFromDB(data);
  } catch (error) {
    handleError(error, {
      message: 'Failed to load recommendations',
      description: 'Unable to load recommended workouts',
      showToast: true,
      context: 'WorkoutsService.getRecommendedWorkouts',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Search workouts
 */
export const searchWorkouts = async (query: string): Promise<Workout[]> => {
  return getWorkouts({ search: query });
};

// =====================================================
// EXERCISES - Fetch Functions
// =====================================================

/**
 * Get all exercises with optional filters
 */
export const getExercises = async (filters?: ExerciseFilters): Promise<Exercise[]> => {
  try {
    // Build WHERE conditions
    const conditions: any[] = [];

    if (filters?.category) {
      conditions.push(eq(exercises.category, filters.category as any));
    }

    if (filters?.difficulty) {
      conditions.push(eq(exercises.difficulty_level, filters.difficulty as any));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(exercises.name, `%${filters.search}%`),
          like(exercises.description, `%${filters.search}%`)
        )
      );
    }

    // Execute query
    let query = conditions.length > 0
      ? db.select().from(exercises).where(and(...conditions)).orderBy(asc(exercises.name))
      : db.select().from(exercises).orderBy(asc(exercises.name));

    // Apply pagination
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as any;
    }

    const data = await query;

    // Debug logging
    logger.debug('[Workouts] getExercises', {
      filters,
      count: data.length,
      first: data[0]?.name,
      last: data[data.length - 1]?.name,
    });

    // Transform and add computed fields
    return data.map((ex: any) => ({
      ...ex,
      // Compatibility fields
      muscle_primary: ex.primary_muscles?.[0] || 'Unknown',
      muscles_secondary: ex.secondary_muscles || [],
      equipment: ex.equipment_required?.[0] || 'none',
      difficulty: ex.difficulty_level,
      image_url: ex.thumbnail_url,
      duration_minutes: 3,
      calories_burned: 20,
      sets_recommended: 3,
      reps_recommended: '10-15',
      rest_seconds: 90,
      tags: ex.category ? [ex.category] : [],
      created_at: safeToISOString(ex.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(ex.updated_at) || new Date().toISOString(),
    })) as Exercise[];
  } catch (error) {
    handleError(error, {
      message: 'Failed to load exercises',
      description: 'Please check your connection',
      showToast: true,
      context: 'WorkoutsService.getExercises',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const data = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);

    if (data.length === 0) {
      return null;
    }

    const ex = data[0];

    return {
      ...ex,
      muscle_primary: ex.primary_muscles?.[0] || 'Unknown',
      muscles_secondary: ex.secondary_muscles || [],
      equipment: ex.equipment_required?.[0] || 'none',
      difficulty: ex.difficulty_level,
      image_url: ex.thumbnail_url,
      duration_minutes: 3,
      calories_burned: 20,
      sets_recommended: 3,
      reps_recommended: '10-15',
      rest_seconds: 90,
      tags: ex.category ? [ex.category] : [],
      created_at: safeToISOString(ex.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(ex.updated_at) || new Date().toISOString(),
    } as Exercise;
  } catch (error) {
    handleError(error, {
      message: 'Failed to load exercise',
      description: 'Unable to load exercise details',
      showToast: true,
      context: 'WorkoutsService.getExerciseById',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get exercises by category
 */
export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  return getExercises({ category });
};

/**
 * Search exercises with autocomplete
 */
export const searchExercises = async (query: string, limit: number = 10): Promise<Exercise[]> => {
  try {
    const data = await db
      .select()
      .from(exercises)
      .where(
        or(
          like(exercises.name, `%${query}%`),
          like(exercises.description, `%${query}%`)
        )
      )
      .limit(limit);

    // Transform data
    return data.map((ex: any) => ({
      ...ex,
      muscle_primary: ex.primary_muscles?.[0] || 'Unknown',
      muscles_secondary: ex.secondary_muscles || [],
      equipment: ex.equipment_required?.[0] || 'none',
      difficulty: ex.difficulty_level,
      image_url: ex.thumbnail_url,
      duration_minutes: 3,
      calories_burned: 20,
      sets_recommended: 3,
      reps_recommended: '10-15',
      rest_seconds: 90,
      tags: ex.category ? [ex.category] : [],
      created_at: safeToISOString(ex.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(ex.updated_at) || new Date().toISOString(),
    })) as Exercise[];
  } catch (error) {
    handleError(error, {
      message: 'Failed to search exercises',
      description: 'Unable to find exercises',
      showToast: true,
      context: 'WorkoutsService.searchExercises',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get exercise categories with counts
 */
export const getExerciseCategories = async (): Promise<Array<{ name: string; count: number; icon: string }>> => {
  try {
    // Get all exercises and count by category
    const data = await db.select().from(exercises);

    // Count exercises per category
    const categoryCounts: Record<string, number> = {};
    data.forEach((item: typeof data[0]) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    // Map categories with icons
    const categoryIcons: Record<string, string> = {
      chest: '💪',
      back: '🦾',
      shoulders: '🏋️',
      arms: '💪',
      legs: '🦵',
      core: '🔥',
      cardio: '🏃',
      full_body: '🔥',
    };

    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      icon: categoryIcons[name] || '🏃',
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load categories',
      description: 'Unable to load exercise categories',
      showToast: true,
      context: 'WorkoutsService.getExerciseCategories',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// WORKOUT SESSIONS - Save & Track Progress
// =====================================================

/**
 * Save a new workout session (when user starts a workout)
 */
export const createWorkoutSession = async (
  userId: string,
  workoutId: string
): Promise<{ id: string } | null> => {
  try {
    const result = await db
      .insert(userWorkoutSessions)
      .values({
        user_id: userId,
        workout_id: workoutId,
        status: 'in_progress',
        started_at: toISOString(new Date()),
      })
      .returning({ id: userWorkoutSessions.id });

    if (result.length === 0) {
      return null;
    }

    return { id: result[0].id };
  } catch (error) {
    handleError(error, {
      message: 'Failed to create session',
      context: 'WorkoutsService.createWorkoutSession',
      // No toast - internal function, handled by workout-sessions service
    });
    return null;
  }
};

/**
 * Update workout session progress
 */
export const updateWorkoutSession = async (
  sessionId: string,
  updates: {
    duration_seconds?: number;
    calories_burned?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  }
): Promise<boolean> => {
  try {
    await db
      .update(userWorkoutSessions)
      .set({
        ...updates,
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update session',
      context: 'WorkoutsService.updateWorkoutSession',
      // No toast - internal function, handled by workout-sessions service
    });
    return false;
  }
};

/**
 * Complete workout session
 */
export const completeWorkoutSession = async (
  sessionId: string,
  finalStats: {
    duration_seconds: number;
    calories_burned: number;
  }
): Promise<boolean> => {
  try {
    // Update session
    await db
      .update(userWorkoutSessions)
      .set({
        status: 'completed',
        completed_at: toISOString(new Date()),
        duration_seconds: finalStats.duration_seconds,
        calories_burned: finalStats.calories_burned,
        updated_at: toISOString(new Date()),
      })
      .where(eq(userWorkoutSessions.id, sessionId));

    // Increment workout completion count
    const session = await db
      .select()
      .from(userWorkoutSessions)
      .where(eq(userWorkoutSessions.id, sessionId))
      .limit(1);

    if (session.length > 0 && session[0].workout_id) {
      await db
        .update(workouts)
        .set({
          completion_count: sql`${workouts.completion_count} + 1`,
        })
        .where(eq(workouts.id, session[0].workout_id));
    }

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to complete session',
      context: 'WorkoutsService.completeWorkoutSession',
      // No toast - internal function, handled by workout-sessions service
    });
    return false;
  }
};

/**
 * Get user's workout history
 */
export const getUserWorkoutHistory = async (
  userId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    const data = await db
      .select({
        session: userWorkoutSessions,
        workout: workouts,
      })
      .from(userWorkoutSessions)
      .leftJoin(workouts, eq(userWorkoutSessions.workout_id, workouts.id))
      .where(
        and(
          eq(userWorkoutSessions.user_id, userId),
          eq(userWorkoutSessions.status, 'completed')
        )
      )
      .orderBy(desc(userWorkoutSessions.completed_at))
      .limit(limit);

    return data.map((item: typeof data[0]) => ({
      ...item.session,
      workouts: item.workout,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load workout history',
      description: 'Unable to load your workout history',
      showToast: true,
      context: 'WorkoutsService.getUserWorkoutHistory',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// TRANSFORM FUNCTIONS
// =====================================================

/**
 * Transform database workout to app format
 */
function transformWorkoutFromDB(dbWorkout: any): Workout {
  // Parse exercises JSONB field
  const exercisesData = Array.isArray(dbWorkout.exercises) ? dbWorkout.exercises : [];

  // Default values
  const equipment: EquipmentType[] = ['none'];
  const muscle_groups: MuscleGroup[] = ['full_body'];
  const total_exercises = exercisesData.length;

  const tags: string[] = [
    dbWorkout.workout_type,
    dbWorkout.difficulty_level,
    dbWorkout.is_premium ? 'premium' : 'free',
  ];

  return {
    id: dbWorkout.id,
    title: dbWorkout.name,
    description: dbWorkout.description,
    thumbnail_url: dbWorkout.thumbnail_url || undefined,
    category: dbWorkout.workout_type as WorkoutCategory,
    difficulty: dbWorkout.difficulty_level as FitnessLevel,
    muscle_groups: muscle_groups,
    estimated_duration_minutes: dbWorkout.estimated_duration,
    estimated_calories: dbWorkout.calories_burned_estimate,
    equipment: equipment,
    exercises: exercisesData.map((ex: any, index: number) => ({
      id: `${dbWorkout.id}-ex-${index}`,
      exercise_id: ex.exercise_id || `ex-${index}`,
      exercise: {
        id: ex.exercise_id || `ex-${index}`,
        name: ex.name,
        description: '',
        muscle_groups: [],
        equipment: ['none'] as EquipmentType[],
        difficulty: dbWorkout.difficulty_level as FitnessLevel,
        instructions: [],
        tips: [],
        common_mistakes: [],
        has_reps: ex.reps !== undefined && ex.reps !== null,
        has_duration: ex.duration_seconds !== undefined && ex.duration_seconds !== null,
        has_distance: false,
        has_weight: false,
        gif_url: undefined,
        thumbnail_url: undefined,
        video_url: undefined,
        created_at: safeToISOString(dbWorkout.created_at) || new Date().toISOString(),
        updated_at: safeToISOString(dbWorkout.updated_at) || new Date().toISOString(),
      },
      order: ex.order,
      sets: ex.sets,
      reps: ex.reps || undefined,
      duration_seconds: ex.duration_seconds || undefined,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes || undefined,
    })),
    total_exercises: total_exercises,
    tags: tags,
    completion_count: dbWorkout.completion_count,
    average_rating: dbWorkout.average_rating ? parseFloat(dbWorkout.average_rating) : undefined,
    is_premium: dbWorkout.is_premium,
    created_at: safeToISOString(dbWorkout.created_at) || new Date().toISOString(),
    updated_at: safeToISOString(dbWorkout.updated_at) || new Date().toISOString(),
  };
}

/**
 * Transform array of database workouts to app format
 */
function transformWorkoutsFromDB(dbWorkouts: any[]): Workout[] {
  return dbWorkouts.map(transformWorkoutFromDB);
}
