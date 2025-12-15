/**
 * 🧪 DATE HELPERS TESTS
 *
 * Comprehensive tests for date handling utilities including timezone handling
 * Tests toISOString(), safeToISOString(), and timezone consistency
 */

import { toISOString, safeToISOString, formatDate, getTodayString, isToday, isWithinDays } from '@/utils/dateHelpers';

describe('dateHelpers', () => {
  // =====================================================
  // toISOString() TESTS
  // =====================================================

  describe('toISOString', () => {
    test('converts valid Date object to ISO string', () => {
      const date = new Date('2025-01-07T12:30:00.000Z');
      expect(toISOString(date)).toBe('2025-01-07T12:30:00.000Z');
    });

    test('converts ISO string to ISO string (passthrough)', () => {
      const isoString = '2025-01-07T12:30:00.000Z';
      expect(toISOString(isoString)).toBe(isoString);
    });

    test('converts PostgreSQL date format (YYYY-MM-DD) to ISO', () => {
      const pgDate = '2025-01-07';
      expect(toISOString(pgDate)).toBe('2025-01-07T00:00:00.000Z');
    });

    test('returns fallback for null/undefined', () => {
      const fallback = '2025-01-01T00:00:00.000Z';
      expect(toISOString(null, fallback)).toBe(fallback);
      expect(toISOString(undefined, fallback)).toBe(fallback);
    });

    test('returns current date ISO for null with default fallback', () => {
      const result = toISOString(null);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    test('handles invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      const fallback = '2025-01-01T00:00:00.000Z';
      expect(toISOString(invalidDate, fallback)).toBe(fallback);
    });

    test('handles dates outside valid range', () => {
      const invalidDate = new Date('0000-01-01'); // Year 0 is invalid
      const fallback = '2025-01-01T00:00:00.000Z';
      expect(toISOString(invalidDate, fallback)).toBe(fallback);
    });

    test('handles future dates correctly', () => {
      const futureDate = new Date('2030-12-31T23:59:59.999Z');
      expect(toISOString(futureDate)).toBe('2030-12-31T23:59:59.999Z');
    });

    test('handles past dates correctly', () => {
      const pastDate = new Date('2000-01-01T00:00:00.000Z');
      expect(toISOString(pastDate)).toBe('2000-01-01T00:00:00.000Z');
    });
  });

  // =====================================================
  // safeToISOString() TESTS
  // =====================================================

  describe('safeToISOString', () => {
    test('converts valid Date to ISO string', () => {
      const date = new Date('2025-01-07T12:30:00.000Z');
      expect(safeToISOString(date)).toBe('2025-01-07T12:30:00.000Z');
    });

    test('returns null for null input', () => {
      expect(safeToISOString(null)).toBe(null);
    });

    test('returns null for undefined input', () => {
      expect(safeToISOString(undefined)).toBe(null);
    });

    test('returns null for invalid Date', () => {
      const invalidDate = new Date('invalid');
      expect(safeToISOString(invalidDate)).toBe(null);
    });

    test('returns null for empty string', () => {
      expect(safeToISOString('')).toBe(null);
    });

    test('converts valid date string to ISO', () => {
      expect(safeToISOString('2025-01-07')).toBe('2025-01-07T00:00:00.000Z');
    });
  });

  // =====================================================
  // TIMEZONE CONSISTENCY TESTS
  // =====================================================

  describe('timezone consistency', () => {
    test('toISOString always returns UTC timezone (Z suffix)', () => {
      const date = new Date('2025-01-07T12:30:00.000Z');
      const result = toISOString(date);
      expect(result).toMatch(/Z$/); // Ends with Z (UTC)
    });

    test('same Date object always produces same ISO string', () => {
      const date = new Date('2025-01-07T12:30:00.000Z');
      const iso1 = toISOString(date);
      const iso2 = toISOString(date);
      expect(iso1).toBe(iso2);
    });

    test('Date created from ISO string is equal when converted back', () => {
      const originalISO = '2025-01-07T12:30:00.000Z';
      const date = new Date(originalISO);
      const convertedISO = toISOString(date);
      expect(convertedISO).toBe(originalISO);
    });

    test('PostgreSQL date format converts to midnight UTC', () => {
      const pgDate = '2025-01-07';
      const iso = toISOString(pgDate);
      expect(iso).toBe('2025-01-07T00:00:00.000Z');
      expect(iso).toMatch(/T00:00:00\.000Z$/); // Midnight UTC
    });

    test('handles DST transitions correctly', () => {
      // March 10, 2024 - DST starts in US
      const beforeDST = new Date('2024-03-09T12:00:00.000Z');
      const afterDST = new Date('2024-03-11T12:00:00.000Z');

      expect(toISOString(beforeDST)).toBe('2024-03-09T12:00:00.000Z');
      expect(toISOString(afterDST)).toBe('2024-03-11T12:00:00.000Z');
    });
  });

  // =====================================================
  // DATABASE TIMESTAMP COMPATIBILITY TESTS
  // =====================================================

  describe('database timestamp compatibility', () => {
    test('toISOString output is compatible with PostgreSQL timestamptz', () => {
      const date = new Date('2025-01-07T12:30:45.123Z');
      const iso = toISOString(date);

      // PostgreSQL expects: YYYY-MM-DDTHH:MM:SS.sssZ
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('handles current timestamp (new Date())', () => {
      const now = new Date();
      const iso = toISOString(now);

      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(iso).getTime()).toBe(now.getTime());
    });

    test('roundtrip: Date → ISO → Date preserves timestamp', () => {
      const original = new Date('2025-01-07T12:30:45.123Z');
      const iso = toISOString(original);
      const restored = new Date(iso!);

      expect(restored.getTime()).toBe(original.getTime());
    });
  });

  // =====================================================
  // formatDate() TESTS
  // =====================================================

  describe('formatDate', () => {
    const testDate = '2025-01-07T12:30:00.000Z';

    test('formats date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/Jan 7, 2025/);
    });

    test('formats date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toMatch(/January 7, 2025/);
    });

    test('formats time', () => {
      const result = formatDate(testDate, 'time');
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });

    test('handles invalid date string', () => {
      expect(formatDate('invalid', 'short')).toBe('Invalid date');
    });
  });

  // =====================================================
  // DATE COMPARISON TESTS
  // =====================================================

  describe('date comparisons', () => {
    test('isToday returns true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    test('isToday returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    test('isWithinDays works correctly', () => {
      const now = new Date();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      expect(isWithinDays(twoDaysAgo, 3)).toBe(true);
      expect(isWithinDays(twoDaysAgo, 1)).toBe(false);
    });

    test('getTodayString returns YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // =====================================================
  // EDGE CASES & ERROR HANDLING
  // =====================================================

  describe('edge cases', () => {
    test('handles empty object', () => {
      expect(safeToISOString({})).toBe(null);
    });

    test('handles number input', () => {
      const timestamp = Date.now();
      const result = toISOString(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('handles array input gracefully', () => {
      expect(safeToISOString([] as any)).toBe(null);
    });

    test('handles boolean input gracefully', () => {
      expect(safeToISOString(true as any)).toBe(null);
    });

    test('handles very large timestamps', () => {
      // Max safe timestamp: 8640000000000000 (Sep 13, 275760)
      const maxDate = new Date(8639999999999999);
      const iso = toISOString(maxDate);
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('handles epoch (1970-01-01)', () => {
      const epoch = new Date(0);
      expect(toISOString(epoch)).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  // =====================================================
  // PERFORMANCE TESTS
  // =====================================================

  describe('performance', () => {
    test('toISOString is fast for large batches', () => {
      const start = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        toISOString(new Date());
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    test('safeToISOString handles invalid inputs efficiently', () => {
      const start = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        safeToISOString('invalid');
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
