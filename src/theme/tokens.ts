/**
 * Design Tokens - Apple-Style Design System
 * 
 * Philosophy: Minimal, focused on content, generous negative space
 * Target: 60/120 FPS animations, < 120ms gesture response
 */

export const tokens = {
  // ==================== COLORS ====================
  colors: {
    // Primary - Cool Blue (iOS style)
    primary: {
      50: '#E6F2FF',
      100: '#CCE5FF',
      200: '#99CCFF',
      300: '#66B2FF',
      400: '#3399FF',
      500: '#0A84FF', // Main primary
      600: '#0066CC',
      700: '#004D99',
      800: '#003366',
      900: '#001A33',
    },
    
    // Secondary - Warm Accent
    secondary: {
      50: '#FFF5E6',
      100: '#FFEBCC',
      200: '#FFD699',
      300: '#FFC266',
      400: '#FFAD33',
      500: '#FF9500', // Main secondary
      600: '#CC7700',
      700: '#995900',
      800: '#663C00',
      900: '#331E00',
    },
    
    // Accent - Purple (for premium features)
    accent: {
      50: '#F3E5FF',
      100: '#E6CCFF',
      200: '#CC99FF',
      300: '#B366FF',
      400: '#9933FF',
      500: '#8B5CF6', // Main accent
      600: '#6F4AC4',
      700: '#533793',
      800: '#382562',
      900: '#1C1231',
    },
    
    // Success - Green
    success: {
      50: '#E6F9F0',
      100: '#CCF3E1',
      200: '#99E7C3',
      300: '#66DBA5',
      400: '#33CF87',
      500: '#10B981', // Main success
      600: '#0D9467',
      700: '#0A6F4D',
      800: '#064A33',
      900: '#03251A',
    },
    
    // Error - Red
    error: {
      50: '#FFE6E6',
      100: '#FFCCCC',
      200: '#FF9999',
      300: '#FF6666',
      400: '#FF3333',
      500: '#FF3B30', // Main error
      600: '#CC2F26',
      700: '#99231D',
      800: '#661813',
      900: '#330C0A',
    },
    
    // Warning - Orange
    warning: {
      50: '#FFF5E6',
      100: '#FFEBCC',
      200: '#FFD699',
      300: '#FFC266',
      400: '#FFAD33',
      500: '#FF9500',
      600: '#CC7700',
      700: '#995900',
      800: '#663C00',
      900: '#331E00',
    },
    
    // Neutrals - Light Mode
    light: {
      bg: '#FFFFFF',
      surface: '#F9F9FB',
      card: '#FFFFFF',
      border: '#E5E5EA',
      divider: '#D1D1D6',
      text: {
        primary: '#000000',
        secondary: '#3C3C43',
        tertiary: '#8E8E93',
        disabled: '#C7C7CC',
      },
    },
    
    // Neutrals - Dark Mode
    dark: {
      bg: '#000000',
      surface: '#1C1C1E',
      card: '#2C2C2E',
      border: '#38383A',
      divider: '#48484A',
      text: {
        primary: '#FFFFFF',
        secondary: '#EBEBF5',
        tertiary: '#8E8E93',
        disabled: '#48484A',
      },
    },
  },
  
  // ==================== SPACING (8pt grid) ====================
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // ==================== TYPOGRAPHY ====================
  typography: {
    // Font Families (SF Pro style)
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    // Font Sizes
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 22,
      xxl: 28,
      xxxl: 34,
      display: 40,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // ==================== BORDER RADIUS ====================
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
  },
  
  // ==================== SHADOWS ====================
  shadows: {
    // iOS-style shadows
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  // ==================== MOTION SYSTEM ====================
  motion: {
    // Durations (ms)
    duration: {
      instant: 0,
      fast: 120,
      medium: 300,
      slow: 420,
      slower: 600,
    },
    
    // Easing curves
    easing: {
      // Spring physics (for gestures)
      spring: {
        damping: 15,
        mass: 1,
        stiffness: 150,
      },
      
      // Cubic bezier (for fades)
      ease: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  },
  
  // ==================== Z-INDEX ====================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
} as const;

export type Tokens = typeof tokens;
export type ColorScheme = 'light' | 'dark';

