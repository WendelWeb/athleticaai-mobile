/**
 * Streak Celebration Modal - Confetti animation for streak milestones
 *
 * Milestones from ULTIMATE_FEATURES.md:
 * - 7 Days: First week completion
 * - 30 Days: One month streak (certificat + badge + confetti)
 * - 100 Days: Badge + T-shirt offer
 * - 365 Days: Trophy + Hall of Fame
 *
 * Features:
 * - Lottie confetti animation
 * - Milestone-specific messages
 * - Share functionality
 * - Haptic feedback
 * - Auto-dismiss or manual close
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button } from '@components/ui/Button';

const { width, height } = Dimensions.get('window');

interface StreakCelebrationProps {
  /** Current streak count */
  streak: number;

  /** Visibility state */
  visible: boolean;

  /** On close callback */
  onClose: () => void;

  /** On share callback */
  onShare?: () => void;
}

// Milestone configurations
const MILESTONES = {
  7: {
    title: '7 Day Warrior!',
    message: 'You crushed your first week! Keep the momentum going! 💪',
    emoji: '🔥',
    color: ['#3B82F6', '#2563EB'] as const,
    badge: 'First Week',
  },
  30: {
    title: '30 Days Strong!',
    message: 'One month of consistency! You\'re building unstoppable habits! 🎉',
    emoji: '🏆',
    color: ['#8B5CF6', '#7C3AED'] as const,
    badge: 'Monthly Warrior',
  },
  100: {
    title: '100 Days Legend!',
    message: 'Over 3 months of dedication! You\'re in the top 5%! 🌟',
    emoji: '💎',
    color: ['#F59E0B', '#D97706'] as const,
    badge: 'Centurion',
  },
  365: {
    title: '365 Days Hall of Fame!',
    message: 'A full year! You\'re a true warrior! Welcome to the elite! 👑',
    emoji: '⭐',
    color: ['#10B981', '#059669'] as const,
    badge: 'Annual Champion',
  },
};

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  streak,
  visible,
  onClose,
  onShare,
}) => {
  const theme = useStyledTheme();
  const confettiRef = useRef<LottieView>(null);

  // Get milestone config or default
  const milestoneConfig = MILESTONES[streak as keyof typeof MILESTONES] || {
    title: `${streak} Day Streak!`,
    message: `${streak} days of pure dedication! Keep crushing it!`,
    emoji: '🔥',
    color: ['#3B82F6', '#2563EB'] as const,
    badge: 'Warrior',
  };

  useEffect(() => {
    if (visible) {
      // Play confetti animation
      confettiRef.current?.play();

      // Haptic celebration
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 300);
      }
    }
  }, [visible]);

  const handleShare = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await Share.share({
        message: `🔥 ${streak} Day Streak on AthleticaAI! ${milestoneConfig.message}\n\nJoin me in the fitness revolution!`,
        title: `${streak} Day Streak Achievement`,
      });

      onShare?.();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Animation (full screen, non-blocking) */}
        <LottieView
          ref={confettiRef}
          source={{ uri: 'https://lottie.host/e0be2b66-97f7-47cd-a8df-cc28e32c4dd9/kPKUzQN8q7.json' }}
          style={styles.confetti}
          loop={false}
          autoPlay={false}
        />

        {/* Content Card */}
        <View style={styles.content}>
          <LinearGradient
            colors={milestoneConfig.color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Close Button */}
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Emoji */}
            <Text style={styles.emoji}>{milestoneConfig.emoji}</Text>

            {/* Streak Count */}
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={32} color="#FFFFFF" />
              <Text style={styles.streakCount}>{streak}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{milestoneConfig.title}</Text>

            {/* Message */}
            <Text style={styles.message}>{milestoneConfig.message}</Text>

            {/* Badge Name */}
            <View style={styles.badgeContainer}>
              <Ionicons name="ribbon" size={20} color="#FFFFFF" />
              <Text style={styles.badgeText}>{milestoneConfig.badge}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                onPress={handleShare}
                icon={<Ionicons name="share-social" size={20} color={theme.colors.primary[500]} />}
                style={styles.shareButton}
              >
                Share
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleClose}
                style={styles.continueButton}
              >
                Continue
              </Button>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
    pointerEvents: 'none',
  },
  content: {
    width: width * 0.9,
    maxWidth: 400,
    zIndex: 2,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
