/**
 * 📈 LIVE STATS BAR - Real-time Metrics Display
 *
 * Affiche les métriques temps réel de la session
 * Pressable pour ouvrir modal détaillé
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { LiveSessionStats } from '@/types/workoutSession';

interface LiveStatsBarProps {
  stats: LiveSessionStats | null;
  onPress?: () => void;
}

export function LiveStatsBar({ stats, onPress }: LiveStatsBarProps) {
  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  // Calculate performance color
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#34C759'; // Green - Excellent
    if (score >= 70) return '#007AFF'; // Blue - Good
    if (score >= 50) return '#FF9500'; // Orange - Moderate
    return '#FF3B30'; // Red - Needs improvement
  };

  const scoreColor = getScoreColor(stats.current_performance_score);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Volume */}
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Volume</Text>
        <Text style={styles.statValue}>
          {stats.total_volume_kg.toLocaleString()} kg
        </Text>
      </View>

      {/* Calories */}
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Calories</Text>
        <Text style={styles.statValue}>{Math.round(stats.calories_burned)}</Text>
      </View>

      {/* Intensity */}
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Intensity</Text>
        <Text style={styles.statValue}>{Math.round(stats.average_intensity * 100)}%</Text>
      </View>

      {/* Performance Score */}
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Score</Text>
        <Text style={[styles.statValue, { color: scoreColor }]}>
          {Math.round(stats.current_performance_score)}
        </Text>
      </View>

      {/* Trend indicator (vs previous) */}
      {stats.vs_previous_session_percent !== 0 && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendText,
              {
                color: stats.vs_previous_session_percent > 0 ? '#34C759' : '#FF3B30',
              },
            ]}
          >
            {stats.vs_previous_session_percent > 0 ? '↑' : '↓'}
            {Math.abs(Math.round(stats.vs_previous_session_percent))}%
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  trendContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
