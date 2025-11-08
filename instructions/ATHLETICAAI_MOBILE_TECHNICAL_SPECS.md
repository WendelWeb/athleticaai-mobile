# 🔧 AthleticaAI Mobile - Spécifications Techniques Détaillées

## 📁 ARCHITECTURE COMPLÈTE

```
athleticaai-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── workouts.tsx         # Workout library
│   │   ├── progress.tsx         # Progress tracking
│   │   ├── nutrition.tsx        # Nutrition & meals
│   │   └── profile.tsx          # User profile
│   ├── (modals)/
│   │   ├── workout-player.tsx   # Full-screen workout
│   │   ├── ai-coach.tsx         # AI chat
│   │   ├── subscription.tsx     # Paywall
│   │   └── settings.tsx
│   ├── (onboarding)/
│   │   ├── welcome.tsx
│   │   ├── step-[id].tsx        # Dynamic onboarding steps
│   │   └── complete.tsx
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Modal.tsx
│   │   ├── workout/
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── FormCheckOverlay.tsx
│   │   ├── ai/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── QuickReplies.tsx
│   │   │   └── VoiceInput.tsx
│   │   ├── nutrition/
│   │   │   ├── MealCard.tsx
│   │   │   ├── MacroChart.tsx
│   │   │   ├── FoodScanner.tsx
│   │   │   └── RecipeCard.tsx
│   │   ├── progress/
│   │   │   ├── WeightChart.tsx
│   │   │   ├── BodyCompositionChart.tsx
│   │   │   ├── StrengthChart.tsx
│   │   │   ├── BeforeAfterSlider.tsx
│   │   │   └── HeatmapCalendar.tsx
│   │   ├── social/
│   │   │   ├── FeedCard.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── LeaderboardRow.tsx
│   │   │   └── ChallengeCard.tsx
│   │   └── animations/
│   │       ├── ConfettiAnimation.tsx
│   │       ├── BreathingCircle.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── SuccessCheckmark.tsx
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── hooks/
│   │   │   │   └── useOnboarding.ts
│   │   │   ├── components/
│   │   │   │   ├── StepIndicator.tsx
│   │   │   │   └── OnboardingCard.tsx
│   │   │   └── schemas/
│   │   │       └── onboardingSchema.ts
│   │   ├── workout/
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkouts.ts
│   │   │   │   ├── useWorkoutPlayer.ts
│   │   │   │   └── useFormCheck.ts
│   │   │   ├── components/
│   │   │   │   ├── WorkoutFilters.tsx
│   │   │   │   └── WorkoutGrid.tsx
│   │   │   └── types/
│   │   │       └── workout.types.ts
│   │   ├── nutrition/
│   │   │   ├── hooks/
│   │   │   │   ├── useMealPlan.ts
│   │   │   │   ├── useFoodLogger.ts
│   │   │   │   └── useMacroTracker.ts
│   │   │   └── components/
│   │   │       ├── MealCalendar.tsx
│   │   │       └── MacroTracker.tsx
│   │   ├── progress/
│   │   │   ├── hooks/
│   │   │   │   ├── useProgress.ts
│   │   │   │   └── useStats.ts
│   │   │   └── components/
│   │   │       ├── ProgressDashboard.tsx
│   │   │       └── InsightsCard.tsx
│   │   ├── ai-coach/
│   │   │   ├── hooks/
│   │   │   │   ├── useAIChat.ts
│   │   │   │   └── useVoiceInput.ts
│   │   │   ├── components/
│   │   │   │   └── ChatInterface.tsx
│   │   │   └── services/
│   │   │       └── aiService.ts
│   │   ├── social/
│   │   │   ├── hooks/
│   │   │   │   ├── useFeed.ts
│   │   │   │   ├── useChallenges.ts
│   │   │   │   └── useLeaderboard.ts
│   │   │   └── components/
│   │   │       ├── SocialFeed.tsx
│   │   │       └── ChallengesList.tsx
│   │   └── subscription/
│   │       ├── hooks/
│   │       │   └── useSubscription.ts
│   │       ├── components/
│   │       │   ├── Paywall.tsx
│   │       │   └── PricingCard.tsx
│   │       └── services/
│   │           └── revenueCatService.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── supabase.ts
│   │   │   ├── workoutApi.ts
│   │   │   ├── nutritionApi.ts
│   │   │   ├── progressApi.ts
│   │   │   └── socialApi.ts
│   │   ├── ai/
│   │   │   ├── openaiService.ts
│   │   │   ├── claudeService.ts
│   │   │   ├── formCheckService.ts
│   │   │   └── nutritionAnalysisService.ts
│   │   ├── analytics/
│   │   │   ├── mixpanel.ts
│   │   │   └── amplitude.ts
│   │   ├── notifications/
│   │   │   ├── pushNotifications.ts
│   │   │   └── localNotifications.ts
│   │   ├── storage/
│   │   │   ├── mmkv.ts
│   │   │   └── cache.ts
│   │   └── wearables/
│   │       ├── appleHealth.ts
│   │       └── googleFit.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── workoutStore.ts
│   │   ├── nutritionStore.ts
│   │   ├── progressStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useTheme.ts
│   │   ├── useHaptics.ts
│   │   ├── useSound.ts
│   │   └── useNetworkStatus.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── calculations.ts
│   │   ├── dateHelpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── workout.types.ts
│   │   ├── nutrition.types.ts
│   │   ├── progress.types.ts
│   │   └── api.types.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── config.ts
│   └── theme/
│       ├── index.ts
│       ├── lightTheme.ts
│       └── darkTheme.ts
├── assets/
│   ├── animations/
│   │   ├── splash.json
│   │   ├── confetti.json
│   │   ├── loading.json
│   │   └── success.json
│   ├── videos/
│   │   └── workouts/
│   ├── images/
│   │   ├── onboarding/
│   │   ├── workouts/
│   │   └── nutrition/
│   └── fonts/
│       ├── SF-Pro-Display-Bold.otf
│       ├── SF-Pro-Display-Semibold.otf
│       └── SF-Pro-Text-Regular.otf
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_workouts.sql
│   │   ├── 003_nutrition.sql
│   │   └── 004_social.sql
│   └── functions/
│       ├── generate-workout/
│       ├── analyze-form/
│       ├── calculate-macros/
│       └── send-notification/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── README.md
```

---

## 🗄️ SCHÉMA DATABASE (Supabase)

### Tables Principales

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, premium, elite
  subscription_status TEXT DEFAULT 'inactive',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Onboarding data
  primary_goal TEXT, -- weight_loss, muscle_gain, endurance, strength, flexibility, wellness
  fitness_level TEXT, -- beginner, intermediate, advanced, expert
  gender TEXT,
  date_of_birth DATE,
  height_cm INTEGER,
  weight_kg DECIMAL,
  target_weight_kg DECIMAL,
  target_date DATE,
  -- Preferences
  available_equipment TEXT[], -- home, gym, park, dumbbells, bands, etc.
  workout_days_per_week INTEGER,
  workout_duration_minutes INTEGER,
  preferred_time_of_day TEXT, -- morning, afternoon, evening
  music_preference BOOLEAN DEFAULT true,
  voice_coach_enabled BOOLEAN DEFAULT true,
  -- Limitations
  injuries TEXT[],
  medical_conditions TEXT[],
  -- Progress
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- cardio, strength, yoga, pilates, boxing, dance, recovery
  subcategory TEXT, -- hiit, running, cycling, full_body, upper, lower, core
  duration_minutes INTEGER,
  intensity TEXT, -- low, moderate, high, extreme
  level TEXT, -- beginner, intermediate, advanced, expert
  equipment_required TEXT[],
  muscles_targeted TEXT[],
  calories_estimate INTEGER,
  video_url TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workout Exercises
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT, -- reps, time, distance
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  order_index INTEGER,
  video_url TEXT,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Workout History
CREATE TABLE user_workout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  rating INTEGER, -- 1-5 stars
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrition - Meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  meal_date DATE,
  meal_name TEXT,
  calories INTEGER,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Progress Tracking
CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE,
  weight_kg DECIMAL,
  body_fat_percentage DECIMAL,
  -- Measurements (cm)
  waist_cm DECIMAL,
  chest_cm DECIMAL,
  arms_cm DECIMAL,
  thighs_cm DECIMAL,
  -- Photos
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  -- Notes
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat History
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT, -- user, assistant
  content TEXT,
  message_type TEXT, -- text, image, workout, meal
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social - Posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  post_type TEXT, -- workout_complete, progress_update, achievement
  workout_id UUID REFERENCES workouts(id),
  media_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social - Follows
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT, -- streak, distance, workouts, calories
  target_value INTEGER,
  start_date DATE,
  end_date DATE,
  reward_badge TEXT,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Challenges
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  requirement_type TEXT, -- streak, workouts, calories, weight_loss
  requirement_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

---

## 🎨 EXEMPLES DE CODE

### 1. Design System Theme

```typescript
// src/theme/index.ts
export const theme = {
  colors: {
    primary: {
      50: '#E6F7F0',
      100: '#B3E8D4',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
    },
    secondary: {
      50: '#EFF6FF',
      500: '#3B82F6',
      600: '#2563EB',
    },
    accent: {
      purple: '#8B5CF6',
      orange: '#F59E0B',
      pink: '#EC4899',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      900: '#111827',
    },
    dark: {
      background: '#000000',
      surface: '#1C1C1E',
      card: '#2C2C2E',
      border: '#38383A',
    },
  },
  typography: {
    h1: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
    h2: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
    body1: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
};
```

### 2. Zustand Store Example

```typescript
// src/stores/workoutStore.ts
import { create } from 'zustand';

interface WorkoutStore {
  currentWorkout: Workout | null;
  isPlaying: boolean;
  currentExerciseIndex: number;
  elapsedTime: number;
  setCurrentWorkout: (workout: Workout) => void;
  play: () => void;
  pause: () => void;
  nextExercise: () => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  currentWorkout: null,
  isPlaying: false,
  currentExerciseIndex: 0,
  elapsedTime: 0,
  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  nextExercise: () => set((state) => ({ 
    currentExerciseIndex: state.currentExerciseIndex + 1 
  })),
  reset: () => set({ 
    currentWorkout: null, 
    isPlaying: false, 
    currentExerciseIndex: 0, 
    elapsedTime: 0 
  }),
}));
```

### 3. React Query Hook

```typescript
// src/features/workout/hooks/useWorkouts.ts
import { useQuery } from '@tanstack/react-query';
import { workoutApi } from '@/services/api/workoutApi';

export const useWorkouts = (filters?: WorkoutFilters) => {
  return useQuery({
    queryKey: ['workouts', filters],
    queryFn: () => workoutApi.getWorkouts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

---

**Ce document complète le MEGA PROMPT principal avec tous les détails techniques nécessaires ! 🚀**

