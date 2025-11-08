/**
 * Create Test Program - Ajoute le workout de test dans un program visible
 */

import 'dotenv/config';
import { db, workoutPrograms, workouts } from '../src/db';
import { eq } from 'drizzle-orm';

async function createTestProgram() {
  try {
    console.log('🚀 Creating test program...\n');

    // 1. Trouver le workout de test
    console.log('🔍 Finding test workout...');
    const testWorkout = await db.query.workouts.findFirst({
      where: eq(workouts.name, 'Quick Full Body Test'),
    });

    if (!testWorkout) {
      console.error('❌ Test workout not found. Run create-test-workout.ts first!');
      process.exit(1);
    }

    console.log(`✅ Found workout: "${testWorkout.name}" (${testWorkout.id})`);

    // 2. Créer le program
    console.log('\n📝 Creating program...');

    const [program] = await db.insert(workoutPrograms).values({
      name: '🧪 Test Program - WorkoutPlayer V2',
      description: 'Program de test pour tester le nouveau WorkoutPlayer V2 avec ML/Analytics',
      thumbnail_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      duration_weeks: 1,
      workouts_per_week: 1,
      difficulty_level: 'beginner' as const,
      target_goals: ['stay_healthy', 'build_muscle'],
      target_fitness_levels: ['beginner'],
      total_workouts: 1,
      estimated_time_per_workout: 20,
      is_premium: false,
      workouts: [
        {
          workout_id: testWorkout.id,
          week_number: 1,
          day_number: 1,
          name: testWorkout.name,
          description: testWorkout.description || '',
        }
      ],
    }).returning();

    console.log(`✅ Created program: "${program.name}" (ID: ${program.id})`);

    console.log('\n🎉 TEST PROGRAM CREATED SUCCESSFULLY!\n');
    console.log('📱 To test WorkoutPlayer V2:');
    console.log('   1. Launch app: npm start');
    console.log('   2. Go to Workouts tab');
    console.log('   3. Find "🧪 Test Program - WorkoutPlayer V2"');
    console.log('   4. Click on the program');
    console.log('   5. Click on "Quick Full Body Test" workout');
    console.log('   6. Click "▶ Start Workout"');
    console.log('   7. BOOM! WorkoutPlayer V2 loads 🚀\n');

  } catch (error) {
    console.error('❌ Error creating test program:', error);
    throw error;
  }
}

createTestProgram()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
