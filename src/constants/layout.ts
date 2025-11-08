/**
 * Layout Constants - Centralized layout values
 *
 * Usage:
 * ```typescript
 * import { LAYOUT, TIMING, ELEVATION } from '@/constants/layout';
 *
 * <View style={{ height: LAYOUT.CARD_IMAGE_HEIGHT }}>
 * ```
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Layout dimensions
 */
export const LAYOUT = {
  // Screen dimensions
  SCREEN_WIDTH,
  SCREEN_HEIGHT,

  // Card dimensions
  CARD_IMAGE_HEIGHT: 200,
  CARD_MIN_HEIGHT: 120,
  CARD_BORDER_RADIUS: 16,

  // Header
  HEADER_HEIGHT: 60,
  HEADER_HEIGHT_LARGE: 100,

  // Tab bar
  TAB_BAR_HEIGHT: Platform.select({ ios: 83, android: 60, default: 60 }),

  // Avatar
  AVATAR_SIZE_SMALL: 32,
  AVATAR_SIZE_MEDIUM: 48,
  AVATAR_SIZE_LARGE: 80,
  AVATAR_SIZE_XLARGE: 120,

  // Buttons
  BUTTON_HEIGHT: 56,
  BUTTON_HEIGHT_SMALL: 40,
  BUTTON_MIN_WIDTH: 120,
  BUTTON_BORDER_RADIUS: 12,

  // Input
  INPUT_HEIGHT: 56,
  INPUT_BORDER_RADIUS: 12,

  // Badge
  BADGE_HEIGHT: 24,
  BADGE_HEIGHT_SMALL: 20,
  BADGE_BORDER_RADIUS: 12,

  // Spacing (8pt grid system)
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  SPACING_XXL: 48,
  SPACING_XXXL: 64,

  // Border radius
  BORDER_RADIUS_SM: 8,
  BORDER_RADIUS_MD: 12,
  BORDER_RADIUS_LG: 16,
  BORDER_RADIUS_XL: 24,
  BORDER_RADIUS_FULL: 999,

  // Icon sizes
  ICON_SIZE_XS: 16,
  ICON_SIZE_SM: 20,
  ICON_SIZE_MD: 24,
  ICON_SIZE_LG: 32,
  ICON_SIZE_XL: 48,

  // Touch targets (minimum 44x44 for accessibility)
  TOUCH_TARGET_MIN: 44,

  // Content max width (for tablets)
  CONTENT_MAX_WIDTH: 700,

  // Container padding
  CONTAINER_PADDING: 16,
  CONTAINER_PADDING_HORIZONTAL: 20,
  CONTAINER_PADDING_VERTICAL: 16,
} as const;

/**
 * Animation timing (in milliseconds)
 */
export const TIMING = {
  // Durations
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,

  // Delays
  STAGGER_DELAY: 100,
  STAGGER_DELAY_SHORT: 50,

  // Debounce/Throttle
  DEBOUNCE: 300,
  THROTTLE: 100,
  SCROLL_THROTTLE: 16, // 60fps

  // Long press
  LONG_PRESS: 500,
} as const;

/**
 * Elevation/Shadow depths
 */
export const ELEVATION = {
  NONE: 0,
  XS: 1,
  SM: 2,
  MD: 4,
  LG: 8,
  XL: 16,
  XXL: 24,
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BEHIND: -1,
  BASE: 0,
  RAISED: 1,
  DROPDOWN: 10,
  STICKY: 100,
  OVERLAY: 1000,
  MODAL: 1100,
  POPOVER: 1200,
  TOAST: 1300,
  TOOLTIP: 1400,
} as const;

/**
 * Opacity levels
 */
export const OPACITY = {
  TRANSPARENT: 0,
  SUBTLE: 0.05,
  LIGHT: 0.1,
  MEDIUM: 0.3,
  HEAVY: 0.5,
  STRONG: 0.7,
  ALMOST_OPAQUE: 0.9,
  OPAQUE: 1,
} as const;

/**
 * Common aspect ratios
 */
export const ASPECT_RATIO = {
  SQUARE: 1,
  PORTRAIT: 3 / 4,
  LANDSCAPE: 4 / 3,
  WIDE: 16 / 9,
  ULTRA_WIDE: 21 / 9,
} as const;

/**
 * Workout player specific
 */
export const WORKOUT_PLAYER = {
  TIMER_SIZE: 200,
  TIMER_STROKE_WIDTH: 8,
  EXERCISE_IMAGE_HEIGHT: 300,
  CONTROLS_HEIGHT: 80,
  PROGRESS_BAR_HEIGHT: 4,
} as const;

/**
 * Animation spring configs
 */
export const SPRING_CONFIGS = {
  default: {
    tension: 65,
    friction: 8,
  },
  gentle: {
    tension: 40,
    friction: 10,
  },
  wobbly: {
    tension: 180,
    friction: 12,
  },
  stiff: {
    tension: 210,
    friction: 20,
  },
} as const;

/**
 * Helper to check if device is small screen
 */
export const isSmallScreen = SCREEN_WIDTH < 375;

/**
 * Helper to check if device is tablet
 */
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Responsive font scaling
 */
export const scaleFontSize = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isTablet) return size * 1.1;
  return size;
};

/**
 * Responsive spacing scaling
 */
export const scaleSpacing = (spacing: number): number => {
  if (isSmallScreen) return spacing * 0.8;
  if (isTablet) return spacing * 1.2;
  return spacing;
};
