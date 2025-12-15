/**
 * Drizzle Community Service
 *
 * Features:
 * - Social Feed (posts, likes, comments)
 * - Challenges (join, track progress, complete)
 * - Leaderboard (rankings, trends)
 * - User follows (friends/followers)
 */

import { db, posts, postLikes, postComments, challenges, challengeParticipants, leaderboardEntries, userFollows, profiles } from '@/db';
import { eq, desc, and, sql, asc, gte, lte } from 'drizzle-orm';
import { logger, toISOString, handleError } from '@/utils';

// =====================================================
// TYPES
// =====================================================

export interface Post {
  id: string;
  user_id: string;
  type: 'workout' | 'achievement' | 'transformation' | 'text' | 'photo';
  content: string;
  image_url: string | null;
  video_url: string | null;
  workout_id: string | null;
  session_id: string | null;
  workout_data: any | null;
  achievement_id: string | null;
  achievement_data: any | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;

  // Populated user data
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };

  // Is liked by current user?
  is_liked?: boolean;
}

export interface CreatePostData {
  user_id: string;
  type: 'workout' | 'achievement' | 'transformation' | 'text' | 'photo';
  content: string;
  image_url?: string;
  video_url?: string;
  workout_id?: string;
  session_id?: string;
  workout_data?: any;
  achievement_id?: string;
  achievement_data?: any;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient_start: string;
  gradient_end: string;
  type: 'weekly' | 'monthly' | 'special';
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  target: number;
  unit: string;
  reward_xp: number;
  reward_badge: string | null;
  reward_title: string | null;
  start_date: string;
  end_date: string;
  participants_count: number;
  is_premium: boolean;
  created_at: string;

  // User participation data
  user_progress?: number;
  is_joined?: boolean;
  is_completed?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  type: 'weekly' | 'monthly' | 'all_time';
  rank: number;
  previous_rank: number | null;
  score: number;
  week_start: string | null;
  month_start: string | null;
  created_at: string;
  updated_at: string;

  // Populated user data
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };

  // Trend
  trend?: 'up' | 'down' | 'same';
}

// =====================================================
// POSTS
// =====================================================

/**
 * Get feed posts (latest first)
 */
export const getFeedPosts = async (userId?: string, limit = 20, offset = 0): Promise<Post[]> => {
  try {
    // Get posts with user data
    const postsData = await db
      .select({
        post: posts,
        user: {
          id: profiles.id,
          full_name: profiles.full_name,
          avatar_url: profiles.avatar_url,
        },
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.user_id, profiles.id))
      .orderBy(desc(posts.created_at))
      .limit(limit)
      .offset(offset);

    // If userId provided, check which posts are liked by user
    let likedPostIds: string[] = [];
    if (userId) {
      const likes = await db
        .select({ post_id: postLikes.post_id })
        .from(postLikes)
        .where(eq(postLikes.user_id, userId));
      likedPostIds = likes.map((l: { post_id: string }) => l.post_id);
    }

    return postsData.map(({ post, user }: any, index: number) => {
      if (index === 0) {
        logger.debug('[Community] First post fetched', {
          created_at: post.created_at,
          created_at_type: typeof post.created_at,
          created_at_instanceof: post.created_at instanceof Date,
        });
      }
      return {
        ...post,
        created_at: toISOString(post.created_at),
        updated_at: toISOString(post.updated_at),
        user: user || undefined,
        is_liked: userId ? likedPostIds.includes(post.id) : false,
      };
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to load community feed',
      description: 'Unable to load posts',
      showToast: true,
      context: 'CommunityService.getFeedPosts',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get single post by ID
 */
export const getPostById = async (postId: string, userId?: string): Promise<Post | null> => {
  try {
    const result = await db
      .select({
        post: posts,
        user: {
          id: profiles.id,
          full_name: profiles.full_name,
          avatar_url: profiles.avatar_url,
        },
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.user_id, profiles.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (result.length === 0) return null;

    const { post, user } = result[0];

    // Check if liked by user
    let isLiked = false;
    if (userId) {
      const like = await db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.post_id, postId), eq(postLikes.user_id, userId)))
        .limit(1);
      isLiked = like.length > 0;
    }

    return {
      ...post,
      created_at: toISOString(post.created_at),
      updated_at: toISOString(post.updated_at),
      user: user || undefined,
      is_liked: isLiked,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load post',
      description: 'Unable to load post details',
      showToast: true,
      context: 'CommunityService.getPostById',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Create new post
 */
export const createPost = async (data: CreatePostData): Promise<Post> => {
  try {
    const [newPost] = await db
      .insert(posts)
      .values({
        user_id: data.user_id,
        type: data.type,
        content: data.content,
        image_url: data.image_url || null,
        video_url: data.video_url || null,
        workout_id: data.workout_id || null,
        session_id: data.session_id || null,
        workout_data: data.workout_data || null,
        achievement_id: data.achievement_id || null,
        achievement_data: data.achievement_data || null,
      })
      .returning();

    return {
      ...newPost,
      created_at: toISOString(newPost.created_at),
      updated_at: toISOString(newPost.updated_at),
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to create post',
      description: 'Could not publish your post',
      showToast: true,
      context: 'CommunityService.createPost',
    });
    throw error; // Re-throw so caller knows it failed
  }
};

/**
 * Delete post
 */
export const deletePost = async (postId: string, userId: string): Promise<void> => {
  try {
    // Ensure user owns the post
    await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.user_id, userId)));
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete post',
      description: 'Could not delete your post',
      showToast: true,
      context: 'CommunityService.deletePost',
    });
    throw error;
  }
};

/**
 * Like/Unlike post
 */
export const togglePostLike = async (postId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> => {
  try {
    // Check if already liked
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.post_id, postId), eq(postLikes.user_id, userId)))
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.post_id, postId), eq(postLikes.user_id, userId)));

      // Decrement count
      await db
        .update(posts)
        .set({ likes_count: sql`${posts.likes_count} - 1` })
        .where(eq(posts.id, postId));

      const [updated] = await db.select({ likes_count: posts.likes_count }).from(posts).where(eq(posts.id, postId));

      return { isLiked: false, likesCount: updated?.likes_count || 0 };
    } else {
      // Like
      await db.insert(postLikes).values({
        post_id: postId,
        user_id: userId,
      });

      // Increment count
      await db
        .update(posts)
        .set({ likes_count: sql`${posts.likes_count} + 1` })
        .where(eq(posts.id, postId));

      const [updated] = await db.select({ likes_count: posts.likes_count }).from(posts).where(eq(posts.id, postId));

      return { isLiked: true, likesCount: updated?.likes_count || 0 };
    }
  } catch (error) {
    handleError(error, {
      message: 'Failed to like post',
      description: 'Could not update post like',
      showToast: false, // Silent failure for likes
      context: 'CommunityService.togglePostLike',
    });
    throw error;
  }
};

/**
 * Add comment to post
 */
export const addComment = async (postId: string, userId: string, content: string): Promise<void> => {
  try {
    await db.insert(postComments).values({
      post_id: postId,
      user_id: userId,
      content,
    });

    // Increment comments count
    await db
      .update(posts)
      .set({ comments_count: sql`${posts.comments_count} + 1` })
      .where(eq(posts.id, postId));
  } catch (error) {
    handleError(error, {
      message: 'Failed to add comment',
      description: 'Could not post your comment',
      showToast: true,
      context: 'CommunityService.addComment',
    });
    throw error;
  }
};

// =====================================================
// CHALLENGES
// =====================================================

/**
 * Get active challenges
 */
export const getActiveChallenges = async (userId?: string): Promise<Challenge[]> => {
  try {
    const now = new Date();

    const challengesData = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.status, 'active'),
          lte(challenges.start_date, now),
          gte(challenges.end_date, now)
        )
      )
      .orderBy(desc(challenges.created_at));

    // If userId provided, get user participation data
    if (userId) {
      const participations = await db
        .select()
        .from(challengeParticipants)
        .where(eq(challengeParticipants.user_id, userId));

      const participationMap = new Map(participations.map((p: any) => [p.challenge_id, p]));

      return challengesData.map((challenge: any) => {
        const participation: any = participationMap.get(challenge.id);
        return {
          ...challenge,
          start_date: toISOString(challenge.start_date),
          end_date: toISOString(challenge.end_date),
          created_at: toISOString(challenge.created_at),
          user_progress: participation?.progress || 0,
          is_joined: !!participation,
          is_completed: participation?.is_completed || false,
        };
      });
    }

    return challengesData.map((challenge: any) => ({
      ...challenge,
      start_date: toISOString(challenge.start_date),
      end_date: toISOString(challenge.end_date),
      created_at: toISOString(challenge.created_at),
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load challenges',
      description: 'Unable to load active challenges',
      showToast: true,
      context: 'CommunityService.getActiveChallenges',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Join challenge
 */
export const joinChallenge = async (challengeId: string, userId: string): Promise<void> => {
  try {
    // Check if already joined
    const existing = await db
      .select()
      .from(challengeParticipants)
      .where(and(eq(challengeParticipants.challenge_id, challengeId), eq(challengeParticipants.user_id, userId)))
      .limit(1);

    if (existing.length > 0) {
      return; // Already joined
    }

    // Insert participation
    await db.insert(challengeParticipants).values({
      challenge_id: challengeId,
      user_id: userId,
      progress: 0,
    });

    // Increment participants count
    await db
      .update(challenges)
      .set({ participants_count: sql`${challenges.participants_count} + 1` })
      .where(eq(challenges.id, challengeId));
  } catch (error) {
    handleError(error, {
      message: 'Failed to join challenge',
      description: 'Could not join this challenge',
      showToast: true,
      context: 'CommunityService.joinChallenge',
    });
    throw error;
  }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  challengeId: string,
  userId: string,
  progress: number
): Promise<void> => {
  try {
    // Get challenge target
    const [challenge] = await db
      .select({ target: challenges.target })
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge) throw new Error('Challenge not found');

    const isCompleted = progress >= challenge.target;

    await db
      .update(challengeParticipants)
      .set({
        progress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          eq(challengeParticipants.challenge_id, challengeId),
          eq(challengeParticipants.user_id, userId)
        )
      );
  } catch (error) {
    handleError(error, {
      message: 'Failed to update challenge',
      description: 'Could not update challenge progress',
      showToast: false, // Silent - progress updates happen frequently
      context: 'CommunityService.updateChallengeProgress',
    });
    throw error;
  }
};

// =====================================================
// LEADERBOARD
// =====================================================

/**
 * Get leaderboard
 */
export const getLeaderboard = async (
  type: 'weekly' | 'monthly' | 'all_time' = 'weekly',
  limit = 50
): Promise<LeaderboardEntry[]> => {
  try {
    const entries = await db
      .select({
        entry: leaderboardEntries,
        user: {
          id: profiles.id,
          full_name: profiles.full_name,
          avatar_url: profiles.avatar_url,
        },
      })
      .from(leaderboardEntries)
      .leftJoin(profiles, eq(leaderboardEntries.user_id, profiles.id))
      .where(eq(leaderboardEntries.type, type))
      .orderBy(asc(leaderboardEntries.rank))
      .limit(limit);

    return entries.map(({ entry, user }: any) => {
      let trend: 'up' | 'down' | 'same' = 'same';
      if (entry.previous_rank !== null) {
        if (entry.rank < entry.previous_rank) trend = 'up';
        else if (entry.rank > entry.previous_rank) trend = 'down';
      }

      return {
        ...entry,
        created_at: toISOString(entry.created_at),
        updated_at: toISOString(entry.updated_at),
        week_start: entry.week_start ? toISOString(entry.week_start) : null,
        month_start: entry.month_start ? toISOString(entry.month_start) : null,
        user: user as any,
        trend,
      };
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to load leaderboard',
      description: 'Unable to load rankings',
      showToast: true,
      context: 'CommunityService.getLeaderboard',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get user leaderboard position
 */
export const getUserLeaderboardPosition = async (
  userId: string,
  type: 'weekly' | 'monthly' | 'all_time' = 'weekly'
): Promise<LeaderboardEntry | null> => {
  try {
    const result = await db
      .select({
        entry: leaderboardEntries,
        user: {
          id: profiles.id,
          full_name: profiles.full_name,
          avatar_url: profiles.avatar_url,
        },
      })
      .from(leaderboardEntries)
      .leftJoin(profiles, eq(leaderboardEntries.user_id, profiles.id))
      .where(
        and(
          eq(leaderboardEntries.user_id, userId),
          eq(leaderboardEntries.type, type)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const { entry, user } = result[0];

    let trend: 'up' | 'down' | 'same' = 'same';
    if (entry.previous_rank !== null) {
      if (entry.rank < entry.previous_rank) trend = 'up';
      else if (entry.rank > entry.previous_rank) trend = 'down';
    }

    return {
      ...entry,
      created_at: toISOString(entry.created_at),
      updated_at: toISOString(entry.updated_at),
      week_start: entry.week_start ? toISOString(entry.week_start) : null,
      month_start: entry.month_start ? toISOString(entry.month_start) : null,
      user: user as any,
      trend,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load leaderboard position',
      description: 'Unable to load your ranking',
      showToast: true,
      context: 'CommunityService.getUserLeaderboardPosition',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// FOLLOWS
// =====================================================

/**
 * Follow user
 */
export const followUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    await db.insert(userFollows).values({
      follower_id: followerId,
      following_id: followingId,
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to follow user',
      description: 'Could not follow this user',
      showToast: true,
      context: 'CommunityService.followUser',
    });
    throw error;
  }
};

/**
 * Unfollow user
 */
export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.follower_id, followerId),
          eq(userFollows.following_id, followingId)
        )
      );
  } catch (error) {
    handleError(error, {
      message: 'Failed to unfollow user',
      description: 'Could not unfollow this user',
      showToast: true,
      context: 'CommunityService.unfollowUser',
    });
    throw error;
  }
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const result = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.follower_id, followerId),
          eq(userFollows.following_id, followingId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    handleError(error, {
      message: 'Failed to check follow status',
      description: 'Could not check if you follow this user',
      showToast: false, // Silent - non-critical
      context: 'CommunityService.isFollowing',
    });
    return false;
  }
};

/**
 * Get followers count
 */
export const getFollowersCount = async (userId: string): Promise<number> => {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userFollows)
      .where(eq(userFollows.following_id, userId));

    return result[0]?.count || 0;
  } catch (error) {
    handleError(error, {
      message: 'Failed to get followers count',
      showToast: false,
      context: 'CommunityService.getFollowersCount',
    });
    return 0;
  }
};

/**
 * Get following count
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userFollows)
      .where(eq(userFollows.follower_id, userId));

    return result[0]?.count || 0;
  } catch (error) {
    handleError(error, {
      message: 'Failed to get following count',
      showToast: false,
      context: 'CommunityService.getFollowingCount',
    });
    return 0;
  }
};
