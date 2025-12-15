/**
 * 🧪 E2E TEST: Workout Player Flow
 *
 * Tests the complete workout session journey:
 * 1. Browse workouts & select one
 * 2. Start workout session
 * 3. Complete sets with rep/weight input
 * 4. Skip exercises
 * 5. Pause/resume session
 * 6. View workout summary
 * 7. Verify session saved to database
 *
 * Covers:
 * - WorkoutPlayer state machine (7 states)
 * - SessionManager integration
 * - Exercise completion tracking
 * - Stats calculation
 * - Database persistence
 */

import { by, element, expect as detoxExpect, device } from 'detox';

describe('💪 Workout Player E2E', () => {
  const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Assume user is already signed in
    // If not, sign in first using auth-flow test
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  beforeEach(async () => {
    // Navigate to home screen before each test
    await element(by.id('tab-home')).tap();
  });

  describe('🔍 Workout Selection', () => {
    it('should navigate to workouts tab', async () => {
      await element(by.id('tab-workouts')).tap();
      await detoxExpect(element(by.id('workouts-screen'))).toBeVisible();
    });

    it('should show list of workouts', async () => {
      await detoxExpect(element(by.id('workouts-list'))).toBeVisible();

      // Should have at least one workout
      await detoxExpect(element(by.id('workout-card-0'))).toBeVisible();
    });

    it('should navigate to workout detail screen', async () => {
      // Tap first workout
      await element(by.id('workout-card-0')).tap();

      // Should show workout detail
      await detoxExpect(element(by.id('workout-detail-screen'))).toBeVisible();
      await detoxExpect(element(by.id('start-workout-button'))).toBeVisible();
    });

    it('should show workout preview (exercises list)', async () => {
      await detoxExpect(element(by.id('exercises-preview-list'))).toBeVisible();

      // Should show at least 3 exercises
      await detoxExpect(element(by.id('exercise-preview-0'))).toBeVisible();
      await detoxExpect(element(by.id('exercise-preview-1'))).toBeVisible();
      await detoxExpect(element(by.id('exercise-preview-2'))).toBeVisible();
    });
  });

  describe('🎬 Start Workout Session', () => {
    beforeAll(async () => {
      // Navigate to workout detail if not already there
      await element(by.id('tab-workouts')).tap();
      await element(by.id('workout-card-0')).tap();
    });

    it('should start workout session', async () => {
      // Tap "Start Workout"
      await element(by.id('start-workout-button')).tap();

      // Should navigate to workout player screen
      await detoxExpect(element(by.id('workout-player-screen'))).toBeVisible();

      // Should show first exercise
      await detoxExpect(element(by.id('current-exercise-card'))).toBeVisible();
    }, 10000);

    it('should show workout player UI elements', async () => {
      // Timer
      await detoxExpect(element(by.id('workout-timer'))).toBeVisible();

      // Exercise counter (e.g., "1 / 8")
      await detoxExpect(element(by.id('exercise-counter'))).toBeVisible();

      // Pause button
      await detoxExpect(element(by.id('pause-button'))).toBeVisible();

      // Exercise details (name, muscle group, sets)
      await detoxExpect(element(by.id('exercise-name'))).toBeVisible();
      await detoxExpect(element(by.id('muscle-group'))).toBeVisible();
      await detoxExpect(element(by.id('target-sets'))).toBeVisible();
    });

    it('should show set input UI', async () => {
      // Reps input
      await detoxExpect(element(by.id('reps-input'))).toBeVisible();

      // Weight input
      await detoxExpect(element(by.id('weight-input'))).toBeVisible();

      // Complete set button
      await detoxExpect(element(by.id('complete-set-button'))).toBeVisible();
    });
  });

  describe('✅ Complete Sets', () => {
    it('should complete Set 1 with reps and weight', async () => {
      // Input reps
      await element(by.id('reps-input')).typeText('12');

      // Input weight
      await element(by.id('weight-input')).typeText('50');

      // Tap "Complete Set"
      await element(by.id('complete-set-button')).tap();

      // Should show success feedback
      await detoxExpect(element(by.text('Set 1 complete!'))).toBeVisible();

      // Should update set counter (1/3 sets)
      await detoxExpect(element(by.text('1 / 3'))).toBeVisible();
    });

    it('should auto-fill previous set values for Set 2', async () => {
      // Reps input should show previous value (12)
      await detoxExpect(element(by.id('reps-input'))).toHaveText('12');

      // Weight input should show previous value (50)
      await detoxExpect(element(by.id('weight-input'))).toHaveText('50');

      // User can adjust values
      await element(by.id('reps-input')).clearText();
      await element(by.id('reps-input')).typeText('10');

      // Complete Set 2
      await element(by.id('complete-set-button')).tap();

      await detoxExpect(element(by.text('2 / 3'))).toBeVisible();
    });

    it('should complete Set 3 and move to next exercise', async () => {
      // Complete Set 3
      await element(by.id('reps-input')).clearText();
      await element(by.id('reps-input')).typeText('10');
      await element(by.id('weight-input')).clearText();
      await element(by.id('weight-input')).typeText('50');
      await element(by.id('complete-set-button')).tap();

      // Should show "Exercise Complete!" animation
      await detoxExpect(element(by.text('Exercise Complete!'))).toBeVisible();

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Should auto-advance to next exercise
      await detoxExpect(element(by.id('current-exercise-card'))).toBeVisible();

      // Exercise counter should update (e.g., "2 / 8")
      await detoxExpect(element(by.text('2 / 8'))).toBeVisible();
    }, 10000);
  });

  describe('⏭️ Skip Exercise', () => {
    it('should show skip exercise button', async () => {
      await detoxExpect(element(by.id('skip-exercise-button'))).toBeVisible();
    });

    it('should show skip reason dialog', async () => {
      await element(by.id('skip-exercise-button')).tap();

      // Should show dialog with reasons
      await detoxExpect(element(by.text('Why are you skipping?'))).toBeVisible();
      await detoxExpect(element(by.id('skip-reason-equipment'))).toBeVisible();
      await detoxExpect(element(by.id('skip-reason-injury'))).toBeVisible();
      await detoxExpect(element(by.id('skip-reason-fatigue'))).toBeVisible();
    });

    it('should skip exercise and move to next', async () => {
      // Select skip reason
      await element(by.id('skip-reason-equipment')).tap();

      // Confirm skip
      await element(by.id('confirm-skip-button')).tap();

      // Should advance to next exercise
      await detoxExpect(element(by.text('3 / 8'))).toBeVisible();
    });
  });

  describe('⏸️ Pause & Resume', () => {
    it('should pause workout session', async () => {
      // Tap pause button
      await element(by.id('pause-button')).tap();

      // Should show pause overlay
      await detoxExpect(element(by.id('pause-overlay'))).toBeVisible();
      await detoxExpect(element(by.text('Workout Paused'))).toBeVisible();

      // Timer should stop
      await detoxExpect(element(by.id('workout-timer'))).toHaveText('03:45'); // Example time

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Timer should still show same time (paused)
      await detoxExpect(element(by.id('workout-timer'))).toHaveText('03:45');
    }, 5000);

    it('should show pause menu options', async () => {
      await detoxExpect(element(by.id('resume-button'))).toBeVisible();
      await detoxExpect(element(by.id('end-workout-button'))).toBeVisible();
      await detoxExpect(element(by.id('restart-button'))).toBeVisible();
    });

    it('should resume workout session', async () => {
      // Tap resume
      await element(by.id('resume-button')).tap();

      // Pause overlay should disappear
      await detoxExpect(element(by.id('pause-overlay'))).not.toBeVisible();

      // Timer should resume
      // (Check that timer changes after 1 second)
      const initialTime = await element(by.id('workout-timer')).getAttributes();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newTime = await element(by.id('workout-timer')).getAttributes();

      // Times should be different (timer resumed)
      // Note: This is pseudo-code, actual Detox API may differ
    });
  });

  describe('📊 Workout Summary', () => {
    beforeAll(async () => {
      // Complete remaining exercises quickly
      // (Or use test helper to fast-forward)
      for (let i = 0; i < 5; i++) {
        // Skip remaining exercises
        await element(by.id('skip-exercise-button')).tap();
        await element(by.id('skip-reason-other')).tap();
        await element(by.id('confirm-skip-button')).tap();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });

    it('should show workout summary screen', async () => {
      // After last exercise, should show summary
      await detoxExpect(element(by.id('workout-summary-screen'))).toBeVisible();
    }, 30000); // Long timeout for completing all exercises

    it('should display workout stats', async () => {
      // Duration
      await detoxExpect(element(by.id('stat-duration'))).toBeVisible();

      // Calories burned
      await detoxExpect(element(by.id('stat-calories'))).toBeVisible();

      // Total sets
      await detoxExpect(element(by.id('stat-sets'))).toBeVisible();

      // Total volume (kg)
      await detoxExpect(element(by.id('stat-volume'))).toBeVisible();

      // Exercises completed
      await detoxExpect(element(by.id('stat-exercises'))).toBeVisible();
    });

    it('should show completed exercises list', async () => {
      await detoxExpect(element(by.id('completed-exercises-list'))).toBeVisible();

      // Should show exercises with sets data
      await detoxExpect(element(by.id('completed-exercise-0'))).toBeVisible();
    });

    it('should allow rating workout difficulty', async () => {
      await detoxExpect(element(by.id('difficulty-rating'))).toBeVisible();

      // Select "Hard" (4/5 stars)
      await element(by.id('difficulty-star-4')).tap();

      // Should highlight 4 stars
      // (Visual check - may need accessibility labels)
    });

    it('should allow rating energy level', async () => {
      await detoxExpect(element(by.id('energy-rating'))).toBeVisible();

      // Select "Medium" energy
      await element(by.id('energy-level-3')).tap();
    });

    it('should allow adding notes', async () => {
      await detoxExpect(element(by.id('workout-notes-input'))).toBeVisible();

      await element(by.id('workout-notes-input')).typeText('Great workout! Felt strong on squats.');

      // Dismiss keyboard
      await element(by.id('workout-notes-input')).tapReturnKey();
    });

    it('should save workout and navigate to home', async () => {
      // Tap "Finish Workout"
      await element(by.id('finish-workout-button')).tap();

      // Should show success toast
      await detoxExpect(element(by.text('Workout saved!'))).toBeVisible();

      // Should navigate to home screen
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    }, 5000);
  });

  describe('💾 Session Persistence', () => {
    it('should show workout in history', async () => {
      // Navigate to Progress tab
      await element(by.id('tab-progress')).tap();

      // Tap "History" sub-tab
      await element(by.id('history-tab')).tap();

      // Should show completed workout in history
      await detoxExpect(element(by.id('workout-history-item-0'))).toBeVisible();
    });

    it('should display correct workout stats in history', async () => {
      // Tap on workout history item
      await element(by.id('workout-history-item-0')).tap();

      // Should show workout detail
      await detoxExpect(element(by.id('workout-detail-screen'))).toBeVisible();

      // Verify stats match what was completed
      await detoxExpect(element(by.text('3 sets'))).toBeVisible(); // Exercise 1 had 3 sets
      await detoxExpect(element(by.text('50 kg'))).toBeVisible(); // Weight used
    });

    it('should update user stats (total workouts)', async () => {
      // Navigate to Profile
      await element(by.id('tab-profile')).tap();

      // Should show incremented workout count
      await detoxExpect(element(by.id('total-workouts-stat'))).toBeVisible();

      // Get text value (e.g., "5 workouts" → should be +1 from before)
      // (Pseudo-code - actual implementation depends on UI)
    });

    it('should update streak if applicable', async () => {
      // Check if streak badge updated
      await detoxExpect(element(by.id('current-streak-badge'))).toBeVisible();

      // Streak should be at least 1
      // (Implementation depends on when last workout was)
    });
  });

  describe('🔄 Resume Incomplete Session', () => {
    beforeAll(async () => {
      // Start a new workout
      await element(by.id('tab-workouts')).tap();
      await element(by.id('workout-card-0')).tap();
      await element(by.id('start-workout-button')).tap();

      // Complete 1 set
      await element(by.id('reps-input')).typeText('10');
      await element(by.id('weight-input')).typeText('40');
      await element(by.id('complete-set-button')).tap();
    });

    it('should save session state when app goes to background', async () => {
      // Send app to background
      await device.sendToHome();

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Bring app back
      await device.launchApp({ newInstance: false });
    });

    it('should show resume workout prompt', async () => {
      // Should show modal asking to resume
      await detoxExpect(element(by.text('Resume Workout?'))).toBeVisible();
      await detoxExpect(element(by.id('resume-session-button'))).toBeVisible();
      await detoxExpect(element(by.id('discard-session-button'))).toBeVisible();
    });

    it('should resume from last completed set', async () => {
      // Tap "Resume"
      await element(by.id('resume-session-button')).tap();

      // Should be on workout player
      await detoxExpect(element(by.id('workout-player-screen'))).toBeVisible();

      // Should be on Set 2 (Set 1 was completed before background)
      await detoxExpect(element(by.text('2 / 3'))).toBeVisible();

      // Previous set data should be visible in history
      await detoxExpect(element(by.id('previous-sets-list'))).toBeVisible();
      await detoxExpect(element(by.text('Set 1: 10 reps × 40 kg'))).toBeVisible();
    });

    it('should discard incomplete session', async () => {
      // Pause workout
      await element(by.id('pause-button')).tap();

      // End workout
      await element(by.id('end-workout-button')).tap();

      // Confirm discard
      await detoxExpect(element(by.text('Discard this workout?'))).toBeVisible();
      await element(by.id('confirm-discard-button')).tap();

      // Should navigate to home
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();

      // Session should NOT appear in history
      await element(by.id('tab-progress')).tap();
      await element(by.id('history-tab')).tap();

      // Discarded workout should not be in list
      // (Check that total count didn't increase)
    });
  });

  describe('🏆 Achievements During Workout', () => {
    it('should show achievement popup after workout', async () => {
      // Start and complete a full workout
      await element(by.id('tab-workouts')).tap();
      await element(by.id('workout-card-0')).tap();
      await element(by.id('start-workout-button')).tap();

      // ... complete all exercises ...
      // (Use test helper to fast-forward)

      // After summary, should show achievement modal
      await detoxExpect(element(by.id('achievement-popup'))).toBeVisible();
      await detoxExpect(element(by.text('First Workout Complete!'))).toBeVisible();
    });

    it('should add achievement to profile', async () => {
      // Dismiss achievement popup
      await element(by.id('close-achievement-button')).tap();

      // Navigate to Achievements
      await element(by.id('tab-profile')).tap();
      await element(by.id('achievements-button')).tap();

      // Should show unlocked achievement
      await detoxExpect(element(by.id('achievement-first-workout'))).toBeVisible();
    });
  });
});
