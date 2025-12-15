/**
 * Jest Setup File
 *
 * Runs before each test suite
 * Sets up global mocks and configurations
 */

// Set timezone to UTC for consistent date tests
process.env.TZ = 'UTC';

// Mock React Native modules that don't work in Node
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Clerk auth
jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      fullName: 'Test User',
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.error in tests unless explicitly needed
  error: jest.fn(),
  // Suppress console.warn in tests
  warn: jest.fn(),
};

// Set __DEV__ for React Native
global.__DEV__ = true;
