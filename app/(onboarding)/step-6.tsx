/**
 * Onboarding Step 6: Equipment Available
 *
 * User selects available equipment and workout location
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@components/ui';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EQUIPMENT_OPTIONS, type EquipmentType } from '@/types/onboarding';

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Home', icon: '🏠', description: 'I workout at home' },
  { value: 'gym', label: 'Gym', icon: '🏢', description: 'I have gym access' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳', description: 'Parks and outdoor spaces' },
  { value: 'mixed', label: 'Mixed', icon: '🔄', description: 'Combination of locations' },
];

export default function Step6Equipment() {
  const router = useRouter();
  const theme = useStyledTheme();
  const { data, updateData } = useOnboarding();

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>(
    data.equipment_available || []
  );
  const [location, setLocation] = useState(data.workout_location || 'home');

  const toggleEquipment = (equipment: EquipmentType) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment) ? prev.filter((e) => e !== equipment) : [...prev, equipment]
    );
  };

  const handleContinue = () => {
    updateData({
      equipment_available: selectedEquipment,
      workout_location: location as any,
    });
    router.push('/(onboarding)/step-7');
  };

  const canContinue = selectedEquipment.length > 0;

  return (
    <OnboardingContainer
      step={6}
      totalSteps={9}
      title="What Equipment Do You Have?"
      subtitle="We'll create workouts based on your equipment"
    >
      {/* Location */}
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
          Where do you workout?
        </Text>
        <View style={styles.locationGrid}>
          {LOCATION_OPTIONS.map((opt) => {
            const isSelected = location === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setLocation(opt.value as any)}
                style={[
                  styles.locationCard,
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
                <Text style={styles.locationIcon}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.locationLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                      fontWeight: theme.typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.locationDescription,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.secondary
                        : theme.colors.light.text.secondary,
                    },
                  ]}
                >
                  {opt.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Equipment */}
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
          Select all equipment you have
        </Text>
        <View style={styles.equipmentGrid}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = selectedEquipment.includes(eq.value);
            return (
              <TouchableOpacity
                key={eq.value}
                onPress={() => toggleEquipment(eq.value)}
                style={[
                  styles.equipmentChip,
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
                <Text style={styles.equipmentIcon}>{eq.icon}</Text>
                <Text
                  style={[
                    styles.equipmentLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.dark.text.primary
                        : theme.colors.light.text.primary,
                    },
                  ]}
                >
                  {eq.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.button}
        >
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
  label: {
    fontSize: 17,
    marginBottom: 16,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  locationIcon: {
    fontSize: 32,
  },
  locationLabel: {
    fontSize: 16,
  },
  locationDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipmentChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equipmentIcon: {
    fontSize: 18,
  },
  equipmentLabel: {
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
