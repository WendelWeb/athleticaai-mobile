/**
 * Error Types - Type-safe error handling
 *
 * Usage:
 * ```typescript
 * import { getErrorMessage, AppError } from '@/types/errors';
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   logger.error('[Feature] Operation failed', error);
 * }
 * ```
 */

/**
 * Standard application error interface
 */
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Type guard for Error objects
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Type guard for objects with message property
 */
export const hasMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
};

/**
 * Extract error message from unknown error type
 * Safe to use with any caught error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }

  if (hasMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
};

/**
 * Create a standardized AppError
 */
export const createAppError = (
  message: string,
  code?: string,
  statusCode?: number,
  details?: unknown
): AppError => {
  return {
    message,
    code,
    statusCode,
    details,
  };
};

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Database
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_NOT_FOUND: 'DB_NOT_FOUND',

  // API
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  NO_INTERNET: 'NO_INTERNET',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
