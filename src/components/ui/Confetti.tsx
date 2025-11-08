/**
 * 🎉 CONFETTI EFFECT - Achievement Celebrations
 *
 * Features:
 * - Animated confetti particles
 * - Customizable colors
 * - Performance optimized
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

const ConfettiPiece: React.FC<{
  color: string;
  delay: number;
  onComplete?: () => void;
}> = ({ color, delay, onComplete }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomX = Math.random() * SCREEN_WIDTH;
    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomRotation = Math.random() * 360;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 100,
        duration: 3000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: randomX + randomXOffset,
        duration: 3000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: randomRotation,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(delay + 2000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
};

export const Confetti: React.FC<ConfettiProps> = ({
  count = 50,
  duration = 3000,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
  onComplete,
}) => {
  const pieces = Array.from({ length: count }).map((_, index) => ({
    id: index,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 500,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          color={piece.color}
          delay={piece.delay}
          onComplete={piece.id === count - 1 ? onComplete : undefined}
        />
      ))}
    </View>
  );
};

// Hook for easy confetti usage
export const useConfetti = () => {
  const [showConfetti, setShowConfetti] = React.useState(false);

  const celebrate = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  return { showConfetti, celebrate };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
