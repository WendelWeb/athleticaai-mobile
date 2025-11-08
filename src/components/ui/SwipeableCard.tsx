/**
 * 👆 SWIPEABLE CARD - Gesture Interactions
 *
 * Features:
 * - Swipe left/right gestures
 * - Haptic feedback
 * - Customizable actions
 * - Smooth animations
 */

import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { haptics } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  leftColor?: string;
  rightColor?: string;
  disabled?: boolean;
}

const SwipeableCardComponent: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftIcon = 'trash',
  rightIcon = 'checkmark',
  leftColor = '#FF3B30',
  rightColor = '#34C759',
  disabled = false,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return !disabled && Math.abs(gesture.dx) > 5;
      },
      onPanResponderGrant: () => {
        haptics.light();
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (gesture.dx > SWIPE_THRESHOLD && onSwipeRight) {
          // Swipe right
          haptics.success();
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD && onSwipeLeft) {
          // Swipe left
          haptics.warning();
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          // Return to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const opacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const leftActionOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left Action (Swipe Left) */}
      {onSwipeLeft && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.leftAction,
            { backgroundColor: leftColor, opacity: leftActionOpacity },
          ]}
        >
          <Ionicons name={leftIcon} size={28} color="#FFFFFF" />
        </Animated.View>
      )}

      {/* Right Action (Swipe Right) */}
      {onSwipeRight && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.rightAction,
            { backgroundColor: rightColor, opacity: rightActionOpacity },
          ]}
        >
          <Ionicons name={rightIcon} size={28} color="#FFFFFF" />
        </Animated.View>
      )}

      {/* Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            opacity,
            transform: [
              { translateX: pan.x },
              { scale },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const SwipeableCard = React.memo(SwipeableCardComponent);

// Add display name for debugging
SwipeableCard.displayName = 'SwipeableCard';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'transparent',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
});
