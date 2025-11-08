/**
 * Seed Nutrition Data
 * Creates realistic recipes and meal plans
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

// =====================================================
// SAMPLE RECIPES
// =====================================================

const RECIPES = [
  {
    name: 'Grilled Chicken & Quinoa Bowl',
    description: 'High-protein meal with grilled chicken breast, quinoa, roasted vegetables, and avocado',
    calories: 520,
    protein_g: 45,
    carbs_g: 48,
    fats_g: 15,
    prep_time_minutes: 25,
    cook_time_minutes: 20,
    servings: 2,
    difficulty: 'easy',
    meal_type: 'lunch',
    is_premium: false,
    tags: ['high-protein', 'gluten-free', 'meal-prep'],
    ingredients: [
      { name: 'Chicken breast', amount: '300g', calories: 330 },
      { name: 'Quinoa', amount: '1 cup cooked', calories: 220 },
      { name: 'Mixed vegetables', amount: '2 cups', calories: 100 },
      { name: 'Avocado', amount: '1/2', calories: 120 },
      { name: 'Olive oil', amount: '1 tbsp', calories: 120 },
    ],
    instructions: [
      'Season chicken breast with salt, pepper, and herbs',
      'Grill chicken for 6-7 minutes per side until fully cooked',
      'Cook quinoa according to package instructions',
      'Roast vegetables with olive oil at 400°F for 20 minutes',
      'Slice avocado and arrange all components in a bowl',
      'Serve warm and enjoy!',
    ],
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  },
  {
    name: 'Greek Yogurt Protein Pancakes',
    description: 'Fluffy protein-packed pancakes made with Greek yogurt, oats, and banana',
    calories: 380,
    protein_g: 28,
    carbs_g: 52,
    fats_g:8,
    fiber_g: 6,
    prep_time_minutes: 10,
    cook_time_minutes:15,
    servings: 2,
    difficulty: 'easy',
    meal_type: 'breakfast',
    is_premium: false,
    tags: ['high-protein', 'breakfast', 'vegetarian'],
    ingredients: [
      { name: 'Greek yogurt', amount: '200g', calories: 130 },
      { name: 'Oats', amount: '1 cup', calories: 300 },
      { name: 'Banana', amount: '1 large', calories: 120 },
      { name: 'Eggs', amount: '2', calories: 140 },
      { name: 'Protein powder', amount: '1 scoop', calories: 120 },
    ],
    instructions: [
      'Blend oats into flour consistency',
      'Mix all ingredients in a bowl until smooth',
      'Heat non-stick pan over medium heat',
      'Pour batter to make 4-5 pancakes',
      'Cook 2-3 minutes per side until golden',
      'Top with berries and honey',
    ],
    image_url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93',
  },
  {
    name: 'Salmon & Sweet Potato',
    description: 'Baked salmon fillet with roasted sweet potato and green beans',
    calories: 485,
    protein_g: 38,
    carbs_g: 42,
    fats_g:18,
    fiber_g: 7,
    prep_time_minutes: 15,
    cook_time_minutes:25,
    servings: 1,
    difficulty: 'medium',
    meal_type: 'dinner',
    is_premium: true,
    tags: ['high-protein', 'omega-3', 'gluten-free'],
    ingredients: [
      { name: 'Salmon fillet', amount: '200g', calories: 280 },
      { name: 'Sweet potato', amount: '1 medium', calories: 130 },
      { name: 'Green beans', amount: '150g', calories: 45 },
      { name: 'Lemon', amount: '1/2', calories: 10 },
      { name: 'Olive oil', amount: '1 tbsp', calories: 120 },
    ],
    instructions: [
      'Preheat oven to 400°F',
      'Cut sweet potato into cubes and toss with oil',
      'Place salmon on baking sheet, season with salt and lemon',
      'Roast sweet potato for 15 minutes',
      'Add salmon and green beans, roast 12 more minutes',
      'Serve hot with lemon wedges',
    ],
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
  },
  {
    name: 'Protein Overnight Oats',
    description: 'Easy prep breakfast with oats, protein powder, chia seeds, and berries',
    calories: 350,
    protein_g: 25,
    carbs_g: 45,
    fats_g:10,
    fiber_g: 10,
    prep_time_minutes: 5,
    cook_time_minutes:0,
    servings: 1,
    difficulty: 'easy',
    meal_type: 'breakfast',
    is_premium: false,
    tags: ['high-protein', 'meal-prep', 'vegetarian', 'quick'],
    ingredients: [
      { name: 'Oats', amount: '1/2 cup', calories: 150 },
      { name: 'Protein powder', amount: '1 scoop', calories: 120 },
      { name: 'Almond milk', amount: '1 cup', calories: 40 },
      { name: 'Chia seeds', amount: '1 tbsp', calories: 60 },
      { name: 'Mixed berries', amount: '1/2 cup', calories: 40 },
    ],
    instructions: [
      'Combine oats, protein powder, and chia seeds in jar',
      'Add almond milk and stir well',
      'Refrigerate overnight (or minimum 4 hours)',
      'Top with berries before eating',
      'Enjoy cold or microwave for 30 seconds',
    ],
    image_url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf',
  },
  {
    name: 'Turkey & Veggie Stir-Fry',
    description: 'Quick high-protein stir-fry with ground turkey and colorful vegetables',
    calories: 420,
    protein_g: 42,
    carbs_g: 32,
    fats_g:14,
    fiber_g: 6,
    prep_time_minutes: 10,
    cook_time_minutes:15,
    servings: 2,
    difficulty: 'easy',
    meal_type: 'dinner',
    is_premium: false,
    tags: ['high-protein', 'low-carb', 'quick'],
    ingredients: [
      { name: 'Ground turkey', amount: '400g', calories: 480 },
      { name: 'Bell peppers', amount: '2', calories: 60 },
      { name: 'Broccoli', amount: '2 cups', calories: 60 },
      { name: 'Soy sauce', amount: '2 tbsp', calories: 20 },
      { name: 'Brown rice', amount: '1 cup cooked', calories: 220 },
    ],
    instructions: [
      'Heat pan over high heat with oil',
      'Cook ground turkey until browned',
      'Add chopped vegetables and stir-fry 5 minutes',
      'Add soy sauce and seasonings',
      'Serve over brown rice',
      'Garnish with sesame seeds',
    ],
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
  },
  {
    name: 'Egg White Veggie Omelet',
    description: 'Low-fat, high-protein omelet loaded with fresh vegetables',
    calories: 220,
    protein_g: 24,
    carbs_g: 18,
    fats_g:6,
    fiber_g: 4,
    prep_time_minutes: 5,
    cook_time_minutes:10,
    servings: 1,
    difficulty: 'easy',
    meal_type: 'breakfast',
    is_premium: false,
    tags: ['high-protein', 'low-calorie', 'vegetarian'],
    ingredients: [
      { name: 'Egg whites', amount: '6', calories: 100 },
      { name: 'Spinach', amount: '1 cup', calories: 7 },
      { name: 'Tomatoes', amount: '1/2 cup', calories: 15 },
      { name: 'Mushrooms', amount: '1/2 cup', calories: 15 },
      { name: 'Low-fat cheese', amount: '30g', calories: 80 },
    ],
    instructions: [
      'Whisk egg whites with salt and pepper',
      'Sauté vegetables in non-stick pan',
      'Pour egg whites over vegetables',
      'Cook until edges set, then fold omelet',
      'Add cheese and cover to melt',
      'Serve immediately',
    ],
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
  },
  {
    name: 'Beef & Broccoli Bowl',
    description: 'Asian-inspired lean beef with steamed broccoli and jasmine rice',
    calories: 540,
    protein_g: 46,
    carbs_g: 54,
    fats_g:16,
    fiber_g: 5,
    prep_time_minutes: 15,
    cook_time_minutes:20,
    servings: 2,
    difficulty: 'medium',
    meal_type: 'dinner',
    is_premium: true,
    tags: ['high-protein', 'asian'],
    ingredients: [
      { name: 'Lean beef', amount: '300g', calories: 450 },
      { name: 'Broccoli', amount: '3 cups', calories: 90 },
      { name: 'Jasmine rice', amount: '1 cup cooked', calories: 200 },
      { name: 'Oyster sauce', amount: '2 tbsp', calories: 40 },
      { name: 'Garlic & ginger', amount: '2 tbsp', calories: 20 },
    ],
    instructions: [
      'Slice beef thinly against the grain',
      'Marinate with soy sauce and cornstarch',
      'Stir-fry beef in hot wok until browned',
      'Remove beef, add broccoli and steam',
      'Return beef, add sauce and toss',
      'Serve over jasmine rice',
    ],
    image_url: 'https://images.unsplash.com/photo-1603073163308-9d1cb13f9b25',
  },
  {
    name: 'Tuna Protein Salad',
    description: 'Fresh tuna salad with mixed greens, chickpeas, and lemon vinaigrette',
    calories: 380,
    protein_g: 35,
    carbs_g: 28,
    fats_g:14,
    fiber_g: 8,
    prep_time_minutes: 10,
    cook_time_minutes:0,
    servings: 1,
    difficulty: 'easy',
    meal_type: 'lunch',
    is_premium: false,
    tags: ['high-protein', 'low-carb', 'quick', 'salad'],
    ingredients: [
      { name: 'Canned tuna', amount: '150g', calories: 150 },
      { name: 'Mixed greens', amount: '3 cups', calories: 30 },
      { name: 'Chickpeas', amount: '1/2 cup', calories: 140 },
      { name: 'Cherry tomatoes', amount: '1 cup', calories: 30 },
      { name: 'Olive oil dressing', amount: '1 tbsp', calories: 120 },
    ],
    instructions: [
      'Drain tuna and flake with fork',
      'Wash and dry mixed greens',
      'Combine all vegetables in bowl',
      'Top with tuna and chickpeas',
      'Drizzle with lemon vinaigrette',
      'Toss gently and serve',
    ],
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1',
  },
];

// =====================================================
// SEED FUNCTIONS
// =====================================================

async function clearExistingData() {
  console.log('🗑️  Clearing existing nutrition data...\n');

  await sql`DELETE FROM meal_logs`;
  await sql`DELETE FROM water_logs`;
  await sql`DELETE FROM daily_nutrition_logs`;
  await sql`DELETE FROM recipes`;

  console.log('✅ Existing data cleared\n');
}

async function seedRecipes() {
  console.log('🍽️  Seeding recipes...\n');

  for (const recipe of RECIPES) {
    await sql`
      INSERT INTO recipes (
        name, description, calories, protein_g, carbs_g, fats_g,
        prep_time_minutes, cook_time_minutes, servings, difficulty,
        meal_type, is_premium, tags, ingredients, instructions, image_url,
        average_rating, created_at
      ) VALUES (
        ${recipe.name},
        ${recipe.description},
        ${recipe.calories},
        ${recipe.protein_g},
        ${recipe.carbs_g},
        ${recipe.fats_g},
        ${recipe.prep_time_minutes},
        ${recipe.cook_time_minutes},
        ${recipe.servings},
        ${recipe.difficulty},
        ${recipe.meal_type},
        ${recipe.is_premium},
        ${recipe.tags},
        ${JSON.stringify(recipe.ingredients)},
        ${recipe.instructions},
        ${recipe.image_url},
        ${(Math.random() * 1 + 4).toFixed(1)},
        NOW()
      )
    `;

    const isPremium = recipe.is_premium ? '👑' : '  ';
    console.log(`✅ ${isPremium} ${recipe.name}`);
    console.log(`   → ${recipe.calories} kcal | P: ${recipe.protein_g}g | C: ${recipe.carbs_g}g | F: ${recipe.fats_g}g`);
    console.log(`   → ${recipe.meal_type} | ${recipe.difficulty} | ${recipe.prep_time_minutes + recipe.cook_time_minutes} min\n`);
  }
}

async function seedDailyLogs() {
  console.log('📊 Seeding daily nutrition logs...\n');

  // Get first user
  const users = await sql`SELECT id FROM profiles LIMIT 1`;

  if (users.length === 0) {
    console.log('⚠️  No users found. Creating demo user...');
    await sql`
      INSERT INTO profiles (id, full_name, email, created_at)
      VALUES ('demo-user-1', 'Demo User', 'demo@athletica.com', NOW())
    `;
  }

  const userId = users[0]?.id || 'demo-user-1';

  // Create logs for last 7 days
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const logDate = new Date(now);
    logDate.setDate(now.getDate() - i);
    const dateStr = logDate.toISOString().split('T')[0];

    const caloriesConsumed = 1800 + Math.floor(Math.random() * 600);
    const proteinG = 120 + Math.floor(Math.random() * 60);
    const carbsG = 180 + Math.floor(Math.random() * 80);
    const fatsG = 50 + Math.floor(Math.random() * 30);
    const waterGlasses = 6 + Math.floor(Math.random() * 4);

    await sql`
      INSERT INTO daily_nutrition_logs (
        user_id, log_date, calories_consumed, calories_target,
        protein_g, protein_target, carbs_g, carbs_target,
        fats_g, fats_target, water_ml, water_glasses,
        created_at
      ) VALUES (
        ${userId},
        ${dateStr},
        ${caloriesConsumed}, 2200,
        ${proteinG}, 165,
        ${carbsG}, 220,
        ${fatsG}, 73,
        ${waterGlasses * 250}, ${waterGlasses},
        NOW()
      )
    `;

    console.log(`✅ Day ${i + 1}: ${dateStr}`);
    console.log(`   → ${caloriesConsumed} kcal | ${waterGlasses} glasses water\n`);
  }
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('🔥 NUTRITION DATA SEEDER\n');
  console.log('════════════════════════════════════════\n');

  try {
    await clearExistingData();
    await seedRecipes();
    await seedDailyLogs();

    console.log('════════════════════════════════════════\n');
    console.log('🎉 SUCCESS!\n');
    console.log(`✅ ${RECIPES.length} recipes created`);
    console.log('✅ 7 days of nutrition logs created\n');
    console.log('🔥 Nutrition data is ready!\n');
  } catch (error) {
    console.error('❌ Error seeding nutrition data:', error);
    throw error;
  }
}

main();
