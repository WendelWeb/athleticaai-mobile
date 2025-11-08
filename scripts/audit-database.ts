/**
 * Audit Database State
 * Check what data actually exists in the database
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function auditDatabase() {
  console.log('🔍 AUDITING DATABASE STATE\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // Check exercises
    const exercisesCount = await sql`SELECT COUNT(*) as count FROM exercises`;
    console.log(`📋 Exercises: ${exercisesCount[0].count}`);

    // Check workout_programs
    const programsCount = await sql`SELECT COUNT(*) as count FROM workout_programs`;
    console.log(`🏋️  Workout Programs: ${programsCount[0].count}`);

    // Check recipes
    const recipesCount = await sql`SELECT COUNT(*) as count FROM recipes`;
    console.log(`🍽️  Recipes: ${recipesCount[0].count}`);

    // Check posts
    const postsCount = await sql`SELECT COUNT(*) as count FROM posts`;
    console.log(`📝 Posts: ${postsCount[0].count}`);

    // Check challenges
    const challengesCount = await sql`SELECT COUNT(*) as count FROM challenges`;
    console.log(`🎯 Challenges: ${challengesCount[0].count}`);

    // Check profiles
    const profilesCount = await sql`SELECT COUNT(*) as count FROM profiles`;
    console.log(`👤 Profiles: ${profilesCount[0].count}`);

    console.log('\n═══════════════════════════════════════');
    console.log('\n📊 SUMMARY:');

    const totalContent =
      Number(exercisesCount[0].count) +
      Number(programsCount[0].count) +
      Number(recipesCount[0].count);

    if (totalContent === 0) {
      console.log('❌ DATABASE IS EMPTY - Need to run seed scripts!');
      console.log('\nRun these commands:');
      console.log('  npm run db:push');
      console.log('  npm run seed:exercises');
      console.log('  npm run seed:programs');
    } else if (totalContent < 50) {
      console.log('⚠️  DATABASE HAS MINIMAL DATA - Consider adding more content');
    } else {
      console.log('✅ DATABASE HAS CONTENT - Ready for testing');
    }

    console.log(`\nTotal content items: ${totalContent}`);

  } catch (error) {
    console.error('❌ Error auditing database:', error);
    console.log('\n⚠️  Possible issues:');
    console.log('  - Database connection failed');
    console.log('  - Tables not created (run npm run db:push)');
    console.log('  - Invalid DATABASE_URL in .env');
  }
}

auditDatabase();
