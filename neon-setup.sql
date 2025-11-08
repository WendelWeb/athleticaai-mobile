-- =====================================================
-- AthleticaAI - Neon PostgreSQL Setup
-- =====================================================
-- Run this SQL in your Neon Console to create all tables
-- Database: neondb
-- =====================================================

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

CREATE TYPE user_gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
CREATE TYPE goal_type AS ENUM ('lose_weight', 'build_muscle', 'get_stronger', 'improve_endurance', 'stay_healthy', 'athletic_performance');
CREATE TYPE workout_type AS ENUM ('strength', 'cardio', 'hiit', 'yoga', 'pilates', 'stretching', 'sports', 'custom');
CREATE TYPE exercise_category AS ENUM ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'elite');
CREATE TYPE workout_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled');

-- =====================================================
-- 2. CREATE PROFILES TABLE (Main User Table)
-- =====================================================

CREATE TABLE profiles (
  -- Primary
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Personal Info
  date_of_birth DATE,
  gender user_gender,
  height_cm DECIMAL(5, 2),
  weight_kg DECIMAL(5, 2),

  -- Fitness Profile
  fitness_level fitness_level DEFAULT 'beginner',
  primary_goal goal_type,

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- Preferences
  preferred_workout_days INTEGER[] DEFAULT ARRAY[1,3,5],
  preferred_workout_time TIME DEFAULT '07:00:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,

  -- Onboarding Data
  age INTEGER,
  target_weight_kg DECIMAL(5, 2),
  target_date DATE,
  sports_history TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_activity_level TEXT,
  injuries TEXT[] DEFAULT ARRAY[]::TEXT[],
  medical_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  equipment_available TEXT[] DEFAULT ARRAY[]::TEXT[],
  workout_location TEXT,
  days_per_week INTEGER DEFAULT 3,
  minutes_per_session INTEGER DEFAULT 30,
  music_enabled BOOLEAN DEFAULT TRUE,
  music_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  voice_coach_enabled BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'en',
  units TEXT DEFAULT 'metric',
  motivation TEXT,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE WORKOUT PROGRAMS TABLE
-- =====================================================

CREATE TABLE workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Program Details
  duration_weeks INTEGER NOT NULL,
  workouts_per_week INTEGER NOT NULL,
  difficulty_level difficulty_level NOT NULL,

  -- Targeting
  target_goals TEXT[] NOT NULL,
  target_fitness_levels TEXT[] NOT NULL,

  -- Content
  total_workouts INTEGER NOT NULL,
  estimated_time_per_workout INTEGER,

  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,

  -- Stats
  enrolled_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE EXERCISES TABLE
-- =====================================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,

  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  animation_url TEXT,

  -- Classification
  category exercise_category NOT NULL,
  difficulty_level difficulty_level NOT NULL,

  -- Equipment
  equipment_required TEXT[],

  -- Muscles
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[],

  -- Instructions
  instructions TEXT[],
  tips TEXT[],
  common_mistakes TEXT[],

  -- Metadata
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE WORKOUTS TABLE
-- =====================================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Classification
  workout_type workout_type NOT NULL,
  difficulty_level difficulty_level NOT NULL,

  -- Details
  estimated_duration INTEGER NOT NULL,
  calories_burned_estimate INTEGER,

  -- Program Association
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
  week_number INTEGER,
  day_number INTEGER,

  -- Content
  exercises JSONB NOT NULL,

  -- Stats
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,

  -- Metadata
  is_premium BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. CREATE USER WORKOUT SESSIONS TABLE
-- =====================================================

CREATE TABLE user_workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Workout
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,

  -- Session Info
  status workout_status DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Performance Data
  duration_seconds INTEGER,
  calories_burned INTEGER,
  exercises_completed JSONB,

  -- Feedback
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. CREATE PROGRESS ENTRIES TABLE
-- =====================================================

CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Measurements
  weight_kg DECIMAL(5, 2),
  body_fat_percentage DECIMAL(4, 2),
  muscle_mass_kg DECIMAL(5, 2),

  -- Body Measurements (cm)
  chest_cm DECIMAL(5, 2),
  waist_cm DECIMAL(5, 2),
  hips_cm DECIMAL(5, 2),
  biceps_cm DECIMAL(5, 2),
  thighs_cm DECIMAL(5, 2),

  -- Photos
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CREATE NUTRITION PLANS TABLE
-- =====================================================

CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Plan Details
  name TEXT NOT NULL,
  description TEXT,

  -- Macros (daily targets)
  calories_target INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fats_g INTEGER NOT NULL,

  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. CREATE MEAL LOGS TABLE
-- =====================================================

CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Meal Info
  meal_name TEXT NOT NULL,
  meal_type TEXT,
  meal_time TIMESTAMPTZ NOT NULL,

  -- Nutrition
  calories INTEGER,
  protein_g DECIMAL(5, 2),
  carbs_g DECIMAL(5, 2),
  fats_g DECIMAL(5, 2),

  -- Media
  photo_url TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. CREATE INDEXES (for performance)
-- =====================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_workout_sessions_user_id ON user_workout_sessions(user_id);
CREATE INDEX idx_user_workout_sessions_workout_id ON user_workout_sessions(workout_id);
CREATE INDEX idx_user_workout_sessions_status ON user_workout_sessions(status);
CREATE INDEX idx_progress_entries_user_id ON progress_entries(user_id);
CREATE INDEX idx_nutrition_plans_user_id ON nutrition_plans(user_id);
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_workouts_program_id ON workouts(program_id);

-- =====================================================
-- SUCCESS! 🎉
-- =====================================================
-- All tables created successfully!
-- You can now use the app with full database support.
-- =====================================================
