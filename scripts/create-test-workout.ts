/**
 * Create Test Workout - Pour tester WorkoutPlayer V2
 *
 * Crée 1 workout simple avec 3 exercises de test
 */

import 'dotenv/config';
import { db, exercises, workouts } from '../src/db';
import { eq } from 'drizzle-orm';

async function createTestWorkout() {
  try {
    console.log('🚀 Creating test workout for WorkoutPlayer V2...\n');

    // 1. Créer 3 exercises de test
    console.log('📝 Creating test exercises...');

    const exerciseData = [
      {
        name: 'Push-ups',
        description: 'Classic push-ups for chest and triceps',
        thumbnail_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800',
        category: 'chest' as const,
        difficulty_level: 'beginner' as const,
        equipment_required: ['bodyweight'],
        primary_muscles: ['pectorals', 'triceps'],
        secondary_muscles: ['shoulders', 'core'],
        instructions: [
          'Start in plank position',
          'Lower body until chest nearly touches floor',
          'Push back up to starting position',
          'Keep core tight throughout'
        ],
        is_premium: false,
      },
      {
        name: 'Bodyweight Squats',
        description: 'Basic squats for legs and glutes',
        thumbnail_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
        category: 'legs' as const,
        difficulty_level: 'beginner' as const,
        equipment_required: ['bodyweight'],
        primary_muscles: ['quadriceps', 'glutes'],
        secondary_muscles: ['hamstrings', 'calves'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower hips back and down',
          'Keep chest up and knees tracking over toes',
          'Push through heels to stand'
        ],
        is_premium: false,
      },
      {
        name: 'Plank Hold',
        description: 'Core stability exercise',
        thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
        category: 'core' as const,
        difficulty_level: 'beginner' as const,
        equipment_required: ['bodyweight'],
        primary_muscles: ['abs', 'core'],
        secondary_muscles: ['shoulders', 'glutes'],
        instructions: [
          'Start in forearm plank position',
          'Keep body in straight line from head to heels',
          'Engage core and glutes',
          'Hold position for specified time'
        ],
        is_premium: false,
      },
    ];

    // Insérer exercises
    const insertedExercises = await db.insert(exercises).values(exerciseData).returning();
    console.log(`✅ Created ${insertedExercises.length} test exercises`);

    // 2. Créer le workout
    console.log('\n📝 Creating test workout...');

    const [workout] = await db.insert(workouts).values({
      name: 'Quick Full Body Test',
      description: 'Simple full-body workout to test WorkoutPlayer V2 features',
      thumbnail_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      difficulty_level: 'beginner' as const,
      workout_type: 'strength' as const,
      estimated_duration: 20,
      is_premium: false,
      exercises: insertedExercises.map((ex: typeof insertedExercises[0], idx: number) => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        order_index: idx,
        sets: 3,
        reps: idx === 2 ? null : 12, // Plank = time-based
        duration_seconds: idx === 2 ? 30 : null, // Plank = 30s hold
        rest_seconds: 60,
        notes: idx === 0
          ? 'Focus on form, not speed'
          : idx === 1
          ? 'Go deep but keep knees safe'
          : 'Keep body straight, no sagging',
      })),
    }).returning();

    console.log(`✅ Created workout: "${workout.name}" (ID: ${workout.id})`);

    console.log('\n🎉 TEST WORKOUT CREATED SUCCESSFULLY!\n');
    console.log('📱 To test WorkoutPlayer V2:');
    console.log('   1. Launch app: npm start');
    console.log('   2. Go to Workouts tab');
    console.log(`   3. Find "${workout.name}"`);
    console.log('   4. Click "▶ Start Workout"');
    console.log('   5. BOOM! WorkoutPlayer V2 loads 🚀\n');

    console.log('🆔 Workout ID:', workout.id);
    console.log('   Direct link: /workout-player/' + workout.id);

  } catch (error) {
    console.error('❌ Error creating test workout:', error);
    throw error;
  }
}

createTestWorkout()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
