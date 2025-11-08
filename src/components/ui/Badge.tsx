/**
 * Badge Component - For gamification (XP, levels, achievements)
 *
 * Features:
 * - Multiple variants (primary, success, warning, error, info)
 * - Multiple sizes (sm, md, lg)
 * - Icon support
 * - Pulse animation for new badges
 * - Accessibility compliant
 *
 * Performance: Moti for simple pulse animations
 */

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
// import { MotiView } from 'moti'; // Temporarily disabled - uses Reanimated
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme } from '@theme/ThemeProvider';

export interface BadgeProps {
  /** Badge text */
  children: string | number;

  /** Badge variant */
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

  /** Badge size */
  size?: 'sm' | 'md' | 'lg';

  /** Icon (left) */
  icon?: keyof typeof Ionicons.glyphMap;

  /** Pulse animation (for new badges) */
  pulse?: boolean;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Test ID */
  testID?: string;
}

const BadgeComponent: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  pulse = false,
  accessibilityLabel,
  testID,
}) => {
  const theme = useStyledTheme();

  // Get colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary[500],
          text: '#FFFFFF',
        };
      case 'success':
        return {
          bg: theme.colors.success[500],
          text: '#FFFFFF',
        };
      case 'warning':
        return {
          bg: theme.colors.warning[500],
          text: '#FFFFFF',
        };
      case 'error':
        return {
          bg: theme.colors.error[500],
          text: '#FFFFFF',
        };
      case 'info':
        return {
          bg: theme.colors.accent[500],
          text: '#FFFFFF',
        };
      case 'neutral':
        return {
          bg: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
          text: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
        };
      default:
        return {
          bg: theme.colors.primary[500],
          text: '#FFFFFF',
        };
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 2,
          paddingHorizontal: 8,
          fontSize: theme.typography.fontSize.xs,
          iconSize: 12,
          borderRadius: theme.borderRadius.sm,
        };
      case 'lg':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: theme.typography.fontSize.md,
          iconSize: 20,
          borderRadius: theme.borderRadius.md,
        };
      default: // md
        return {
          paddingVertical: 4,
          paddingHorizontal: 12,
          fontSize: theme.typography.fontSize.sm,
          iconSize: 16,
          borderRadius: theme.borderRadius.sm,
        };
    }
  };

  const colors = getColors();
  const sizeStyles = getSizeStyles();

  const BadgeContent = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Badge: ${children}`}
      testID={testID}
    >
      {icon && (
        <Ionicons name={icon} size={sizeStyles.iconSize} color={colors.text} style={styles.icon} />
      )}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: sizeStyles.fontSize,
            fontWeight: theme.typography.fontWeight.semibold,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );

  // Wrap with pulse animation if needed
  // Temporarily disabled - Moti uses Reanimated
  // if (pulse) {
  //   return (
  //     <MotiView
  //       from={{ scale: 1 }}
  //       animate={{ scale: [1, 1.1, 1] }}
  //       transition={{
  //         type: 'timing',
  //         duration: 1000,
  //         loop: true,
  //       }}
  //     >
  //       {BadgeContent}
  //     </MotiView>
  //   );
  // }

  return BadgeContent;
};

// Memoize component to prevent unnecessary re-renders
export const Badge = React.memo(BadgeComponent);

// Add display name for debugging
Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    textAlign: 'center',
  },
});
