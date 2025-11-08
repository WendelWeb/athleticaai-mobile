/**
 * Check for invalid dates in database
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function checkDates() {
  console.log('🔍 CHECKING FOR INVALID DATES\n');
  console.log('════════════════════════════════════════\n');

  // Check daily_nutrition_logs
  console.log('📊 Daily Nutrition Logs:');
  const nutritionLogs = await sql`
    SELECT id, log_date, created_at, updated_at
    FROM daily_nutrition_logs
    LIMIT 5
  `;
  nutritionLogs.forEach((log: any) => {
    console.log('  ID:', log.id);
    console.log('  log_date:', log.log_date, typeof log.log_date);
    console.log('  created_at:', log.created_at, typeof log.created_at);
    console.log('  updated_at:', log.updated_at, typeof log.updated_at);
    console.log('');
  });

  // Check posts
  console.log('📝 Posts:');
  const posts = await sql`
    SELECT id, created_at, updated_at
    FROM posts
    LIMIT 3
  `;
  posts.forEach((post: any) => {
    console.log('  ID:', post.id);
    console.log('  created_at:', post.created_at, typeof post.created_at);
    console.log('  updated_at:', post.updated_at, typeof post.updated_at);
    console.log('');
  });

  // Check challenges
  console.log('🎯 Challenges:');
  const challenges = await sql`
    SELECT id, start_date, end_date, created_at
    FROM challenges
    LIMIT 3
  `;
  challenges.forEach((challenge: any) => {
    console.log('  ID:', challenge.id);
    console.log('  start_date:', challenge.start_date, typeof challenge.start_date);
    console.log('  end_date:', challenge.end_date, typeof challenge.end_date);
    console.log('  created_at:', challenge.created_at, typeof challenge.created_at);
    console.log('');
  });

  // Check leaderboard
  console.log('🏆 Leaderboard:');
  const leaderboard = await sql`
    SELECT id, week_start, month_start, created_at, updated_at
    FROM leaderboard_entries
    LIMIT 3
  `;
  leaderboard.forEach((entry: any) => {
    console.log('  ID:', entry.id);
    console.log('  week_start:', entry.week_start, typeof entry.week_start);
    console.log('  month_start:', entry.month_start, typeof entry.month_start);
    console.log('  created_at:', entry.created_at, typeof entry.created_at);
    console.log('  updated_at:', entry.updated_at, typeof entry.updated_at);
    console.log('');
  });

  console.log('════════════════════════════════════════');
}

checkDates();
