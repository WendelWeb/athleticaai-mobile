/**
 * 📊 USE CURRENT PROGRAM - Get user's active program
 *
 * Features:
 * - Fetches active program from userPrograms
 * - Calculates completion percentage
 * - Real-time progress tracking
 * - Auto-refresh on focus
 */

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-expo';
import { db } from '@/db';
import { userPrograms, workoutPrograms } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/utils/logger';

interface CurrentProgram {
  id: string;
  programId: string;
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  workoutsCompleted: number;
  workoutsRemaining: number;
  totalWorkouts: number;
  completionPercentage: number;
  status: 'saved' | 'active' | 'completed' | 'paused' | 'abandoned';
}

async function fetchCurrentProgram(userId: string): Promise<CurrentProgram | null> {
  logger.info('[useCurrentProgram] Fetching active program', { userId });

  // Get active user program
  const userProgramResult = await (db as any).query.userPrograms.findFirst({
    where: and(
      eq(userPrograms.user_id, userId),
      eq(userPrograms.status, 'active')
    ),
    with: {
      program: true, // Include program details via Drizzle relation
    },
  });

  if (!userProgramResult) {
    logger.debug('[useCurrentProgram] No active program found');
    return null;
  }

  const program = userProgramResult.program;

  // Calculate completion percentage
  const completionPercentage =
    userProgramResult.total_workouts > 0
      ? (userProgramResult.workouts_completed / userProgramResult.total_workouts) * 100
      : 0;

  const workoutsRemaining =
    userProgramResult.total_workouts - userProgramResult.workouts_completed;

  const currentProgram: CurrentProgram = {
    id: userProgramResult.id,
    programId: userProgramResult.program_id,
    programName: program?.name || 'Unknown Program',
    currentWeek: userProgramResult.current_week || 1,
    totalWeeks: program?.duration_weeks || 8,
    workoutsCompleted: userProgramResult.workouts_completed || 0,
    workoutsRemaining: Math.max(0, workoutsRemaining),
    totalWorkouts: userProgramResult.total_workouts || 0,
    completionPercentage: Math.round(completionPercentage),
    status: userProgramResult.status || 'active',
  };

  logger.info('[useCurrentProgram] Program fetched successfully', {
    programName: currentProgram.programName,
    completion: `${currentProgram.completionPercentage}%`,
  });

  return currentProgram;
  // Let errors propagate to React Query for proper error state handling
}

export function useCurrentProgram() {
  const { user } = useUser();
  const userId = user?.id || '';

  const {
    data: currentProgram,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currentProgram', userId],
    queryFn: () => fetchCurrentProgram(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: 'always', // Always refresh on mount
  });

  return {
    currentProgram,
    isLoading,
    error,
    refresh: refetch,
    hasActiveProgram: !!currentProgram,
  };
}
