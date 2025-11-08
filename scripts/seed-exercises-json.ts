/**
 * Seed Exercises from JSON - Drizzle ORM
 *
 * Simple seed script that reads from exercises-seed.json
 *
 * Usage:
 * npx tsx scripts/seed-exercises-json.ts
 */

import 'dotenv/config'; // Load .env file
import * as fs from 'fs';
import * as path from 'path';
import { db, exercises } from '../src/db';
import { v4 as uuidv4 } from 'uuid';

interface ExerciseSeed {
  name: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  animation_url: string | null;
  category: string;
  difficulty_level: string;
  equipment_required: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  tips: string[];
  common_mistakes: string[];
  is_premium: boolean;
}

async function seedExercises() {
  try {
    console.log('🚀 Starting exercises seed from JSON...\n');

    // Read JSON file
    const jsonFilePath = path.join(__dirname, '../exercises-seed.json');
    console.log(`📂 Reading file: ${jsonFilePath}`);

    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`File not found: ${jsonFilePath}`);
    }

    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const exercisesList: ExerciseSeed[] = JSON.parse(jsonContent);

    console.log(`✅ File loaded with ${exercisesList.length} exercises\n`);

    // Delete existing exercises (clean slate)
    console.log('🗑️  Deleting existing exercises...');
    await db.delete(exercises);
    console.log('✅ Existing exercises deleted\n');

    // Prepare exercises for insertion
    const exercisesToInsert = exercisesList.map((ex) => ({
      id: uuidv4(),
      name: ex.name,
      description: ex.description,
      thumbnail_url: ex.thumbnail_url,
      video_url: ex.video_url,
      animation_url: ex.animation_url,
      category: ex.category as any,
      difficulty_level: ex.difficulty_level as any,
      equipment_required: ex.equipment_required,
      primary_muscles: ex.primary_muscles,
      secondary_muscles: ex.secondary_muscles,
      instructions: ex.instructions,
      tips: ex.tips,
      common_mistakes: ex.common_mistakes,
      is_premium: ex.is_premium,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Insert exercises in batches
    const BATCH_SIZE = 50;
    const batches = Math.ceil(exercisesToInsert.length / BATCH_SIZE);

    console.log(`📦 Inserting in ${batches} batch(es)...\n`);

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, exercisesToInsert.length);
      const batch = exercisesToInsert.slice(start, end);

      console.log(`⏳ Batch ${i + 1}/${batches}: Inserting exercises ${start + 1}-${end}...`);

      await db.insert(exercises).values(batch);

      console.log(`✅ Batch ${i + 1}/${batches} complete`);
    }

    console.log(`\n🎉 SUCCESS! ${exercisesToInsert.length} exercises inserted into Neon database!\n`);

    // Show sample exercises
    console.log('📋 Sample exercises inserted:');
    exercisesToInsert.slice(0, 10).forEach((ex, idx) => {
      console.log(
        `${idx + 1}. ${ex.name} (${ex.category}, ${ex.difficulty_level})`
      );
    });

    console.log('\n✨ Done! You can now use these exercises in the app.');
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed
seedExercises();
