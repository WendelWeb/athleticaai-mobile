/**
 * Program Generator - Professional AI Prompts
 *
 * Generates workout programs with STRICT rules for each split
 * NO mixing incompatible muscle groups
 * Science-based volume, frequency, intensity
 */

import type {
  AIGeneratorFormData,
  ProgramType,
  FitnessLevel,
  FitnessGoal,
  GeneratedProgram,
  GeneratedProgramWorkout,
} from '@/types/aiGenerator';

// ============================================
// PROGRAM RULES - STRICT SPLIT DEFINITIONS
// ============================================

interface ProgramRules {
  name: string;
  weeks_duration: number;
  days: Array<{
    day_number: number;
    day_name: string;
    muscle_groups: string[];
    focus: 'power' | 'hypertrophy' | 'mixed';
    rules: string[];
  }>;
  progression_strategy: string;
  volume_guidelines: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}

const PROGRAM_RULES: Record<ProgramType, ProgramRules> = {
  // ============================================
  // PPL (PUSH/PULL/LEGS)
  // ============================================
  ppl_3x: {
    name: 'Push/Pull/Legs 3x/week',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Push Day',
        muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include back or biceps exercises',
          'Start with compound: Bench Press OR Overhead Press',
          'Include 1-2 chest exercises, 1-2 shoulder exercises, 1 triceps isolation',
          'Total: 5-7 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Pull Day',
        muscle_groups: ['Back', 'Biceps', 'Rear Delts'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include chest, front/side delts, or triceps',
          'Start with compound: Deadlift OR Pull-ups/Rows',
          'Include vertical pull (pull-ups) AND horizontal pull (rows)',
          'Rear delts: 1 exercise (face pulls or reverse flyes)',
          'Total: 5-7 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Leg Day',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body exercises',
          'Start with compound: Squat OR Leg Press',
          'Include quad-dominant (squat) AND hip-dominant (deadlift/RDL)',
          'Calves: 1-2 exercises at end',
          'Total: 5-7 exercises',
        ],
      },
    ],
    progression_strategy: 'Add 2.5-5kg weekly on compounds, 1-2 reps on accessories',
    volume_guidelines: {
      beginner: '10-12 sets per muscle group',
      intermediate: '12-16 sets per muscle group',
      advanced: '16-20 sets per muscle group',
    },
  },

  ppl_6x: {
    name: 'Push/Pull/Legs 6x/week (2x frequency)',
    weeks_duration: 8,
    days: [
      // Same as PPL 3x but repeated twice (Day 1-3, then Day 4-6)
      {
        day_number: 1,
        day_name: 'Push Day 1',
        muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include back or biceps exercises',
          'Start with flat barbell bench press',
          'Focus on compound movements',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Pull Day 1',
        muscle_groups: ['Back', 'Biceps', 'Rear Delts'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include chest, shoulders, or triceps',
          'Start with deadlifts or weighted pull-ups',
          'Include vertical + horizontal pulls',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Leg Day 1',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body',
          'Start with back squat',
          'Quad + hamstring + calves',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Push Day 2',
        muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include back or biceps',
          'Start with incline bench press OR overhead press',
          'Different exercises than Push Day 1',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 5,
        day_name: 'Pull Day 2',
        muscle_groups: ['Back', 'Biceps', 'Rear Delts'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include chest, shoulders, triceps',
          'Start with barbell rows OR lat pulldowns',
          'Different exercises than Pull Day 1',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 6,
        day_name: 'Leg Day 2',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body',
          'Start with leg press OR front squat',
          'Different exercises than Leg Day 1',
          'Total: 5-6 exercises',
        ],
      },
    ],
    progression_strategy: 'Progressive overload each week - add weight or reps',
    volume_guidelines: {
      beginner: '10-12 sets per muscle per week (split across 2 days)',
      intermediate: '14-18 sets per muscle per week',
      advanced: '18-22 sets per muscle per week',
    },
  },

  // ============================================
  // UPPER/LOWER
  // ============================================
  upper_lower_4x: {
    name: 'Upper/Lower 4x/week',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Upper Body 1',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include leg exercises',
          'Start with horizontal press (bench press)',
          'Include horizontal pull (rows)',
          'Balance pushing and pulling movements (2:2 ratio)',
          'Arms: 1-2 exercises total',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Lower Body 1',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body exercises',
          'Start with squat variation',
          'Include hip hinge (RDL or deadlift)',
          'Quad-dominant AND hip-dominant movements',
          'Total: 5-7 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Upper Body 2',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include leg exercises',
          'Start with vertical press (overhead press)',
          'Include vertical pull (pull-ups or lat pulldowns)',
          'Different exercises than Upper 1',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Lower Body 2',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body',
          'Start with leg press OR front squat',
          'Different exercises than Lower 1',
          'Total: 5-7 exercises',
        ],
      },
    ],
    progression_strategy: 'Double progression: add reps (8→12), then add weight and reset to 8',
    volume_guidelines: {
      beginner: '12-14 sets per muscle per week',
      intermediate: '14-18 sets per muscle per week',
      advanced: '18-22 sets per muscle per week',
    },
  },

  upper_lower_6x: {
    name: 'Upper/Lower 6x/week (High Frequency)',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Upper Body 1 (Heavy)',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'power',
        rules: [
          'Focus on strength (4-6 reps)',
          'Heavy compounds only',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Lower Body 1 (Heavy)',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes'],
        focus: 'power',
        rules: [
          'Focus on strength (4-6 reps)',
          'Heavy squats + deadlifts',
          'Total: 4-5 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Upper Body 2 (Volume)',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'hypertrophy',
        rules: [
          'Higher reps (8-12)',
          'More isolation work',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Lower Body 2 (Volume)',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'Higher reps (8-12)',
          'Leg press, lunges, hamstring curls',
          'Total: 6-7 exercises',
        ],
      },
      {
        day_number: 5,
        day_name: 'Upper Body 3 (Accessory)',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'hypertrophy',
        rules: [
          'Isolation exercises',
          'Pump work (12-15 reps)',
          'Total: 5-6 exercises',
        ],
      },
      {
        day_number: 6,
        day_name: 'Lower Body 3 (Accessory)',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'Isolation exercises',
          'Leg extensions, curls, calves',
          'Total: 4-5 exercises',
        ],
      },
    ],
    progression_strategy: 'Linear progression on heavy days, volume progression on hypertrophy days',
    volume_guidelines: {
      beginner: 'NOT RECOMMENDED - too much volume',
      intermediate: '16-20 sets per muscle per week',
      advanced: '20-25 sets per muscle per week',
    },
  },

  // ============================================
  // ARNOLD SPLIT
  // ============================================
  arnold_split: {
    name: 'Arnold Split (Chest/Back, Shoulders/Arms, Legs) x2',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Chest & Back Day 1',
        muscle_groups: ['Chest', 'Back'],
        focus: 'hypertrophy',
        rules: [
          'AGONIST-ANTAGONIST pairing',
          'Alternate chest and back exercises',
          'Example: Bench Press, then Barbell Row, then Incline DB Press, then Pull-ups',
          'NEVER include shoulders (except rear delts OK), arms, or legs',
          'Equal volume for chest and back (3-4 exercises each)',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Shoulders & Arms Day 1',
        muscle_groups: ['Shoulders', 'Biceps', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include chest, back, or legs',
          'Shoulders: 3-4 exercises (front, side, rear delts)',
          'Biceps: 2-3 exercises',
          'Triceps: 2-3 exercises',
          'Alternate biceps and triceps for pump',
          'Total: 7-9 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Legs Day 1',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'NEVER include upper body',
          'Start with squat variation',
          'Include deadlift or RDL',
          'High volume legs (Arnold trained legs hard!)',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Chest & Back Day 2',
        muscle_groups: ['Chest', 'Back'],
        focus: 'hypertrophy',
        rules: [
          'Different exercises than Day 1',
          'Still agonist-antagonist pairing',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 5,
        day_name: 'Shoulders & Arms Day 2',
        muscle_groups: ['Shoulders', 'Biceps', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'Different exercises than Day 2',
          'Total: 7-9 exercises',
        ],
      },
      {
        day_number: 6,
        day_name: 'Legs Day 2',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'Different exercises than Day 3',
          'Total: 6-8 exercises',
        ],
      },
    ],
    progression_strategy: 'Arnold used pyramid sets - warm up then heavy sets',
    volume_guidelines: {
      beginner: 'NOT RECOMMENDED - too advanced',
      intermediate: '18-22 sets per muscle per week',
      advanced: '22-28 sets per muscle per week (Arnold volume!)',
    },
  },

  // ============================================
  // BRO SPLIT
  // ============================================
  bro_split: {
    name: 'Bro Split (1 muscle group per day)',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Chest Day',
        muscle_groups: ['Chest'],
        focus: 'hypertrophy',
        rules: [
          'ONLY chest exercises',
          'NEVER include triceps isolation (they are hit during pressing)',
          'Include flat, incline, decline angles',
          'Barbell AND dumbbell exercises',
          'Finish with cable flyes for pump',
          'Total: 5-7 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Back Day',
        muscle_groups: ['Back'],
        focus: 'hypertrophy',
        rules: [
          'ONLY back exercises',
          'NEVER include biceps isolation',
          'Vertical pulls (pull-ups, lat pulldowns)',
          'Horizontal pulls (rows)',
          'Deadlifts OR heavy rows to start',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Shoulder Day',
        muscle_groups: ['Shoulders'],
        focus: 'hypertrophy',
        rules: [
          'ONLY shoulder exercises',
          'Front delts, Side delts, Rear delts',
          'Start with overhead press',
          'Lateral raises for side delts (CRITICAL)',
          'Face pulls or rear delt flyes',
          'Total: 5-7 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Arms Day',
        muscle_groups: ['Biceps', 'Triceps'],
        focus: 'hypertrophy',
        rules: [
          'ONLY biceps and triceps',
          'Alternate biceps and triceps exercises',
          'Biceps: 3-4 exercises',
          'Triceps: 3-4 exercises',
          'Focus on pump and mind-muscle connection',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 5,
        day_name: 'Leg Day',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'ONLY lower body',
          'Squats OR leg press to start',
          'Quad isolation (leg extensions)',
          'Hamstring work (curls, RDL)',
          'Calves at end',
          'Total: 6-8 exercises',
        ],
      },
    ],
    progression_strategy: 'Focus on time under tension and muscle damage',
    volume_guidelines: {
      beginner: 'NOT OPTIMAL - low frequency',
      intermediate: '15-20 sets per muscle (all in one day!)',
      advanced: '20-25 sets per muscle',
    },
  },

  // ============================================
  // FULL BODY
  // ============================================
  full_body_3x: {
    name: 'Full Body 3x/week',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Full Body A',
        muscle_groups: ['Chest', 'Back', 'Quads', 'Shoulders', 'Arms'],
        focus: 'mixed',
        rules: [
          'Hit ALL major muscle groups',
          'Start with lower body compound (squat)',
          'Then upper body compound (bench press)',
          'Then back (rows)',
          'Keep volume per muscle LOW (will train again in 2 days)',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Full Body B',
        muscle_groups: ['Back', 'Hamstrings', 'Chest', 'Shoulders', 'Arms'],
        focus: 'mixed',
        rules: [
          'Hit ALL major muscle groups',
          'Start with deadlift OR Romanian deadlift',
          'Different exercises than Day A',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Full Body C',
        muscle_groups: ['Quads', 'Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'mixed',
        rules: [
          'Hit ALL major muscle groups',
          'Start with leg press OR front squat',
          'Different exercises than A and B',
          'Total: 6-8 exercises',
        ],
      },
    ],
    progression_strategy: 'Linear progression - add weight every session',
    volume_guidelines: {
      beginner: '3-4 sets per muscle per session (9-12 sets per week)',
      intermediate: '4-5 sets per muscle per session (12-15 sets per week)',
      advanced: '5-6 sets per muscle per session (15-18 sets per week)',
    },
  },

  // ============================================
  // PHUL (Power Hypertrophy Upper Lower)
  // ============================================
  phul: {
    name: 'PHUL - Power Hypertrophy Upper Lower',
    weeks_duration: 8,
    days: [
      {
        day_number: 1,
        day_name: 'Upper Power',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'power',
        rules: [
          'STRENGTH focus - 3-5 reps, heavy weight',
          'Compound movements only',
          'Bench press, rows, overhead press',
          'REST 3-4 minutes between sets',
          'Total: 4-6 exercises',
        ],
      },
      {
        day_number: 2,
        day_name: 'Lower Power',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes'],
        focus: 'power',
        rules: [
          'STRENGTH focus - 3-5 reps',
          'Squat, deadlift variations',
          'REST 3-4 minutes',
          'Total: 4-5 exercises',
        ],
      },
      {
        day_number: 3,
        day_name: 'Upper Hypertrophy',
        muscle_groups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        focus: 'hypertrophy',
        rules: [
          'VOLUME focus - 8-12 reps',
          'More isolation exercises',
          'Flies, curls, extensions',
          'REST 60-90 seconds',
          'Total: 6-8 exercises',
        ],
      },
      {
        day_number: 4,
        day_name: 'Lower Hypertrophy',
        muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focus: 'hypertrophy',
        rules: [
          'VOLUME focus - 8-12 reps',
          'Leg press, lunges, leg curls',
          'REST 60-90 seconds',
          'Total: 6-7 exercises',
        ],
      },
    ],
    progression_strategy: 'Power days: add weight weekly. Hypertrophy: add reps then weight',
    volume_guidelines: {
      beginner: 'NOT RECOMMENDED - need strength base first',
      intermediate: '14-18 sets per muscle per week',
      advanced: '18-22 sets per muscle per week',
    },
  },

  // NOTE: Abbreviated for space - would include PHAT, ULPPL, 5/3/1, nSuns, Starting Strength
  // with similar detailed rules
  phat: {
    name: 'PHAT - Power Hypertrophy Adaptive Training',
    weeks_duration: 8,
    days: [] as any, // Simplified for now
    progression_strategy: 'Undulating periodization',
    volume_guidelines: {
      beginner: 'NOT RECOMMENDED',
      intermediate: '16-20 sets per muscle per week',
      advanced: '20-25 sets per muscle per week',
    },
  },

  ulppl: {
    name: 'ULPPL Hybrid',
    weeks_duration: 8,
    days: [] as any,
    progression_strategy: 'Progressive overload',
    volume_guidelines: {
      beginner: '12-16 sets per muscle per week',
      intermediate: '16-20 sets per muscle per week',
      advanced: '20-24 sets per muscle per week',
    },
  },

  '531': {
    name: '5/3/1',
    weeks_duration: 12,
    days: [] as any,
    progression_strategy: '5/3/1 progression scheme',
    volume_guidelines: {
      beginner: '10-12 sets per muscle per week',
      intermediate: '12-16 sets per muscle per week',
      advanced: '16-20 sets per muscle per week',
    },
  },

  nsuns: {
    name: 'nSuns',
    weeks_duration: 8,
    days: [] as any,
    progression_strategy: 'Linear progression based on AMRAP sets',
    volume_guidelines: {
      beginner: 'NOT RECOMMENDED',
      intermediate: '15-20 sets per muscle per week',
      advanced: '20-25 sets per muscle per week',
    },
  },

  starting_strength: {
    name: 'Starting Strength',
    weeks_duration: 12,
    days: [] as any,
    progression_strategy: 'Linear progression - add 2.5-5kg every session',
    volume_guidelines: {
      beginner: '9-12 sets per muscle per week (low volume, high frequency)',
      intermediate: '12-15 sets per muscle per week',
      advanced: 'Graduate to intermediate program',
    },
  },

  custom_ai: {
    name: 'Custom AI Program',
    weeks_duration: 8,
    days: [] as any,
    progression_strategy: 'AI-determined based on user profile',
    volume_guidelines: {
      beginner: 'AI-optimized',
      intermediate: 'AI-optimized',
      advanced: 'AI-optimized',
    },
  },
};

// ============================================
// REP RANGES BY GOAL
// ============================================

const REP_RANGES: Record<FitnessGoal, { compound: string; isolation: string }> = {
  hypertrophy: {
    compound: '6-10 reps',
    isolation: '8-12 reps',
  },
  strength: {
    compound: '3-6 reps',
    isolation: '6-8 reps',
  },
  fat_loss: {
    compound: '8-12 reps',
    isolation: '12-15 reps',
  },
  endurance: {
    compound: '12-15 reps',
    isolation: '15-20 reps',
  },
  recomposition: {
    compound: '6-10 reps',
    isolation: '10-15 reps',
  },
};

// ============================================
// GENERATE PROFESSIONAL PROMPT
// ============================================

export function generateProfessionalPrompt(
  formData: AIGeneratorFormData,
  dayNumber: number
): string {
  const { personal_profile, experience_goal, availability, program } = formData;
  const rules = PROGRAM_RULES[program.program_type];
  const dayRules = rules.days[dayNumber - 1];
  const repRanges = REP_RANGES[experience_goal.goal];

  // Map expert to advanced for volume guidelines
  const fitnessLevelForVolume = experience_goal.fitness_level === 'expert' ? 'advanced' : experience_goal.fitness_level;
  const volumeGuideline = rules.volume_guidelines[fitnessLevelForVolume as 'beginner' | 'intermediate' | 'advanced'];

  if (!dayRules) {
    throw new Error(`No rules found for day ${dayNumber} of program ${program.program_type}`);
  }

  const prompt = `You are an ISSA/NASM certified strength coach creating a professional workout program.

CLIENT PROFILE:
- Age: ${personal_profile.age}
- Gender: ${personal_profile.gender}
- Fitness Level: ${experience_goal.fitness_level.toUpperCase()}
- Primary Goal: ${experience_goal.goal.toUpperCase()}
- Available Equipment: ${availability.equipment}
- Session Duration: ${availability.session_duration} minutes
- Injuries/Limitations: ${availability.injuries.join(', ')}

PROGRAM: ${rules.name}
WORKOUT: Day ${dayNumber} - ${dayRules.day_name}

MUSCLE GROUPS TO TARGET: ${dayRules.muscle_groups.join(', ')}

STRICT RULES (MUST FOLLOW):
${dayRules.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

REP RANGES:
- Compound exercises: ${repRanges.compound}
- Isolation exercises: ${repRanges.isolation}

VOLUME GUIDELINE: ${volumeGuideline}

PROGRESSION: ${rules.progression_strategy}

EQUIPMENT AVAILABLE: ${availability.equipment}

GENERATE a complete workout with the following JSON format:

{
  "day_name": "${dayRules.day_name}",
  "muscle_groups": ${JSON.stringify(dayRules.muscle_groups)},
  "estimated_duration_minutes": ${availability.session_duration},
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "8-10",
      "rest_seconds": 90,
      "notes": "Technique cues, progression tips"
    }
  ]
}

REQUIREMENTS:
1. RESPECT THE MUSCLE GROUPS - Do NOT include exercises for other muscles
2. FOLLOW THE RULES - Each rule is CRITICAL for program effectiveness
3. EQUIPMENT - Only use exercises possible with available equipment
4. PROGRESSION - Start with compounds, end with isolation
5. BALANCE - If training opposing muscles (chest/back), equal volume
6. SAFETY - Avoid exercises that aggravate listed injuries
7. TIME - Total workout should fit in ${availability.session_duration} minutes

Generate ONLY the JSON, no additional text.`;

  return prompt;
}

// ============================================
// GET PROGRAM OVERVIEW
// ============================================

export function getProgramOverview(programType: ProgramType): ProgramRules {
  return PROGRAM_RULES[programType];
}

// ============================================
// GET TOTAL DAYS FOR PROGRAM
// ============================================

export function getProgramTotalDays(programType: ProgramType): number {
  return PROGRAM_RULES[programType].days.length;
}
