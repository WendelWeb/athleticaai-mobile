/**
 * Avatar Component - User profile pictures with AI-generated fallback
 * 
 * Features:
 * - Image with fallback to initials
 * - Multiple sizes (xs, sm, md, lg, xl)
 * - Status indicator (online, offline, busy)
 * - Border/ring support
 * - Pressable for profile navigation
 * - AI prompt stored in accessibilityLabel
 * 
 * Performance: Expo Image for optimized loading
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useStyledTheme } from '@theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AvatarProps {
  /** Image URL */
  source?: string;
  
  /** User name (for initials fallback) */
  name?: string;
  
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Status indicator */
  status?: 'online' | 'offline' | 'busy' | 'none';
  
  /** Show border/ring */
  showBorder?: boolean;
  
  /** Border color */
  borderColor?: string;
  
  /** Press handler */
  onPress?: () => void;
  
  /** AI prompt for image generation (stored in accessibility) */
  aiPrompt?: string;
  
  /** Test ID */
  testID?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'User',
  size = 'md',
  status = 'none',
  showBorder = false,
  borderColor,
  onPress,
  aiPrompt,
  testID,
}) => {
  const theme = useStyledTheme();
  const scale = useSharedValue(1);

  // Get size dimensions
  const getSizeValue = () => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 48;
      case 'lg':
        return 64;
      case 'xl':
        return 96;
      default:
        return 48;
    }
  };

  const sizeValue = getSizeValue();
  const fontSize = sizeValue * 0.4;

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return theme.colors.success[500];
      case 'offline':
        return theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary;
      case 'busy':
        return theme.colors.error[500];
      default:
        return 'transparent';
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Press handlers
  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const avatarContent = (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          borderWidth: showBorder ? 2 : 0,
          borderColor: borderColor || theme.colors.primary[500],
        },
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
          contentFit="cover"
          transition={200}
          accessible
          accessibilityLabel={aiPrompt || `Avatar of ${name}`}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
              backgroundColor: theme.colors.primary[500],
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                color: '#FFFFFF',
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {/* Status Indicator */}
      {status !== 'none' && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: sizeValue * 0.25,
              height: sizeValue * 0.25,
              borderRadius: (sizeValue * 0.25) / 2,
              backgroundColor: getStatusColor(),
              borderWidth: 2,
              borderColor: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`View profile of ${name}`}
        testID={testID}
        style={animatedStyle}
      >
        {avatarContent}
      </AnimatedPressable>
    );
  }

  return <View testID={testID}>{avatarContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

