/**
 * Drizzle Nutrition Service
 *
 * Features:
 * - Meal Logging (breakfast, lunch, dinner, snacks)
 * - Daily Nutrition Tracking (calories, macros, water)
 * - Water Logging
 * - Recipes Library
 * - Nutrition Plans
 */

import { db, mealLogs, dailyNutritionLogs, waterLogs, recipes, nutritionPlans } from '@/db';
import { eq, desc, and, sql, gte, lte, asc } from 'drizzle-orm';
import { logger, toISOString, handleError } from '@/utils';

// =====================================================
// TYPES
// =====================================================

export interface MealLog {
  id: string;
  user_id: string;
  meal_name: string;
  meal_type: string | null; // breakfast, lunch, dinner, snack
  meal_time: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateMealLogData {
  user_id: string;
  meal_name: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_time?: Date;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  photo_url?: string;
  notes?: string;
}

export interface DailyNutritionLog {
  id: string;
  user_id: string;
  log_date: string;
  calories_consumed: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  water_ml: number;
  water_glasses: number;
  calories_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fats_target: number | null;
  water_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  difficulty: string | null;
  ingredients: any;
  instructions: string[];
  tags: string[] | null;
  meal_type: string | null;
  is_premium: boolean;
  saves_count: number;
  average_rating: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  calories_target: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// MEAL LOGS
// =====================================================

/**
 * Get meal logs for a specific date
 */
export const getMealLogsByDate = async (userId: string, date: Date): Promise<MealLog[]> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.user_id, userId),
          gte(mealLogs.meal_time, startOfDay),
          lte(mealLogs.meal_time, endOfDay)
        )
      )
      .orderBy(asc(mealLogs.meal_time));

    return logs.map((log: any) => ({
      ...log,
      meal_time: toISOString(log.meal_time),
      created_at: toISOString(log.created_at),
      protein_g: log.protein_g ? parseFloat(log.protein_g as any) : null,
      carbs_g: log.carbs_g ? parseFloat(log.carbs_g as any) : null,
      fats_g: log.fats_g ? parseFloat(log.fats_g as any) : null,
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load meals',
      description: 'Unable to load your meals for this date',
      showToast: true,
      context: 'NutritionService.getMealLogsByDate',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Create meal log
 */
export const createMealLog = async (data: CreateMealLogData): Promise<MealLog> => {
  try {
    const [newLog] = await db
      .insert(mealLogs)
      .values({
        user_id: data.user_id,
        meal_name: data.meal_name,
        meal_type: data.meal_type || null,
        meal_time: data.meal_time || new Date(),
        calories: data.calories || null,
        protein_g: data.protein_g?.toString() as any || null,
        carbs_g: data.carbs_g?.toString() as any || null,
        fats_g: data.fats_g?.toString() as any || null,
        photo_url: data.photo_url || null,
        notes: data.notes || null,
      })
      .returning();

    // Update daily nutrition log
    await updateDailyNutritionLog(
      data.user_id,
      data.meal_time || new Date(),
      data.calories || 0,
      data.protein_g || 0,
      data.carbs_g || 0,
      data.fats_g || 0
    );

    return {
      ...newLog,
      meal_time: toISOString(newLog.meal_time),
      created_at: toISOString(newLog.created_at),
      protein_g: newLog.protein_g ? parseFloat(newLog.protein_g as any) : null,
      carbs_g: newLog.carbs_g ? parseFloat(newLog.carbs_g as any) : null,
      fats_g: newLog.fats_g ? parseFloat(newLog.fats_g as any) : null,
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to log meal',
      description: 'Could not save your meal',
      showToast: true,
      context: 'NutritionService.createMealLog',
    });
    throw error;
  }
};

/**
 * Delete meal log
 */
export const deleteMealLog = async (logId: string, userId: string): Promise<void> => {
  try {
    // Get log first to subtract from daily
    const [log] = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.id, logId), eq(mealLogs.user_id, userId)))
      .limit(1);

    if (!log) return;

    // Delete log
    await db
      .delete(mealLogs)
      .where(and(eq(mealLogs.id, logId), eq(mealLogs.user_id, userId)));

    // Update daily nutrition log (subtract)
    await updateDailyNutritionLog(
      userId,
      log.meal_time || new Date(),
      -(log.calories || 0),
      -(parseFloat(log.protein_g as any) || 0),
      -(parseFloat(log.carbs_g as any) || 0),
      -(parseFloat(log.fats_g as any) || 0)
    );
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete meal',
      description: 'Could not delete your meal log',
      showToast: true,
      context: 'NutritionService.deleteMealLog',
    });
    throw error;
  }
};

// =====================================================
// DAILY NUTRITION LOGS
// =====================================================

/**
 * Get or create daily nutrition log
 */
export const getDailyNutritionLog = async (userId: string, date: Date): Promise<DailyNutritionLog> => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Try to get existing log
    const existingLog = await db
      .select()
      .from(dailyNutritionLogs)
      .where(
        and(
          eq(dailyNutritionLogs.user_id, userId),
          eq(dailyNutritionLogs.log_date, dateStr as any)
        )
      )
      .limit(1);

    if (existingLog.length > 0) {
      const log = existingLog[0];
      return {
        ...log,
        log_date: toISOString(log.log_date, dateStr),
        created_at: toISOString(log.created_at),
        updated_at: toISOString(log.updated_at),
      };
    }

    // Create new log
    const [newLog] = await db
      .insert(dailyNutritionLogs)
      .values({
        user_id: userId,
        log_date: dateStr as any,
        calories_consumed: 0,
        protein_g: 0,
        carbs_g: 0,
        fats_g: 0,
        water_ml: 0,
        water_glasses: 0,
      })
      .returning();

    return {
      ...newLog,
      log_date: toISOString(newLog.log_date, dateStr),
      created_at: toISOString(newLog.created_at),
      updated_at: toISOString(newLog.updated_at),
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load nutrition data',
      description: 'Unable to load daily nutrition log',
      showToast: true,
      context: 'NutritionService.getDailyNutritionLog',
    });
    throw error;
  }
};

/**
 * Update daily nutrition log (add or subtract values)
 */
const updateDailyNutritionLog = async (
  userId: string,
  date: Date,
  caloriesDelta: number,
  proteinDelta: number,
  carbsDelta: number,
  fatsDelta: number
): Promise<void> => {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Get or create log
    await getDailyNutritionLog(userId, date);

    // Update
    await db
      .update(dailyNutritionLogs)
      .set({
        calories_consumed: sql`${dailyNutritionLogs.calories_consumed} + ${caloriesDelta}`,
        protein_g: sql`${dailyNutritionLogs.protein_g} + ${proteinDelta}`,
        carbs_g: sql`${dailyNutritionLogs.carbs_g} + ${carbsDelta}`,
        fats_g: sql`${dailyNutritionLogs.fats_g} + ${fatsDelta}`,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          eq(dailyNutritionLogs.user_id, userId),
          eq(dailyNutritionLogs.log_date, dateStr as any)
        )
      );
  } catch (error) {
    handleError(error, {
      message: 'Failed to update nutrition data',
      showToast: false, // Internal function
      context: 'NutritionService.updateDailyNutritionLog',
    });
    throw error;
  }
};

/**
 * Set nutrition targets
 */
export const setNutritionTargets = async (
  userId: string,
  date: Date,
  targets: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    water?: number;
  }
): Promise<void> => {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Get or create log
    await getDailyNutritionLog(userId, date);

    // Update targets
    await db
      .update(dailyNutritionLogs)
      .set({
        calories_target: targets.calories !== undefined ? targets.calories : sql`${dailyNutritionLogs.calories_target}`,
        protein_target: targets.protein !== undefined ? targets.protein : sql`${dailyNutritionLogs.protein_target}`,
        carbs_target: targets.carbs !== undefined ? targets.carbs : sql`${dailyNutritionLogs.carbs_target}`,
        fats_target: targets.fats !== undefined ? targets.fats : sql`${dailyNutritionLogs.fats_target}`,
        water_target: targets.water !== undefined ? targets.water : sql`${dailyNutritionLogs.water_target}`,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          eq(dailyNutritionLogs.user_id, userId),
          eq(dailyNutritionLogs.log_date, dateStr as any)
        )
      );
  } catch (error) {
    handleError(error, {
      message: 'Failed to set targets',
      description: 'Could not update your nutrition targets',
      showToast: true,
      context: 'NutritionService.setNutritionTargets',
    });
    throw error;
  }
};

// =====================================================
// WATER LOGS
// =====================================================

/**
 * Add water log
 */
export const addWaterLog = async (userId: string, amountMl: number): Promise<WaterLog> => {
  try {
    const [newLog] = await db
      .insert(waterLogs)
      .values({
        user_id: userId,
        amount_ml: amountMl,
      })
      .returning();

    // Update daily nutrition log
    const dateStr = new Date().toISOString().split('T')[0];

    await db
      .update(dailyNutritionLogs)
      .set({
        water_ml: sql`${dailyNutritionLogs.water_ml} + ${amountMl}`,
        water_glasses: sql`${dailyNutritionLogs.water_glasses} + ${Math.floor(amountMl / 250)}`,
        updated_at: toISOString(new Date()),
      })
      .where(
        and(
          eq(dailyNutritionLogs.user_id, userId),
          eq(dailyNutritionLogs.log_date, dateStr as any)
        )
      );

    return {
      ...newLog,
      logged_at: toISOString(newLog.logged_at),
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to log water',
      description: 'Could not save water intake',
      showToast: true,
      context: 'NutritionService.addWaterLog',
    });
    throw error;
  }
};

/**
 * Get water logs for today
 */
export const getTodayWaterLogs = async (userId: string): Promise<WaterLog[]> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await db
      .select()
      .from(waterLogs)
      .where(
        and(
          eq(waterLogs.user_id, userId),
          gte(waterLogs.logged_at, startOfDay),
          lte(waterLogs.logged_at, endOfDay)
        )
      )
      .orderBy(desc(waterLogs.logged_at));

    return logs.map((log: any) => ({
      ...log,
      logged_at: toISOString(log.logged_at),
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load water logs',
      description: 'Unable to load your water intake',
      showToast: true,
      context: 'NutritionService.getTodayWaterLogs',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// RECIPES
// =====================================================

/**
 * Get recipes (with filters)
 */
export const getRecipes = async (filters?: {
  meal_type?: string;
  tags?: string[];
  is_premium?: boolean;
  limit?: number;
}): Promise<Recipe[]> => {
  try {
    let query = db.select().from(recipes);

    // Apply filters
    const conditions = [];
    if (filters?.meal_type) {
      conditions.push(eq(recipes.meal_type, filters.meal_type));
    }
    if (filters?.is_premium !== undefined) {
      conditions.push(eq(recipes.is_premium, filters.is_premium));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(recipes.saves_count)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const recipesData = await query;

    return recipesData.map((recipe: any) => ({
      ...recipe,
      created_at: toISOString(recipe.created_at),
      updated_at: toISOString(recipe.updated_at),
      average_rating: recipe.average_rating?.toString() || '0',
    }));
  } catch (error) {
    handleError(error, {
      message: 'Failed to load recipes',
      description: 'Unable to load recipe library',
      showToast: true,
      context: 'NutritionService.getRecipes',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  try {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) return null;

    return {
      ...recipe,
      created_at: toISOString(recipe.created_at),
      updated_at: toISOString(recipe.updated_at),
      average_rating: recipe.average_rating?.toString() || '0',
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load recipe',
      description: 'Unable to load recipe details',
      showToast: true,
      context: 'NutritionService.getRecipeById',
    });
    throw error; // Let React Query handle error state
  }
};

// =====================================================
// NUTRITION PLANS
// =====================================================

/**
 * Get active nutrition plan
 */
export const getActiveNutritionPlan = async (userId: string): Promise<NutritionPlan | null> => {
  try {
    const [plan] = await db
      .select()
      .from(nutritionPlans)
      .where(
        and(
          eq(nutritionPlans.user_id, userId),
          eq(nutritionPlans.is_active, true)
        )
      )
      .orderBy(desc(nutritionPlans.created_at))
      .limit(1);

    if (!plan) return null;

    return {
      ...plan,
      start_date: toISOString(plan.start_date),
      end_date: plan.end_date ? toISOString(plan.end_date) : null,
      created_at: toISOString(plan.created_at),
      updated_at: toISOString(plan.updated_at),
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to load nutrition plan',
      description: 'Unable to load your nutrition plan',
      showToast: true,
      context: 'NutritionService.getActiveNutritionPlan',
    });
    throw error; // Let React Query handle error state
  }
};

/**
 * Create nutrition plan
 */
export const createNutritionPlan = async (data: {
  user_id: string;
  name: string;
  description?: string;
  calories_target: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  start_date?: Date;
  end_date?: Date;
}): Promise<NutritionPlan> => {
  try {
    // Deactivate all existing plans
    await db
      .update(nutritionPlans)
      .set({ is_active: false, updated_at: toISOString(new Date()) })
      .where(eq(nutritionPlans.user_id, data.user_id));

    // Create new plan
    const [newPlan] = await db
      .insert(nutritionPlans)
      .values({
        user_id: data.user_id,
        name: data.name,
        description: data.description || null,
        calories_target: data.calories_target,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fats_g: data.fats_g,
        start_date: (data.start_date || new Date()) as any,
        end_date: data.end_date as any || null,
        is_active: true,
      })
      .returning();

    return {
      ...newPlan,
      start_date: toISOString(newPlan.start_date),
      end_date: newPlan.end_date ? toISOString(newPlan.end_date) : null,
      created_at: toISOString(newPlan.created_at),
      updated_at: toISOString(newPlan.updated_at),
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to create nutrition plan',
      description: 'Could not save your nutrition plan',
      showToast: true,
      context: 'NutritionService.createNutritionPlan',
    });
    throw error;
  }
};
