/**
 * 🏗️ PROGRAM BUILDER SERVICE
 *
 * Handles saving custom workout programs created in the builder
 */

import { db } from '@/db';
import { workoutPrograms, workouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleError } from '@/utils/errorHandler';
import { sanitizeBuilderExercises } from '@/utils/sanitize';
import type { ProgramBuilder, WorkoutExercise } from '@/types/workout-builder';
import { toISOString } from '@/utils';

// =====================================================
// TYPES
// =====================================================

export interface SaveProgramInput {
  program: ProgramBuilder;
  userId: string;
  isPublished?: boolean;
}

export interface SaveProgramResult {
  programId: string;
  workoutIds: string[];
}

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * Save a program from the builder to the database
 * Creates workout_programs record + all workout records
 */
export const saveProgramFromBuilder = async (
  input: SaveProgramInput
): Promise<SaveProgramResult | null> => {
  const { program, userId, isPublished = false } = input;

  try {
    // Use transaction to ensure all-or-nothing save
    return await db.transaction(async (tx: typeof db) => {
      // Step 1: Calculate program stats
    const totalWorkouts = program.weeks.reduce(
      (sum, week) => sum + week.workouts.length,
      0
    );

    const avgDuration =
      totalWorkouts > 0
        ? Math.round(
            program.weeks.reduce(
              (sum, week) =>
                sum +
                week.workouts.reduce((s, w) => s + (w.estimated_duration || 0), 0),
              0
            ) / totalWorkouts
          )
        : 0;

    // Map builder goal to database goal type
    const goalMapping: { [key: string]: string } = {
      muscle: 'build_muscle',
      strength: 'get_stronger',
      endurance: 'improve_endurance',
      fat_loss: 'lose_weight',
    };

    // Map builder level to database difficulty level
    const levelMapping: { [key: string]: string } = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    };

      // Step 2: Create workout_programs record
      const programResult = await tx
        .insert(workoutPrograms)
      .values({
        name: program.name,
        description: program.description || '',
        duration_weeks: program.duration_weeks,
        workouts_per_week: program.days_per_week,
        difficulty_level: levelMapping[program.level] || 'intermediate',
        target_goals: [goalMapping[program.goal] || 'build_muscle'],
        target_fitness_levels: [levelMapping[program.level] || 'intermediate'],
        total_workouts: totalWorkouts,
        estimated_time_per_workout: avgDuration,
        is_premium: false,
        created_by: userId,
        is_published: isPublished,
        created_at: toISOString(new Date()),
        updated_at: toISOString(new Date()),
      })
      .returning();

    const programId = programResult[0].id;

    // Step 3: Create all workout records
    const workoutIds: string[] = [];

    for (const week of program.weeks) {
      for (const workout of week.workouts) {
        // ✅ Sanitize exercises to prevent XSS/injection attacks
        const exercisesJson = sanitizeBuilderExercises(workout.exercises);

        // Map target muscles to workout type
        const workoutType = determineWorkoutType(workout.target_muscles);
        const difficultyLevel = levelMapping[program.level] || 'intermediate';

        const workoutResult = await tx
          .insert(workouts)
          .values({
            name: workout.name,
            description: workout.notes || '',
            program_id: programId,
            week_number: week.week_number,
            day_number: workout.day_of_week + 1, // Convert 0-6 to 1-7
            workout_type: workoutType,
            difficulty_level: difficultyLevel,
            estimated_duration: workout.estimated_duration || 0,
            exercises: exercisesJson,
            is_premium: false,
            created_by: userId,
            created_at: toISOString(new Date()),
            updated_at: toISOString(new Date()),
          })
          .returning();

        workoutIds.push(workoutResult[0].id);
      }
    }

      return {
        programId,
        workoutIds,
      };
    }); // End transaction
  } catch (error) {
    handleError(error, {
      message: 'Failed to save program',
      description: 'Could not save your custom program',
      showToast: true,
      context: 'ProgramBuilder.saveProgramFromBuilder',
    });
    return null;
  }
};

/**
 * Update an existing program from builder
 */
export const updateProgramFromBuilder = async (
  programId: string,
  input: SaveProgramInput
): Promise<boolean> => {
  const { program, userId } = input;

  try {
    // Use transaction to ensure all-or-nothing update
    await db.transaction(async (tx: typeof db) => {
      // Calculate stats
    const totalWorkouts = program.weeks.reduce(
      (sum, week) => sum + week.workouts.length,
      0
    );

    const avgDuration =
      totalWorkouts > 0
        ? Math.round(
            program.weeks.reduce(
              (sum, week) =>
                sum +
                week.workouts.reduce((s, w) => s + (w.estimated_duration || 0), 0),
              0
            ) / totalWorkouts
          )
        : 0;

    const goalMapping: { [key: string]: string } = {
      muscle: 'build_muscle',
      strength: 'get_stronger',
      endurance: 'improve_endurance',
      fat_loss: 'lose_weight',
    };

    const levelMapping: { [key: string]: string } = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    };

      // Update workout_programs record
      await tx
        .update(workoutPrograms)
      .set({
        name: program.name,
        description: program.description || '',
        duration_weeks: program.duration_weeks,
        workouts_per_week: program.days_per_week,
        difficulty_level: levelMapping[program.level] || 'intermediate',
        target_goals: [goalMapping[program.goal] || 'build_muscle'],
        target_fitness_levels: [levelMapping[program.level] || 'intermediate'],
        total_workouts: totalWorkouts,
        estimated_time_per_workout: avgDuration,
        updated_at: toISOString(new Date()),
      })
      .where(eq(workoutPrograms.id, programId));

      // Delete existing workouts for this program
      await tx.delete(workouts).where(eq(workouts.program_id, programId));

      // Re-create all workouts
      for (const week of program.weeks) {
        for (const workout of week.workouts) {
        // ✅ Sanitize exercises to prevent XSS/injection attacks
        const exercisesJson = sanitizeBuilderExercises(workout.exercises);

        const workoutType = determineWorkoutType(workout.target_muscles);
        const difficultyLevel = levelMapping[program.level] || 'intermediate';

        await tx.insert(workouts).values({
          name: workout.name,
          description: workout.notes || '',
          program_id: programId,
          week_number: week.week_number,
          day_number: workout.day_of_week + 1,
          workout_type: workoutType,
          difficulty_level: difficultyLevel,
          estimated_duration: workout.estimated_duration || 0,
          exercises: exercisesJson,
          is_premium: false,
          created_by: userId,
          created_at: toISOString(new Date()),
          updated_at: toISOString(new Date()),
        });
        }
      }
    }); // End transaction

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update program',
      description: 'Could not save changes',
      showToast: true,
      context: 'ProgramBuilder.updateProgramFromBuilder',
    });
    return false;
  }
};

/**
 * Delete a custom program and all its workouts
 */
export const deleteCustomProgram = async (programId: string): Promise<boolean> => {
  try {
    // Cascade delete will handle workouts automatically
    await db.delete(workoutPrograms).where(eq(workoutPrograms.id, programId));
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete program',
      description: 'Could not delete custom program',
      showToast: true,
      context: 'ProgramBuilder.deleteCustomProgram',
    });
    return false;
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Determine workout type based on target muscles
 */
function determineWorkoutType(muscles: string[]): string {
  if (muscles.length === 0) return 'custom';

  const upperMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'];
  const lowerMuscles = ['quads', 'hamstrings', 'glutes', 'calves'];
  const coreMuscles = ['abs', 'obliques'];

  const hasUpper = muscles.some((m) => upperMuscles.includes(m));
  const hasLower = muscles.some((m) => lowerMuscles.includes(m));
  const hasCore = muscles.some((m) => coreMuscles.includes(m));

  // Full body if targeting both upper and lower
  if (hasUpper && hasLower) return 'strength';

  // If mostly core
  if (hasCore && !hasUpper && !hasLower) return 'custom';

  // Default to strength training
  return 'strength';
}
