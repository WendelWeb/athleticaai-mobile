/**
 * 📋 ASSIGNED PROGRAMS SERVICE
 *
 * Manage program assignments from coaches to clients
 * Reuses existing program builder - just handles the assignment logic
 */

import { db } from '@/db';
import { assignedPrograms, programAdjustments, userPrograms, workoutPrograms } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { handleError } from '@/utils/errorHandler';
import { enrollInProgram } from './user-programs';
import type {
  AssignedProgram,
  AssignedProgramWithDetails,
  LogAdjustmentInput,
  AdjustmentWithContext,
} from '@/types/coaching';

// =====================================================
// ASSIGN PROGRAMS TO CLIENTS
// =====================================================

/**
 * Assign an existing program to a client
 * This is the KEY function that links coach programs to clients
 */
export async function assignProgramToClient(input: {
  coachId: string;
  clientId: string;
  programId: string;
  notes?: string;
}): Promise<AssignedProgram | null> {
  try {
    const { coachId, clientId, programId, notes } = input;

    // 0. Fetch program to get total_workouts
    const program = await db.query.workoutPrograms.findFirst({
      where: eq(workoutPrograms.id, programId),
    });

    if (!program) {
      throw new Error('Program not found');
    }

    // 1. Enroll client in the program (creates user_programs record)
    const userProgram = await enrollInProgram({
      userId: clientId,
      programId: programId,
      totalWorkouts: program.total_workouts,
    });

    if (!userProgram) {
      throw new Error('Failed to enroll client in program');
    }

    // 2. Create assignment record (links coach → client → program)
    const result = await db
      .insert(assignedPrograms)
      .values({
        coach_id: coachId,
        client_id: clientId,
        program_id: programId,
        user_program_id: userProgram.id,
        notes,
        is_active: true,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    handleError(error, {
      message: 'Failed to assign program to client',
      context: 'AssignedPrograms.assignProgramToClient',
    });
    return null;
  }
}

/**
 * Assign program to multiple clients at once
 */
export async function assignProgramToMultipleClients(input: {
  coachId: string;
  clientIds: string[];
  programId: string;
  notes?: string;
}): Promise<number> {
  try {
    const { coachId, clientIds, programId, notes } = input;

    let successCount = 0;

    for (const clientId of clientIds) {
      const result = await assignProgramToClient({
        coachId,
        clientId,
        programId,
        notes,
      });

      if (result) successCount++;
    }

    return successCount;
  } catch (error) {
    handleError(error, {
      message: 'Failed to assign program to multiple clients',
      context: 'AssignedPrograms.assignProgramToMultipleClients',
    });
    return 0;
  }
}

// =====================================================
// GET ASSIGNED PROGRAMS
// =====================================================

/**
 * Get all programs assigned by a coach
 */
export async function getCoachAssignedPrograms(coachId: string): Promise<AssignedProgramWithDetails[]> {
  try {
    const results = await db.query.assignedPrograms.findMany({
      where: eq(assignedPrograms.coach_id, coachId),
      with: {
        program: true,
        client: true,
        userProgram: true,
      },
      orderBy: [desc(assignedPrograms.assigned_at)],
    });

    return results.map((assignment: any) => ({
      ...assignment,
      program_name: assignment.program.name,
      program_thumbnail: assignment.program.thumbnail_url || undefined,
      program_duration_weeks: assignment.program.duration_weeks,
      coach_name: '', // Not needed for coach view
      client_name: assignment.client.full_name || 'Unknown',
      progress_percentage: parseFloat(assignment.userProgram?.completion_percentage || '0'),
      workouts_completed: assignment.userProgram?.workouts_completed || 0,
      total_workouts: assignment.program.total_workouts,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to get coach assigned programs',
      context: 'AssignedPrograms.getCoachAssignedPrograms',
    });
    return [];
  }
}

/**
 * Get all programs assigned to a client
 */
export async function getClientAssignedPrograms(clientId: string): Promise<AssignedProgramWithDetails[]> {
  try {
    const results = await db.query.assignedPrograms.findMany({
      where: and(eq(assignedPrograms.client_id, clientId), eq(assignedPrograms.is_active, true)),
      with: {
        program: true,
        coach: {
          with: {
            user: true,
          },
        },
        userProgram: true,
      },
      orderBy: [desc(assignedPrograms.assigned_at)],
    });

    return results.map((assignment: any) => ({
      ...assignment,
      program_name: assignment.program.name,
      program_thumbnail: assignment.program.thumbnail_url || undefined,
      program_duration_weeks: assignment.program.duration_weeks,
      coach_name: assignment.coach.user.full_name || 'Unknown',
      client_name: '', // Not needed for client view
      progress_percentage: parseFloat(assignment.userProgram?.completion_percentage || '0'),
      workouts_completed: assignment.userProgram?.workouts_completed || 0,
      total_workouts: assignment.program.total_workouts,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to get client assigned programs',
      context: 'AssignedPrograms.getClientAssignedPrograms',
    });
    return [];
  }
}

/**
 * Get specific assignment by ID
 */
export async function getAssignedProgram(assignmentId: string): Promise<AssignedProgram | null> {
  try {
    return await db.query.assignedPrograms.findFirst({
      where: eq(assignedPrograms.id, assignmentId),
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to get assigned program',
      context: 'AssignedPrograms.getAssignedProgram',
    });
    return null;
  }
}

// =====================================================
// PROGRAM ADJUSTMENTS (Coach Edits)
// =====================================================

/**
 * Log a program adjustment made by coach
 */
export async function logAdjustment(input: LogAdjustmentInput): Promise<boolean> {
  try {
    await db.insert(programAdjustments).values({
      assigned_program_id: input.assignedProgramId,
      coach_id: input.coachId,
      adjustment_type: input.adjustmentType,
      old_value: input.oldValue,
      new_value: input.newValue,
      reason: input.reason,
      week_number: input.weekNumber,
      workout_id: input.workoutId,
    });

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to log adjustment',
      context: 'AssignedPrograms.logAdjustment',
    });
    return false;
  }
}

/**
 * Get adjustment history for a program
 */
export async function getAdjustmentHistory(assignedProgramId: string): Promise<AdjustmentWithContext[]> {
  try {
    const results = await db.query.programAdjustments.findMany({
      where: eq(programAdjustments.assigned_program_id, assignedProgramId),
      orderBy: [desc(programAdjustments.applied_at)],
    });

    // TODO: Add program and client names via joins
    return results.map((adjustment: any) => ({
      ...adjustment,
      program_name: 'Program', // TODO: Fetch from join
      client_name: 'Client', // TODO: Fetch from join
      coach_name: 'Coach', // TODO: Fetch from join
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to get adjustment history',
      context: 'AssignedPrograms.getAdjustmentHistory',
    });
    return [];
  }
}

/**
 * Get recent adjustments for a client (for notifications)
 */
export async function getRecentAdjustmentsForClient(
  clientId: string,
  limit = 10
): Promise<AdjustmentWithContext[]> {
  try {
    // Get all active assignments for client
    const assignments = await db.query.assignedPrograms.findMany({
      where: and(eq(assignedPrograms.client_id, clientId), eq(assignedPrograms.is_active, true)),
    });

    const assignmentIds = assignments.map((a: any) => a.id);

    if (assignmentIds.length === 0) return [];

    // Get adjustments for all assignments
    // TODO: This needs proper SQL query with IN clause
    // For now, fetch individually
    const allAdjustments: AdjustmentWithContext[] = [];

    for (const assignmentId of assignmentIds) {
      const adjustments = await getAdjustmentHistory(assignmentId);
      allAdjustments.push(...adjustments);
    }

    // Sort by date and limit
    return allAdjustments.sort((a: any, b: any) => b.applied_at.getTime() - a.applied_at.getTime()).slice(0, limit);
  } catch (error) {
    handleError(error, {
      message: 'Failed to get recent adjustments for client',
      context: 'AssignedPrograms.getRecentAdjustmentsForClient',
    });
    return [];
  }
}

// =====================================================
// ASSIGNMENT MANAGEMENT
// =====================================================

/**
 * Deactivate an assignment (client stops following coach's program)
 */
export async function deactivateAssignment(assignmentId: string): Promise<boolean> {
  try {
    await db
      .update(assignedPrograms)
      .set({
        is_active: false,
      })
      .where(eq(assignedPrograms.id, assignmentId));

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to deactivate assignment',
      context: 'AssignedPrograms.deactivateAssignment',
    });
    return false;
  }
}

/**
 * Reactivate an assignment
 */
export async function reactivateAssignment(assignmentId: string): Promise<boolean> {
  try {
    await db
      .update(assignedPrograms)
      .set({
        is_active: true,
      })
      .where(eq(assignedPrograms.id, assignmentId));

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to reactivate assignment',
      context: 'AssignedPrograms.reactivateAssignment',
    });
    return false;
  }
}

/**
 * Delete an assignment (hard delete)
 */
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  try {
    await db.delete(assignedPrograms).where(eq(assignedPrograms.id, assignmentId));
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete assignment',
      context: 'AssignedPrograms.deleteAssignment',
    });
    return false;
  }
}

/**
 * Update assignment notes
 */
export async function updateAssignmentNotes(assignmentId: string, notes: string): Promise<boolean> {
  try {
    await db
      .update(assignedPrograms)
      .set({
        notes,
      })
      .where(eq(assignedPrograms.id, assignmentId));

    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update assignment notes',
      context: 'AssignedPrograms.updateAssignmentNotes',
    });
    return false;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if program is assigned to client by specific coach
 */
export async function isProgramAssignedToClient(input: {
  coachId: string;
  clientId: string;
  programId: string;
}): Promise<boolean> {
  try {
    const { coachId, clientId, programId } = input;

    const assignment = await db.query.assignedPrograms.findFirst({
      where: and(
        eq(assignedPrograms.coach_id, coachId),
        eq(assignedPrograms.client_id, clientId),
        eq(assignedPrograms.program_id, programId),
        eq(assignedPrograms.is_active, true)
      ),
    });

    return !!assignment;
  } catch (error) {
    handleError(error, {
      message: 'Failed to check program assignment',
      context: 'AssignedPrograms.isProgramAssignedToClient',
    });
    return false;
  }
}

/**
 * Get count of active assignments for a program
 */
export async function getProgramAssignmentCount(programId: string): Promise<number> {
  try {
    const assignments = await db.query.assignedPrograms.findMany({
      where: and(eq(assignedPrograms.program_id, programId), eq(assignedPrograms.is_active, true)),
    });

    return assignments.length;
  } catch (error) {
    handleError(error, {
      message: 'Failed to get program assignment count',
      context: 'AssignedPrograms.getProgramAssignmentCount',
    });
    return 0;
  }
}
