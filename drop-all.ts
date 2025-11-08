/**
 * Drop all tables and ENUMs from Neon database
 * Run before re-pushing corrected schema
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load .env file
config();

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function dropAll() {
  console.log('🗑️  Dropping all tables and ENUMs from Neon...\n');

  try {
    // Drop all tables (in correct order due to foreign keys)
    console.log('Dropping tables...');
    await sql`DROP TABLE IF EXISTS meal_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS nutrition_plans CASCADE`;
    await sql`DROP TABLE IF EXISTS progress_entries CASCADE`;
    await sql`DROP TABLE IF EXISTS user_workout_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS workouts CASCADE`;
    await sql`DROP TABLE IF EXISTS exercises CASCADE`;
    await sql`DROP TABLE IF EXISTS workout_programs CASCADE`;
    await sql`DROP TABLE IF EXISTS profiles CASCADE`;
    console.log('✅ All tables dropped\n');

    // Drop all ENUMs
    console.log('Dropping ENUMs...');
    await sql`DROP TYPE IF EXISTS workout_status CASCADE`;
    await sql`DROP TYPE IF EXISTS subscription_tier CASCADE`;
    await sql`DROP TYPE IF EXISTS difficulty_level CASCADE`;
    await sql`DROP TYPE IF EXISTS exercise_category CASCADE`;
    await sql`DROP TYPE IF EXISTS workout_type CASCADE`;
    await sql`DROP TYPE IF EXISTS goal_type CASCADE`;
    await sql`DROP TYPE IF EXISTS fitness_level CASCADE`;
    await sql`DROP TYPE IF EXISTS user_gender CASCADE`;
    console.log('✅ All ENUMs dropped\n');

    console.log('✅ Database cleaned successfully!');
    console.log('\nNow run: npx drizzle-kit push');
  } catch (error) {
    console.error('❌ Error dropping tables/ENUMs:', error);
    process.exit(1);
  }
}

dropAll();
