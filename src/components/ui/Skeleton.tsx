/**
 * Skeleton Loader - Shimmer effect for loading states
 * 
 * Features:
 * - Shimmer gradient animation
 * - Multiple variants (text, circle, rect)
 * - Customizable dimensions
 * - Dark mode support
 * 
 * Performance: Reanimated 3 for 60 FPS shimmer
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circle' | 'rect';
  
  /** Width */
  width?: number | string;
  
  /** Height */
  height?: number;
  
  /** Border radius (for rect variant) */
  borderRadius?: number;
  
  /** Custom style */
  style?: ViewStyle;
  
  /** Test ID */
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height = 20,
  borderRadius,
  style,
  testID,
}) => {
  const theme = useStyledTheme();
  const shimmerTranslate = useSharedValue(-1);

  // Start shimmer animation
  React.useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmerTranslate]);

  // Animated shimmer style
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Get dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'text':
        return {
          width: width,
          height: height || 16,
          borderRadius: borderRadius || 4,
        };
      case 'circle':
        const size = typeof width === 'number' ? width : height;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'rect':
      default:
        return {
          width,
          height,
          borderRadius: borderRadius || theme.borderRadius.md,
        };
    }
  };

  const dimensions = getDimensions();

  // Gradient colors based on theme
  const gradientColors: readonly [string, string, string] = theme.isDark
    ? ['#1C1C1E', '#2C2C2E', '#1C1C1E']
    : ['#E5E5EA', '#F9F9FB', '#E5E5EA'];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width as any,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          backgroundColor: theme.isDark
            ? theme.colors.dark.surface
            : theme.colors.light.surface,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Group - Multiple skeletons for complex layouts
export interface SkeletonGroupProps {
  /** Number of skeleton items */
  count?: number;
  
  /** Spacing between items */
  spacing?: number;
  
  /** Skeleton props for each item */
  skeletonProps?: SkeletonProps;
  
  /** Test ID */
  testID?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  spacing = 16,
  skeletonProps,
  testID,
}) => {
  return (
    <View testID={testID}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: index < count - 1 ? spacing : 0 }}>
          <Skeleton {...skeletonProps} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: 300,
    height: '100%',
  },
});

