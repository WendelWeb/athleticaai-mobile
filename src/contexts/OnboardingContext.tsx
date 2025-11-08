/**
 * Onboarding Context
 *
 * Manages onboarding state across all 10 steps
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { OnboardingData } from '@/types/onboarding';

interface OnboardingContextValue {
  data: OnboardingData;
  currentStep: number;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  isComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const INITIAL_DATA: OnboardingData = {
  // Step 1
  goal: null,

  // Step 2
  fitness_level: null,

  // Step 3
  age: null,
  gender: null,
  height_cm: null,
  weight_kg: null,

  // Step 4
  sports_history: [],
  current_activity_level: 'lightly_active',

  // Step 5
  injuries: [],
  medical_conditions: [],
  notes: null,

  // Step 6
  equipment_available: [],
  workout_location: 'home',

  // Step 7
  days_per_week: 3,
  minutes_per_session: 30,
  preferred_workout_time: 'flexible',

  // Step 8
  music_enabled: true,
  music_genres: [],
  voice_coach_enabled: true,
  language: 'en',
  units: 'metric',

  // Step 9
  target_weight_kg: null,
  target_date: null,
  motivation: null,

  // Completion
  completed_at: null,
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [currentStep, setCurrentStep] = useState(1);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 10)); // Max 10 steps
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1)); // Min step 1
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 10)));
  }, []);

  const resetOnboarding = useCallback(() => {
    setData(INITIAL_DATA);
    setCurrentStep(1);
  }, []);

  const isComplete = data.completed_at !== null;

  const value: OnboardingContextValue = {
    data,
    currentStep,
    updateData,
    nextStep,
    previousStep,
    goToStep,
    resetOnboarding,
    isComplete,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
