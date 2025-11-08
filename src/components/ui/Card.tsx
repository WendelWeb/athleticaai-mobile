/**
 * Card Component - Apple-style with shadow and animations
 *
 * Features:
 * - Soft shadow (iOS-style)
 * - Scale animation on press (0.98 spring)
 * - Haptic feedback
 * - Customizable padding
 * - Dark mode support
 * - Accessibility compliant
 *
 * Performance: Reanimated 3 worklets for 60 FPS
 */

import React, { ReactNode, useRef } from 'react';
import { Pressable, View, Animated } from 'react-native';
import { useStyledTheme } from '@theme/ThemeProvider';
import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps {
  /** Card content */
  children: ReactNode;

  /** Press handler (makes card pressable) */
  onPress?: () => void;

  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Shadow elevation */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Border radius */
  radius?: 'sm' | 'md' | 'lg' | 'xl';

  /** Custom background color */
  backgroundColor?: string;

  /** Custom style */
  style?: object;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Test ID */
  testID?: string;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  onPress,
  padding = 'md',
  shadow = 'md',
  radius = 'lg',
  backgroundColor,
  style,
  accessibilityLabel,
  testID,
}) => {
  const theme = useStyledTheme();
  const scale = useRef(new Animated.Value(1)).current;

  // Press handlers
  const handlePressIn = () => {
    if (!onPress) return;

    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();

    haptics.light();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Get padding value
  const getPadding = () => {
    if (padding === 'none') return 0;
    if (padding === 'sm') return theme.spacing.sm;
    if (padding === 'lg') return theme.spacing.lg;
    return theme.spacing.md;
  };

  // Get shadow style
  const getShadow = () => {
    if (shadow === 'none') return {};
    if (shadow === 'sm') return theme.shadows.sm;
    if (shadow === 'lg') return theme.shadows.lg;
    if (shadow === 'xl') return theme.shadows.xl;
    return theme.shadows.md;
  };

  // Get border radius
  const getBorderRadius = () => {
    if (radius === 'sm') return theme.borderRadius.sm;
    if (radius === 'lg') return theme.borderRadius.lg;
    if (radius === 'xl') return theme.borderRadius.xl;
    return theme.borderRadius.md;
  };

  // Get background color
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    return theme.isDark ? theme.colors.dark.card : theme.colors.light.card;
  };

  const cardStyle = {
    padding: getPadding(),
    borderRadius: getBorderRadius(),
    backgroundColor: getBackgroundColor(),
    ...getShadow(),
  };

  // If pressable
  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[cardStyle, style, { transform: [{ scale }] }]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  // Static card
  return (
    <View accessible accessibilityLabel={accessibilityLabel} testID={testID} style={[cardStyle, style]}>
      {children}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const Card = React.memo(CardComponent);

// Add display name for debugging
Card.displayName = 'Card';
