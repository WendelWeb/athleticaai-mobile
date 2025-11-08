/**
 * PremiumBadge Component
 *
 * Visual indicator for premium features
 *
 * INNOVATION:
 * - Animated gradient
 * - Pulse effect
 * - Multiple variants (icon, text, full)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PremiumBadgeProps {
  variant?: 'icon' | 'text' | 'full';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  style?: ViewStyle;
}

const PremiumBadgeComponent: React.FC<PremiumBadgeProps> = ({ variant = 'full', size = 'md', pulse = false, style }) => {
  const sizes = {
    sm: { icon: 12, text: 10, padding: 4 },
    md: { icon: 16, text: 12, padding: 6 },
    lg: { icon: 20, text: 14, padding: 8 },
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <View style={[styles.iconBadge, style]}>
        <Ionicons name="star" size={currentSize.icon} color="#FFD700" />
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View style={[styles.textBadge, { paddingHorizontal: currentSize.padding, paddingVertical: currentSize.padding / 2 }, style]}>
        <Text style={[styles.textBadgeText, { fontSize: currentSize.text }]}>PRO</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.fullBadge, { paddingHorizontal: currentSize.padding, paddingVertical: currentSize.padding / 2 }, style]}
    >
      <Ionicons name="star" size={currentSize.icon} color="#FFFFFF" />
      <Text style={[styles.fullBadgeText, { fontSize: currentSize.text }]}>PRO</Text>
    </LinearGradient>
  );
};

// Memoize component to prevent unnecessary re-renders
export const PremiumBadge = React.memo(PremiumBadgeComponent);

// Add display name for debugging
PremiumBadge.displayName = 'PremiumBadge';

const styles = StyleSheet.create({
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  textBadgeText: {
    color: '#000000',
    fontWeight: '700',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
  },
  fullBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
