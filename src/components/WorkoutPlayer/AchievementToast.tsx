/**
 * 🏆 ACHIEVEMENT TOAST - Real-time Achievement Notifications
 *
 * INNOVATION Apple Fitness+ style:
 * - Slide-in animation from top
 * - Auto-dismiss après 3s
 * - Haptic feedback
 * - Rarity-based colors (Common → Legendary)
 * - Confetti animation pour legendary
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { Achievement } from '@/services/achievements/AchievementEngine';
import { AchievementEngine } from '@/services/achievements/AchievementEngine';

const { width } = Dimensions.get('window');

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoDismissDelay?: number; // milliseconds (default: 3000)
}

export function AchievementToast({
  achievement,
  onDismiss,
  autoDismissDelay = 3000,
}: AchievementToastProps) {
  // Animations
  const translateY = useSharedValue(-200);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // Get rarity color
  const rarityColor = AchievementEngine.getRarityColor(achievement.rarity);

  // Haptic feedback based on rarity
  useEffect(() => {
    // Entry animation
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 100 })
    );
    opacity.value = withTiming(1, { duration: 300 });

    // Haptic feedback
    switch (achievement.rarity) {
      case 'legendary':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'epic':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'rare':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Auto-dismiss
    const timer = setTimeout(() => {
      // Exit animation
      translateY.value = withTiming(-200, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, autoDismissDelay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Gradient colors based on rarity
  const getGradientColors = (): [string, string] => {
    switch (achievement.rarity) {
      case 'legendary':
        return ['#F59E0B', '#D97706']; // Gold
      case 'epic':
        return ['#A855F7', '#9333EA']; // Purple
      case 'rare':
        return ['#3B82F6', '#2563EB']; // Blue
      default:
        return ['#6B7280', '#4B5563']; // Gray
    }
  };

  const [gradientStart, gradientEnd] = getGradientColors();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{achievement.title}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '40' }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.description}>{achievement.description}</Text>
          <Text style={styles.points}>+{achievement.points} points</Text>
        </View>

        {/* Shine effect for legendary */}
        {achievement.rarity === 'legendary' && (
          <View style={styles.shine} />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  points: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
});
