/**
 * Onboarding Step 8: Preferences
 *
 * User sets music, voice coach, language, and unit preferences
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { Unit } from '@/types/onboarding';

const MUSIC_GENRES = [
  { value: 'pop', label: 'Pop', icon: '🎵' },
  { value: 'rock', label: 'Rock', icon: '🎸' },
  { value: 'hip_hop', label: 'Hip Hop', icon: '🎤' },
  { value: 'electronic', label: 'Electronic', icon: '🎧' },
  { value: 'classical', label: 'Classical', icon: '🎻' },
  { value: 'metal', label: 'Metal', icon: '🤘' },
];

export default function Step8Preferences() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [musicEnabled, setMusicEnabled] = useState(data.music_enabled ?? true);
  const [musicGenres, setMusicGenres] = useState<string[]>(data.music_genres || []);
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState(data.voice_coach_enabled ?? true);
  const [units, setUnits] = useState<Unit>(data.units || 'metric');

  const toggleGenre = (genre: string) => {
    setMusicGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleContinue = () => {
    updateData({
      music_enabled: musicEnabled,
      music_genres: musicGenres,
      voice_coach_enabled: voiceCoachEnabled,
      language: 'en', // Default to English for now
      units,
    });
    router.push('/(onboarding)/step-9');
  };

  return (
    <OnboardingContainer
      step={8}
      totalSteps={9}
      title="Your Preferences"
      subtitle="Customize your workout experience"
    >
      {/* Music */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              🎵 Music during workouts
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.secondary
                    : theme.colors.light.text.secondary,
                },
              ]}
            >
              Play music to keep you motivated
            </Text>
          </View>
          <Switch
            value={musicEnabled}
            onValueChange={setMusicEnabled}
            trackColor={{
              false: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
              true: theme.colors.primary[500],
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {musicEnabled && (
          <View style={styles.genresGrid}>
            {MUSIC_GENRES.map((genre) => {
              const isSelected = musicGenres.includes(genre.value);
              return (
                <TouchableOpacity
                  key={genre.value}
                  onPress={() => toggleGenre(genre.value)}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary[500]
                        : theme.isDark
                        ? theme.colors.dark.surface
                        : theme.colors.light.surface,
                      borderColor: isSelected
                        ? theme.colors.primary[500]
                        : theme.isDark
                        ? theme.colors.dark.border
                        : theme.colors.light.border,
                    },
                  ]}
                >
                  <Text style={styles.genreIcon}>{genre.icon}</Text>
                  <Text
                    style={[
                      styles.genreLabel,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : theme.isDark
                          ? theme.colors.dark.text.primary
                          : theme.colors.light.text.primary,
                      },
                    ]}
                  >
                    {genre.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Voice Coach */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              🗣️ Voice Coach
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: theme.isDark
                    ? theme.colors.dark.text.secondary
                    : theme.colors.light.text.secondary,
                },
              ]}
            >
              Get audio guidance during workouts
            </Text>
          </View>
          <Switch
            value={voiceCoachEnabled}
            onValueChange={setVoiceCoachEnabled}
            trackColor={{
              false: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
              true: theme.colors.primary[500],
            }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Units */}
      <View style={styles.section}>
        <Text
          style={[
            styles.label,
            {
              color: theme.isDark
                ? theme.colors.dark.text.primary
                : theme.colors.light.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
        >
          📏 Units
        </Text>
        <View style={styles.unitsOptions}>
          <TouchableOpacity
            onPress={() => setUnits('metric')}
            style={[
              styles.unitOption,
              {
                backgroundColor: units === 'metric'
                  ? theme.colors.primary[500]
                  : theme.isDark
                  ? theme.colors.dark.surface
                  : theme.colors.light.surface,
                borderColor: units === 'metric'
                  ? theme.colors.primary[500]
                  : theme.isDark
                  ? theme.colors.dark.border
                  : theme.colors.light.border,
              },
            ]}
          >
            <Text
              style={[
                styles.unitLabel,
                {
                  color: units === 'metric'
                    ? '#FFFFFF'
                    : theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              Metric (kg, cm)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUnits('imperial')}
            style={[
              styles.unitOption,
              {
                backgroundColor: units === 'imperial'
                  ? theme.colors.primary[500]
                  : theme.isDark
                  ? theme.colors.dark.surface
                  : theme.colors.light.surface,
                borderColor: units === 'imperial'
                  ? theme.colors.primary[500]
                  : theme.isDark
                  ? theme.colors.dark.border
                  : theme.colors.light.border,
              },
            ]}
          >
            <Text
              style={[
                styles.unitLabel,
                {
                  color: units === 'imperial'
                    ? '#FFFFFF'
                    : theme.isDark
                    ? theme.colors.dark.text.primary
                    : theme.colors.light.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              Imperial (lbs, ft)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button variant="primary" size="lg" onPress={handleContinue} style={styles.button}>
          Continue
        </Button>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 17,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  genreChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genreIcon: {
    fontSize: 18,
  },
  genreLabel: {
    fontSize: 14,
  },
  unitsOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  unitLabel: {
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
