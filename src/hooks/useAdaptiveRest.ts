/**
 * ⏱️ USE ADAPTIVE REST - Smart Rest Timer Hook
 *
 * Hook pour gérer le timer de repos adaptatif intelligent
 * Calcule automatiquement le temps de repos optimal basé sur:
 * - RPE de la série précédente
 * - Historique utilisateur
 * - Fatigue (numéro de série)
 * - Difficulté exercice
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdaptiveEngine } from '@/services/sessions/AdaptiveEngine';
import { haptics } from '@/utils/haptics';
import type { AdaptiveRestCalculation } from '@/types/workoutSession';

interface UseAdaptiveRestOptions {
  userId: string;
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
  weightKg?: number;
  rpe?: number;
  onRestComplete?: () => void;
  enableAlerts?: boolean;
  alertAtSeconds?: number[];
}

interface UseAdaptiveRestReturn {
  // Timer state
  isResting: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  progress: number; // 0-1

  // Adaptive data
  restCalculation: AdaptiveRestCalculation | null;
  recommendedRestSeconds: number;

  // Controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
}

export function useAdaptiveRest(
  options: UseAdaptiveRestOptions
): UseAdaptiveRestReturn {
  const [isResting, setIsResting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restCalculation, setRestCalculation] = useState<AdaptiveRestCalculation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Calculate adaptive rest on mount
  useEffect(() => {
    const calculateRest = async () => {
      const calculation = await AdaptiveEngine.calculateAdaptiveRest(
        options.userId,
        options.exerciseId,
        {
          set_number: options.setNumber,
          reps_completed: options.repsCompleted,
          weight_kg: options.weightKg,
          rpe: options.rpe,
        }
      );
      setRestCalculation(calculation);
    };

    calculateRest();
  }, [options.userId, options.exerciseId, options.setNumber, options.rpe]);

  const recommendedRestSeconds = restCalculation?.recommended_rest_seconds || 90;
  const remainingSeconds = Math.max(0, recommendedRestSeconds - elapsedSeconds);
  const progress = Math.min(elapsedSeconds / recommendedRestSeconds, 1);

  // Timer logic
  useEffect(() => {
    if (!isResting) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      // Check for alerts
      if (options.enableAlerts && options.alertAtSeconds) {
        if (options.alertAtSeconds.includes(elapsed)) {
          haptics.medium();
        }
      }

      // Auto-complete
      if (elapsed >= recommendedRestSeconds) {
        if (options.onRestComplete) {
          haptics.success();
          options.onRestComplete();
        }
        stop();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting, recommendedRestSeconds, options.enableAlerts, options.alertAtSeconds]);

  const start = useCallback(() => {
    setIsResting(true);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setElapsedSeconds(0);
    haptics.light();
  }, []);

  const pause = useCallback(() => {
    if (!isResting) return;
    setIsResting(false);
    pausedTimeRef.current = Date.now() - startTimeRef.current;
  }, [isResting]);

  const resume = useCallback(() => {
    if (isResting) return;
    setIsResting(true);
    startTimeRef.current = Date.now() - pausedTimeRef.current;
  }, [isResting]);

  const skip = useCallback(() => {
    stop();
    if (options.onRestComplete) {
      options.onRestComplete();
    }
    haptics.medium();
  }, [options.onRestComplete]);

  const reset = useCallback(() => {
    stop();
    setElapsedSeconds(0);
  }, []);

  const stop = useCallback(() => {
    setIsResting(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const addTime = useCallback((seconds: number) => {
    // Extend rest time
    pausedTimeRef.current -= seconds * 1000;
  }, []);

  return {
    isResting,
    elapsedSeconds,
    remainingSeconds,
    progress,
    restCalculation,
    recommendedRestSeconds,
    start,
    pause,
    resume,
    skip,
    reset,
    addTime,
  };
}
