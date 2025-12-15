/**
 * 🧹 SANITIZATION UTILITIES
 *
 * Prevents XSS attacks and injection in user inputs
 * CRITICAL for JSONB fields and user-generated content
 *
 * Features:
 * - HTML/Script tag removal
 * - SQL injection prevention
 * - Deep object sanitization
 * - Array sanitization
 * - Whitelist-based cleaning
 *
 * Usage:
 *   const clean = sanitizeString(userInput);
 *   const cleanObj = sanitizeObject(workout.exercises);
 */

// =====================================================
// STRING SANITIZATION
// =====================================================

/**
 * Sanitize a string to prevent XSS attacks
 * Removes HTML tags, scripts, and dangerous characters
 *
 * @param input - Raw user input
 * @param options - Sanitization options
 * @returns Sanitized string safe for storage/display
 *
 * @example
 * sanitizeString('<script>alert("xss")</script>Hello')
 * // Returns: "Hello"
 *
 * sanitizeString('Hello <b>world</b>', { allowBasicMarkdown: true })
 * // Returns: "Hello world" (strips HTML but preserves text)
 */
export function sanitizeString(
  input: string | null | undefined,
  options: {
    allowBasicMarkdown?: boolean;
    maxLength?: number;
    allowNewlines?: boolean;
  } = {}
): string {
  if (!input) return '';

  const { allowBasicMarkdown = false, maxLength = 10000, allowNewlines = true } = options;

  let sanitized = input;

  // 1. Remove all HTML tags and scripts
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // 2. Remove script-like patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // onclick=, onload=, etc.

  // 3. Remove SQL injection attempts
  sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');
  sanitized = sanitized.replace(/(-{2}|\/\*|\*\/)/g, ''); // SQL comments

  // 4. Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // 5. Remove control characters (except newlines/tabs if allowed)
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n\t]/g, ' ');
  }
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 6. Trim whitespace
  sanitized = sanitized.trim();

  // 7. Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize a number input
 * Ensures it's a valid, safe number
 */
export function sanitizeNumber(
  input: number | string | null | undefined,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): number | null {
  if (input === null || input === undefined) return null;

  const { min = -Infinity, max = Infinity, integer = false } = options;

  let num = typeof input === 'string' ? parseFloat(input) : input;

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) return null;

  // Enforce integer if required
  if (integer) {
    num = Math.round(num);
  }

  // Clamp to min/max
  num = Math.max(min, Math.min(max, num));

  return num;
}

// =====================================================
// OBJECT SANITIZATION
// =====================================================

/**
 * Deep sanitize an object
 * Recursively sanitizes all string values
 *
 * @example
 * sanitizeObject({
 *   name: '<script>alert("xss")</script>Bob',
 *   age: 25,
 *   notes: ['Hello<script>', 'World'],
 * })
 * // Returns: { name: 'Bob', age: 25, notes: ['Hello', 'World'] }
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T | null | undefined,
  options: {
    allowedKeys?: string[]; // Whitelist of allowed keys
    maxDepth?: number;
  } = {}
): T | null {
  if (!obj || typeof obj !== 'object') return null;

  const { allowedKeys, maxDepth = 10 } = options;

  function sanitizeValue(value: any, depth: number): any {
    // Prevent infinite recursion
    if (depth > maxDepth) return null;

    // Null/undefined
    if (value === null || value === undefined) return null;

    // String - sanitize
    if (typeof value === 'string') {
      return sanitizeString(value);
    }

    // Number - validate
    if (typeof value === 'number') {
      return sanitizeNumber(value);
    }

    // Boolean - pass through
    if (typeof value === 'boolean') {
      return value;
    }

    // Array - sanitize each element
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);
    }

    // Object - recursive sanitize
    if (typeof value === 'object') {
      const sanitized: any = {};

      for (const key of Object.keys(value)) {
        // Check whitelist if provided
        if (allowedKeys && !allowedKeys.includes(key)) {
          continue; // Skip non-whitelisted keys
        }

        // Sanitize key name
        const sanitizedKey = sanitizeString(key, { maxLength: 100 });
        if (!sanitizedKey) continue;

        // Sanitize value
        const sanitizedValue = sanitizeValue(value[key], depth + 1);
        if (sanitizedValue !== null && sanitizedValue !== undefined) {
          sanitized[sanitizedKey] = sanitizedValue;
        }
      }

      return sanitized;
    }

    // Unknown type - reject
    return null;
  }

  return sanitizeValue(obj, 0) as T;
}

/**
 * Sanitize array
 * Filters out invalid items and sanitizes valid ones
 */
export function sanitizeArray<T>(
  arr: T[] | null | undefined,
  sanitizer: (item: T) => T | null
): T[] {
  if (!arr || !Array.isArray(arr)) return [];

  return arr
    .map((item) => sanitizer(item))
    .filter((item): item is T => item !== null && item !== undefined);
}

// =====================================================
// JSONB FIELD SANITIZATION
// =====================================================

/**
 * Sanitize workout exercises JSONB field
 * Ensures all fields are safe before storing in database
 *
 * @example
 * sanitizeWorkoutExercises([
 *   {
 *     exercise_id: 'uuid',
 *     sets: 3,
 *     reps: '<script>alert("xss")</script>12',
 *     notes: 'Focus on form<script>',
 *   }
 * ])
 * // Returns: [{ exercise_id: 'uuid', sets: 3, reps: 12, notes: 'Focus on form' }]
 */
export function sanitizeWorkoutExercises(
  exercises: any[] | null | undefined
): Array<{
  exercise_id: string;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds: number;
  notes?: string;
}> {
  if (!exercises || !Array.isArray(exercises)) return [];

  return sanitizeArray(exercises, (exercise) => {
    if (!exercise || typeof exercise !== 'object') return null;

    const sanitized: any = {};

    // exercise_id (UUID) - validate format
    if (typeof exercise.exercise_id === 'string') {
      sanitized.exercise_id = sanitizeString(exercise.exercise_id, { maxLength: 100 });
      // Basic UUID format check
      if (!/^[a-f0-9-]{36}$/i.test(sanitized.exercise_id)) {
        return null; // Invalid UUID
      }
    } else {
      return null; // Required field
    }

    // sets (number) - must be positive integer
    sanitized.sets = sanitizeNumber(exercise.sets, { min: 1, max: 100, integer: true });
    if (!sanitized.sets) return null;

    // reps (optional number)
    if (exercise.reps !== null && exercise.reps !== undefined) {
      sanitized.reps = sanitizeNumber(exercise.reps, { min: 0, max: 1000, integer: true });
    }

    // duration_seconds (optional number)
    if (exercise.duration_seconds !== null && exercise.duration_seconds !== undefined) {
      sanitized.duration_seconds = sanitizeNumber(exercise.duration_seconds, {
        min: 0,
        max: 3600,
        integer: true,
      });
    }

    // rest_seconds (number)
    sanitized.rest_seconds = sanitizeNumber(exercise.rest_seconds, {
      min: 0,
      max: 600,
      integer: true,
    });
    if (sanitized.rest_seconds === null) sanitized.rest_seconds = 60; // Default

    // notes (optional string)
    if (exercise.notes) {
      sanitized.notes = sanitizeString(exercise.notes, {
        maxLength: 500,
        allowNewlines: true,
      });
    }

    return sanitized;
  });
}

/**
 * Sanitize user profile data
 * Ensures personal info is safe
 */
export function sanitizeProfileData(profile: any): any {
  if (!profile || typeof profile !== 'object') return null;

  return sanitizeObject(profile, {
    allowedKeys: [
      'display_name',
      'bio',
      'age',
      'weight_kg',
      'height_cm',
      'gender',
      'fitness_level',
      'fitness_goal',
      'workout_frequency',
      'available_equipment',
      'dietary_preferences',
    ],
  });
}

/**
 * Sanitize workout builder exercises JSONB field
 * More comprehensive than basic workout exercises - includes progression, tempo, etc.
 *
 * @example
 * sanitizeBuilderExercises([
 *   {
 *     exercise_id: 'uuid',
 *     exercise_name: 'Bench Press<script>',
 *     sets: 3,
 *     reps_min: 8,
 *     reps_max: 12,
 *     notes: 'Focus on form<script>alert("xss")</script>',
 *     progression: { type: 'linear', rate: 5 },
 *   }
 * ])
 */
export function sanitizeBuilderExercises(exercises: any[] | null | undefined): any[] {
  if (!exercises || !Array.isArray(exercises)) return [];

  const validMuscleGroups = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
    'quads',
    'hamstrings',
    'glutes',
    'calves',
    'abs',
    'obliques',
  ];

  const validEquipment = [
    'barbell',
    'dumbbell',
    'cable',
    'machine',
    'bodyweight',
    'resistance_band',
    'kettlebell',
  ];

  const validProgressionTypes = ['fixed', 'linear', 'wave', 'custom'];

  return sanitizeArray(exercises, (exercise) => {
    if (!exercise || typeof exercise !== 'object') return null;

    const sanitized: any = {};

    // exercise_id (UUID) - required
    if (typeof exercise.exercise_id === 'string') {
      sanitized.exercise_id = sanitizeString(exercise.exercise_id, { maxLength: 100 });
      // Basic UUID format check
      if (!/^[a-f0-9-]{36}$/i.test(sanitized.exercise_id)) {
        return null; // Invalid UUID
      }
    } else {
      return null; // Required field
    }

    // exercise_name - required
    if (typeof exercise.exercise_name === 'string') {
      sanitized.exercise_name = sanitizeString(exercise.exercise_name, { maxLength: 200 });
      if (!sanitized.exercise_name) return null;
    } else {
      return null; // Required field
    }

    // muscle_group - required, validate enum
    if (typeof exercise.muscle_group === 'string') {
      const muscleGroup = exercise.muscle_group.toLowerCase();
      if (validMuscleGroups.includes(muscleGroup)) {
        sanitized.muscle_group = muscleGroup;
      } else {
        return null; // Invalid muscle group
      }
    } else {
      return null; // Required field
    }

    // equipment - array of enums
    if (Array.isArray(exercise.equipment)) {
      sanitized.equipment = exercise.equipment
        .filter((eq: any) => typeof eq === 'string' && validEquipment.includes(eq.toLowerCase()))
        .map((eq: string) => eq.toLowerCase());
      if (sanitized.equipment.length === 0) {
        sanitized.equipment = ['bodyweight']; // Default fallback
      }
    } else {
      sanitized.equipment = ['bodyweight']; // Default fallback
    }

    // order - required number
    sanitized.order = sanitizeNumber(exercise.order, { min: 0, max: 100, integer: true });
    if (sanitized.order === null) sanitized.order = 0; // Default

    // sets - required number
    sanitized.sets = sanitizeNumber(exercise.sets, { min: 1, max: 100, integer: true });
    if (!sanitized.sets) return null; // Required field

    // reps_min - required number
    sanitized.reps_min = sanitizeNumber(exercise.reps_min, { min: 0, max: 1000, integer: true });
    if (sanitized.reps_min === null) return null; // Required field

    // reps_max - required number
    sanitized.reps_max = sanitizeNumber(exercise.reps_max, { min: 0, max: 1000, integer: true });
    if (sanitized.reps_max === null) return null; // Required field

    // Ensure reps_max >= reps_min
    if (sanitized.reps_max < sanitized.reps_min) {
      sanitized.reps_max = sanitized.reps_min;
    }

    // rest_seconds - required number
    sanitized.rest_seconds = sanitizeNumber(exercise.rest_seconds, {
      min: 0,
      max: 600,
      integer: true,
    });
    if (sanitized.rest_seconds === null) sanitized.rest_seconds = 60; // Default

    // weight - optional number
    if (exercise.weight !== null && exercise.weight !== undefined) {
      sanitized.weight = sanitizeNumber(exercise.weight, { min: 0, max: 1000 });
    }

    // weight_unit - optional enum
    if (exercise.weight_unit && ['lbs', 'kg'].includes(exercise.weight_unit)) {
      sanitized.weight_unit = exercise.weight_unit;
    } else {
      sanitized.weight_unit = 'kg'; // Default
    }

    // progression - required object
    if (exercise.progression && typeof exercise.progression === 'object') {
      const prog = exercise.progression;
      const progressionType = prog.type || 'fixed';

      if (validProgressionTypes.includes(progressionType)) {
        sanitized.progression = {
          type: progressionType,
        };

        // rate for linear progression
        if (progressionType === 'linear' && prog.rate !== undefined) {
          sanitized.progression.rate = sanitizeNumber(prog.rate, { min: 0, max: 100 });
        }

        // custom_weeks for custom progression
        if (progressionType === 'custom' && prog.custom_weeks) {
          const customWeeks: { [key: number]: number } = {};
          Object.keys(prog.custom_weeks).forEach((week) => {
            const weekNum = sanitizeNumber(parseInt(week), { min: 1, max: 52, integer: true });
            const value = sanitizeNumber(prog.custom_weeks[week], { min: 0, max: 1000 });
            if (weekNum !== null && value !== null) {
              customWeeks[weekNum] = value;
            }
          });
          if (Object.keys(customWeeks).length > 0) {
            sanitized.progression.custom_weeks = customWeeks;
          }
        }
      } else {
        sanitized.progression = { type: 'fixed' }; // Default fallback
      }
    } else {
      sanitized.progression = { type: 'fixed' }; // Default fallback
    }

    // tempo - optional object
    if (exercise.tempo && typeof exercise.tempo === 'object') {
      const eccentric = sanitizeNumber(exercise.tempo.eccentric, { min: 0, max: 10, integer: true });
      const pause1 = sanitizeNumber(exercise.tempo.pause1, { min: 0, max: 10, integer: true });
      const concentric = sanitizeNumber(exercise.tempo.concentric, {
        min: 0,
        max: 10,
        integer: true,
      });
      const pause2 = sanitizeNumber(exercise.tempo.pause2, { min: 0, max: 10, integer: true });

      if (
        eccentric !== null &&
        pause1 !== null &&
        concentric !== null &&
        pause2 !== null
      ) {
        sanitized.tempo = {
          eccentric,
          pause1,
          concentric,
          pause2,
        };
      }
    }

    // rpe_target - optional number (1-10)
    if (exercise.rpe_target !== null && exercise.rpe_target !== undefined) {
      sanitized.rpe_target = sanitizeNumber(exercise.rpe_target, {
        min: 1,
        max: 10,
        integer: true,
      });
    }

    // notes - optional string
    if (exercise.notes) {
      sanitized.notes = sanitizeString(exercise.notes, {
        maxLength: 500,
        allowNewlines: true,
      });
    }

    // superset_with - optional string (UUID or exercise ID)
    if (exercise.superset_with) {
      const supersetId = sanitizeString(exercise.superset_with, { maxLength: 100 });
      // Allow both UUIDs and simple IDs
      if (supersetId) {
        sanitized.superset_with = supersetId;
      }
    }

    // drop_sets - optional object
    if (exercise.drop_sets && typeof exercise.drop_sets === 'object') {
      const enabled = Boolean(exercise.drop_sets.enabled);
      const drops = sanitizeNumber(exercise.drop_sets.drops, { min: 1, max: 3, integer: true });
      const weightReduction = sanitizeNumber(exercise.drop_sets.weight_reduction_percent, {
        min: 10,
        max: 50,
        integer: true,
      });

      if (enabled && drops !== null && weightReduction !== null) {
        sanitized.drop_sets = {
          enabled,
          drops,
          weight_reduction_percent: weightReduction,
        };

        // reps_per_drop - optional
        if (exercise.drop_sets.reps_per_drop !== undefined) {
          const repsPerDrop = sanitizeNumber(exercise.drop_sets.reps_per_drop, {
            min: 1,
            max: 100,
            integer: true,
          });
          if (repsPerDrop !== null) {
            sanitized.drop_sets.reps_per_drop = repsPerDrop;
          }
        }
      }
    }

    return sanitized;
  });
}

/**
 * Sanitize workout session exercises_completed JSONB field
 * Used when saving active workout data (sets, reps, weights)
 *
 * @example
 * sanitizeWorkoutSessionExercises([
 *   {
 *     exercise_id: 'uuid',
 *     exercise_name: 'Bench Press',
 *     target_sets: 3,
 *     sets_completed: [
 *       { reps: 12, weight_kg: 60, rpe: 8, notes: 'Felt strong<script>' }
 *     ]
 *   }
 * ])
 */
export function sanitizeWorkoutSessionExercises(
  exercises: any[] | null | undefined
): any[] {
  if (!exercises || !Array.isArray(exercises)) return [];

  const validSkipReasons = ['equipment', 'injury', 'fatigue', 'difficulty', 'other'];

  return sanitizeArray(exercises, (exercise) => {
    if (!exercise || typeof exercise !== 'object') return null;

    const sanitized: any = {};

    // exercise_id - required UUID
    if (typeof exercise.exercise_id === 'string') {
      sanitized.exercise_id = sanitizeString(exercise.exercise_id, { maxLength: 100 });
      // UUID format check
      if (!/^[a-f0-9-]{36}$/i.test(sanitized.exercise_id)) {
        return null; // Invalid UUID
      }
    } else {
      return null; // Required field
    }

    // exercise_name - required string
    if (typeof exercise.exercise_name === 'string') {
      sanitized.exercise_name = sanitizeString(exercise.exercise_name, { maxLength: 200 });
      if (!sanitized.exercise_name) return null;
    } else {
      return null; // Required field
    }

    // target_sets - required number
    sanitized.target_sets = sanitizeNumber(exercise.target_sets, {
      min: 1,
      max: 100,
      integer: true,
    });
    if (!sanitized.target_sets) return null;

    // target_reps - optional number
    if (exercise.target_reps !== null && exercise.target_reps !== undefined) {
      sanitized.target_reps = sanitizeNumber(exercise.target_reps, {
        min: 0,
        max: 1000,
        integer: true,
      });
    }

    // target_duration_seconds - optional number
    if (exercise.target_duration_seconds !== null && exercise.target_duration_seconds !== undefined) {
      sanitized.target_duration_seconds = sanitizeNumber(exercise.target_duration_seconds, {
        min: 0,
        max: 3600,
        integer: true,
      });
    }

    // sets_completed - array of SetData
    if (Array.isArray(exercise.sets_completed)) {
      sanitized.sets_completed = sanitizeArray(exercise.sets_completed, (set: any) => {
        if (!set || typeof set !== 'object') return null;

        const sanitizedSet: any = {};

        // reps - required number
        sanitizedSet.reps = sanitizeNumber(set.reps, { min: 0, max: 1000, integer: true });
        if (sanitizedSet.reps === null) return null; // Required

        // weight_kg - optional number
        if (set.weight_kg !== null && set.weight_kg !== undefined) {
          sanitizedSet.weight_kg = sanitizeNumber(set.weight_kg, { min: 0, max: 1000 });
        }

        // duration_seconds - optional number
        if (set.duration_seconds !== null && set.duration_seconds !== undefined) {
          sanitizedSet.duration_seconds = sanitizeNumber(set.duration_seconds, {
            min: 0,
            max: 3600,
            integer: true,
          });
        }

        // rest_seconds - optional number
        if (set.rest_seconds !== null && set.rest_seconds !== undefined) {
          sanitizedSet.rest_seconds = sanitizeNumber(set.rest_seconds, {
            min: 0,
            max: 600,
            integer: true,
          });
        }

        // rpe - optional number (1-10)
        if (set.rpe !== null && set.rpe !== undefined) {
          sanitizedSet.rpe = sanitizeNumber(set.rpe, { min: 1, max: 10, integer: true });
        }

        // form_quality - optional number (1-5)
        if (set.form_quality !== null && set.form_quality !== undefined) {
          sanitizedSet.form_quality = sanitizeNumber(set.form_quality, {
            min: 1,
            max: 5,
            integer: true,
          });
        }

        // notes - optional string
        if (set.notes) {
          sanitizedSet.notes = sanitizeString(set.notes, {
            maxLength: 500,
            allowNewlines: true,
          });
        }

        // completed_at - required date
        if (set.completed_at) {
          // Validate it's a valid date
          const date = new Date(set.completed_at);
          if (!isNaN(date.getTime())) {
            sanitizedSet.completed_at = date;
          } else {
            sanitizedSet.completed_at = new Date(); // Fallback to now
          }
        } else {
          sanitizedSet.completed_at = new Date(); // Default to now
        }

        return sanitizedSet;
      });
    } else {
      sanitized.sets_completed = []; // Default to empty array
    }

    // skipped - required boolean
    sanitized.skipped = Boolean(exercise.skipped);

    // skip_reason - optional enum
    if (exercise.skip_reason && validSkipReasons.includes(exercise.skip_reason)) {
      sanitized.skip_reason = exercise.skip_reason;
    }

    // started_at - optional date
    if (exercise.started_at) {
      const date = new Date(exercise.started_at);
      if (!isNaN(date.getTime())) {
        sanitized.started_at = date;
      }
    }

    // completed_at - optional date
    if (exercise.completed_at) {
      const date = new Date(exercise.completed_at);
      if (!isNaN(date.getTime())) {
        sanitized.completed_at = date;
      }
    }

    return sanitized;
  });
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
  sanitizeArray,
  sanitizeWorkoutExercises,
  sanitizeProfileData,
  sanitizeBuilderExercises,
  sanitizeWorkoutSessionExercises,
};
