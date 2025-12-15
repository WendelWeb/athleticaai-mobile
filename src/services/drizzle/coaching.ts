/**
 * 🏋️ COACHING SERVICE
 *
 * Database operations for coaching system
 */

import { db } from '@/db';
import { profiles, coaches, coachClients } from '@/db/schema';
import { eq, and, desc, or, gte, sql } from 'drizzle-orm';
import { handleError, toISOString } from '@/utils';
import type {
  Coach,
  CoachProfile,
  ClientWithProgress,
  SearchCoachesFilters,
  UpdateCoachProfileInput,
  AddClientInput,
  CoachStats,
} from '@/types/coaching';

// =====================================================
// COACH MODE MANAGEMENT
// =====================================================

/**
 * Toggle coach mode for a user
 */
export async function toggleCoachMode(userId: string, isCoach: boolean): Promise<boolean> {
  try {
    // Update profile
    await db.update(profiles).set({ is_coach: isCoach }).where(eq(profiles.id, userId));

    if (isCoach) {
      // Create coach profile if not exists
      const existingCoach = await db.query.coaches.findFirst({
        where: eq(coaches.user_id, userId),
      });

      if (!existingCoach) {
        await db.insert(coaches).values({
          user_id: userId,
          is_accepting_clients: true,
        });
      }
    }

    return true;
  } catch (error) {
    handleError(error, { message: 'Failed to toggle coach mode', context: 'Coaching.toggleCoachMode' });
    return false;
  }
}

/**
 * Check if user is a coach
 */
export async function isUserCoach(userId: string): Promise<boolean> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { is_coach: true },
    });

    return profile?.is_coach || false;
  } catch (error) {
    handleError(error, { message: 'Failed to check coach status', context: 'Coaching.isUserCoach' });
    return false;
  }
}

// =====================================================
// COACH PROFILE MANAGEMENT
// =====================================================

/**
 * Get coach profile by user ID
 */
export async function getCoachProfile(userId: string): Promise<CoachProfile | null> {
  try {
    const coach = await db.query.coaches.findFirst({
      where: eq(coaches.user_id, userId),
      with: {
        user: true,
        reviews: {
          limit: 5,
          orderBy: [desc(sql`created_at`)],
        },
      },
    });

    if (!coach) return null;

    return {
      ...coach,
      user_name: coach.user.full_name || undefined,
      user_avatar: coach.user.avatar_url || undefined,
      user_email: coach.user.email,
      review_count: coach.reviews?.length || 0,
    };
  } catch (error) {
    handleError(error, { message: 'Failed to get coach profile', context: 'Coaching.getCoachProfile' });
    return null;
  }
}

/**
 * Get coach profile by coach ID
 */
export async function getCoachById(coachId: string): Promise<CoachProfile | null> {
  try {
    const coach = await db.query.coaches.findFirst({
      where: eq(coaches.id, coachId),
      with: {
        user: true,
        reviews: true,
      },
    });

    if (!coach) return null;

    return {
      ...coach,
      user_name: coach.user.full_name || undefined,
      user_avatar: coach.user.avatar_url || undefined,
      user_email: coach.user.email,
      review_count: coach.reviews?.length || 0,
    };
  } catch (error) {
    handleError(error, { message: 'Failed to get coach by ID', context: 'Coaching.getCoachById' });
    return null;
  }
}

/**
 * Update coach profile
 */
export async function updateCoachProfile(input: UpdateCoachProfileInput): Promise<boolean> {
  try {
    const { coachId, ...updates } = input;

    await db
      .update(coaches)
      .set({
        ...updates,
        updated_at: toISOString(new Date()),
      })
      .where(eq(coaches.id, coachId));

    return true;
  } catch (error) {
    handleError(error, { message: 'Failed to update coach profile', context: 'Coaching.updateCoachProfile' });
    return false;
  }
}

// =====================================================
// COACH SEARCH & DISCOVERY
// =====================================================

/**
 * Search coaches with filters
 */
export async function searchCoaches(filters?: SearchCoachesFilters): Promise<CoachProfile[]> {
  try {
    // Build where conditions
    const conditions = [eq(coaches.is_accepting_clients, true)];

    if (filters?.minRating) {
      conditions.push(gte(coaches.rating_average, filters.minRating.toString()));
    }

    // Query coaches
    const results = await db.query.coaches.findMany({
      where: and(...conditions),
      with: {
        user: true,
        reviews: true,
      },
      orderBy: [desc(coaches.rating_average), desc(coaches.total_clients)],
      limit: 50,
    });

    // Transform to CoachProfile
    return results.map((coach: any) => ({
      ...coach,
      user_name: coach.user.full_name || undefined,
      user_avatar: coach.user.avatar_url || undefined,
      user_email: coach.user.email,
      review_count: coach.reviews?.length || 0,
    }));
  } catch (error) {
    handleError(error, { message: 'Failed to search coaches', context: 'Coaching.searchCoaches' });
    return [];
  }
}

/**
 * Get all coaches (marketplace)
 */
export async function getAllCoaches(): Promise<CoachProfile[]> {
  return searchCoaches();
}

// =====================================================
// CLIENT MANAGEMENT
// =====================================================

/**
 * Add a client to coach
 */
export async function addClient(input: AddClientInput): Promise<boolean> {
  try {
    const { coachId, clientId, notes, client_goals } = input;

    // Check if relationship already exists
    const existing = await db.query.coachClients.findFirst({
      where: and(eq(coachClients.coach_id, coachId), eq(coachClients.client_id, clientId)),
    });

    if (existing) {
      // Reactivate if cancelled
      if (existing.status === 'cancelled') {
        await db
          .update(coachClients)
          .set({
            status: 'active',
            started_at: toISOString(new Date()),
            ended_at: null,
            updated_at: toISOString(new Date()),
          })
          .where(eq(coachClients.id, existing.id));
      }
      return true;
    }

    // Create new relationship
    await db.insert(coachClients).values({
      coach_id: coachId,
      client_id: clientId,
      status: 'active',
      notes,
      client_goals,
    });

    // Increment coach's total_clients
    await db
      .update(coaches)
      .set({
        total_clients: sql`${coaches.total_clients} + 1`,
        updated_at: toISOString(new Date()),
      })
      .where(eq(coaches.id, coachId));

    return true;
  } catch (error) {
    handleError(error, { message: 'Failed to add client', context: 'Coaching.addClient' });
    return false;
  }
}

/**
 * Get coach's clients
 */
export async function getCoachClients(
  coachId: string,
  status?: 'pending' | 'active' | 'paused' | 'cancelled'
): Promise<ClientWithProgress[]> {
  try {
    const conditions = [eq(coachClients.coach_id, coachId)];

    if (status) {
      conditions.push(eq(coachClients.status, status));
    }

    const results = await db.query.coachClients.findMany({
      where: and(...conditions),
      with: {
        client: true,
      },
      orderBy: [desc(coachClients.started_at)],
    });

    // TODO: Fetch progress data for each client
    // For now, return basic info
    return results.map((relationship: any) => ({
      ...relationship,
      client_name: relationship.client.full_name || 'Unknown',
      client_avatar: relationship.client.avatar_url || undefined,
      client_email: relationship.client.email,
      active_programs_count: 0, // TODO: Query user_programs
      workouts_completed: 0, // TODO: Query user_workout_sessions
      last_workout_date: undefined,
      unread_messages_count: 0, // TODO: Query coach_messages
      current_streak: 0,
    }));
  } catch (error) {
    handleError(error, { message: 'Failed to get coach clients', context: 'Coaching.getCoachClients' });
    return [];
  }
}

/**
 * Get client's coaches
 */
export async function getClientCoaches(clientId: string): Promise<CoachProfile[]> {
  try {
    const results = await db.query.coachClients.findMany({
      where: and(eq(coachClients.client_id, clientId), eq(coachClients.status, 'active')),
      with: {
        coach: {
          with: {
            user: true,
            reviews: true,
          },
        },
      },
      orderBy: [desc(coachClients.started_at)],
    });

    return results.map((relationship: any) => ({
      ...relationship.coach,
      user_name: relationship.coach.user.full_name || undefined,
      user_avatar: relationship.coach.user.avatar_url || undefined,
      user_email: relationship.coach.user.email,
      review_count: relationship.coach.reviews?.length || 0,
    }));
  } catch (error) {
    handleError(error, { message: 'Failed to get client coaches', context: 'Coaching.getClientCoaches' });
    return [];
  }
}

/**
 * Update client status
 */
export async function updateClientStatus(
  relationshipId: string,
  status: 'pending' | 'active' | 'paused' | 'cancelled'
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updated_at: toISOString(new Date()),
    };

    if (status === 'cancelled') {
      updates.ended_at = new Date();
    }

    await db.update(coachClients).set(updates).where(eq(coachClients.id, relationshipId));

    return true;
  } catch (error) {
    handleError(error, { message: 'Failed to update client status', context: 'Coaching.updateClientStatus' });
    return false;
  }
}

/**
 * Remove client (cancel relationship)
 */
export async function removeClient(coachId: string, clientId: string): Promise<boolean> {
  try {
    const relationship = await db.query.coachClients.findFirst({
      where: and(eq(coachClients.coach_id, coachId), eq(coachClients.client_id, clientId)),
    });

    if (!relationship) return false;

    return await updateClientStatus(relationship.id, 'cancelled');
  } catch (error) {
    handleError(error, { message: 'Failed to remove client', context: 'Coaching.removeClient' });
    return false;
  }
}

/**
 * Check if user is client of coach
 */
export async function isClientOfCoach(coachId: string, clientId: string): Promise<boolean> {
  try {
    const relationship = await db.query.coachClients.findFirst({
      where: and(
        eq(coachClients.coach_id, coachId),
        eq(coachClients.client_id, clientId),
        eq(coachClients.status, 'active')
      ),
    });

    return !!relationship;
  } catch (error) {
    handleError(error, { message: 'Failed to check client relationship', context: 'Coaching.isClientOfCoach' });
    return false;
  }
}

// =====================================================
// COACH STATS
// =====================================================

/**
 * Get coach statistics
 */
export async function getCoachStats(coachId: string): Promise<CoachStats> {
  try {
    const coach = await db.query.coaches.findFirst({
      where: eq(coaches.id, coachId),
      with: {
        clients: true,
        reviews: true,
      },
    });

    if (!coach) {
      return {
        totalClients: 0,
        activeClients: 0,
        totalProgramsCreated: 0,
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const activeClients = coach.clients?.filter((c: any) => c.status === 'active').length || 0;

    return {
      totalClients: coach.total_clients,
      activeClients,
      totalProgramsCreated: coach.total_programs_created,
      averageRating: parseFloat(coach.rating_average || '0'),
      totalReviews: coach.reviews?.length || 0,
    };
  } catch (error) {
    handleError(error, { message: 'Failed to get coach stats', context: 'Coaching.getCoachStats' });
    return {
      totalClients: 0,
      activeClients: 0,
      totalProgramsCreated: 0,
      averageRating: 0,
      totalReviews: 0,
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get coach-client relationship
 */
export async function getCoachClientRelationship(
  coachId: string,
  clientId: string
): Promise<typeof coachClients.$inferSelect | null> {
  try {
    return await db.query.coachClients.findFirst({
      where: and(eq(coachClients.coach_id, coachId), eq(coachClients.client_id, clientId)),
    });
  } catch (error) {
    handleError(error, { message: 'Failed to get relationship', context: 'Coaching.getCoachClientRelationship' });
    return null;
  }
}

/**
 * Update coach notes for client
 */
export async function updateClientNotes(relationshipId: string, notes: string): Promise<boolean> {
  try {
    await db
      .update(coachClients)
      .set({
        notes,
        updated_at: toISOString(new Date()),
      })
      .where(eq(coachClients.id, relationshipId));

    return true;
  } catch (error) {
    handleError(error, { message: 'Failed to update client notes', context: 'Coaching.updateClientNotes' });
    return false;
  }
}
