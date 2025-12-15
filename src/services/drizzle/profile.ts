/**
 * Drizzle Profile Service
 *
 * Replaces Supabase profile service with Drizzle ORM + Neon
 * Maintains EXACT same interface as Supabase for seamless migration
 *
 * Features:
 * - Get profile by ID
 * - Create profile (for new users)
 * - Update profile
 * - Upload avatar via ImageKit (replaces Supabase Storage)
 */

import { db, profiles } from '@/db';
import { eq } from 'drizzle-orm';
import { logger, handleError, safeToISOString } from '@/utils';

// Re-export Profile interface (same as Supabase)
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite' | null;
  primary_goal:
    | 'lose_weight'
    | 'build_muscle'
    | 'get_stronger'
    | 'improve_endurance'
    | 'stay_healthy'
    | 'athletic_performance'
    | null;
  subscription_tier: 'free' | 'premium' | 'elite';
  subscription_expires_at: string | null;
  preferred_workout_days: number[];
  preferred_workout_time: string;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;

  // Coaching
  is_coach?: boolean;

  // Onboarding fields
  age?: number | null;
  target_weight_kg?: number | null;
  target_date?: string | null;
  sports_history?: string[] | null;
  current_activity_level?: string | null;
  injuries?: string[] | null;
  medical_conditions?: string[] | null;
  notes?: string | null;
  equipment_available?: string[] | null;
  workout_location?: string | null;
  days_per_week?: number | null;
  minutes_per_session?: number | null;
  music_enabled?: boolean | null;
  music_genres?: string[] | null;
  voice_coach_enabled?: boolean | null;
  language?: string | null;
  units?: string | null;
  motivation?: string | null;
  onboarding_completed_at?: string | null;
  onboarding_version?: number | null;
}

// Re-export UpdateProfileData interface (same as Supabase)
export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string | null;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  primary_goal?:
    | 'lose_weight'
    | 'build_muscle'
    | 'get_stronger'
    | 'improve_endurance'
    | 'stay_healthy'
    | 'athletic_performance';
  preferred_workout_days?: number[];
  preferred_workout_time?: string;
  notifications_enabled?: boolean;
  onboarding_completed?: boolean;
  is_coach?: boolean;

  // Onboarding fields
  age?: number;
  target_weight_kg?: number;
  target_date?: string;
  sports_history?: string[];
  current_activity_level?: string;
  injuries?: string[];
  medical_conditions?: string[];
  notes?: string;
  equipment_available?: string[];
  workout_location?: string;
  days_per_week?: number;
  minutes_per_session?: number;
  music_enabled?: boolean;
  music_genres?: string[];
  voice_coach_enabled?: boolean;
  language?: string;
  units?: string;
  motivation?: string;
  onboarding_completed_at?: string;
  onboarding_version?: number;
}

/**
 * Get user profile by ID
 */
export const getProfile = async (
  userId: string
): Promise<{ profile: Profile | null; error: any }> => {
  try {
    const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

    if (result.length === 0) {
      return {
        profile: null,
        error: null,
      };
    }

    // Convert Drizzle result to Profile interface format
    const profileData = result[0];
    const profile: Profile = {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      avatar_url: profileData.avatar_url,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,
      height_cm: profileData.height_cm ? parseFloat(profileData.height_cm) : null,
      weight_kg: profileData.weight_kg ? parseFloat(profileData.weight_kg) : null,
      fitness_level: profileData.fitness_level,
      primary_goal: profileData.primary_goal,
      subscription_tier: profileData.subscription_tier || 'free',
      subscription_expires_at: safeToISOString(profileData.subscription_expires_at),
      preferred_workout_days: profileData.preferred_workout_days || [1, 3, 5],
      preferred_workout_time: profileData.preferred_workout_time || '07:00:00',
      notifications_enabled: profileData.notifications_enabled ?? true,
      onboarding_completed: profileData.onboarding_completed ?? false,
      is_coach: profileData.is_coach ?? false,
      created_at: safeToISOString(profileData.created_at) || new Date().toISOString(),
      updated_at: safeToISOString(profileData.updated_at) || new Date().toISOString(),

      // Onboarding fields
      age: profileData.age,
      target_weight_kg: profileData.target_weight_kg ? parseFloat(profileData.target_weight_kg) : null,
      target_date: profileData.target_date,
      sports_history: profileData.sports_history,
      current_activity_level: profileData.current_activity_level,
      injuries: profileData.injuries,
      medical_conditions: profileData.medical_conditions,
      notes: profileData.notes,
      equipment_available: profileData.equipment_available,
      workout_location: profileData.workout_location,
      days_per_week: profileData.days_per_week,
      minutes_per_session: profileData.minutes_per_session,
      music_enabled: profileData.music_enabled,
      music_genres: profileData.music_genres,
      voice_coach_enabled: profileData.voice_coach_enabled,
      language: profileData.language,
      units: profileData.units,
      motivation: profileData.motivation,
      onboarding_completed_at: safeToISOString(profileData.onboarding_completed_at),
      onboarding_version: profileData.onboarding_version,
    };

    return {
      profile,
      error: null,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load profile',
      description: 'Unable to load your profile data',
      showToast: true,
      context: 'ProfileService.getProfile',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Create user profile (called after sign up)
 */
export const createProfile = async (
  userId: string,
  email: string,
  fullName?: string
): Promise<{ profile: Profile | null; error: any }> => {
  try {
    const result = await db
      .insert(profiles)
      .values({
        id: userId,
        email,
        full_name: fullName || null,
        subscription_tier: 'free',
        fitness_level: 'beginner',
        notifications_enabled: true,
        onboarding_completed: false,
      })
      .returning();

    if (result.length === 0) {
      return {
        profile: null,
        error: new Error('Failed to create profile'),
      };
    }

    // Fetch the created profile
    return getProfile(userId);
  } catch (error) {
    handleError(error, {
      message: 'Failed to create profile',
      description: 'Could not create your profile',
      showToast: true,
      context: 'ProfileService.createProfile',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileData
): Promise<{ profile: Profile | null; error: any }> => {
  try {
    // Convert string dates to Date objects for Drizzle
    const updateData: any = { ...updates };

    if (updates.date_of_birth) {
      updateData.date_of_birth = updates.date_of_birth;
    }

    if (updates.target_date) {
      updateData.target_date = updates.target_date;
    }

    if (updates.onboarding_completed_at) {
      updateData.onboarding_completed_at = new Date(updates.onboarding_completed_at);
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, userId))
      .returning();

    if (result.length === 0) {
      return {
        profile: null,
        error: new Error('Profile not found'),
      };
    }

    // Fetch the updated profile
    return getProfile(userId);
  } catch (error) {
    handleError(error, {
      message: 'Failed to update profile',
      description: 'Your changes could not be saved',
      showToast: true,
      context: 'ProfileService.updateProfile',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Upload avatar via ImageKit (replaces Supabase Storage)
 */
export const uploadAvatar = async (
  userId: string,
  file: {
    uri: string;
    type: string;
    name: string;
  }
): Promise<{ url: string | null; error: any }> => {
  try {
    // TODO: Implement ImageKit upload when ImageKit service is ready
    // For now, return placeholder

    logger.warn('[Profile] ImageKit upload not implemented - using placeholder', { userId });

    // Placeholder: Return mock URL
    const mockUrl = `https://ik.imagekit.io/szpehxzt8/avatars/${userId}-${Date.now()}.jpg`;

    // Update profile with new avatar URL
    await updateProfile(userId, { avatar_url: mockUrl });

    return {
      url: mockUrl,
      error: null,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to upload avatar',
      description: 'Could not upload profile picture',
      showToast: true,
      context: 'ProfileService.uploadAvatar',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Delete avatar
 */
export const deleteAvatar = async (userId: string, avatarUrl: string): Promise<{ error: any }> => {
  try {
    // TODO: Implement ImageKit delete when ImageKit service is ready

    // Update profile to remove avatar URL
    await updateProfile(userId, { avatar_url: null });

    return { error: null };
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete avatar',
      description: 'Could not remove profile picture',
      showToast: true,
      context: 'ProfileService.deleteAvatar',
    });
    throw error; // Let React Query handle error state
  }
};
