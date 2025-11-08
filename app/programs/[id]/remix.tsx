/**
 * 🎨 ATHLETICAAI - PROGRAM REMIX AI
 * Adapt workout programs on-the-fly with AI-generated alternatives
 * Use cases: Gym closed, equipment missing, injury, time constraints
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
  TextInput,
  Switch,
  ActivityIndicator,
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

type RemixScenario = 'home' | 'limited_equipment' | 'injury' | 'time_constraint' | 'custom';

type RemixConstraints = {
  scenario: RemixScenario;
  availableEquipment: string[];
  timeLimit?: number; // minutes
  injuryNotes?: string;
  customInstructions?: string;
};

type RemixedWorkout = {
  original_name: string;
  remixed_name: string;
  changes: string[];
  exercises_replaced: number;
};

export default function ProgramRemixScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { id, userProgramId } = useLocalSearchParams<{ id: string; userProgramId: string }>();
  const { profile } = useClerkAuth();

  // State
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [remixing, setRemixing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<RemixScenario>('home');

  // Remix constraints
  const [availableEquipment, setAvailableEquipment] = useState({
    dumbbells: true,
    barbell: false,
    kettlebell: true,
    bands: true,
    pullupBar: false,
    bench: false,
  });
  const [timeLimit, setTimeLimit] = useState(30);
  const [injuryNotes, setInjuryNotes] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // Remixed workouts preview
  const [remixedWorkouts, setRemixedWorkouts] = useState<RemixedWorkout[]>([]);

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
    } catch (error) {
      console.error('Error loading program remix data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleScenarioSelect = (scenario: RemixScenario) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedScenario(scenario);

    // Auto-configure equipment based on scenario
    if (scenario === 'home') {
      setAvailableEquipment({
        dumbbells: true,
        barbell: false,
        kettlebell: false,
        bands: true,
        pullupBar: false,
        bench: false,
      });
    }
  };

  const handleRemixProgram = async () => {
    if (!program) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setRemixing(true);

    // Simulate AI processing (replace with real AI API call)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock remixed workouts
    const mockRemixed: RemixedWorkout[] = [
      {
        original_name: 'Chest & Triceps',
        remixed_name: 'Chest & Triceps (Home)',
        changes: [
          'Bench Press → Push-ups (3x15)',
          'Incline Dumbbell Press → Incline Push-ups (3x12)',
          'Cable Flyes → Band Flyes (3x15)',
        ],
        exercises_replaced: 3,
      },
      {
        original_name: 'Back & Biceps',
        remixed_name: 'Back & Biceps (Home)',
        changes: [
          'Barbell Rows → Dumbbell Rows (4x10)',
          'Lat Pulldowns → Band Pulldowns (3x12)',
          'Deadlifts → Romanian Deadlifts with Dumbbells (3x10)',
        ],
        exercises_replaced: 3,
      },
      {
        original_name: 'Legs',
        remixed_name: 'Legs (Home)',
        changes: [
          'Barbell Squats → Goblet Squats with Dumbbells (4x12)',
          'Leg Press → Bulgarian Split Squats (3x10)',
          'Leg Curls → Nordic Curls (3x8)',
        ],
        exercises_replaced: 3,
      },
    ];

    setRemixedWorkouts(mockRemixed);
    setRemixing(false);
  };

  const handleApplyRemix = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    alert(
      `✅ Program Remixed!\n\n${remixedWorkouts.length} workouts have been adapted to your constraints.\n\nYour custom program is now active!`
    );

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
          <Text style={[styles.headerTitle, { color: textColors.primary }]}>Program Remix AI</Text>
          <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
            Adapt to Your Situation
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Scenario Selection */}
        <View style={styles.scenarioSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Select Scenario</Text>

          <View style={styles.scenarioGrid}>
            {[
              { id: 'home', label: 'Train at Home', icon: 'home' },
              { id: 'limited_equipment', label: 'Limited Equipment', icon: 'barbell' },
              { id: 'injury', label: 'Injury/Limitation', icon: 'medkit' },
              { id: 'time_constraint', label: 'Time Constraint', icon: 'time' },
            ].map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                onPress={() => handleScenarioSelect(scenario.id as RemixScenario)}
                style={[
                  styles.scenarioCard,
                  {
                    backgroundColor:
                      selectedScenario === scenario.id
                        ? theme.colors.primary[100]
                        : bgColors.surface,
                    borderColor:
                      selectedScenario === scenario.id
                        ? theme.colors.primary[500]
                        : 'transparent',
                    borderWidth: 2,
                  },
                ]}
              >
                <Ionicons
                  name={scenario.icon as any}
                  size={28}
                  color={
                    selectedScenario === scenario.id
                      ? theme.colors.primary[500]
                      : textColors.secondary
                  }
                />
                <Text
                  style={[
                    styles.scenarioLabel,
                    {
                      color:
                        selectedScenario === scenario.id
                          ? theme.colors.primary[700]
                          : textColors.primary,
                    },
                  ]}
                >
                  {scenario.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment Selection */}
        {(selectedScenario === 'home' || selectedScenario === 'limited_equipment') && (
          <View style={styles.equipmentSection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Available Equipment
            </Text>

            {Object.entries(availableEquipment).map(([key, value]) => (
              <View key={key} style={[styles.equipmentItem, { backgroundColor: bgColors.surface }]}>
                <Text style={[styles.equipmentLabel, { color: textColors.primary }]}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Switch
                  value={value}
                  onValueChange={(newValue) =>
                    setAvailableEquipment({ ...availableEquipment, [key]: newValue })
                  }
                  trackColor={{
                    false: theme.colors.dark.border,
                    true: theme.colors.primary[500],
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        )}

        {/* Time Constraint */}
        {selectedScenario === 'time_constraint' && (
          <View style={styles.timeSection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Workout Time Limit
            </Text>

            <View style={[styles.timeInput, { backgroundColor: bgColors.surface }]}>
              <TextInput
                style={[styles.timeInputField, { color: textColors.primary }]}
                value={timeLimit.toString()}
                onChangeText={(text) => setTimeLimit(parseInt(text) || 30)}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={textColors.secondary}
              />
              <Text style={[styles.timeInputLabel, { color: textColors.secondary }]}>minutes</Text>
            </View>
          </View>
        )}

        {/* Injury Notes */}
        {selectedScenario === 'injury' && (
          <View style={styles.injurySection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Injury/Limitation Details
            </Text>

            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: bgColors.surface, color: textColors.primary },
              ]}
              value={injuryNotes}
              onChangeText={setInjuryNotes}
              placeholder="e.g., Shoulder pain, avoid overhead movements"
              placeholderTextColor={textColors.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Remix Button */}
        {!remixedWorkouts.length && (
          <TouchableOpacity
            onPress={handleRemixProgram}
            activeOpacity={0.8}
            style={styles.remixButton}
            disabled={remixing}
          >
            <LinearGradient
              colors={[theme.colors.success[500], theme.colors.success[600]]}
              style={styles.remixButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {remixing ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.remixButtonText}>AI is remixing your program...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="color-wand" size={20} color="#FFFFFF" />
                  <Text style={styles.remixButtonText}>Remix Program with AI</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Remixed Workouts Preview */}
        {remixedWorkouts.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Remixed Workouts Preview
            </Text>

            {remixedWorkouts.map((workout, index) => (
              <View
                key={index}
                style={[styles.previewCard, { backgroundColor: bgColors.surface }]}
              >
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewOriginal, { color: textColors.secondary }]}>
                    {workout.original_name}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={textColors.secondary} />
                  <Text style={[styles.previewRemixed, { color: theme.colors.success[600] }]}>
                    {workout.remixed_name}
                  </Text>
                </View>

                <View style={styles.previewChanges}>
                  {workout.changes.map((change, i) => (
                    <View key={i} style={styles.previewChangeItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.colors.success[500]}
                      />
                      <Text style={[styles.previewChangeText, { color: textColors.primary }]}>
                        {change}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[styles.previewBadge, { backgroundColor: theme.colors.success[100] }]}
                >
                  <Text style={[styles.previewBadgeText, { color: theme.colors.success[700] }]}>
                    {workout.exercises_replaced} exercises adapted
                  </Text>
                </View>
              </View>
            ))}

            {/* Apply Button */}
            <TouchableOpacity
              onPress={handleApplyRemix}
              activeOpacity={0.8}
              style={styles.applyButton}
            >
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                style={styles.applyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.applyButtonText}>Apply Remixed Program</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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

  // Scenario Selection
  scenarioSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scenarioCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  scenarioLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Equipment
  equipmentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  equipmentLabel: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Time
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  timeInputField: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 60,
  },
  timeInputLabel: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Injury
  injurySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 100,
  },

  // Remix Button
  remixButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  remixButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  remixButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Preview
  previewSection: {
    paddingHorizontal: 20,
  },
  previewCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewOriginal: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  previewRemixed: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewChanges: {
    marginBottom: 12,
  },
  previewChangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  previewChangeText: {
    fontSize: 14,
    flex: 1,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Apply Button
  applyButton: {
    marginTop: 8,
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
