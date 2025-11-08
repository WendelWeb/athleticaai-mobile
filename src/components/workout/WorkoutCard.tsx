/**
 * WorkoutCard Component - Premium workout card for list display
 *
 * Features:
 * - Thumbnail image with gradient overlay
 * - Badges (category, difficulty, premium)
 * - Stats pills (duration, calories, exercises)
 * - Pressable with haptic feedback
 * - Shared element transition ready
 * - Dark mode support
 * - Loading skeleton state
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Badge } from '@components/ui';
import type { Workout } from '@/types/workout';

interface WorkoutCardProps {
  workout: Workout;
  variant?: 'default' | 'compact';
  onPress?: (workout: Workout) => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  variant = 'default',
  onPress,
}) => {
  const theme = useStyledTheme();
  const router = useRouter();

  const handlePress = () => {
    // Haptic feedback
    haptics.light();

    // Custom onPress or navigate to workout player
    if (onPress) {
      onPress(workout);
    } else {
      router.push(`/workout-player/${workout.id}` as any);
    }
  };

  // Colors
  const bgColors = {
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark
      ? theme.colors.dark.text.secondary
      : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // Difficulty badge variant mapping
  const difficultyVariant = {
    beginner: 'success' as const,
    intermediate: 'warning' as const,
    advanced: 'error' as const,
    elite: 'error' as const,
  };

  // Fallback image if thumbnail missing
  const thumbnailUrl =
    workout.thumbnail_url ||
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.compactCard,
          {
            backgroundColor: bgColors.card,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {/* Thumbnail */}
        <Image source={{ uri: thumbnailUrl }} style={styles.compactThumbnail} />

        {/* Content */}
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: textColors.primary }]} numberOfLines={2}>
            {workout.title}
          </Text>
          <View style={styles.compactStats}>
            <Text style={[styles.statText, { color: textColors.tertiary }]}>
              {workout.estimated_duration_minutes} min
            </Text>
            <Text style={[styles.statText, { color: textColors.tertiary }]}>•</Text>
            <Text style={[styles.statText, { color: textColors.tertiary }]}>
              {workout.difficulty}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: bgColors.card,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Thumbnail with Gradient Overlay */}
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />

        {/* Premium badge (top-right) */}
        {workout.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}

        {/* Category badge (bottom-left) */}
        <View style={styles.categoryBadge}>
          <Badge variant="info">{workout.category}</Badge>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={[styles.title, { color: textColors.primary }]} numberOfLines={2}>
          {workout.title}
        </Text>

        {/* Description */}
        {workout.description && (
          <Text style={[styles.description, { color: textColors.secondary }]} numberOfLines={2}>
            {workout.description}
          </Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Duration */}
          <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
            <Ionicons name="time-outline" size={14} color={theme.colors.primary[500]} />
            <Text style={[styles.statText, { color: textColors.secondary }]}>
              {workout.estimated_duration_minutes} min
            </Text>
          </View>

          {/* Calories */}
          <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
            <Ionicons name="flame-outline" size={14} color={theme.colors.warning[500]} />
            <Text style={[styles.statText, { color: textColors.secondary }]}>
              {workout.estimated_calories} cal
            </Text>
          </View>

          {/* Exercises count */}
          <View style={[styles.statPill, { backgroundColor: bgColors.surface }]}>
            <Ionicons name="barbell-outline" size={14} color={theme.colors.secondary[500]} />
            <Text style={[styles.statText, { color: textColors.secondary }]}>
              {workout.total_exercises} ex
            </Text>
          </View>
        </View>

        {/* Difficulty badge */}
        <View style={styles.footer}>
          <Badge variant={difficultyVariant[workout.difficulty] || 'default'}>
            {workout.difficulty}
          </Badge>
        </View>
      </View>
    </Pressable>
  );
};

// Memoize component to prevent unnecessary re-renders
const MemoizedWorkoutCard = React.memo(WorkoutCard);

// Add display name for debugging
MemoizedWorkoutCard.displayName = 'WorkoutCard';

// Export both for compatibility
export { MemoizedWorkoutCard as WorkoutCard };
export default MemoizedWorkoutCard;

const styles = StyleSheet.create({
  // Default card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Compact card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  compactThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  compactStats: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
});
