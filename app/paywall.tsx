/**
 * RevenueCat Paywall Screen - Apple-Grade Design
 *
 * Features:
 * - Premium subscription plans (Monthly, Annual)
 * - Free trial (7 days)
 * - Feature comparison
 * - Social proof
 * - Restore purchases
 * - Auto-renewable subscription info
 *
 * INTEGRATED: RevenueCat SDK for real purchases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { formatPrice } from '@/services/revenuecat';

export default function PaywallScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { packages, purchase, restore, isLoading: isLoadingRevenueCat } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Theme colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // Loading state while fetching packages
  if (isLoadingRevenueCat || packages.length === 0) {
    // Show loading skeleton
    // (For now, we'll let it continue and show the rest of the UI)
  }

  const premiumFeatures = [
    {
      icon: 'sparkles',
      title: 'Unlimited AI Workouts',
      description: 'Generate infinite science-backed workouts',
      color: theme.colors.primary[500],
    },
    {
      icon: 'fitness',
      title: 'Custom Programs',
      description: '8-12 week transformation plans',
      color: theme.colors.secondary[500],
    },
    {
      icon: 'stats-chart',
      title: 'Advanced Analytics',
      description: 'Track every metric that matters',
      color: theme.colors.success[500],
    },
    {
      icon: 'people',
      title: 'Community Access',
      description: 'Join exclusive Warrior community',
      color: theme.colors.warning[500],
    },
    {
      icon: 'remove-circle',
      title: 'Ad-Free Experience',
      description: 'Zero distractions, pure focus',
      color: theme.colors.error[500],
    },
    {
      icon: 'headset',
      title: 'Priority Support',
      description: '24/7 dedicated assistance',
      color: theme.colors.primary[500],
    },
  ];

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  // Auto-select annual package on mount (if available)
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      // Try to find annual package (usually has longer duration)
      const annualPackage = packages.find(
        (pkg) =>
          pkg.product.identifier.includes('annual') ||
          pkg.product.identifier.includes('year') ||
          pkg.packageType === 'ANNUAL'
      );
      setSelectedPackage(annualPackage || packages[0]);
    }
  }, [packages, selectedPackage]);

  const handlePackageSelect = (pkg: PurchasesPackage) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('No Plan Selected', 'Please select a subscription plan.');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setPurchasing(true);

    try {
      const success = await purchase(selectedPackage);

      if (success) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          "You're now a Premium Warrior! Your transformation journey has been unlocked.",
          [
            {
              text: 'Start Training',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setRestoring(true);

    try {
      await restore();
      // Success alert shown in hook
    } catch (error) {
      // Error already handled in hook
    } finally {
      setRestoring(false);
    }
  };

  const handleTerms = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('https://athleticaai.com/terms'); // TODO: Replace with real URL
  };

  const handlePrivacy = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('https://athleticaai.com/privacy'); // TODO: Replace with real URL
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColors.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={textColors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={48} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Join 50,000+ Warriors transforming their lives
          </Text>
        </LinearGradient>

        <View style={{ height: theme.spacing.xl }} />

        {/* Pricing Plans */}
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          Choose Your Plan
        </Text>

        {isLoadingRevenueCat ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={[styles.loadingText, { color: textColors.secondary }]}>
              Loading plans...
            </Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: textColors.secondary }]}>
              Unable to load subscription plans. Please try again later.
            </Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {packages.map((pkg, index) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isAnnual = pkg.packageType === 'ANNUAL' ||
                               pkg.product.identifier.includes('annual') ||
                               pkg.product.identifier.includes('year');
              const isPopular = isAnnual; // Mark annual as most popular

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  onPress={() => handlePackageSelect(pkg)}
                  activeOpacity={0.9}
                  style={{ flex: 1 }}
                >
                  <Card
                    shadow={isSelected ? 'lg' : 'sm'}
                    padding="lg"
                    style={[
                      styles.planCard,
                      isSelected && {
                        borderWidth: 3,
                        borderColor: theme.colors.primary[500],
                      },
                    ]}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Badge variant="primary" size="sm">
                          Most Popular
                        </Badge>
                      </View>
                    )}

                    {/* Plan Name */}
                    <Text style={[styles.planName, { color: textColors.primary }]}>
                      {isAnnual ? 'Annual' : 'Monthly'}
                    </Text>

                    {/* Price */}
                    <Text style={[styles.planPrice, { color: theme.colors.primary[500] }]}>
                      {formatPrice(pkg.product.price, pkg.product.currencyCode)}
                    </Text>
                    <Text style={[styles.planDuration, { color: textColors.tertiary }]}>
                      {pkg.product.subscriptionPeriod || (isAnnual ? 'per year' : 'per month')}
                    </Text>

                    {/* Savings Badge (Annual only) */}
                    {isAnnual && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save 50%</Text>
                      </View>
                    )}

                    {/* Per Month (Annual only) */}
                    {isAnnual && (
                      <Text style={[styles.planPerMonth, { color: textColors.secondary }]}>
                        {formatPrice(pkg.product.price / 12, pkg.product.currencyCode)}/mo
                      </Text>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: theme.colors.primary[500] }]}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Free Trial Notice */}
        <View style={[styles.trialNotice, { backgroundColor: bgColors.surface }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary[500]} />
          <Text style={[styles.trialText, { color: textColors.secondary }]}>
            Start your <Text style={{ fontWeight: '700' }}>7-day free trial</Text>, cancel anytime
          </Text>
        </View>

        <View style={{ height: theme.spacing.xl }} />

        {/* Features List */}
        <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
          Premium Features
        </Text>
        <View style={styles.featuresGrid}>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: textColors.primary }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: textColors.tertiary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: theme.spacing.xl }} />

        {/* Social Proof */}
        <Card shadow="md" padding="lg">
          <View style={styles.socialProof}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={20} color="#FFD700" />
              ))}
            </View>
            <Text style={[styles.ratingText, { color: textColors.primary }]}>
              4.9/5 from 12,000+ reviews
            </Text>
            <Text style={[styles.ratingSubtext, { color: textColors.tertiary }]}>
              "Best fitness app I've ever used. The AI workouts are incredible!"
            </Text>
          </View>
        </Card>

        <View style={{ height: theme.spacing.xl }} />

        {/* CTA Button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Processing...' : 'Start Free Trial'}
        </Button>

        <View style={{ height: theme.spacing.md }} />

        {/* Restore Purchases */}
        <Button
          variant="ghost"
          size="md"
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? 'Restoring...' : 'Restore Purchases'}
        </Button>

        <View style={{ height: theme.spacing.xl }} />

        {/* Legal Info */}
        <View style={styles.legalSection}>
          <Text style={[styles.legalText, { color: textColors.tertiary }]}>
            Subscription automatically renews unless cancelled at least 24 hours before the end of
            the current period. You can manage subscriptions in your account settings.
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={handleTerms}>
              <Text style={[styles.legalLink, { color: theme.colors.primary[500] }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={[styles.legalDivider, { color: textColors.tertiary }]}>•</Text>
            <TouchableOpacity onPress={handlePrivacy}>
              <Text style={[styles.legalLink, { color: theme.colors.primary[500] }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    position: 'relative',
    alignItems: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 13,
    marginBottom: 12,
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planPerMonth: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  trialText: {
    flex: 1,
    fontSize: 14,
  },
  featuresGrid: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  socialProof: {
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  legalSection: {
    gap: 16,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  legalDivider: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
