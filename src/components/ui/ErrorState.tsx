/**
 * 🚨 ERROR STATE COMPONENT
 *
 * Displays user-friendly error messages with retry functionality
 * Used when React Query errors occur in screens
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme } from '@theme/ThemeProvider';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ErrorStateProps {
  /**
   * Error object from React Query or custom error
   */
  error?: Error | unknown;

  /**
   * Custom error title (default: based on error type)
   */
  title?: string;

  /**
   * Custom error description (default: based on error type)
   */
  description?: string;

  /**
   * Retry callback (usually React Query refetch)
   */
  onRetry?: () => void;

  /**
   * Show retry button (default: true)
   */
  showRetry?: boolean;

  /**
   * Custom icon name (default: 'alert-circle')
   */
  icon?: keyof typeof Ionicons.glyphMap;

  /**
   * Compact mode (smaller, for cards/sections)
   */
  compact?: boolean;
}

/**
 * Get user-friendly error message from error object
 */
function getErrorMessage(error: unknown): { title: string; description: string } {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return {
      title: 'Connection Error',
      description: 'Please check your internet connection and try again.',
    };
  }

  // Auth errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      description: 'Please sign in again to continue.',
    };
  }

  // Database/data errors
  if (errorMessage.includes('database') || errorMessage.includes('data')) {
    return {
      title: 'Data Error',
      description: 'Unable to load data. Please try again.',
    };
  }

  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: 'Not Found',
      description: 'The requested item could not be found.',
    };
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return {
      title: 'Too Many Requests',
      description: 'Please wait a moment before trying again.',
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
  };
}

export function ErrorState({
  error,
  title: customTitle,
  description: customDescription,
  onRetry,
  showRetry = true,
  icon = 'alert-circle',
  compact = false,
}: ErrorStateProps) {
  const theme = useStyledTheme();
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Get error message
  const autoMessage = getErrorMessage(error);
  const title = customTitle || autoMessage.title;
  const description = customDescription || autoMessage.description;

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  if (compact) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.compactContainer,
          {
            backgroundColor: bgColors.surface,
            borderColor: theme.colors.error[200],
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={theme.colors.error[500]} />
        <View style={styles.compactText}>
          <Text style={[styles.compactTitle, { color: textColors.primary }]}>{title}</Text>
          <Text style={[styles.compactDescription, { color: textColors.secondary }]}>
            {description}
          </Text>
        </View>
        {showRetry && onRetry && (
          <TouchableOpacity onPress={handleRetry} style={styles.compactRetry}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.error[100],
          },
        ]}
      >
        <Ionicons name={icon} size={48} color={theme.colors.error[500]} />
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: textColors.primary,
            fontWeight: theme.typography.fontWeight.bold,
          },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      <Text
        style={[
          styles.description,
          {
            color: textColors.secondary,
          },
        ]}
      >
        {description}
      </Text>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRetry}
          style={[
            styles.retryButton,
            {
              backgroundColor: theme.colors.primary[500],
            },
          ]}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {/* Technical Details (dev mode) */}
      {__DEV__ && error instanceof Error && (
        <View
          style={[
            styles.devError,
            {
              backgroundColor: bgColors.surface,
              borderColor: theme.colors.error[200],
            },
          ]}
        >
          <Text style={[styles.devErrorLabel, { color: theme.colors.error[500] }]}>
            Dev Error:
          </Text>
          <Text style={[styles.devErrorText, { color: textColors.tertiary }]}>
            {error.message}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Full error state
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryIcon: {
    marginRight: 4,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  devError: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  devErrorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  devErrorText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },

  // Compact error state
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactRetry: {
    padding: 8,
  },
});
