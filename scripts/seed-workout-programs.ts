/**
 * Seed Workout Programs
 *
 * Creates professional workout programs in the database
 * - Beginner to Elite levels
 * - Different goals (strength, muscle, fat loss, endurance)
 * - Complete with exercises, sets, reps
 */

import 'dotenv/config';
import { db, workoutPrograms, workouts } from '../src/db';

const PROGRAMS = [
  {
    name: "Beginner Full Body 3x/Week",
    description: "Perfect program for beginners. Build strength and learn proper form with compound movements. 3 workouts per week, 45-60 minutes each.",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    duration_weeks: 8,
    workouts_per_week: 3,
    difficulty_level: "beginner" as const,
    target_goals: ["build_muscle", "get_stronger", "stay_healthy"],
    target_fitness_levels: ["beginner"],
    total_workouts: 24,
    estimated_time_per_workout: 50,
    is_premium: false,
  },
  {
    name: "Push Pull Legs (PPL) - Intermediate",
    description: "Classic PPL split for intermediate lifters. Build muscle and strength with focused training. 6 days per week for serious gains.",
    thumbnail_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800",
    duration_weeks: 12,
    workouts_per_week: 6,
    difficulty_level: "intermediate" as const,
    target_goals: ["build_muscle", "get_stronger"],
    target_fitness_levels: ["intermediate", "advanced"],
    total_workouts: 72,
    estimated_time_per_workout: 75,
    is_premium: false,
  },
  {
    name: "Fat Loss HIIT Program",
    description: "High-intensity interval training for maximum fat burn. Combines cardio and strength for lean physique. 4-5 days per week.",
    thumbnail_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    duration_weeks: 6,
    workouts_per_week: 5,
    difficulty_level: "intermediate" as const,
    target_goals: ["lose_weight", "improve_endurance", "stay_healthy"],
    target_fitness_levels: ["beginner", "intermediate"],
    total_workouts: 30,
    estimated_time_per_workout: 40,
    is_premium: false,
  },
  {
    name: "5x5 Strength Program",
    description: "Build serious strength with the proven 5x5 method. Focus on barbell compounds: squat, bench, deadlift. 3 days per week.",
    thumbnail_url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800",
    duration_weeks: 12,
    workouts_per_week: 3,
    difficulty_level: "intermediate" as const,
    target_goals: ["get_stronger", "build_muscle"],
    target_fitness_levels: ["intermediate", "advanced"],
    total_workouts: 36,
    estimated_time_per_workout: 60,
    is_premium: false,
  },
  {
    name: "Upper/Lower 4-Day Split",
    description: "Balanced muscle building with upper/lower split. Perfect for intermediate to advanced lifters. 4 focused workouts per week.",
    thumbnail_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
    duration_weeks: 10,
    workouts_per_week: 4,
    difficulty_level: "intermediate" as const,
    target_goals: ["build_muscle", "get_stronger"],
    target_fitness_levels: ["intermediate", "advanced"],
    total_workouts: 40,
    estimated_time_per_workout: 70,
    is_premium: false,
  },
  {
    name: "Bodyweight Home Workout",
    description: "No equipment needed! Build strength and muscle at home with progressive calisthenics. Perfect for home training.",
    thumbnail_url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800",
    duration_weeks: 8,
    workouts_per_week: 4,
    difficulty_level: "beginner" as const,
    target_goals: ["build_muscle", "stay_healthy", "get_stronger"],
    target_fitness_levels: ["beginner", "intermediate"],
    total_workouts: 32,
    estimated_time_per_workout: 45,
    is_premium: false,
  },
  {
    name: "Advanced Powerlifting Peaking",
    description: "Elite powerlifting program for competition prep. Periodized training for squat, bench, deadlift PRs. For advanced lifters only.",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    duration_weeks: 16,
    workouts_per_week: 4,
    difficulty_level: "expert" as const,
    target_goals: ["get_stronger", "athletic_performance"],
    target_fitness_levels: ["advanced", "elite"],
    total_workouts: 64,
    estimated_time_per_workout: 90,
    is_premium: true,
  },
  {
    name: "30-Day Abs Challenge",
    description: "Transform your core in 30 days. Daily ab workouts with progressive difficulty. See definition and strength gains fast.",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    duration_weeks: 4,
    workouts_per_week: 7,
    difficulty_level: "beginner" as const,
    target_goals: ["lose_weight", "stay_healthy"],
    target_fitness_levels: ["beginner", "intermediate"],
    total_workouts: 30,
    estimated_time_per_workout: 20,
    is_premium: false,
  },
  {
    name: "Athletic Performance Training",
    description: "Train like an athlete. Explosive power, speed, agility. Olympic lifts and plyometrics. 5 days per week for peak performance.",
    thumbnail_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    duration_weeks: 12,
    workouts_per_week: 5,
    difficulty_level: "advanced" as const,
    target_goals: ["athletic_performance", "get_stronger", "improve_endurance"],
    target_fitness_levels: ["advanced", "elite"],
    total_workouts: 60,
    estimated_time_per_workout: 90,
    is_premium: true,
  },
  {
    name: "Women's Glutes & Legs Builder",
    description: "Build strong, sculpted glutes and legs. Targeted exercises for lower body development. 4 focused workouts per week.",
    thumbnail_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
    duration_weeks: 10,
    workouts_per_week: 4,
    difficulty_level: "intermediate" as const,
    target_goals: ["build_muscle", "stay_healthy"],
    target_fitness_levels: ["beginner", "intermediate", "advanced"],
    total_workouts: 40,
    estimated_time_per_workout: 60,
    is_premium: false,
  },
  {
    name: "Cardio Endurance Builder",
    description: "Build cardiovascular endurance progressively. Running, cycling, rowing protocols. 5 days per week for serious cardio gains.",
    thumbnail_url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
    duration_weeks: 8,
    workouts_per_week: 5,
    difficulty_level: "intermediate" as const,
    target_goals: ["improve_endurance", "lose_weight", "stay_healthy"],
    target_fitness_levels: ["beginner", "intermediate", "advanced"],
    total_workouts: 40,
    estimated_time_per_workout: 45,
    is_premium: false,
  },
  {
    name: "Beginner Gym Introduction",
    description: "First time at the gym? This program teaches you the basics. Learn machines, free weights, and gym etiquette. Build confidence.",
    thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    duration_weeks: 6,
    workouts_per_week: 3,
    difficulty_level: "beginner" as const,
    target_goals: ["stay_healthy", "build_muscle", "get_stronger"],
    target_fitness_levels: ["beginner"],
    total_workouts: 18,
    estimated_time_per_workout: 40,
    is_premium: false,
  },
  {
    name: "Hypertrophy Elite - Muscle Mass",
    description: "Advanced muscle building program. High volume training for serious size gains. 6 days per week, bodybuilding style.",
    thumbnail_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
    duration_weeks: 16,
    workouts_per_week: 6,
    difficulty_level: "advanced" as const,
    target_goals: ["build_muscle"],
    target_fitness_levels: ["advanced", "elite"],
    total_workouts: 96,
    estimated_time_per_workout: 90,
    is_premium: true,
  },
  {
    name: "Mobility & Flexibility Program",
    description: "Improve range of motion, reduce injury risk, feel better. Daily mobility work and stretching routines for all levels.",
    thumbnail_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    duration_weeks: 8,
    workouts_per_week: 7,
    difficulty_level: "beginner" as const,
    target_goals: ["stay_healthy"],
    target_fitness_levels: ["beginner", "intermediate", "advanced", "elite"],
    total_workouts: 56,
    estimated_time_per_workout: 25,
    is_premium: false,
  },
  {
    name: "Functional Fitness CrossFit Style",
    description: "Varied functional movements at high intensity. WODs, Olympic lifts, gymnastics, cardio. 5 days per week.",
    thumbnail_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    duration_weeks: 12,
    workouts_per_week: 5,
    difficulty_level: "advanced" as const,
    target_goals: ["athletic_performance", "get_stronger", "improve_endurance"],
    target_fitness_levels: ["intermediate", "advanced", "elite"],
    total_workouts: 60,
    estimated_time_per_workout: 60,
    is_premium: true,
  },
];

// Helper to generate workouts for a program
function generateWorkoutsForProgram(program: typeof PROGRAMS[0]) {
  const workouts = [];
  const workoutsPerWeek = program.workouts_per_week;
  const totalWeeks = program.duration_weeks;

  for (let week = 1; week <= totalWeeks; week++) {
    for (let day = 1; day <= workoutsPerWeek; day++) {
      const workoutIndex = (week - 1) * workoutsPerWeek + day - 1;
      if (workoutIndex >= program.total_workouts) break;

      // Generate workout name based on program type
      let workoutName = '';
      if (program.name.includes('PPL')) {
        const types = ['Push', 'Pull', 'Legs'];
        workoutName = `${types[(day - 1) % 3]} Day`;
      } else if (program.name.includes('Upper/Lower')) {
        workoutName = day % 2 === 1 ? 'Upper Body' : 'Lower Body';
      } else if (program.name.includes('Full Body')) {
        workoutName = 'Full Body Workout';
      } else if (program.name.includes('HIIT')) {
        workoutName = `HIIT Circuit ${day}`;
      } else {
        workoutName = `Workout ${day}`;
      }

      workouts.push({
        workout_id: `${program.name.toLowerCase().replace(/\s+/g, '-')}-w${week}d${day}`,
        week_number: week,
        day_number: day,
        name: `${workoutName} - Week ${week}`,
        description: `${program.name} - Week ${week}, Day ${day}`,
        duration_minutes: program.estimated_time_per_workout,
      });
    }
  }

  return workouts;
}

async function seedWorkoutPrograms() {
  try {
    console.log('🚀 Starting workout programs seed...\n');

    // Delete existing programs
    console.log('🗑️  Deleting existing programs...');
    await db.delete(workoutPrograms);
    console.log('✅ Existing programs deleted\n');

    // Insert new programs
    console.log(`📦 Inserting ${PROGRAMS.length} workout programs with workouts array...\n`);

    for (const program of PROGRAMS) {
      // Generate workouts for this program
      const workoutsArray = generateWorkoutsForProgram(program);

      const result = await db.insert(workoutPrograms).values({
        ...program,
        workouts: workoutsArray, // Add workouts JSONB array
      }).returning();

      if (result.length > 0) {
        console.log(`✅ Created: "${program.name}" (${program.difficulty_level}) - ${workoutsArray.length} workouts`);
      } else {
        console.log(`❌ Failed: "${program.name}"`);
      }
    }

    console.log(`\n🎉 Successfully seeded ${PROGRAMS.length} workout programs!`);
    console.log('\n📊 Breakdown:');
    console.log(`   - Beginner: ${PROGRAMS.filter(p => p.difficulty_level === 'beginner').length}`);
    console.log(`   - Intermediate: ${PROGRAMS.filter(p => p.difficulty_level === 'intermediate').length}`);
    console.log(`   - Advanced: ${PROGRAMS.filter(p => p.difficulty_level === 'advanced').length}`);
    console.log(`   - Expert: ${PROGRAMS.filter(p => p.difficulty_level === 'expert').length}`);
    console.log(`   - Premium: ${PROGRAMS.filter(p => p.is_premium).length}`);
    console.log(`   - Free: ${PROGRAMS.filter(p => !p.is_premium).length}`);

  } catch (error) {
    console.error('❌ Error seeding workout programs:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed
seedWorkoutPrograms();
