/**
 * 🧪 E2E TEST: Authentication Flow
 *
 * Tests the complete auth journey:
 * 1. Sign up with Clerk
 * 2. Profile creation in database
 * 3. Onboarding flow (9 steps)
 * 4. Navigation to home screen
 * 5. Sign out
 * 6. Sign in with existing account
 *
 * Requirements:
 * - Detox (React Native E2E testing)
 * - Test Clerk account credentials in .env.test
 * - Fresh database state (run seed scripts first)
 */

import { by, element, expect as detoxExpect, device } from 'detox';

describe('🔐 Authentication Flow E2E', () => {
  // Test credentials (use test account, not real user)
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test+e2e@athletica.ai';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';
  const TEST_NAME = 'E2E Test User';

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    // Clean up test user (optional)
    // await cleanupTestUser(TEST_EMAIL);
  });

  describe('📝 Sign Up Flow', () => {
    it('should navigate to sign up screen', async () => {
      // Tap "Sign Up" button on landing screen
      await detoxExpect(element(by.id('landing-screen'))).toBeVisible();
      await element(by.id('sign-up-button')).tap();

      // Should show sign up form
      await detoxExpect(element(by.id('sign-up-form'))).toBeVisible();
    });

    it('should show validation errors for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText(TEST_PASSWORD);
      await element(by.id('submit-button')).tap();

      // Should show error message
      await detoxExpect(element(by.text('Invalid email format'))).toBeVisible();
    });

    it('should show validation errors for weak password', async () => {
      await element(by.id('email-input')).typeText(TEST_EMAIL);
      await element(by.id('password-input')).typeText('weak');
      await element(by.id('submit-button')).tap();

      // Should show error message
      await detoxExpect(element(by.text('Password must be at least 8 characters'))).toBeVisible();
    });

    it('should successfully sign up with valid credentials', async () => {
      // Fill in sign up form
      await element(by.id('email-input')).typeText(TEST_EMAIL);
      await element(by.id('password-input')).typeText(TEST_PASSWORD);
      await element(by.id('full-name-input')).typeText(TEST_NAME);

      // Submit
      await element(by.id('submit-button')).tap();

      // Should navigate to onboarding
      await detoxExpect(element(by.id('onboarding-step-1'))).toBeVisible();
    }, 15000); // Longer timeout for network request
  });

  describe('📋 Onboarding Flow (9 Steps)', () => {
    beforeAll(async () => {
      // Assume user is already signed up and on step 1
      // If not, sign up first
    });

    it('Step 1: Should select age', async () => {
      await detoxExpect(element(by.id('onboarding-step-1'))).toBeVisible();
      await detoxExpect(element(by.text('How old are you?'))).toBeVisible();

      // Type age
      await element(by.id('age-input')).typeText('28');
      await element(by.id('next-button')).tap();

      // Should go to step 2
      await detoxExpect(element(by.id('onboarding-step-2'))).toBeVisible();
    });

    it('Step 2: Should select gender', async () => {
      await detoxExpect(element(by.text('What is your gender?'))).toBeVisible();

      // Select gender
      await element(by.id('gender-male')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-3'))).toBeVisible();
    });

    it('Step 3: Should input height and weight', async () => {
      await detoxExpect(element(by.text('Your measurements'))).toBeVisible();

      // Input height (cm)
      await element(by.id('height-input')).typeText('180');

      // Input weight (kg)
      await element(by.id('weight-input')).typeText('75');

      await element(by.id('next-button')).tap();
      await detoxExpect(element(by.id('onboarding-step-4'))).toBeVisible();
    });

    it('Step 4: Should select fitness level', async () => {
      await detoxExpect(element(by.text('Fitness level'))).toBeVisible();

      await element(by.id('fitness-intermediate')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-5'))).toBeVisible();
    });

    it('Step 5: Should select primary goal', async () => {
      await detoxExpect(element(by.text('What\'s your goal?'))).toBeVisible();

      await element(by.id('goal-build-muscle')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-6'))).toBeVisible();
    });

    it('Step 6: Should select workout frequency', async () => {
      await detoxExpect(element(by.text('How often can you train?'))).toBeVisible();

      // Select 4 days per week
      await element(by.id('frequency-4')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-7'))).toBeVisible();
    });

    it('Step 7: Should select workout duration', async () => {
      await detoxExpect(element(by.text('Session duration'))).toBeVisible();

      // Select 60 minutes
      await element(by.id('duration-60')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-8'))).toBeVisible();
    });

    it('Step 8: Should select equipment', async () => {
      await detoxExpect(element(by.text('Available equipment'))).toBeVisible();

      // Select gym equipment
      await element(by.id('equipment-gym')).tap();
      await element(by.id('next-button')).tap();

      await detoxExpect(element(by.id('onboarding-step-9'))).toBeVisible();
    });

    it('Step 9: Should review and complete', async () => {
      await detoxExpect(element(by.text('You\'re all set!'))).toBeVisible();

      await element(by.id('finish-button')).tap();

      // Should navigate to home screen
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    }, 10000);
  });

  describe('🏠 Home Screen After Onboarding', () => {
    it('should show user name in hero section', async () => {
      await detoxExpect(element(by.text(`Welcome back, ${TEST_NAME.split(' ')[0]}`))).toBeVisible();
    });

    it('should show workout of the day card', async () => {
      await detoxExpect(element(by.id('workout-of-day-card'))).toBeVisible();
    });

    it('should show AI generator card', async () => {
      await detoxExpect(element(by.id('ai-generator-card'))).toBeVisible();
    });

    it('should navigate to profile screen', async () => {
      await element(by.id('tab-profile')).tap();
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();
    });
  });

  describe('🚪 Sign Out Flow', () => {
    it('should sign out successfully', async () => {
      // Navigate to profile
      await element(by.id('tab-profile')).tap();

      // Scroll to sign out button
      await element(by.id('profile-scroll-view')).scrollTo('bottom');

      // Tap sign out
      await element(by.id('sign-out-button')).tap();

      // Confirm sign out dialog
      await detoxExpect(element(by.text('Sign Out'))).toBeVisible();
      await element(by.text('Confirm')).tap();

      // Should return to landing screen
      await detoxExpect(element(by.id('landing-screen'))).toBeVisible();
    });
  });

  describe('🔑 Sign In Flow (Returning User)', () => {
    it('should navigate to sign in screen', async () => {
      await element(by.id('sign-in-button')).tap();
      await detoxExpect(element(by.id('sign-in-form'))).toBeVisible();
    });

    it('should show error for wrong password', async () => {
      await element(by.id('email-input')).typeText(TEST_EMAIL);
      await element(by.id('password-input')).typeText('WrongPassword123!');
      await element(by.id('submit-button')).tap();

      // Should show error
      await detoxExpect(element(by.text('Invalid credentials'))).toBeVisible();
    });

    it('should sign in successfully with correct credentials', async () => {
      // Clear previous inputs
      await element(by.id('email-input')).clearText();
      await element(by.id('password-input')).clearText();

      // Type correct credentials
      await element(by.id('email-input')).typeText(TEST_EMAIL);
      await element(by.id('password-input')).typeText(TEST_PASSWORD);
      await element(by.id('submit-button')).tap();

      // Should navigate to home (skip onboarding for returning user)
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    }, 15000);

    it('should maintain user session after app restart', async () => {
      // Restart app
      await device.reloadReactNative();

      // Should still be on home screen (session persisted)
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('🔄 Profile Persistence', () => {
    it('should display user profile data correctly', async () => {
      await element(by.id('tab-profile')).tap();

      // Check profile data matches onboarding input
      await detoxExpect(element(by.text(TEST_NAME))).toBeVisible();
      await detoxExpect(element(by.text(TEST_EMAIL))).toBeVisible();
      await detoxExpect(element(by.text('180 cm'))).toBeVisible();
      await detoxExpect(element(by.text('75 kg'))).toBeVisible();
    });

    it('should update profile successfully', async () => {
      // Tap edit profile
      await element(by.id('edit-profile-button')).tap();

      // Update weight
      await element(by.id('weight-input')).clearText();
      await element(by.id('weight-input')).typeText('77');

      // Save
      await element(by.id('save-profile-button')).tap();

      // Should show success toast
      await detoxExpect(element(by.text('Profile updated'))).toBeVisible();

      // Should reflect new weight
      await detoxExpect(element(by.text('77 kg'))).toBeVisible();
    });
  });
});

/**
 * 🧹 CLEANUP HELPER
 *
 * Deletes test user from database after test runs
 * (Optional - comment out if you want to keep test user)
 */
async function cleanupTestUser(email: string) {
  // TODO: Implement database cleanup
  // - Delete from profiles table
  // - Delete from Clerk (use Clerk Admin API)
  console.log(`[Cleanup] Test user ${email} cleanup not implemented yet`);
}
