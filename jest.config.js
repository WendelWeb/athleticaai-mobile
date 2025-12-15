/**
 * Jest Configuration for AthleticaAI Mobile
 *
 * Configured for React Native + TypeScript + Expo
 */

module.exports = {
  preset: 'jest-expo',

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Transform files (TypeScript, etc.)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Ignore node_modules except specific packages that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-community|react-native-reanimated|react-native-gesture-handler)/)',
  ],

  // Module name mapping (for @ imports)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/db$': '<rootDir>/src/db/index.ts',
    '^@/utils$': '<rootDir>/src/utils/index.ts',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],

  coverageThresholds: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },

  // Test environment
  testEnvironment: 'node',

  // Globals
  globals: {
    __DEV__: true,
  },

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
};
