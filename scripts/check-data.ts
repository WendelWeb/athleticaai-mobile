/**
 * Check what data is actually in the database
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function checkData() {
  console.log('🔍 CHECKING DATABASE DATA\n');
  console.log('════════════════════════════════════════\n');

  // Check posts
  const posts = await sql`SELECT COUNT(*) as count FROM posts`;
  console.log(`📝 Posts: ${posts[0].count}`);

  const postsDetails = await sql`SELECT id, type, content, likes_count, created_at FROM posts ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent posts:');
  postsDetails.forEach((p: any) => {
    console.log(`  - ${p.type}: "${p.content.substring(0, 50)}..." (${p.likes_count} likes)`);
  });
  console.log('');

  // Check challenges
  const challenges = await sql`SELECT COUNT(*) as count FROM challenges`;
  console.log(`🎯 Challenges: ${challenges[0].count}`);

  const challengesDetails = await sql`SELECT id, title, type, participants_count, status FROM challenges LIMIT 10`;
  console.log('All challenges:');
  challengesDetails.forEach((c: any) => {
    console.log(`  - ${c.title} (${c.type}) - ${c.status} - ${c.participants_count} participants`);
  });
  console.log('');

  // Check leaderboard
  const leaderboard = await sql`SELECT COUNT(*) as count FROM leaderboard_entries`;
  console.log(`🏆 Leaderboard entries: ${leaderboard[0].count}`);
  console.log('');

  // Check recipes
  const recipes = await sql`SELECT COUNT(*) as count FROM recipes`;
  console.log(`🍽️  Recipes: ${recipes[0].count}`);

  const recipesDetails = await sql`SELECT id, name, calories, is_premium FROM recipes LIMIT 10`;
  console.log('All recipes:');
  recipesDetails.forEach((r: any) => {
    const premium = r.is_premium ? '👑' : '  ';
    console.log(`  ${premium} ${r.name} (${r.calories} kcal)`);
  });
  console.log('');

  // Check daily logs
  const logs = await sql`SELECT COUNT(*) as count FROM daily_nutrition_logs`;
  console.log(`📊 Daily nutrition logs: ${logs[0].count}`);

  console.log('════════════════════════════════════════');
}

checkData();
