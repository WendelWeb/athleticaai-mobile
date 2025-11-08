/**
 * Drop old workouts JSONB column from workout_programs
 * This is the data-loss migration from JSONB to normalized tables
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function dropWorkoutsColumn() {
  console.log('🗑️  Dropping workouts column from workout_programs...\n');

  try {
    await sql`
      ALTER TABLE workout_programs
      DROP COLUMN IF EXISTS workouts
    `;

    console.log('✅ Column dropped successfully!\n');
    console.log('📝 This was the JSONB migration - workouts are now in the workouts table.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

dropWorkoutsColumn();
