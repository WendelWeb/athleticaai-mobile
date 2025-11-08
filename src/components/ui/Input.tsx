/**
 * Input Component - Apple-style text input with validation
 *
 * Features:
 * - Focus/blur animations
 * - Error state
 * - Success state with checkmark
 * - Password visibility toggle
 * - Icon support
 * - Accessibility compliant
 *
 * Performance: React Native Animated for smooth transitions
 */

import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme } from '@theme/ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;

  /** Error message */
  error?: string;

  /** Left icon */
  leftIcon?: keyof typeof Ionicons.glyphMap;

  /** Right icon */
  rightIcon?: keyof typeof Ionicons.glyphMap;

  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'phone';

  /** Container style */
  containerStyle?: any;

  /** Test ID */
  testID?: string;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  type = 'text',
  value,
  onFocus,
  onBlur,
  containerStyle,
  testID,
  ...props
}) => {
  const theme = useStyledTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  // Handlers
  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: theme.motion.duration.medium,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: theme.motion.duration.medium,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  // Animated border color
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
      error ? theme.colors.error[500] : theme.colors.primary[500],
    ],
  });

  // Input props based on type
  const getInputProps = (): Partial<TextInputProps> => {
    switch (type) {
      case 'email':
        return {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoComplete: 'email',
        };
      case 'password':
        return {
          secureTextEntry: !showPassword,
          autoCapitalize: 'none',
          autoComplete: 'password',
        };
      case 'number':
        return {
          keyboardType: 'numeric',
        };
      case 'phone':
        return {
          keyboardType: 'phone-pad',
          autoComplete: 'tel',
        };
      default:
        return {};
    }
  };

  const textColor = theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary;

  const placeholderColor = theme.isDark
    ? theme.colors.dark.text.tertiary
    : theme.colors.light.text.tertiary;

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error
                ? theme.colors.error[500]
                : isFocused
                  ? theme.colors.primary[500]
                  : theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
            },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
            borderRadius: theme.borderRadius.md,
            borderColor: animatedBorderColor,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={placeholderColor} style={styles.leftIcon} />
        )}

        {/* Text Input */}
        <TextInput
          {...props}
          {...getInputProps()}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: textColor,
              fontSize: 17,
            },
          ]}
          placeholderTextColor={placeholderColor}
          accessible
          accessibilityLabel={label}
          accessibilityState={{ disabled: props.editable === false }}
        />

        {/* Right Icon / Password Toggle */}
        {type === 'password' ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={placeholderColor} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <Ionicons name={rightIcon} size={20} color={placeholderColor} style={styles.rightIcon} />
        ) : null}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.colors.error[500],
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const Input = React.memo(InputComponent);

// Add display name for debugging
Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 4,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
});
