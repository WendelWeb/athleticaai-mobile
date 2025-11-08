/**
 * 🎨 ANIMATED CARD - Universal Component
 *
 * Features:
 * - Progressive entrance (fade + slide)
 * - Press animation (scale)
 * - Haptic feedback
 * - Supports gradient or glass styling
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { haptics } from '@/utils/haptics';
import { useStyledTheme } from '@theme/ThemeProvider';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  onPress?: () => void;
  gradient?: readonly [string, string, ...string[]];
  variant?: 'glass' | 'gradient' | 'solid';
  delay?: number;
  disabled?: boolean;
  style?: ViewStyle;
  blurIntensity?: number;
}

const AnimatedCardComponent: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  onPress,
  gradient,
  variant = 'glass',
  delay = 0,
  disabled = false,
  style,
  blurIntensity,
}) => {
  const theme = useStyledTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    const animDelay = delay || index * 100;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: animDelay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: animDelay,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, index]);

  const handlePressIn = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();

    haptics.light();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;

    haptics.medium();
    onPress();
  };

  const cardStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  };

  const renderContent = () => {
    if (variant === 'gradient' && gradient) {
      return (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientCard, style]}
        >
          {children}
        </LinearGradient>
      );
    }

    if (variant === 'glass') {
      return (
        <BlurView
          intensity={blurIntensity || (theme.isDark ? 40 : 80)}
          tint={theme.isDark ? 'dark' : 'light'}
          style={[styles.glassCard, style]}
        >
          {children}
        </BlurView>
      );
    }

    // Solid variant
    return (
      <Animated.View
        style={[
          styles.solidCard,
          {
            backgroundColor: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  if (onPress && !disabled) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={[styles.container, cardStyle]}>
          {renderContent()}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      {renderContent()}
    </Animated.View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const AnimatedCard = React.memo(AnimatedCardComponent);

// Add display name for debugging
AnimatedCard.displayName = 'AnimatedCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  solidCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
});
