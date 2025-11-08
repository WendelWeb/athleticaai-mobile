/**
 * Toast Provider - Global toast context for entire app
 *
 * Usage:
 * 1. Wrap app in <ToastProvider>
 * 2. Use useToast() hook anywhere to show toasts
 *
 * Example:
 * const { showSuccess, showError } = useToast();
 * showSuccess('Workout saved!');
 * showError('Failed to load data', 'Please check your connection');
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, ToastType, ToastProps } from './Toast';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, description?: string, duration?: number) => void;
  showSuccess: (message: string, description?: string, duration?: number) => void;
  showError: (message: string, description?: string, duration?: number) => void;
  showInfo: (message: string, description?: string, duration?: number) => void;
  showWarning: (message: string, description?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Generate unique ID
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show toast
  const showToast = useCallback(
    (type: ToastType, message: string, description?: string, duration?: number) => {
      const id = generateId();
      const newToast: ToastData = {
        id,
        type,
        message,
        description,
        duration: duration || 3000,
      };

      setToasts((prev) => {
        // Limit to 3 toasts max
        if (prev.length >= 3) {
          return [...prev.slice(-2), newToast];
        }
        return [...prev, newToast];
      });
    },
    []
  );

  // Convenience methods
  const showSuccess = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('success', message, description, duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('error', message, description, duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('info', message, description, duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('warning', message, description, duration);
    },
    [showToast]
  );

  // Dismiss specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismissToast,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Render toasts - stacked vertically */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <View
            key={toast.id}
            style={[
              styles.toastWrapper,
              { top: 60 + index * 90 }, // Stack toasts vertically with 90px gap
            ]}
            pointerEvents="box-none"
          >
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              description={toast.description}
              duration={toast.duration}
              onDismiss={dismissToast}
            />
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
