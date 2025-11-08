/**
 * Seed Exercises Script - Drizzle ORM
 *
 * Parses exercises_rows.sql and inserts exercises into Neon via Drizzle
 *
 * Usage:
 * 1. Make sure DATABASE_URL is in .env
 * 2. Run: npx tsx scripts/seed-exercises.ts
 */

import 'dotenv/config'; // Load .env file
import * as fs from 'fs';
import * as path from 'path';
import { db, exercises } from '../src/db';

// Helper to parse PostgreSQL arrays {item1,item2}
function parsePostgresArray(str: string): string[] {
  if (!str || str === '{}') return [];
  return str
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .split(',')
    .map((item) => item.replace(/"/g, '').trim())
    .filter((item) => item.length > 0);
}

// Parse SQL file - extract exercises from INSERT statements
function parseExercisesFromSQL(sqlContent: string): any[] {
  console.log('📖 Parsing SQL file...');

  const exercisesList: any[] = [];

  // Extract everything after VALUES
  const valuesMatch = sqlContent.match(/VALUES\s+(.+)/s);
  if (!valuesMatch) {
    console.log('❌ No VALUES found in SQL file');
    return [];
  }

  let valuesSection = valuesMatch[1];

  // Simple approach: Split by timestamp pattern + closing paren
  // Each exercise ends with: '2025-10-23 HH:MM:SS.SSSSSS+00')
  const exerciseMatches = valuesSection.match(/\([^(]*?'[0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+\+00'\s*\)/g);

  if (!exerciseMatches) {
    console.log('❌ Could not find exercises in SQL');
    return [];
  }

  console.log(`Found ${exerciseMatches.length} exercise matches`);

  for (const exMatch of exerciseMatches) {
    try {
      // Remove outer parentheses
      const content = exMatch.slice(1, -1);

      // Extract values using regex
      const values: (string | null)[] = [];
      const regex = /'((?:[^'\\]|\\.)*)'/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        values.push(match[1]);
      }

      // Also check for null values by finding positions
      const parts = content.split(/, /);
      const allValues: (string | null)[] = [];

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed === 'null' || trimmed === 'NULL') {
          allValues.push(null);
        } else if (trimmed.startsWith("'")) {
          // Extract from values array
          const val = values.shift();
          allValues.push(val || null);
        } else if (trimmed.startsWith('{')) {
          // PostgreSQL array
          allValues.push(trimmed);
        } else if (trimmed === 'true' || trimmed === 'false') {
          allValues.push(trimmed);
        } else {
          allValues.push(trimmed);
        }
      }

      if (allValues.length < 15) {
        console.log(`Skipping exercise with only ${allValues.length} values`);
        continue;
      }

      const exercise = {
        id: allValues[0] as string,
        name: allValues[1] as string,
        description: allValues[2],
        thumbnail_url: allValues[3],
        video_url: allValues[4],
        animation_url: allValues[5],
        category: allValues[6] as any,
        difficulty_level: allValues[7] as any,
        equipment_required: parsePostgresArray((allValues[8] as string) || '{}'),
        primary_muscles: parsePostgresArray((allValues[9] as string) || '{}'),
        secondary_muscles: parsePostgresArray((allValues[10] as string) || '{}'),
        instructions: parsePostgresArray((allValues[11] as string) || '{}'),
        tips: parsePostgresArray((allValues[12] as string) || '{}'),
        common_mistakes: parsePostgresArray((allValues[13] as string) || '{}'),
        is_premium: allValues[14] === 'true',
        created_at: new Date(),
        updated_at: new Date(),
      };

      exercisesList.push(exercise);
    } catch (error: any) {
      console.log(`Error parsing exercise: ${error.message}`);
      continue;
    }
  }

  console.log(`✅ Parsed ${exercisesList.length} exercises`);
  return exercisesList;
}

// Main seed function
async function seedExercises() {
  try {
    console.log('🚀 Starting exercises seed...\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../exercises_rows.sql');
    console.log(`📂 Reading file: ${sqlFilePath}`);

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`File not found: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log(`✅ File loaded (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

    // Parse exercises
    const exercisesList = parseExercisesFromSQL(sqlContent);

    if (exercisesList.length === 0) {
      console.log('❌ No exercises found in SQL file');
      return;
    }

    console.log(`\n📊 Found ${exercisesList.length} exercises to insert\n`);

    // Delete existing exercises (clean slate)
    console.log('🗑️  Deleting existing exercises...');
    await db.delete(exercises);
    console.log('✅ Existing exercises deleted\n');

    // Insert exercises in batches (to avoid query size limits)
    const BATCH_SIZE = 50;
    const batches = Math.ceil(exercisesList.length / BATCH_SIZE);

    console.log(`📦 Inserting in ${batches} batches of ${BATCH_SIZE} exercises...\n`);

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, exercisesList.length);
      const batch = exercisesList.slice(start, end);

      console.log(`⏳ Batch ${i + 1}/${batches}: Inserting exercises ${start + 1}-${end}...`);

      await db.insert(exercises).values(batch);

      console.log(`✅ Batch ${i + 1}/${batches} complete`);
    }

    console.log(`\n🎉 SUCCESS! ${exercisesList.length} exercises inserted into Neon database!\n`);

    // Show sample exercises
    console.log('📋 Sample exercises inserted:');
    exercisesList.slice(0, 5).forEach((ex, idx) => {
      console.log(
        `${idx + 1}. ${ex.name} (${ex.category}, ${ex.difficulty_level}) - ${ex.primary_muscles.join(', ')}`
      );
    });

    console.log('\n✨ Done! Verify with: npx drizzle-kit studio');
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed
seedExercises();
