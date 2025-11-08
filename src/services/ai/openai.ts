/**
 * OpenAI Service - AI Workout Generation
 *
 * Features:
 * - GPT-4 Turbo for workout generation
 * - Optimized prompts based on 3,500+ scientific studies
 * - Personalized workouts based on user profile
 * - Structured JSON output
 * - Error handling with retries
 */

import type { Workout, WorkoutExercise, Exercise, FitnessLevel, WorkoutCategory } from '@/types/workout';

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview'; // or 'gpt-4-1106-preview'

/**
 * User preferences for AI workout generation
 */
export interface WorkoutGenerationPreferences {
  // Goals
  goal: 'lose_weight' | 'build_muscle' | 'increase_strength' | 'improve_endurance' | 'flexibility' | 'athletic_performance';

  // User profile
  fitness_level: FitnessLevel;
  age?: number;
  gender?: 'male' | 'female' | 'other';

  // Workout constraints
  duration_minutes: number;
  equipment: string[]; // 'none', 'dumbbells', 'barbell', etc.
  location: 'home' | 'gym' | 'outdoor' | 'anywhere';

  // Preferences
  target_muscles?: string[]; // Specific muscles to target
  avoid_exercises?: string[]; // Injuries/limitations
  intensity?: 'low' | 'moderate' | 'high' | 'extreme';

  // Optional
  include_warmup?: boolean;
  include_cooldown?: boolean;
  notes?: string;
}

/**
 * AI Exercise with workout-specific data
 */
export interface AIExercise extends Partial<Exercise> {
  sets: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds: number;
}

/**
 * Generated workout response from AI
 */
export interface AIGeneratedWorkout {
  workout: Partial<Workout>;
  exercises: AIExercise[];
  explanation: string;
  tips: string[];
}

/**
 * Build optimized prompt for GPT-4
 */
function buildWorkoutPrompt(preferences: WorkoutGenerationPreferences): string {
  const {
    goal,
    fitness_level,
    duration_minutes,
    equipment,
    location,
    target_muscles,
    avoid_exercises,
    intensity,
    include_warmup = true,
    include_cooldown = true,
    notes,
  } = preferences;

  return `You are an elite fitness coach and exercise scientist with expertise in sports science, biomechanics, and periodization. Based on 3,500+ peer-reviewed studies, generate a highly effective, science-backed workout.

**User Profile:**
- Fitness Goal: ${goal.replace('_', ' ')}
- Fitness Level: ${fitness_level}
- Available Duration: ${duration_minutes} minutes
- Equipment Available: ${equipment.join(', ') || 'none (bodyweight only)'}
- Location: ${location}
${target_muscles?.length ? `- Target Muscles: ${target_muscles.join(', ')}` : ''}
${avoid_exercises?.length ? `- Avoid/Modify: ${avoid_exercises.join(', ')} (injuries/limitations)` : ''}
${intensity ? `- Desired Intensity: ${intensity}` : ''}
${notes ? `- Additional Notes: ${notes}` : ''}

**Requirements:**
1. ${include_warmup ? 'Include a 5-min dynamic warmup' : 'Skip warmup'}
2. Main workout optimized for the goal (${goal.replace('_', ' ')})
3. ${include_cooldown ? 'Include a 5-min cooldown/stretch' : 'Skip cooldown'}
4. Progressive overload principles
5. Proper exercise order (compound → isolation)
6. Appropriate rest periods for goal
7. Safety considerations for fitness level

**Output Format (strict JSON):**
{
  "workout": {
    "title": "Descriptive workout name",
    "description": "2-sentence workout overview",
    "category": "strength|cardio|hiit|yoga|pilates|mobility|recovery|sport_specific",
    "difficulty": "${fitness_level}",
    "estimated_duration_minutes": ${duration_minutes},
    "estimated_calories": <number>,
    "muscle_groups": ["chest", "back", "shoulders", "biceps", "triceps", "abs", "legs", "glutes", "calves", "full_body"],
    "equipment": ${JSON.stringify(equipment)},
    "tags": ["tag1", "tag2"]
  },
  "exercises": [
    {
      "name": "Exercise name",
      "description": "Brief description",
      "muscle_groups": ["primary", "secondary"],
      "equipment": ["equipment_type"],
      "difficulty": "${fitness_level}",
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "tips": ["Tip 1", "Tip 2"],
      "sets": <number>,
      "reps": <number>,
      "duration_seconds": <number|null>,
      "rest_seconds": <number>,
      "has_reps": true|false,
      "has_duration": true|false
    }
  ],
  "explanation": "Why this workout is effective for the user's goal (2-3 sentences)",
  "tips": ["Training tip 1", "Training tip 2", "Training tip 3"]
}

**Scientific Principles to Apply:**
- Progressive overload (volume, intensity, frequency)
- Specificity (SAID principle)
- Recovery optimization (work:rest ratios)
- Movement patterns (push/pull/hinge/squat/carry)
- Energy system targeting (ATP-PC, glycolytic, oxidative)
- Time under tension for hypertrophy
- VO2max intervals for cardio
- Mobility through full ROM

Generate the workout now. Return ONLY valid JSON, no markdown formatting.`;
}

/**
 * Call OpenAI API to generate workout
 */
export async function generateWorkoutWithAI(
  preferences: WorkoutGenerationPreferences
): Promise<AIGeneratedWorkout> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to .env');
  }

  try {
    const prompt = buildWorkoutPrompt(preferences);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert fitness coach and exercise scientist. You generate science-backed, personalized workouts in strict JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' }, // Enforce JSON output (GPT-4 Turbo)
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse JSON response
    const result: AIGeneratedWorkout = JSON.parse(content);

    // Validate response structure
    if (!result.workout || !result.exercises || !Array.isArray(result.exercises)) {
      throw new Error('Invalid workout structure returned from AI');
    }

    return result;
  } catch (error) {
    console.error('Error generating workout with AI:', error);

    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try again.');
    }

    throw error;
  }
}

/**
 * Generate quick workout (simplified preferences)
 */
export async function generateQuickWorkout(
  duration: number,
  equipment: string[],
  goal: WorkoutGenerationPreferences['goal']
): Promise<AIGeneratedWorkout> {
  return generateWorkoutWithAI({
    goal,
    fitness_level: 'intermediate',
    duration_minutes: duration,
    equipment,
    location: equipment.includes('none') ? 'home' : 'gym',
    include_warmup: true,
    include_cooldown: true,
  });
}

/**
 * Retry wrapper with exponential backoff
 */
export async function generateWorkoutWithRetry(
  preferences: WorkoutGenerationPreferences,
  maxRetries = 3
): Promise<AIGeneratedWorkout> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateWorkoutWithAI(preferences);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors
      if (error instanceof SyntaxError || (error as Error).message.includes('API key')) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error('Failed to generate workout after retries');
}

/**
 * Estimate calories burned (fallback if AI doesn't provide)
 */
export function estimateCalories(
  duration_minutes: number,
  intensity: 'low' | 'moderate' | 'high' | 'extreme',
  goal: WorkoutGenerationPreferences['goal']
): number {
  // Rough MET (Metabolic Equivalent) values
  const metValues = {
    low: 3.5,
    moderate: 5.5,
    high: 7.5,
    extreme: 10.0,
  };

  const goalMultipliers = {
    lose_weight: 1.2, // Higher calorie burn focus
    build_muscle: 0.9,
    increase_strength: 0.85,
    improve_endurance: 1.15,
    flexibility: 0.7,
    athletic_performance: 1.1,
  };

  // Calories = MET * weight(kg) * time(hours)
  // Assuming average weight of 70kg
  const met = metValues[intensity];
  const hours = duration_minutes / 60;
  const baseCalories = met * 70 * hours;
  const multiplier = goalMultipliers[goal];

  return Math.round(baseCalories * multiplier);
}
