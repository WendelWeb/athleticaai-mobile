/**
 * Seed Community Data
 * Creates realistic posts, challenges, and leaderboard entries
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

// =====================================================
// SAMPLE DATA
// =====================================================

const CHALLENGES = [
  {
    title: '30-Day Plank Challenge',
    description: 'Hold a plank for 5 minutes cumulative each day for 30 days. Build core strength progressively!',
    type: 'monthly',
    target: 30,
    reward_xp: 500,
    participants_count: 1247,
    icon: 'fitness',
    gradient: ['#FF6B6B', '#FF8E53'],
    duration_days: 30,
  },
  {
    title: '100 Pushups Weekly',
    description: 'Complete 100 pushups this week. Any style counts - regular, knee, incline.',
    type: 'weekly',
    target: 100,
    reward_xp: 200,
    participants_count: 892,
    icon: 'body',
    gradient: ['#4ECDC4', '#44A8B3'],
    duration_days: 7,
  },
  {
    title: '10K Steps Daily',
    description: 'Walk 10,000 steps every day this week. Get moving and improve cardio!',
    type: 'weekly',
    target: 70000,
    reward_xp: 150,
    participants_count: 2134,
    icon: 'walk',
    gradient: ['#95E1D3', '#38B2AC'],
    duration_days: 7,
  },
  {
    title: 'Perfect Week Challenge',
    description: 'Complete all scheduled workouts this week without missing a single session.',
    type: 'weekly',
    target: 5,
    reward_xp: 300,
    participants_count: 456,
    icon: 'trophy',
    gradient: ['#F38181', '#AA4465'],
    duration_days: 7,
  },
  {
    title: 'Strength Builder',
    description: 'Lift a total of 50,000 lbs this month across all compound lifts.',
    type: 'monthly',
    target: 50000,
    reward_xp: 800,
    participants_count: 678,
    icon: 'barbell',
    gradient: ['#667EEA', '#764BA2'],
    duration_days: 30,
  },
  {
    title: 'Early Bird Workout',
    description: 'Complete 5 workouts before 8 AM this week. Rise and grind!',
    type: 'weekly',
    target: 5,
    reward_xp: 250,
    participants_count: 234,
    icon: 'sunny',
    gradient: ['#F6D365', '#FDA085'],
    duration_days: 7,
  },
  {
    title: 'Consistency King',
    description: 'Log your workouts for 90 consecutive days. Build the ultimate habit!',
    type: 'special',
    target: 90,
    reward_xp: 1500,
    participants_count: 89,
    icon: 'flame',
    gradient: ['#FA709A', '#FEE140'],
    duration_days: 90,
  },
  {
    title: 'Cardio Crusher',
    description: 'Run, bike, or row a total of 50km this month.',
    type: 'monthly',
    target: 50000,
    reward_xp: 600,
    participants_count: 567,
    icon: 'bicycle',
    gradient: ['#30CFD0', '#330867'],
    duration_days: 30,
  },
];

const POST_TEMPLATES = [
  {
    type: 'achievement',
    content: 'Just crushed my 100th workout! 🔥 The grind never stops!',
    likes: 234,
  },
  {
    type: 'transformation',
    content: '6 months progress! Down 30lbs and feeling stronger than ever. Consistency is key! 💪',
    likes: 567,
  },
  {
    type: 'workout',
    content: 'New deadlift PR today: 405lbs! 🏋️ Been chasing this for months.',
    likes: 189,
  },
  {
    type: 'text',
    content: 'Who else hits the gym at 5 AM? Nothing beats that early morning energy! ☀️',
    likes: 156,
  },
  {
    type: 'achievement',
    content: 'Completed the 30-Day Plank Challenge! Core feels like steel 🛡️',
    likes: 298,
  },
  {
    type: 'photo',
    content: 'Leg day = best day. Drop a 🔥 if you agree!',
    likes: 423,
  },
  {
    type: 'workout',
    content: 'First time doing weighted pull-ups! Started with just 10lbs but it felt amazing 💪',
    likes: 167,
  },
  {
    type: 'text',
    content: 'Remember: progress over perfection. Every workout counts, no matter how small! 🌟',
    likes: 512,
  },
  {
    type: 'transformation',
    content: '1 year ago vs today. Same person, different energy. Keep pushing! ⚡',
    likes: 789,
  },
  {
    type: 'workout',
    content: 'Hit 225lbs bench press for 3 reps today! Small victories add up 🎯',
    likes: 201,
  },
];

const USERNAMES = [
  'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Williams', 'David Kim',
  'Jessica Martinez', 'Chris Anderson', 'Lauren Taylor', 'Ryan Thompson', 'Maria Garcia',
  'James Wilson', 'Ashley Davis', 'Daniel Lee', 'Olivia Brown', 'Matthew White',
];

// =====================================================
// SEED FUNCTIONS
// =====================================================

async function clearExistingData() {
  console.log('🗑️  Clearing existing community data...\n');

  await sql`DELETE FROM post_comments`;
  await sql`DELETE FROM post_likes`;
  await sql`DELETE FROM posts`;
  await sql`DELETE FROM challenge_participants`;
  await sql`DELETE FROM challenges`;
  await sql`DELETE FROM leaderboard_entries`;

  console.log('✅ Existing data cleared\n');
}

async function seedChallenges() {
  console.log('📊 Seeding challenges...\n');

  const now = new Date();

  for (const challenge of CHALLENGES) {
    let startDate: Date;
    let endDate: Date;

    if (challenge.type === 'weekly') {
      // Start from last Monday
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay() + 1);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else if (challenge.type === 'monthly') {
      // Start from first of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      // Special challenges start from signup
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + challenge.duration_days);
    }

    await sql`
      INSERT INTO challenges (
        title, description, icon, type, unit, target, reward_xp,
        gradient_start, gradient_end, status,
        start_date, end_date, participants_count,
        created_at
      ) VALUES (
        ${challenge.title},
        ${challenge.description},
        ${challenge.icon},
        ${challenge.type},
        'reps',
        ${challenge.target},
        ${challenge.reward_xp},
        ${challenge.gradient[0]},
        ${challenge.gradient[1]},
        'active',
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        ${challenge.participants_count},
        NOW()
      )
    `;

    console.log(`✅ ${challenge.title}`);
    console.log(`   → ${challenge.participants_count} participants | ${challenge.reward_xp} XP\n`);
  }
}

async function seedPosts() {
  console.log('📝 Seeding posts...\n');

  // Get first user (or create demo user)
  let userId: string;

  const users = await sql`SELECT id FROM profiles LIMIT 1`;

  if (users.length === 0) {
    // Create demo user
    const demoUser = await sql`
      INSERT INTO profiles (id, full_name, email, created_at)
      VALUES ('demo-user-1', 'Demo User', 'demo@athletica.com', NOW())
      RETURNING id
    `;
    userId = demoUser[0].id;
  } else {
    userId = users[0].id;
  }

  // Create posts from last 7 days
  const now = new Date();

  for (let i = 0; i < POST_TEMPLATES.length; i++) {
    const template = POST_TEMPLATES[i];
    const daysAgo = Math.floor(Math.random() * 7);
    const postDate = new Date(now);
    postDate.setDate(now.getDate() - daysAgo);
    postDate.setHours(Math.floor(Math.random() * 24));

    await sql`
      INSERT INTO posts (
        user_id, type, content, likes_count,
        created_at
      ) VALUES (
        ${userId},
        ${template.type},
        ${template.content},
        ${template.likes},
        ${postDate.toISOString()}
      )
    `;

    console.log(`✅ Post ${i + 1}: ${template.type}`);
    console.log(`   "${template.content.substring(0, 50)}..."`);
    console.log(`   → ${template.likes} likes\n`);
  }
}

async function seedLeaderboard() {
  console.log('🏆 Seeding leaderboard...\n');

  // Get first user
  const users = await sql`SELECT id FROM profiles LIMIT 1`;
  const userId = users[0]?.id || 'demo-user-1';

  // Create weekly leaderboard entries
  for (let rank = 1; rank <= 50; rank++) {
    const score = 10000 - (rank * 150) + Math.floor(Math.random() * 100);
    const previousRank = rank + Math.floor(Math.random() * 5) - 2; // ±2 positions

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Last Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];

    await sql`
      INSERT INTO leaderboard_entries (
        user_id, type, rank, score, previous_rank,
        week_start, created_at
      ) VALUES (
        ${userId},
        'weekly',
        ${rank},
        ${score},
        ${previousRank > 0 ? previousRank : null},
        ${weekStartStr},
        NOW()
      )
    `;
  }

  console.log('✅ Created 50 leaderboard entries (weekly)\n');
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('🔥 COMMUNITY DATA SEEDER\n');
  console.log('════════════════════════════════════════\n');

  try {
    await clearExistingData();
    await seedChallenges();
    await seedPosts();
    await seedLeaderboard();

    console.log('════════════════════════════════════════\n');
    console.log('🎉 SUCCESS!\n');
    console.log('✅ 8 challenges created');
    console.log('✅ 10 posts created');
    console.log('✅ 50 leaderboard entries created\n');
    console.log('🔥 Community is ready!\n');
  } catch (error) {
    console.error('❌ Error seeding community data:', error);
    throw error;
  }
}

main();
