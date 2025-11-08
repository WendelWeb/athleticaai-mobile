/**
 * 🔥 USER PROGRAMS SERVICE - Complete Enrollment Logic
 *
 * Handles:
 * - Enrolling users in programs
 * - Saving/bookmarking programs
 * - Tracking progress
 * - Program status management
 */

import { db } from '@/db';
import { userPrograms, workoutPrograms } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// =====================================================
// HELPERS
// =====================================================

/**
 * Safely convert a date value to ISO string
 * Handles: Date objects, strings, timestamps, null, undefined
 */
const toISOStringSafe = (value: any): string | null => {
  if (!value) return null;

  try {
    // If already a valid ISO string, return it
    if (typeof value === 'string' && value.includes('T')) {
      return new Date(value).toISOString();
    }

    // If it's a Date object or timestamp, convert
    const date = new Date(value);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.warn('Failed to convert date to ISO string:', value, error);
    return null;
  }
};

// =====================================================
// TYPES
// =====================================================

export type ProgramStatus = 'saved' | 'active' | 'completed' | 'paused' | 'abandoned';

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  status: ProgramStatus;
  is_saved: boolean;
  started_at: string | null;
  completed_at: string | null;
  paused_at: string | null;
  current_week: number;
  current_workout_index: number;
  workouts_completed: number;
  total_workouts: number;
  completion_percentage: string;

  // Daily tracking fields
  last_workout_date: string | null;
  daily_workouts_completed: number;
  daily_workouts_target: number;

  // Weekly tracking fields
  weekly_workouts_completed: number;
  current_week_start_date: string | null;

  // Program management fields
  is_primary: boolean;
  paused_reason: string | null;

  custom_schedule: any | null;
  rest_days: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EnrollProgramInput {
  userId: string;
  programId: string;
  totalWorkouts: number;
}

export interface SaveProgramInput {
  userId: string;
  programId: string;
}

export interface UpdateProgressInput {
  userProgramId: string;
  workoutsCompleted?: number;
  currentWeek?: number;
  currentWorkoutIndex?: number;
}

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * Check if user is enrolled in a program
 */
export const isUserEnrolled = async (userId: string, programId: string): Promise<boolean> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          eq(userPrograms.program_id, programId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
};

/**
 * Get user's program enrollment
 */
export const getUserProgram = async (
  userId: string,
  programId: string
): Promise<UserProgram | null> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          eq(userPrograms.program_id, programId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error getting user program:', error);
    return null;
  }
};

/**
 * Enroll user in a program (Start Program)
 */
export const enrollInProgram = async (input: EnrollProgramInput): Promise<UserProgram | null> => {
  try {
    const { userId, programId, totalWorkouts } = input;

    // Check if already enrolled
    const existing = await getUserProgram(userId, programId);
    if (existing) {
      // Update to active if saved
      if (existing.status === 'saved') {
        return await updateProgramStatus(existing.id, 'active');
      }
      return existing;
    }

    // Create new enrollment
    const result = await db
      .insert(userPrograms)
      .values({
        user_id: userId,
        program_id: programId,
        status: 'active',
        is_saved: false,
        started_at: new Date(),
        current_week: 1,
        current_workout_index: 0,
        workouts_completed: 0,
        total_workouts: totalWorkouts,
        completion_percentage: '0',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error enrolling in program:', error);
    return null;
  }
};

/**
 * Save/bookmark a program for later
 */
export const saveProgram = async (input: SaveProgramInput): Promise<UserProgram | null> => {
  try {
    const { userId, programId } = input;

    // Check if already enrolled/saved
    const existing = await getUserProgram(userId, programId);
    if (existing) {
      // Toggle saved status
      return await toggleSaved(existing.id);
    }

    // Get program to get total_workouts
    const programData = await db
      .select()
      .from(workoutPrograms)
      .where(eq(workoutPrograms.id, programId))
      .limit(1);

    if (programData.length === 0) {
      throw new Error('Program not found');
    }

    // Create new saved program
    const result = await db
      .insert(userPrograms)
      .values({
        user_id: userId,
        program_id: programId,
        status: 'saved',
        is_saved: true,
        current_week: 1,
        current_workout_index: 0,
        workouts_completed: 0,
        total_workouts: programData[0].total_workouts,
        completion_percentage: '0',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error saving program:', error);
    return null;
  }
};

/**
 * Toggle saved status (bookmark/unbookmark)
 */
export const toggleSaved = async (userProgramId: string): Promise<UserProgram | null> => {
  try {
    // Get current program
    const current = await db
      .select()
      .from(userPrograms)
      .where(eq(userPrograms.id, userProgramId))
      .limit(1);

    if (current.length === 0) {
      return null;
    }

    const newSavedStatus = !current[0].is_saved;

    // Update
    const result = await db
      .update(userPrograms)
      .set({
        is_saved: newSavedStatus,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error toggling saved:', error);
    return null;
  }
};

/**
 * Update program status
 */
export const updateProgramStatus = async (
  userProgramId: string,
  status: ProgramStatus
): Promise<UserProgram | null> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    // Set timestamps based on status
    if (status === 'active' && !updateData.started_at) {
      updateData.started_at = new Date();
    } else if (status === 'completed') {
      updateData.completed_at = new Date();
      updateData.completion_percentage = '100';
    } else if (status === 'paused') {
      updateData.paused_at = new Date();
    }

    const result = await db
      .update(userPrograms)
      .set(updateData)
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error updating program status:', error);
    return null;
  }
};

/**
 * Update program progress
 */
export const updateProgramProgress = async (
  input: UpdateProgressInput
): Promise<UserProgram | null> => {
  try {
    const { userProgramId, workoutsCompleted, currentWeek, currentWorkoutIndex } = input;

    // Get current program to calculate percentage
    const current = await db
      .select()
      .from(userPrograms)
      .where(eq(userPrograms.id, userProgramId))
      .limit(1);

    if (current.length === 0) {
      return null;
    }

    const totalWorkouts = current[0].total_workouts;
    const completed = workoutsCompleted !== undefined ? workoutsCompleted : current[0].workouts_completed;
    const percentage = ((completed / totalWorkouts) * 100).toFixed(2);

    const updateData: any = {
      updated_at: new Date(),
      completion_percentage: percentage,
    };

    if (workoutsCompleted !== undefined) {
      updateData.workouts_completed = workoutsCompleted;
    }
    if (currentWeek !== undefined) {
      updateData.current_week = currentWeek;
    }
    if (currentWorkoutIndex !== undefined) {
      updateData.current_workout_index = currentWorkoutIndex;
    }

    // Auto-complete if all workouts done
    if (completed >= totalWorkouts) {
      updateData.status = 'completed';
      updateData.completed_at = new Date();
      updateData.completion_percentage = '100';
    }

    const result = await db
      .update(userPrograms)
      .set(updateData)
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error updating program progress:', error);
    return null;
  }
};

/**
 * Get all user's programs
 */
export const getUserPrograms = async (userId: string): Promise<UserProgram[]> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(eq(userPrograms.user_id, userId))
      .orderBy(desc(userPrograms.updated_at));

    return result.map((program: typeof result[0]) => ({
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    })) as UserProgram[];
  } catch (error) {
    console.error('Error getting user programs:', error);
    return [];
  }
};

/**
 * Get saved programs
 */
export const getSavedPrograms = async (userId: string): Promise<UserProgram[]> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          eq(userPrograms.is_saved, true)
        )
      )
      .orderBy(desc(userPrograms.created_at));

    return result.map((program: typeof result[0]) => ({
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      completion_percentage: program.completion_percentage?.toString() || '0',
    })) as UserProgram[];
  } catch (error) {
    console.error('Error getting saved programs:', error);
    return [];
  }
};

/**
 * Delete user program (un-enroll)
 */
export const deleteUserProgram = async (userProgramId: string): Promise<boolean> => {
  try {
    await db.delete(userPrograms).where(eq(userPrograms.id, userProgramId));
    return true;
  } catch (error) {
    console.error('Error deleting user program:', error);
    return false;
  }
};

// =====================================================
// PROGRAM MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Set a program as primary (active program for today)
 * Only one program can be primary at a time per user
 */
export const setPrimaryProgram = async (
  userProgramId: string,
  userId: string
): Promise<boolean> => {
  try {
    // First, unset any existing primary program for this user
    await db
      .update(userPrograms)
      .set({
        is_primary: false,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.user_id, userId));

    // Then set the new primary program
    await db
      .update(userPrograms)
      .set({
        is_primary: true,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId));

    console.log(`✅ Primary program set:`, userProgramId);
    return true;
  } catch (error) {
    console.error('Error setting primary program:', error);
    return false;
  }
};

/**
 * Get user's primary (active) program
 */
export const getPrimaryProgram = async (userId: string): Promise<UserProgram | null> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          eq(userPrograms.is_primary, true)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      last_workout_date: program.last_workout_date || null,
      current_week_start_date: program.current_week_start_date || null,
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error getting primary program:', error);
    return null;
  }
};

/**
 * Pause a program with optional reason
 */
export const pauseProgram = async (
  userProgramId: string,
  reason?: string
): Promise<UserProgram | null> => {
  try {
    const result = await db
      .update(userPrograms)
      .set({
        status: 'paused',
        paused_at: new Date(),
        paused_reason: reason || null,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      last_workout_date: program.last_workout_date || null,
      current_week_start_date: program.current_week_start_date || null,
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error pausing program:', error);
    return null;
  }
};

/**
 * Resume a paused program
 */
export const resumeProgram = async (userProgramId: string): Promise<UserProgram | null> => {
  try {
    const result = await db
      .update(userPrograms)
      .set({
        status: 'active',
        paused_at: null,
        paused_reason: null,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      last_workout_date: program.last_workout_date || null,
      current_week_start_date: program.current_week_start_date || null,
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error resuming program:', error);
    return null;
  }
};

/**
 * Restart a program (reset progress to week 1, workout 0)
 */
export const restartProgram = async (userProgramId: string): Promise<UserProgram | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await db
      .update(userPrograms)
      .set({
        status: 'active',
        current_week: 1,
        current_workout_index: 0,
        workouts_completed: 0,
        daily_workouts_completed: 0,
        weekly_workouts_completed: 0,
        completion_percentage: '0',
        started_at: new Date(),
        completed_at: null,
        paused_at: null,
        paused_reason: null,
        last_workout_date: today,
        current_week_start_date: today,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId))
      .returning();

    const program = result[0];
    return {
      ...program,
      created_at: toISOStringSafe(program.created_at) || new Date().toISOString(),
      updated_at: toISOStringSafe(program.updated_at),
      started_at: toISOStringSafe(program.started_at),
      completed_at: toISOStringSafe(program.completed_at),
      paused_at: toISOStringSafe(program.paused_at),
      last_workout_date: program.last_workout_date || null,
      current_week_start_date: program.current_week_start_date || null,
      completion_percentage: program.completion_percentage?.toString() || '0',
    } as UserProgram;
  } catch (error) {
    console.error('Error restarting program:', error);
    return null;
  }
};

/**
 * Set daily workout target for a program
 */
export const setDailyTarget = async (
  userProgramId: string,
  targetWorkouts: number
): Promise<boolean> => {
  try {
    await db
      .update(userPrograms)
      .set({
        daily_workouts_target: targetWorkouts,
        updated_at: new Date(),
      })
      .where(eq(userPrograms.id, userProgramId));

    console.log(`✅ Daily target set: ${targetWorkouts} workouts/day`);
    return true;
  } catch (error) {
    console.error('Error setting daily target:', error);
    return false;
  }
};

/**
 * Get active programs count for user
 */
export const getActiveProgramsCount = async (userId: string): Promise<number> => {
  try {
    const result = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.user_id, userId),
          eq(userPrograms.status, 'active')
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error getting active programs count:', error);
    return 0;
  }
};
