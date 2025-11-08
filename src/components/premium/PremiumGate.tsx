/**
 * PremiumGate Component
 *
 * Gates premium features and shows upgrade prompts
 *
 * INNOVATION:
 * - Auto-tracking of premium gate hits
 * - Contextual upgrade prompts
 * - Fallback UI option
 * - Analytics-ready events
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { haptics } from '@/utils/haptics';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useStyledTheme } from '@theme/ThemeProvider';
import { PremiumBadge } from './PremiumBadge';

interface PremiumGateProps {
  // Premium check
  isPremium?: boolean; // Override hook (for testing)
  featureName: string; // Feature identifier (for analytics)

  // Content
  children: ReactNode;
  fallback?: ReactNode; // Show instead of children if not premium

  // Upgrade prompt
  showPrompt?: boolean; // Show upgrade prompt automatically
  promptTitle?: string;
  promptMessage?: string;

  // Styling
  style?: ViewStyle;
  blurContent?: boolean; // Blur children if not premium
}

const PremiumGateComponent: React.FC<PremiumGateProps> = ({
  isPremium: isPremiumOverride,
  featureName,
  children,
  fallback,
  showPrompt = true,
  promptTitle,
  promptMessage,
  style,
  blurContent = false,
}) => {
  const router = useRouter();
  const theme = useStyledTheme();
  const { isPremium: isPremiumFromHook, trackPremiumGateHit } = useRevenueCat();

  // Use override or hook value
  const isPremium = isPremiumOverride !== undefined ? isPremiumOverride : isPremiumFromHook;

  // If premium, render children directly
  if (isPremium) {
    return <>{children}</>;
  }

  // Track premium gate hit
  React.useEffect(() => {
    if (!isPremium) {
      trackPremiumGateHit(featureName);
    }
  }, [isPremium, featureName, trackPremiumGateHit]);

  // Handle upgrade button press
  const handleUpgrade = () => {
    haptics.medium();
    router.push('/paywall' as any);
  };

  // If fallback provided, show it
  if (fallback) {
    return <View style={style}>{fallback}</View>;
  }

  // Default: Show upgrade prompt overlay
  if (showPrompt) {
    return (
      <View style={[styles.container, style]}>
        {/* Blurred content (optional) */}
        {blurContent && (
          <View style={styles.blurredContent} pointerEvents="none">
            {children}
          </View>
        )}

        {/* Upgrade Prompt Overlay */}
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overlay}
        >
          <View style={styles.overlayContent}>
            <PremiumBadge variant="full" size="lg" />

            <Text style={styles.overlayTitle}>
              {promptTitle || 'Premium Feature 🌟'}
            </Text>

            <Text style={styles.overlayMessage}>
              {promptMessage || 'Upgrade to Premium to unlock this feature and transform your fitness journey!'}
            </Text>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.9}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // No prompt, no fallback: show nothing
  return null;
}

// Memoize component to prevent unnecessary re-renders
export const PremiumGate = React.memo(PremiumGateComponent);

// Add display name for debugging
PremiumGate.displayName = 'PremiumGate';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 200,
  },
  blurredContent: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayContent: {
    alignItems: 'center',
    gap: 16,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});
