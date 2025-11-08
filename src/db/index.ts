/**
 * Drizzle Database Client
 *
 * Connects to Neon PostgreSQL via HTTP
 *
 * IMPORTANT: For React Native/Expo, the DATABASE_URL must be prefixed with EXPO_PUBLIC_
 * to be accessible. However, for security reasons in production, you should use a backend API
 * instead of direct database access from the client.
 *
 * This is acceptable for MVP/development only.
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as workoutSessionSchema from './schema-workout-sessions';

// Merge schemas
const fullSchema = { ...schema, ...workoutSessionSchema };

let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get database instance with lazy initialization
 * This prevents errors during React Native module loading
 */
function getDbInstance() {
  if (dbInstance) {
    return dbInstance;
  }

  // Try EXPO_PUBLIC_ prefix first (for React Native), then fallback to regular (for Node.js scripts)
  const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL || process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not configured. Database operations will fail.');
    console.warn('For React Native, set EXPO_PUBLIC_DATABASE_URL in .env');
    console.warn('For Node.js scripts, set DATABASE_URL in .env');

    // Return a mock instance that will throw on actual use
    // This prevents app crash during initial load
    return null as any;
  }

  // Create Neon HTTP client
  const sql = neon(DATABASE_URL);

  // Create Drizzle instance with full merged schema
  dbInstance = drizzle(sql, { schema: fullSchema });

  return dbInstance;
}

// Export db as a getter to support lazy initialization
// Type assertion to include our schema
export const db = new Proxy({} as ReturnType<typeof getDbInstance>, {
  get(target, prop) {
    const instance = getDbInstance();
    if (!instance) {
      throw new Error('Database not configured. Please set EXPO_PUBLIC_DATABASE_URL in .env');
    }
    return (instance as any)[prop];
  }
});

// Export all schema for easy imports
export * from './schema';
export * from './schema-workout-sessions';
