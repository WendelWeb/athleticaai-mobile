/**
 * Logger Service - Production-ready logging with environment awareness
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('[Feature] Debug message', { data });
 * logger.info('[Feature] Info message', { data });
 * logger.warn('[Feature] Warning message', { data });
 * logger.error('[Feature] Error occurred', error, { data });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = __DEV__;
  private enabledLevels: Set<LogLevel>;

  constructor() {
    // In production, only warn and error are enabled
    this.enabledLevels = this.isDev
      ? new Set(['debug', 'info', 'warn', 'error'])
      : new Set(['warn', 'error']);
  }

  /**
   * Debug logs - Only in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (this.enabledLevels.has('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Info logs - Only in development
   * Use for general information
   */
  info(message: string, context?: LogContext): void {
    if (this.enabledLevels.has('info')) {
      console.info(`ℹ️ [INFO] ${message}`, context || '');
    }
  }

  /**
   * Warning logs - Always enabled
   * Use for potential issues that don't break functionality
   */
  warn(message: string, context?: LogContext): void {
    if (this.enabledLevels.has('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, context || '');

      // TODO: Send to analytics service (Sentry, Mixpanel, etc.)
      // if (!this.isDev) {
      //   analytics.track('warning', { message, ...context });
      // }
    }
  }

  /**
   * Error logs - Always enabled
   * Use for errors that break functionality
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.enabledLevels.has('error')) {
      console.error(`🚨 [ERROR] ${message}`, error || '', context || '');

      // TODO: Send to error tracking service (Sentry)
      // if (!this.isDev && error instanceof Error) {
      //   Sentry.captureException(error, {
      //     extra: { message, ...context },
      //   });
      // }
    }
  }

  /**
   * Performance tracking
   * Use to measure operation duration
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  /**
   * Group related logs
   */
  group(label: string): void {
    if (this.isDev) {
      console.group(`📦 ${label}`);
    }
  }

  groupEnd(): void {
    if (this.isDev) {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogContext };
