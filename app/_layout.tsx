/**
 * Root Layout - Entry point for Expo Router
 *
 * Features:
 * - Clerk Auth Provider
 * - Theme Provider setup
 * - Toast notifications (global)
 * - Font loading
 * - Splash screen management
 * - Navigation configuration
 * - RevenueCat initialization
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ThemeProvider } from '@theme/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeRevenueCat, identifyUser, clearUser } from '@/services/revenuecat';
import * as SecureStore from 'expo-secure-store';
import { ToastProvider } from '@/components/Toast';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Clerk token cache (secure storage)
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const { isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    // Hide splash screen after app is ready
    const prepare = async () => {
      try {
        // Wait for Clerk to load
        if (!isAuthLoaded) return;

        // INNOVATION: Initialize RevenueCat with Clerk user ID (if available)
        if (userId) {
          await initializeRevenueCat(userId);
          identifyUser(userId);
        }

        // Load fonts, assets, etc. here
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [isAuthLoaded, userId]);

  // INNOVATION: Sync RevenueCat user when Clerk auth changes
  useEffect(() => {
    if (userId) {
      identifyUser(userId);
    } else {
      clearUser();
    }
  }, [userId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
