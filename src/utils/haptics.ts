/**
 * Haptics Helper - Standardized haptic feedback across the app
 *
 * Usage:
 * ```typescript
 * import { haptics } from '@/utils/haptics';
 *
 * // On button press
 * haptics.light();
 *
 * // On success action
 * haptics.success();
 *
 * // On error
 * haptics.error();
 * ```
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticsHelper {
  private isIOS = Platform.OS === 'ios';

  /**
   * Light impact - Use for subtle interactions
   * Examples: Tab switch, card press, button hover
   */
  light(): void {
    if (this.isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }

  /**
   * Medium impact - Use for standard interactions
   * Examples: Button press, toggle switch, confirm action
   */
  medium(): void {
    if (this.isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }

  /**
   * Heavy impact - Use for significant interactions
   * Examples: Delete action, important confirmation, major state change
   */
  heavy(): void {
    if (this.isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }

  /**
   * Rigid impact - Use for precise, rigid interactions
   * Examples: Snapping to position, picker selection
   */
  rigid(): void {
    if (this.isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }

  /**
   * Soft impact - Use for soft, gentle interactions
   * Examples: Subtle transitions, background actions
   */
  soft(): void {
    if (this.isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }

  /**
   * Success notification - Use for successful operations
   * Examples: Workout completed, profile saved, payment successful
   */
  success(): void {
    if (this.isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {
          // Silently fail if haptics not available
        }
      );
    }
  }

  /**
   * Warning notification - Use for warnings
   * Examples: Low battery, approaching limit, confirmation needed
   */
  warning(): void {
    if (this.isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {
          // Silently fail if haptics not available
        }
      );
    }
  }

  /**
   * Error notification - Use for errors
   * Examples: Failed to save, network error, validation failed
   */
  error(): void {
    if (this.isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {
          // Silently fail if haptics not available
        }
      );
    }
  }

  /**
   * Selection changed - Use for picker/selector interactions
   * Examples: Scrolling through picker, selecting from list
   */
  selection(): void {
    if (this.isIOS) {
      Haptics.selectionAsync().catch(() => {
        // Silently fail if haptics not available
      });
    }
  }
}

// Export singleton instance
export const haptics = new HapticsHelper();

/**
 * Haptic patterns for common interactions
 */
export const HapticPatterns = {
  // Button interactions
  buttonPress: () => haptics.light(),
  buttonPressImportant: () => haptics.medium(),
  buttonPressDestruct: () => haptics.heavy(),

  // Navigation
  tabSwitch: () => haptics.light(),
  screenTransition: () => haptics.soft(),
  modalOpen: () => haptics.medium(),
  modalClose: () => haptics.light(),

  // Feedback
  actionSuccess: () => haptics.success(),
  actionWarning: () => haptics.warning(),
  actionError: () => haptics.error(),

  // Interactions
  toggleOn: () => haptics.medium(),
  toggleOff: () => haptics.light(),
  swipe: () => haptics.selection(),
  drag: () => haptics.light(),
  drop: () => haptics.medium(),

  // Workout specific
  exerciseComplete: () => haptics.success(),
  workoutComplete: () => {
    // Double success haptic for emphasis
    haptics.success();
    setTimeout(() => haptics.success(), 100);
  },
  restTimerDone: () => haptics.warning(),
  personalRecord: () => {
    // Triple heavy haptic for celebration
    haptics.heavy();
    setTimeout(() => haptics.heavy(), 100);
    setTimeout(() => haptics.heavy(), 200);
  },
} as const;
