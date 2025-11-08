/**
 * Theme Provider - Manages light/dark mode with system preference support
 *
 * Features:
 * - Auto-detect system theme
 * - Persist user preference
 * - Smooth theme transitions
 * - Type-safe theme access
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { tokens, ColorScheme } from './tokens';
// import { MMKV } from 'react-native-mmkv'; // Temporarily disabled - requires native rebuild

// MMKV storage for theme persistence
// const storage = new MMKV();
const THEME_STORAGE_KEY = 'app-theme';

// Theme type
export interface Theme {
  colors: typeof tokens.colors;
  spacing: typeof tokens.spacing;
  typography: typeof tokens.typography;
  borderRadius: typeof tokens.borderRadius;
  shadows: typeof tokens.shadows;
  motion: typeof tokens.motion;
  zIndex: typeof tokens.zIndex;
  isDark: boolean;
  scheme: ColorScheme;
}

// Create theme object based on color scheme
const createTheme = (scheme: ColorScheme): Theme => ({
  ...tokens,
  isDark: scheme === 'dark',
  scheme,
});

// Theme Context
interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme | 'auto') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme Provider Component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light';

  // Initialize theme from storage or system preference
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    // const stored = storage.getString(THEME_STORAGE_KEY);
    // if (stored === 'light' || stored === 'dark') {
    //   return stored;
    // }
    return systemColorScheme;
  });

  const [theme, setTheme] = useState<Theme>(() => createTheme(colorScheme));

  // Update theme when color scheme changes
  useEffect(() => {
    setTheme(createTheme(colorScheme));
  }, [colorScheme]);

  // Sync with system theme if auto mode
  useEffect(() => {
    // const stored = storage.getString(THEME_STORAGE_KEY);
    // if (stored === 'auto' || !stored) {
    setColorSchemeState(systemColorScheme);
    // }
  }, [systemColorScheme]);

  const setColorScheme = (scheme: ColorScheme | 'auto') => {
    // storage.set(THEME_STORAGE_KEY, scheme);

    if (scheme === 'auto') {
      setColorSchemeState(systemColorScheme);
    } else {
      setColorSchemeState(scheme);
    }
  };

  const toggleTheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const value: ThemeContextValue = {
    theme,
    colorScheme,
    setColorScheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Hook to get current theme object (for styled-components)
export const useStyledTheme = (): Theme => {
  const { theme } = useTheme();
  return theme;
};
