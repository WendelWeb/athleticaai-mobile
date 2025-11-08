/**
 * Global Error Handler Utility
 *
 * Provides consistent error handling across the app:
 * - User-friendly toast notifications
 * - Error logging
 * - Type-safe error messages
 * - Retry logic for network errors
 */

// Error types and messages
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

interface ErrorConfig {
  type: ErrorType;
  message: string;
  description?: string;
  shouldShowToast?: boolean;
  shouldLog?: boolean;
  shouldRetry?: boolean;
  retryDelay?: number;
}

// Default user-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, { message: string; description: string }> = {
  [ErrorType.NETWORK]: {
    message: 'Connection Error',
    description: 'Please check your internet connection and try again.',
  },
  [ErrorType.DATABASE]: {
    message: 'Data Error',
    description: 'Unable to load data. Please try again.',
  },
  [ErrorType.AUTH]: {
    message: 'Authentication Error',
    description: 'Please sign in again to continue.',
  },
  [ErrorType.VALIDATION]: {
    message: 'Invalid Input',
    description: 'Please check your information and try again.',
  },
  [ErrorType.NOT_FOUND]: {
    message: 'Not Found',
    description: 'The requested item could not be found.',
  },
  [ErrorType.PERMISSION]: {
    message: 'Permission Denied',
    description: 'You don\'t have permission to perform this action.',
  },
  [ErrorType.RATE_LIMIT]: {
    message: 'Too Many Requests',
    description: 'Please wait a moment before trying again.',
  },
  [ErrorType.UNKNOWN]: {
    message: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Classify error based on error object/message
 */
export function classifyError(error: any): ErrorType {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('network') ||
    errorCode === 'econnrefused'
  ) {
    return ErrorType.NETWORK;
  }

  // Auth errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorCode.includes('auth')
  ) {
    return ErrorType.AUTH;
  }

  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('sql') ||
    errorMessage.includes('query') ||
    errorCode.includes('db')
  ) {
    return ErrorType.DATABASE;
  }

  // Not found errors
  if (
    errorMessage.includes('not found') ||
    errorCode === '404'
  ) {
    return ErrorType.NOT_FOUND;
  }

  // Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('access denied') ||
    errorCode === '403'
  ) {
    return ErrorType.PERMISSION;
  }

  // Rate limit errors
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorCode === '429'
  ) {
    return ErrorType.RATE_LIMIT;
  }

  // Validation errors
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation') ||
    errorCode === '400'
  ) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(
  error: any,
  customMessage?: string,
  customDescription?: string
): { message: string; description: string } {
  const errorType = classifyError(error);
  const defaultError = ERROR_MESSAGES[errorType];

  return {
    message: customMessage || defaultError.message,
    description: customDescription || defaultError.description,
  };
}

/**
 * Handle error with logging and optional toast
 * This is the main function to use in catch blocks
 *
 * Usage:
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, {
 *     message: 'Failed to load workouts',
 *     showToast: true,
 *     context: 'WorkoutsService.getWorkouts',
 *   });
 * }
 */
export function handleError(
  error: any,
  options?: {
    message?: string;
    description?: string;
    showToast?: boolean;
    context?: string;
    silent?: boolean;
  }
): void {
  const {
    message: customMessage,
    description: customDescription,
    showToast = false,
    context = 'Unknown',
    silent = false,
  } = options || {};

  // Log error (always)
  if (!silent) {
    const errorType = classifyError(error);
    console.error(`[${context}] ${errorType} Error:`, error);
  }

  // Show toast if requested
  // Note: This requires access to useToast hook, which we'll need to pass
  // For now, this logs a warning. We'll integrate with toast in screens/components
  if (showToast && !silent) {
    console.warn('[ErrorHandler] Toast display requested but not implemented in this context');
    console.warn('[ErrorHandler] Message:', customMessage);
    console.warn('[ErrorHandler] Description:', customDescription);
  }
}

/**
 * Create a safe async wrapper that handles errors automatically
 *
 * Usage:
 * const safeGetWorkouts = withErrorHandler(
 *   getWorkouts,
 *   'Failed to load workouts',
 *   []
 * );
 * const workouts = await safeGetWorkouts();
 */
export function withErrorHandler<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  errorMessage: string,
  fallbackValue: T
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, {
        message: errorMessage,
        context: fn.name || 'Anonymous Function',
      });
      return fallbackValue;
    }
  };
}

/**
 * Retry failed async operations
 *
 * Usage:
 * await retryAsync(
 *   () => fetchData(),
 *   { maxRetries: 3, delay: 1000 }
 * );
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options || {};

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        console.log(`[RetryAsync] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        onRetry?.(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorType = classifyError(error);
  return errorType === ErrorType.NETWORK || errorType === ErrorType.RATE_LIMIT;
}
