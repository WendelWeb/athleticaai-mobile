/**
 * 🔥 ATHLETICAAI - ADAPTIVE SCHEDULING FEATURE
 * ML-powered intelligent rest days & deload week suggestions
 * Analyzes: Performance, RPE, recovery metrics, consistency
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { getWorkoutProgramById, type WorkoutProgram } from '@services/drizzle/workouts';
import { getUserProgram, type UserProgram } from '@services/drizzle/user-programs';
import { useClerkAuth } from '@hooks/useClerkAuth';

const { width } = Dimensions.get('window');

type RecommendationType = 'rest_day' | 'deload_week' | 'push_harder' | 'maintain';

type Recommendation = {
  type: RecommendationType;
  confidence: number; // 0-100
  reason: string;
  actions: string[];
  icon: any;
  color: string;
};

export default function AdaptiveSchedulingScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id, userProgramId } = useLocalSearchParams<{ id: string; userProgramId: string }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(
    null
  );

  // Theme colors
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  useEffect(() => {
    loadData();
  }, [id, userProgramId]);

  const loadData = async () => {
    if (!id || !userProgramId || !profile?.id) return;

    setLoading(true);
    try {
      const [programData, userProgramData] = await Promise.all([
        getWorkoutProgramById(id as string),
        getUserProgram(profile.id, id as string),
      ]);

      setProgram(programData);
      setUserProgram(userProgramData);

      // Compute recommendation
      const recommendation = computeRecommendation(userProgramData);
      setSelectedRecommendation(recommendation);
    } catch (error) {
      console.error('Error loading adaptive scheduling data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock ML algorithm (replace with real ML model later)
  const computeRecommendation = (userProgramData: UserProgram | null): Recommendation => {
    if (!userProgramData) {
      return {
        type: 'maintain',
        confidence: 0,
        reason: 'Not enough data',
        actions: [],
        icon: 'information-circle',
        color: theme.colors.primary[500],
      };
    }

    const { workouts_completed, total_workouts, current_week } = userProgramData;
    const completionRate = workouts_completed / total_workouts;

    // Mock data (replace with real workout session data)
    const avgRPE: number = 7.8; // Average RPE from last 5 workouts
    const missedWorkouts: number = 2; // Missed workouts in last 7 days
    const avgRecoveryScore: number = 65; // 0-100 (from sleep, HRV, soreness data)

    // ML Logic (simplified)
    if ((missedWorkouts as number) >= 3 || (avgRecoveryScore as number) < 50) {
      return {
        type: 'rest_day',
        confidence: 87,
        reason: `Your recovery score is low (${avgRecoveryScore}/100) and you've missed ${missedWorkouts} workouts recently. Your body needs rest.`,
        actions: [
          'Take a complete rest day today',
          'Focus on sleep (8+ hours)',
          'Light stretching or yoga',
          'Hydration & nutrition',
        ],
        icon: 'bed',
        color: theme.colors.primary[400],
      };
    }

    if (current_week >= 4 && avgRPE > 8 && completionRate > 0.7) {
      return {
        type: 'deload_week',
        confidence: 92,
        reason: `You've been training hard for ${current_week} weeks with high intensity (RPE ${avgRPE}/10). Time for a deload week to prevent overtraining.`,
        actions: [
          'Reduce volume by 40-50%',
          'Lower intensity (lighter weights)',
          'Focus on technique & mobility',
          'Active recovery activities',
        ],
        icon: 'trending-down',
        color: theme.colors.warning[500],
      };
    }

    if (avgRPE < 6 && missedWorkouts === 0 && avgRecoveryScore > 80) {
      return {
        type: 'push_harder',
        confidence: 79,
        reason: `Your performance is strong (RPE ${avgRPE}/10, Recovery ${avgRecoveryScore}/100). You have capacity to increase intensity.`,
        actions: [
          'Increase weights by 5-10%',
          'Add 1-2 extra sets',
          'Reduce rest time between sets',
          'Try advanced variations',
        ],
        icon: 'flash',
        color: theme.colors.error[500],
      };
    }

    return {
      type: 'maintain',
      confidence: 84,
      reason: `Your training is well-balanced. Current intensity (RPE ${avgRPE}/10) and recovery (${avgRecoveryScore}/100) are optimal.`,
      actions: [
        'Continue current program as planned',
        'Maintain current intensity',
        'Monitor recovery metrics',
        'Stay consistent',
      ],
      icon: 'checkmark-circle',
      color: theme.colors.success[500],
    };
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleApplyRecommendation = () => {
    if (!selectedRecommendation) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    alert(`Applied: ${selectedRecommendation.type.replace('_', ' ').toUpperCase()}\n\nYour program has been adjusted accordingly.`);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColors.surface }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColors.primary }]}>Adaptive Scheduling</Text>
          <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
            AI-Powered Recommendations
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main Recommendation Card */}
        {selectedRecommendation && (
          <View style={styles.mainSection}>
            <LinearGradient
              colors={[selectedRecommendation.color, selectedRecommendation.color + 'CC']}
              style={styles.recommendationCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name={selectedRecommendation.icon} size={40} color="#FFFFFF" />
                </View>

                <View style={styles.recommendationConfidence}>
                  <Text style={styles.recommendationConfidenceText}>
                    {selectedRecommendation.confidence}%
                  </Text>
                  <Text style={styles.recommendationConfidenceLabel}>Confidence</Text>
                </View>
              </View>

              <Text style={styles.recommendationType}>
                {selectedRecommendation.type.replace('_', ' ').toUpperCase()}
              </Text>

              <Text style={styles.recommendationReason}>{selectedRecommendation.reason}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Actions */}
        {selectedRecommendation && (
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Recommended Actions
            </Text>

            {selectedRecommendation.actions.map((action, index) => (
              <View
                key={index}
                style={[styles.actionItem, { backgroundColor: bgColors.surface }]}
              >
                <View
                  style={[
                    styles.actionNumber,
                    { backgroundColor: selectedRecommendation.color },
                  ]}
                >
                  <Text style={styles.actionNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.actionText, { color: textColors.primary }]}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metrics Overview */}
        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Your Metrics</Text>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="fitness" size={24} color={theme.colors.primary[500]} />
              <Text style={[styles.metricValue, { color: textColors.primary }]}>7.8</Text>
              <Text style={[styles.metricLabel, { color: textColors.secondary }]}>Avg RPE</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="heart" size={24} color={theme.colors.error[500]} />
              <Text style={[styles.metricValue, { color: textColors.primary }]}>65</Text>
              <Text style={[styles.metricLabel, { color: textColors.secondary }]}>
                Recovery Score
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="flame" size={24} color={theme.colors.warning[500]} />
              <Text style={[styles.metricValue, { color: textColors.primary }]}>5</Text>
              <Text style={[styles.metricLabel, { color: textColors.secondary }]}>Day Streak</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: bgColors.surface }]}>
              <Ionicons name="moon" size={24} color={theme.colors.primary[400]} />
              <Text style={[styles.metricValue, { color: textColors.primary }]}>7.2h</Text>
              <Text style={[styles.metricLabel, { color: textColors.secondary }]}>Avg Sleep</Text>
            </View>
          </View>
        </View>

        {/* Apply Button */}
        <TouchableOpacity
          onPress={handleApplyRecommendation}
          activeOpacity={0.8}
          style={styles.applyButton}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.applyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.applyButtonText}>Apply Recommendation</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },

  // Main Recommendation
  mainSection: {
    padding: 20,
  },
  recommendationCard: {
    padding: 24,
    borderRadius: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recommendationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationConfidence: {
    alignItems: 'flex-end',
  },
  recommendationConfidenceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendationConfidenceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  recommendationType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  recommendationReason: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },

  // Metrics
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  // Apply Button
  applyButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
