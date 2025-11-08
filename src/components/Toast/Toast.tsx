/**
 * Toast Notification Component
 *
 * Global toast system for user feedback (errors, success, info, warning)
 *
 * Features:
 * - Slide-in animation from top
 * - Auto-dismiss (configurable duration)
 * - Haptic feedback
 * - Type-based styling (success, error, info, warning)
 * - Swipe to dismiss
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // milliseconds (default: 3000)
  onDismiss: (id: string) => void;
}

export function Toast({
  id,
  type,
  message,
  description,
  duration = 3000,
  onDismiss,
}: ToastProps) {
  // Animations
  const translateY = useSharedValue(-200);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Get toast config based on type
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          gradientColors: ['#10B981', '#059669'] as [string, string],
          haptic: Haptics.NotificationFeedbackType.Success,
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          gradientColors: ['#EF4444', '#DC2626'] as [string, string],
          haptic: Haptics.NotificationFeedbackType.Error,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          gradientColors: ['#F59E0B', '#D97706'] as [string, string],
          haptic: Haptics.NotificationFeedbackType.Warning,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          gradientColors: ['#3B82F6', '#2563EB'] as [string, string],
          haptic: null,
        };
    }
  };

  const config = getToastConfig();

  // Entry animation + haptic
  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });

    // Haptic feedback
    if (Platform.OS === 'ios' && config.haptic) {
      Haptics.notificationAsync(config.haptic);
    }

    // Auto-dismiss
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  // Dismiss animation
  const dismissToast = () => {
    translateY.value = withTiming(-200, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)(id);
    });
  };

  // Swipe to dismiss gesture (using new Gesture API)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      // If swiped more than 100px, dismiss
      if (Math.abs(event.translationX) > 100) {
        translateX.value = withTiming(event.translationX > 0 ? 500 : -500, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onDismiss)(id);
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={dismissToast}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={config.icon} size={28} color="#FFFFFF" />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.message}>{message}</Text>
              {description && (
                <Text style={styles.description}>{description}</Text>
              )}
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={dismissToast}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50, // Below status bar
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
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
