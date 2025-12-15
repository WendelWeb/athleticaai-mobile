/**
 * Date Helper Utilities
 *
 * Robust date handling for Neon PostgreSQL dates
 * Handles Date objects, ISO strings, PostgreSQL date strings, and invalid dates
 */

import { logger } from './logger';

/**
 * Convert any date format to ISO string
 *
 * Handles:
 * - Date objects (valid/invalid)
 * - ISO strings (with/without timezone)
 * - PostgreSQL date strings (YYYY-MM-DD)
 * - Null/undefined (returns fallback)
 * - Invalid dates (returns fallback)
 *
 * @param date - Any date-like value
 * @param fallback - Fallback date if conversion fails (default: current date, can be null)
 * @returns ISO 8601 string or null/fallback
 *
 * @example
 * toISOString(new Date()) // "2025-01-07T12:30:45.123Z"
 * toISOString("2025-01-07") // "2025-01-07T00:00:00.000Z"
 * toISOString(null) // Current date ISO string
 * toISOString(null, null) // null (for optional date fields)
 * toISOString(invalidDate, "2025-01-01T00:00:00.000Z") // Fallback
 */
export const toISOString = (date: any, fallback: string | null = new Date().toISOString()): string | null => {
  // Null/undefined check
  if (!date) return fallback;

  try {
    // Handle string dates
    if (typeof date === 'string') {
      // If already ISO format with time, return as-is
      if (date.includes('T') && (date.includes('Z') || date.includes('+'))) {
        return date;
      }

      // If PostgreSQL date format (YYYY-MM-DD), convert to ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return `${date}T00:00:00.000Z`;
      }

      // Try to parse other string formats
      const testDate = new Date(date);
      if (!isNaN(testDate.getTime())) {
        return testDate.toISOString();
      }

      return fallback;
    }

    // Date object
    if (date instanceof Date) {
      const timestamp = date.getTime();
      // Check if valid AND within reasonable range (year 1 to 275760)
      if (!isNaN(timestamp) && timestamp > 0 && timestamp < 8640000000000000) {
        return date.toISOString();
      }
      return fallback;
    }

    // Try to convert if it's an object with date-like properties
    if (typeof date === 'object' && date !== null) {
      const dateObj = new Date(date as any);
      const timestamp = dateObj.getTime();
      if (!isNaN(timestamp) && timestamp > 0 && timestamp < 8640000000000000) {
        return dateObj.toISOString();
      }
    }
  } catch (error) {
    // Silent fail in production, only log in dev
    if (__DEV__) {
      logger.warn('[DateHelpers] Failed to convert date to ISO string', { date, error });
    }
  }

  return fallback;
};

/**
 * Format ISO date to human-readable string
 *
 * @param isoDate - ISO 8601 date string
 * @param format - "short" | "long" | "time" | "relative"
 * @returns Formatted date string
 *
 * @example
 * formatDate("2025-01-07T12:30:00.000Z", "short") // "Jan 7, 2025"
 * formatDate("2025-01-07T12:30:00.000Z", "long") // "January 7, 2025"
 * formatDate("2025-01-07T12:30:00.000Z", "time") // "12:30 PM"
 * formatDate("2025-01-07T12:30:00.000Z", "relative") // "2 hours ago"
 */
export const formatDate = (
  isoDate: string,
  format: 'short' | 'long' | 'time' | 'relative' = 'short'
): string => {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Invalid date';

    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

      case 'long':
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

      case 'relative':
        return getRelativeTime(date);

      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
};

/**
 * Get today's date as YYYY-MM-DD string
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date N days ago as YYYY-MM-DD string
 */
export const getDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is within last N days
 */
export const isWithinDays = (date: string | Date, days: number): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= days;
};

/**
 * Safe ISO string conversion with null fallback
 *
 * This is an alias for toISOString with null fallback as default.
 * Use this when date fields are optional and you want to return null for invalid dates.
 *
 * @param value - Any date-like value
 * @returns ISO 8601 string or null
 *
 * @example
 * safeToISOString(new Date()) // "2025-01-07T12:30:45.123Z"
 * safeToISOString(null) // null
 * safeToISOString(invalidDate) // null
 * safeToISOString("2025-01-07") // "2025-01-07T00:00:00.000Z"
 */
export const safeToISOString = (value: any): string | null => {
  return toISOString(value, null);
};
