/**
 * 💎 SKELETON LOADER - Premium Loading States
 *
 * Features:
 * - Animated shimmer effect
 * - Customizable shapes
 * - Apple-grade quality
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 12,
  style,
}) => {
  const theme = useStyledTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyles = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5EA',
    overflow: 'hidden' as const,
  };

  return (
    <Animated.View
      style={[
        skeletonStyles,
        { opacity },
        style,
      ]}
    />
  );
};

// Memoize base component
export const Skeleton = React.memo(SkeletonComponent);
Skeleton.displayName = 'Skeleton';

// Preset Skeleton Layouts
const SkeletonCardComponent: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.cardHeader}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={20} />
          <View style={{ height: 8 }} />
          <Skeleton width="50%" height={16} />
        </View>
      </View>
      <View style={{ height: 20 }} />
      <Skeleton width="100%" height={100} />
      <View style={{ height: 16 }} />
      <Skeleton width="100%" height={50} borderRadius={16} />
    </View>
  );
};

export const SkeletonCard = React.memo(SkeletonCardComponent);
SkeletonCard.displayName = 'SkeletonCard';

const SkeletonStatsComponent: React.FC = () => {
  return (
    <View style={styles.skeletonStats}>
      <View style={styles.statItem}>
        <Skeleton width="100%" height={120} borderRadius={20} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width="100%" height={120} borderRadius={20} />
      </View>
    </View>
  );
};

export const SkeletonStats = React.memo(SkeletonStatsComponent);
SkeletonStats.displayName = 'SkeletonStats';

const SkeletonListComponent: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.listItemText}>
            <Skeleton width="80%" height={18} />
            <View style={{ height: 8 }} />
            <Skeleton width="60%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SkeletonList = React.memo(SkeletonListComponent);
SkeletonList.displayName = 'SkeletonList';

const styles = StyleSheet.create({
  skeletonCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  skeletonStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
  },
  skeletonList: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    flex: 1,
  },
});
