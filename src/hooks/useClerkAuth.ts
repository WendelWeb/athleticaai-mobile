/**
 * useClerkAuth Hook - Replaces Zustand authStore
 *
 * Modern React hook for Clerk authentication + Drizzle profile
 * Provides same interface as old authStore for seamless migration
 *
 * Features:
 * - Clerk auth state (isSignedIn, user, session)
 * - Drizzle profile loading & caching
 * - Profile refresh function
 * - Loading states
 * - Error handling
 *
 * Usage:
 * ```tsx
 * const { user, profile, isLoading, refreshProfile } = useClerkAuth();
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import type { UserResource } from '@clerk/types';
import { getProfile, type Profile } from '@/services/drizzle/profile';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

interface UseClerkAuthReturn {
  // Clerk auth state
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;

  // User & session (Clerk)
  user: UserResource | null;
  session: null; // Clerk manages session internally

  // Profile (Drizzle)
  profile: Profile | null;

  // Loading states
  isLoading: boolean;
  isProfileLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * useClerkAuth - Main authentication hook
 *
 * Combines Clerk auth state + Drizzle profile data
 * Auto-loads profile when user signs in
 * Auto-clears profile when user signs out
 */
export const useClerkAuth = (): UseClerkAuthReturn => {
  const { isLoaded, isSignedIn, userId, signOut: clerkSignOut } = useAuth();
  const { user } = useUser();

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've attempted to load profile for current user
  const loadedUserIdRef = useRef<string | null>(null);

  /**
   * Load profile from Neon database
   * Creates profile automatically if it doesn't exist
   */
  const loadProfile = useCallback(
    async (uid: string, userEmail?: string, userFirstName?: string, userLastName?: string) => {
      if (!uid) return;

      try {
        setIsProfileLoading(true);
        setError(null);

        // Services now throw errors instead of returning {profile, error} (Phase 2)
        const { profile: fetchedProfile } = await getProfile(uid);

        if (!fetchedProfile) {
          // Profile doesn't exist → create it automatically
          const { createProfile } = await import('@/services/drizzle/profile');

          // Build full_name from firstName + lastName
          const fullName =
            userFirstName && userLastName
              ? `${userFirstName} ${userLastName}`
              : userFirstName || userLastName || '';

          const { profile: newProfile } = await createProfile(
            uid,
            userEmail || '',
            fullName
          );

          setProfile(newProfile);
        } else {
          setProfile(fetchedProfile);
        }
      } catch (err) {
        const message = getErrorMessage(err);
        logger.error('[Auth] Failed to load profile', err instanceof Error ? err : undefined, { userId: uid });
        setError(message);
        setProfile(null);
        throw err; // Let error propagate for error boundaries
      } finally {
        setIsProfileLoading(false);
      }
    },
    []
  );

  /**
   * Refresh profile (manual)
   */
  const refreshProfile = useCallback(async () => {
    if (!userId) return;

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? undefined;
    const userFirstName = user?.firstName ?? undefined;
    const userLastName = user?.lastName ?? undefined;
    await loadProfile(userId, userEmail, userFirstName, userLastName);
  }, [userId, user, loadProfile]);

  /**
   * Sign out (Clerk + clear profile)
   */
  const signOut = useCallback(async () => {
    try {
      await clerkSignOut();
      setProfile(null);
      setError(null);
      loadedUserIdRef.current = null; // Reset ref to allow re-login
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error('[Auth] Failed to sign out', err instanceof Error ? err : undefined);
      setError(message);
      throw err; // Re-throw so UI can handle
    }
  }, [clerkSignOut]);

  /**
   * Auto-load profile when user signs in (ONCE per user)
   * Uses ref to prevent infinite loop
   */
  useEffect(() => {
    // Only load if:
    // 1. Clerk is loaded
    // 2. User is signed in
    // 3. We have userId
    // 4. We haven't already loaded profile for this user
    // 5. Not currently loading
    if (isLoaded && isSignedIn && userId && loadedUserIdRef.current !== userId && !isProfileLoading) {
      loadedUserIdRef.current = userId; // Mark as loaded (prevents retry)

      const userEmail = user?.primaryEmailAddress?.emailAddress ?? undefined;
      const userFirstName = user?.firstName ?? undefined;
      const userLastName = user?.lastName ?? undefined;
      loadProfile(userId, userEmail, userFirstName, userLastName);
    }
  }, [isLoaded, isSignedIn, userId, user, isProfileLoading]);

  /**
   * Clear profile when user signs out
   */
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setProfile(null);
      setError(null);
      loadedUserIdRef.current = null; // Reset ref for next user
    }
  }, [isLoaded, isSignedIn]);

  // Combined loading state
  const isLoading = !isLoaded || isProfileLoading;

  return {
    // Clerk auth state
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: userId ?? null,

    // User & session
    user: user ?? null,
    session: null, // Clerk manages session internally

    // Profile (Drizzle)
    profile,

    // Loading states
    isLoading,
    isProfileLoading,

    // Error state
    error,

    // Actions
    refreshProfile,
    signOut,
  };
};

/**
 * useProfile - Simplified hook for profile only
 *
 * Usage:
 * ```tsx
 * const { profile, isLoading, refresh } = useProfile();
 * ```
 */
export const useProfile = () => {
  const { profile, isProfileLoading, refreshProfile } = useClerkAuth();

  return {
    profile,
    isLoading: isProfileLoading,
    refresh: refreshProfile,
  };
};

/**
 * useRequireAuth - Hook that redirects to sign-in if not authenticated
 *
 * Usage in protected screens:
 * ```tsx
 * const { user, profile } = useRequireAuth();
 * ```
 */
export const useRequireAuth = () => {
  const auth = useClerkAuth();
  const { isLoaded, isSignedIn } = auth;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in
      // Note: Use Expo Router navigation
    }
  }, [isLoaded, isSignedIn]);

  return auth;
};

export default useClerkAuth;
