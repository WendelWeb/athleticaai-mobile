/**
 * useRevenueCat Hook
 *
 * Custom hook for RevenueCat integration
 *
 * INNOVATION:
 * - Auto-refresh customer info
 * - Premium gate tracking
 * - Contextual upgrade prompts
 * - A/B testing ready structure
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import {
  getCustomerInfo,
  isPremium as checkIsPremium,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionMetadata,
  ENTITLEMENT_ID,
} from '@/services/revenuecat';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

interface UseRevenueCatReturn {
  // Premium status
  isPremium: boolean;
  isLoading: boolean;

  // Subscription metadata
  planName: string | null;
  expirationDate: Date | null;
  willRenew: boolean;
  isInTrialPeriod: boolean;

  // Actions
  checkPremium: () => Promise<boolean>;
  showPaywall: () => void;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;

  // INNOVATION: Premium gate tracking
  trackPremiumGateHit: (feature: string) => void;
  premiumGateHits: Record<string, number>;

  // Packages
  packages: PurchasesPackage[];
  refreshPackages: () => Promise<void>;
}

// INNOVATION: Track how many times user hits premium gates (for analytics & upgrade prompts)
const premiumGateHitsStorage: Record<string, number> = {};

export function useRevenueCat(): UseRevenueCatReturn {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [willRenew, setWillRenew] = useState<boolean>(false);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState<boolean>(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [premiumGateHits, setPremiumGateHits] = useState<Record<string, number>>({});

  /**
   * Check and update premium status
   */
  const checkPremium = useCallback(async (): Promise<boolean> => {
    try {
      const premium = await checkIsPremium();
      setIsPremium(premium);
      logger.debug('[RevenueCat] Premium status checked', { isPremium: premium });

      // Get subscription metadata
      const metadata = await getSubscriptionMetadata();
      if (metadata) {
        setPlanName(metadata.planName);
        setExpirationDate(metadata.expirationDate);
        setWillRenew(metadata.willRenew);
        setIsInTrialPeriod(metadata.isInTrialPeriod);
        logger.debug('[RevenueCat] Subscription metadata loaded', {
          planName: metadata.planName,
          willRenew: metadata.willRenew,
        });
      }

      return premium;
    } catch (error) {
      logger.error('[RevenueCat] Failed to check premium status', error instanceof Error ? error : undefined);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load available packages
   */
  const refreshPackages = useCallback(async () => {
    try {
      const offerings = await getOfferings();
      if (offerings?.availablePackages) {
        setPackages(offerings.availablePackages);
        logger.debug('[RevenueCat] Packages loaded', { count: offerings.availablePackages.length });
      }
    } catch (error) {
      logger.error('[RevenueCat] Failed to load packages', error instanceof Error ? error : undefined);
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    checkPremium();
    refreshPackages();

    // Listen for customer info updates
    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      const premium = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPremium(premium);
      logger.info('[RevenueCat] Customer info updated', { isPremium: premium });
    });
  }, [checkPremium, refreshPackages]);

  /**
   * Show paywall (navigate to paywall screen)
   */
  const showPaywall = useCallback(() => {
    // TODO: Navigate to paywall screen
    // router.push('/paywall');
    logger.info('[RevenueCat] Show paywall triggered');
  }, []);

  /**
   * Purchase a package
   */
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      logger.info('[RevenueCat] Initiating purchase', { packageId: pkg.identifier });
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        await checkPremium();
        logger.info('[RevenueCat] Purchase successful', { packageId: pkg.identifier });
        return true;
      }
      return false;
    } catch (error) {
      const isUserCancelled = error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled;
      if (!isUserCancelled) {
        logger.error('[RevenueCat] Purchase failed', error instanceof Error ? error : undefined, {
          packageId: pkg.identifier,
        });
        Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
      } else {
        logger.debug('[RevenueCat] Purchase cancelled by user');
      }
      return false;
    }
  }, [checkPremium]);

  /**
   * Restore purchases
   */
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        await checkPremium();
        Alert.alert('Restore Successful', 'Your purchases have been restored!');
        return true;
      }
      return false;
    } catch (error) {
      Alert.alert('Restore Failed', 'No purchases found to restore.');
      return false;
    }
  }, [checkPremium]);

  /**
   * INNOVATION: Track when user hits a premium gate
   * Used for:
   * - Analytics (which features drive conversions)
   * - Smart upgrade prompts (after 3 hits on same feature, show contextual upgrade)
   * - A/B testing (different prompts for different features)
   */
  const trackPremiumGateHit = useCallback((feature: string) => {
    premiumGateHitsStorage[feature] = (premiumGateHitsStorage[feature] || 0) + 1;
    setPremiumGateHits({ ...premiumGateHitsStorage });

    logger.info(`[RevenueCat] Premium gate hit: ${feature}`, {
      feature,
      count: premiumGateHitsStorage[feature],
    });

    // INNOVATION: Show contextual upgrade prompt after 3 hits
    if (premiumGateHitsStorage[feature] === 3) {
      showContextualUpgradePrompt(feature);
    }
  }, []);

  return {
    isPremium,
    isLoading,
    planName,
    expirationDate,
    willRenew,
    isInTrialPeriod,
    checkPremium,
    showPaywall,
    purchase,
    restore,
    trackPremiumGateHit,
    premiumGateHits,
    packages,
    refreshPackages,
  };
}

/**
 * INNOVATION: Contextual upgrade prompt
 * Shows custom message based on which feature user is trying to access
 */
function showContextualUpgradePrompt(feature: string): void {
  const prompts: Record<string, { title: string; message: string }> = {
    ai_generation: {
      title: 'Unlimited AI Workouts 🤖',
      message: 'Generate infinite science-backed workouts tailored to your goals. Upgrade to Premium now!',
    },
    custom_programs: {
      title: 'Custom 8-12 Week Programs 🎯',
      message: 'Follow structured transformation programs designed by experts. Upgrade to unlock!',
    },
    advanced_analytics: {
      title: 'Advanced Analytics 📊',
      message: 'Track every metric that matters and optimize your progress. Go Premium now!',
    },
    community: {
      title: 'Warrior Community 👥',
      message: 'Join our exclusive community of 50,000+ Warriors. Upgrade to connect!',
    },
  };

  const prompt = prompts[feature] || {
    title: 'Upgrade to Premium 🌟',
    message: 'Unlock all features and transform your fitness journey!',
  };

  Alert.alert(
    prompt.title,
    prompt.message,
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Upgrade Now',
        onPress: () => {
          // TODO: Navigate to paywall
          logger.info('[RevenueCat] User tapped upgrade from contextual prompt', { feature });
        },
      },
    ]
  );
}
