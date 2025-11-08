/**
 * RevenueCat Configuration
 *
 * Setup and configuration for RevenueCat subscriptions
 * Handles: Initialization, offerings, entitlements, purchases
 *
 * INNOVATION: Analytics-ready events, A/B testing structure, usage tracking
 */

import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (IMPORTANT: Add to .env)
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifiers
export const ENTITLEMENT_ID = 'pro'; // Main premium entitlement

// Product identifiers (match App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  monthly: 'athletica_pro_monthly',
  annual: 'athletica_pro_annual',
} as const;

// Offering identifiers
export const OFFERING_IDS = {
  default: 'default',
  onboarding: 'onboarding_special', // Special offer during onboarding
  winback: 'winback_offer', // Re-engagement offer for churned users
} as const;

/**
 * Initialize RevenueCat
 * Call this once at app startup (in _layout.tsx or App.tsx)
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      // Silent - RevenueCat optional
      return;
    }

    // Configure SDK (silent mode - no logs)
    Purchases.setLogLevel(LOG_LEVEL.ERROR);

    // Initialize with user ID (if available)
    if (userId) {
      await Purchases.configure({ apiKey, appUserID: userId });
    } else {
      await Purchases.configure({ apiKey });
    }

    // Track initialization (silent)
    trackRevenueCatEvent('revenuecat_initialized', { platform: Platform.OS });
  } catch (error) {
    // Silent - app works without RevenueCat
  }
}

/**
 * Set user ID (call after sign-in)
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
    // Silent - RevenueCat optional
  } catch (error) {
    // Silent - app works without RevenueCat
  }
}

/**
 * Clear user ID (call after sign-out)
 */
export async function clearUser(): Promise<void> {
  try {
    await Purchases.logOut();
    // Silent - RevenueCat optional
  } catch (error) {
    // Silent - app works without RevenueCat
  }
}

/**
 * Get available offerings (pricing plans)
 */
export async function getOfferings(offeringId?: string): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (offeringId) {
      return offerings.all[offeringId] || null;
    }

    return offerings.current;
  } catch (error) {
    // Silent - return null if RevenueCat unavailable
    return null;
  }
}

/**
 * Get customer info (entitlements, subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    // Silent - return null if RevenueCat unavailable
    return null;
  }
}

/**
 * Check if user has premium (active subscription)
 */
export async function isPremium(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    // Check if user has active entitlement
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (error) {
    // Silent - return false if RevenueCat unavailable
    return false;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // INNOVATION: Track successful purchase
    trackRevenueCatEvent('purchase_success', {
      package_id: pkg.identifier,
      product_id: pkg.product.identifier,
      price: pkg.product.price,
    });

    return customerInfo;
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.userCancelled) {
      // Silent - user cancelled
      trackRevenueCatEvent('purchase_cancelled', {
        package_id: pkg.identifier,
      });
      return null;
    }

    // Silent error - track but don't spam console
    trackRevenueCatEvent('purchase_failed', {
      package_id: pkg.identifier,
      error: error.message,
    });

    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    // INNOVATION: Track restore
    trackRevenueCatEvent('restore_purchases', {
      has_active_subscription: typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined',
    });

    return customerInfo;
  } catch (error) {
    // Silent error - track but don't spam console
    trackRevenueCatEvent('restore_failed', { error: (error as Error).message });
    throw error;
  }
}

/**
 * INNOVATION: Track RevenueCat events for analytics
 * TODO: Integrate with Mixpanel/Analytics service
 */
function trackRevenueCatEvent(eventName: string, properties?: Record<string, any>): void {
  // Silent - ready for Mixpanel integration
  // TODO: Integrate with Mixpanel
  // Mixpanel.track(eventName, properties);
}

/**
 * INNOVATION: Get subscription metadata (for UI display)
 */
export async function getSubscriptionMetadata(): Promise<{
  isPremium: boolean;
  planName: string | null;
  expirationDate: Date | null;
  willRenew: boolean;
  isInTrialPeriod: boolean;
} | null> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!proEntitlement) {
      return {
        isPremium: false,
        planName: null,
        expirationDate: null,
        willRenew: false,
        isInTrialPeriod: false,
      };
    }

    return {
      isPremium: true,
      planName: proEntitlement.productIdentifier,
      expirationDate: new Date(proEntitlement.expirationDate || ''),
      willRenew: proEntitlement.willRenew,
      isInTrialPeriod: proEntitlement.periodType === 'TRIAL',
    };
  } catch (error) {
    // Silent - return null if RevenueCat unavailable
    return null;
  }
}

/**
 * INNOVATION: Format price for display
 */
export function formatPrice(price: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(price);
}
