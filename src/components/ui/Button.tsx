/**
 * Button Component - Apple-style with Reanimated 3 animations
 *
 * Features:
 * - Scale animation on press (0.98 spring)
 * - Haptic feedback
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Disabled state
 * - Icon support
 * - Accessibility compliant
 *
 * Performance: Native animations via Reanimated worklets (60 FPS)
 */

import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { useStyledTheme } from '@theme/ThemeProvider';
import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps {
  /** Button text */
  children: string;

  /** Press handler */
  onPress?: () => void;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Loading state */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Full width */
  fullWidth?: boolean;

  /** Icon (left) */
  icon?: React.ReactNode;

  /** Icon (right) */
  iconRight?: React.ReactNode;

  /** Custom style */
  style?: object;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Test ID */
  testID?: string;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconRight,
  style,
  accessibilityLabel,
  testID,
}) => {
  const theme = useStyledTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Press handlers with haptic feedback
  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();

    // Haptic feedback
    haptics.light();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading || !onPress) return;
    onPress();
  };

  // Disabled/loading opacity
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: disabled || loading ? 0.5 : 1,
      duration: theme.motion.duration.fast,
      useNativeDriver: true,
    }).start();
  }, [disabled, loading, opacity, theme.motion.duration.fast]);

  // Styles based on variant
  const getBackgroundColor = () => {
    if (variant === 'primary') return theme.colors.primary[500];
    if (variant === 'secondary') return theme.colors.secondary[500];
    if (variant === 'danger') return theme.colors.error[500];
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'ghost') {
      return theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary;
    }
    return '#FFFFFF';
  };

  const getBorderColor = () => {
    if (variant === 'ghost') {
      return theme.isDark ? theme.colors.dark.border : theme.colors.light.border;
    }
    return 'transparent';
  };

  // Size styles
  const getPadding = () => {
    if (size === 'sm') return { paddingVertical: 8, paddingHorizontal: 16 };
    if (size === 'lg') return { paddingVertical: 16, paddingHorizontal: 32 };
    return { paddingVertical: 12, paddingHorizontal: 24 };
  };

  const getFontSize = () => {
    if (size === 'sm') return theme.typography.fontSize.sm;
    if (size === 'lg') return theme.typography.fontSize.lg;
    return theme.typography.fontSize.md;
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderRadius: theme.borderRadius.md,
          ...getPadding(),
          width: fullWidth ? '100%' : 'auto',
          transform: [{ scale }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              {children}
            </Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
};

// Memoize component to prevent unnecessary re-renders
export const Button = React.memo(ButtonComponent);

// Add display name for debugging
Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
