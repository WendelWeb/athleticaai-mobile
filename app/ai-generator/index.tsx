/**
 * AI Workout Generator - PROFESSIONAL VERSION
 *
 * Multi-step questionnaire for personalized program generation
 *
 * Steps:
 * 1. Personal Profile (age, gender, height, weight)
 * 2. Experience & Goal (fitness level, main goal)
 * 3. Availability & Constraints (days/week, duration, equipment, injuries)
 * 4. Program Selection (choose from 15+ programs)
 * 5. Nutrition Preferences (diet type, allergies, meals/day)
 *
 * Then: Generate complete program + nutrition plan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Button, Card } from '@components/ui';
import type {
  Gender,
  FitnessLevel,
  FitnessGoal,
  DaysPerWeek,
  SessionDuration,
  EquipmentAvailable,
  Injury,
  ProgramType,
  DietType,
  Allergy,
  MealsPerDay,
  AIGeneratorFormData,
  PersonalProfile,
  ExperienceGoal,
  AvailabilityConstraints,
  ProgramSelection,
  NutritionPreferences,
} from '@/types/aiGenerator';
import {
  PROGRAM_TEMPLATES,
  FITNESS_LEVEL_INFO,
  FITNESS_GOAL_INFO,
} from '@/types/aiGenerator';

const TOTAL_STEPS = 5;

export default function AIGeneratorScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

  // Current step (0-4)
  const [currentStep, setCurrentStep] = useState(0);

  // Form data
  const [formData, setFormData] = useState<Partial<AIGeneratorFormData>>({});

  // Step 1: Personal Profile
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState('175');
  const [currentWeightKg, setCurrentWeightKg] = useState('75');
  const [goalWeightKg, setGoalWeightKg] = useState('');

  // Step 2: Experience & Goal
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('intermediate');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('hypertrophy');

  // Step 3: Availability & Constraints
  const [daysPerWeek, setDaysPerWeek] = useState<DaysPerWeek>(4);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [equipment, setEquipment] = useState<EquipmentAvailable>('full_gym');
  const [injuries, setInjuries] = useState<Injury[]>(['none']);

  // Step 4: Program Selection
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>('ppl_6x');

  // Step 5: Nutrition
  const [dietType, setDietType] = useState<DietType>('omnivore');
  const [allergies, setAllergies] = useState<Allergy[]>(['none']);
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(4);

  // Theme colors
  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  // ============================================
  // Navigation Handlers
  // ============================================

  const handleNext = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Validate current step
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - generate program
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Profile
        if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
          Alert.alert('Invalid Age', 'Please enter a valid age (13-100)');
          return false;
        }
        if (!heightCm || parseInt(heightCm) < 100 || parseInt(heightCm) > 250) {
          Alert.alert('Invalid Height', 'Please enter a valid height (100-250 cm)');
          return false;
        }
        if (!currentWeightKg || parseInt(currentWeightKg) < 30 || parseInt(currentWeightKg) > 300) {
          Alert.alert('Invalid Weight', 'Please enter a valid weight (30-300 kg)');
          return false;
        }
        return true;

      case 1: // Experience & Goal
        return true; // Always valid (radio buttons)

      case 2: // Availability
        return true; // Always valid

      case 3: // Program Selection
        return true; // Always valid

      case 4: // Nutrition
        return true; // Always valid

      default:
        return true;
    }
  };

  const handleGenerate = () => {
    // Build complete form data
    const completeData: AIGeneratorFormData = {
      personal_profile: {
        age: parseInt(age),
        gender,
        height_cm: parseInt(heightCm),
        current_weight_kg: parseInt(currentWeightKg),
        goal_weight_kg: goalWeightKg ? parseInt(goalWeightKg) : undefined,
      },
      experience_goal: {
        fitness_level: fitnessLevel,
        goal: fitnessGoal,
      },
      availability: {
        days_per_week: daysPerWeek,
        session_duration: sessionDuration,
        equipment,
        injuries,
      },
      program: {
        program_type: selectedProgram,
      },
      nutrition: {
        diet_type: dietType,
        allergies,
        meals_per_day: mealsPerDay,
        track_macros: true,
      },
    };

    // Navigate to result screen with form data
    router.push({
      pathname: '/ai-generator/result-pro' as any,
      params: {
        formData: JSON.stringify(completeData),
      },
    });
  };

  // ============================================
  // Toggle Helper for Arrays
  // ============================================

  const toggleArrayItem = <T,>(array: T[], item: T, setArray: (arr: T[]) => void) => {
    if (array.includes(item)) {
      // Remove if exists (but keep at least one item if it's 'none')
      const newArray = array.filter((i) => i !== item);
      setArray(newArray.length > 0 ? newArray : [item]);
    } else {
      // Add and remove 'none' if selecting something else
      const newArray = array.filter((i) => i !== ('none' as any));
      setArray([...newArray, item]);
    }
  };

  // ============================================
  // Render Progress Indicator
  // ============================================

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isCompleted
                        ? theme.colors.primary[500]
                        : bgColors.border,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive || isCompleted
                      ? theme.colors.primary[500]
                      : bgColors.surface,
                    borderColor: isActive || isCompleted
                      ? theme.colors.primary[500]
                      : bgColors.border,
                  },
                ]}
              >
                {isCompleted && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // ============================================
  // Render Step Content
  // ============================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1PersonalProfile();
      case 1:
        return renderStep2ExperienceGoal();
      case 2:
        return renderStep3Availability();
      case 3:
        return renderStep4ProgramSelection();
      case 4:
        return renderStep5Nutrition();
      default:
        return null;
    }
  };

  // ============================================
  // STEP 1: Personal Profile
  // ============================================

  const renderStep1PersonalProfile = () => {
    return (
      <View>
        <Text style={[styles.stepTitle, { color: textColors.primary }]}>
          📊 Personal Profile
        </Text>
        <Text style={[styles.stepSubtitle, { color: textColors.secondary }]}>
          Tell us about yourself
        </Text>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Age</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: bgColors.surface,
                borderColor: bgColors.border,
                color: textColors.primary,
              },
            ]}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={textColors.tertiary}
          />
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Gender</Text>
          <View style={styles.optionsRow}>
            {(['male', 'female', 'other'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: gender === g ? theme.colors.primary[500] : bgColors.surface,
                    borderColor: gender === g ? theme.colors.primary[500] : bgColors.border,
                  },
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: gender === g ? '#FFFFFF' : textColors.primary },
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Height */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Height (cm)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: bgColors.surface,
                borderColor: bgColors.border,
                color: textColors.primary,
              },
            ]}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="numeric"
            placeholder="175"
            placeholderTextColor={textColors.tertiary}
          />
        </View>

        {/* Current Weight */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>
            Current Weight (kg)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: bgColors.surface,
                borderColor: bgColors.border,
                color: textColors.primary,
              },
            ]}
            value={currentWeightKg}
            onChangeText={setCurrentWeightKg}
            keyboardType="numeric"
            placeholder="75"
            placeholderTextColor={textColors.tertiary}
          />
        </View>

        {/* Goal Weight (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>
            Goal Weight (kg) <Text style={{ color: textColors.tertiary }}>- Optional</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: bgColors.surface,
                borderColor: bgColors.border,
                color: textColors.primary,
              },
            ]}
            value={goalWeightKg}
            onChangeText={setGoalWeightKg}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor={textColors.tertiary}
          />
        </View>
      </View>
    );
  };

  // ============================================
  // STEP 2: Experience & Goal
  // ============================================

  const renderStep2ExperienceGoal = () => {
    return (
      <View>
        <Text style={[styles.stepTitle, { color: textColors.primary }]}>
          🎯 Experience & Goal
        </Text>
        <Text style={[styles.stepSubtitle, { color: textColors.secondary }]}>
          What's your fitness background?
        </Text>

        {/* Fitness Level */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Fitness Level</Text>
          {(['beginner', 'intermediate', 'advanced', 'expert'] as FitnessLevel[]).map((level) => {
            const info = FITNESS_LEVEL_INFO[level];
            const isSelected = fitnessLevel === level;

            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.selectionCard,
                  {
                    backgroundColor: isSelected ? theme.colors.primary[500] + '20' : bgColors.surface,
                    borderColor: isSelected ? theme.colors.primary[500] : bgColors.border,
                  },
                ]}
                onPress={() => setFitnessLevel(level)}
              >
                <View style={styles.selectionCardContent}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectionCardTitle,
                        { color: isSelected ? theme.colors.primary[500] : textColors.primary },
                      ]}
                    >
                      {info.label}
                    </Text>
                    <Text style={[styles.selectionCardSubtitle, { color: textColors.tertiary }]}>
                      {info.description} • {info.years}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[500]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fitness Goal */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Primary Goal</Text>
          {(['hypertrophy', 'fat_loss', 'strength', 'endurance', 'recomposition'] as FitnessGoal[]).map(
            (goal) => {
              const info = FITNESS_GOAL_INFO[goal];
              const isSelected = fitnessGoal === goal;

              return (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.selectionCard,
                    {
                      backgroundColor: isSelected ? info.color + '20' : bgColors.surface,
                      borderColor: isSelected ? info.color : bgColors.border,
                    },
                  ]}
                  onPress={() => setFitnessGoal(goal)}
                >
                  <View style={styles.selectionCardContent}>
                    <Ionicons name={info.icon as any} size={24} color={info.color} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.selectionCardTitle,
                          { color: isSelected ? info.color : textColors.primary },
                        ]}
                      >
                        {info.label}
                      </Text>
                      <Text style={[styles.selectionCardSubtitle, { color: textColors.tertiary }]}>
                        {info.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={info.color} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>
    );
  };

  // ============================================
  // STEP 3: Availability & Constraints
  // ============================================

  const renderStep3Availability = () => {
    return (
      <View>
        <Text style={[styles.stepTitle, { color: textColors.primary }]}>
          📅 Availability & Constraints
        </Text>
        <Text style={[styles.stepSubtitle, { color: textColors.secondary }]}>
          How often can you train?
        </Text>

        {/* Days per Week */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Days per Week</Text>
          <View style={styles.optionsGrid}>
            {([2, 3, 4, 5, 6, 7] as DaysPerWeek[]).map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.gridOption,
                  {
                    backgroundColor: daysPerWeek === days ? theme.colors.primary[500] : bgColors.surface,
                    borderColor: daysPerWeek === days ? theme.colors.primary[500] : bgColors.border,
                  },
                ]}
                onPress={() => setDaysPerWeek(days)}
              >
                <Text
                  style={[
                    styles.gridOptionText,
                    { color: daysPerWeek === days ? '#FFFFFF' : textColors.primary },
                  ]}
                >
                  {days}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session Duration */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Session Duration</Text>
          <View style={styles.optionsGrid}>
            {([30, 45, 60, 90, 120] as SessionDuration[]).map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.gridOption,
                  {
                    backgroundColor:
                      sessionDuration === duration ? theme.colors.secondary[500] : bgColors.surface,
                    borderColor:
                      sessionDuration === duration ? theme.colors.secondary[500] : bgColors.border,
                  },
                ]}
                onPress={() => setSessionDuration(duration)}
              >
                <Text
                  style={[
                    styles.gridOptionText,
                    { color: sessionDuration === duration ? '#FFFFFF' : textColors.primary },
                  ]}
                >
                  {duration}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment Available */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Equipment Available</Text>
          {(
            [
              { value: 'full_gym', label: '🏋️ Full Gym' },
              { value: 'home_gym_full', label: '🏠 Home Gym (Full)' },
              { value: 'home_gym_basic', label: '🏠 Home Gym (Basic)' },
              { value: 'dumbbells_only', label: '💪 Dumbbells Only' },
              { value: 'bodyweight', label: '🤸 Bodyweight Only' },
              { value: 'resistance_bands', label: '🎗️ Resistance Bands' },
            ] as Array<{ value: EquipmentAvailable; label: string }>
          ).map((eq) => (
            <TouchableOpacity
              key={eq.value}
              style={[
                styles.optionButtonFull,
                {
                  backgroundColor: equipment === eq.value ? theme.colors.primary[500] : bgColors.surface,
                  borderColor: equipment === eq.value ? theme.colors.primary[500] : bgColors.border,
                },
              ]}
              onPress={() => setEquipment(eq.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: equipment === eq.value ? '#FFFFFF' : textColors.primary },
                ]}
              >
                {eq.label}
              </Text>
              {equipment === eq.value && (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Injuries/Limitations */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>
            Injuries/Limitations <Text style={{ color: textColors.tertiary }}>- Select all that apply</Text>
          </Text>
          <View style={styles.tagsContainer}>
            {(
              ['none', 'shoulders', 'knees', 'lower_back', 'elbows', 'wrists', 'hips', 'neck'] as Injury[]
            ).map((injury) => {
              const isSelected = injuries.includes(injury);
              return (
                <TouchableOpacity
                  key={injury}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected ? theme.colors.error[500] : bgColors.surface,
                      borderColor: isSelected ? theme.colors.error[500] : bgColors.border,
                    },
                  ]}
                  onPress={() => toggleArrayItem(injuries, injury, setInjuries)}
                >
                  <Text
                    style={[styles.tagText, { color: isSelected ? '#FFFFFF' : textColors.primary }]}
                  >
                    {injury.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // STEP 4: Program Selection
  // ============================================

  const renderStep4ProgramSelection = () => {
    // Filter programs compatible with user's availability
    const compatiblePrograms = Object.values(PROGRAM_TEMPLATES).filter((program) => {
      return (
        program.days_per_week === daysPerWeek &&
        program.best_for_goal.includes(fitnessGoal) &&
        program.best_for_level.includes(fitnessLevel)
      );
    });

    const allPrograms = Object.values(PROGRAM_TEMPLATES);

    return (
      <View>
        <Text style={[styles.stepTitle, { color: textColors.primary }]}>
          💪 Choose Your Program
        </Text>
        <Text style={[styles.stepSubtitle, { color: textColors.secondary }]}>
          {compatiblePrograms.length} programs match your profile
        </Text>

        {/* Compatible Programs */}
        {compatiblePrograms.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.success[500] }]}>
              ✅ Perfect Match
            </Text>
            {compatiblePrograms.map((program) => renderProgramCard(program, true))}
          </>
        )}

        {/* All Programs */}
        <Text style={[styles.sectionLabel, { color: textColors.secondary, marginTop: 16 }]}>
          📚 All Programs
        </Text>
        {allPrograms.map((program) => {
          const isCompatible = compatiblePrograms.some((p) => p.type === program.type);
          if (isCompatible) return null; // Already shown above
          return renderProgramCard(program, false);
        })}
      </View>
    );
  };

  const renderProgramCard = (program: typeof PROGRAM_TEMPLATES[keyof typeof PROGRAM_TEMPLATES], isCompatible: boolean) => {
    const isSelected = selectedProgram === program.type;

    return (
      <TouchableOpacity
        key={program.type}
        style={[
          styles.programCard,
          {
            backgroundColor: isSelected
              ? theme.colors.primary[500] + '20'
              : bgColors.surface,
            borderColor: isSelected ? theme.colors.primary[500] : bgColors.border,
            opacity: isCompatible ? 1 : 0.6,
          },
        ]}
        onPress={() => setSelectedProgram(program.type)}
      >
        <View style={styles.programCardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.programCardTitle,
                { color: isSelected ? theme.colors.primary[500] : textColors.primary },
              ]}
            >
              {program.name}
            </Text>
            <Text style={[styles.programCardSubtitle, { color: textColors.tertiary }]}>
              {program.description}
            </Text>
            {program.split_structure && (
              <Text style={[styles.programCardMeta, { color: textColors.secondary }]}>
                📋 {program.split_structure}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary[500]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================
  // STEP 5: Nutrition Preferences
  // ============================================

  const renderStep5Nutrition = () => {
    return (
      <View>
        <Text style={[styles.stepTitle, { color: textColors.primary }]}>
          🍽️ Nutrition Preferences
        </Text>
        <Text style={[styles.stepSubtitle, { color: textColors.secondary }]}>
          Tell us about your diet
        </Text>

        {/* Diet Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Diet Type</Text>
          {(
            [
              { value: 'omnivore', label: '🍖 Omnivore' },
              { value: 'vegetarian', label: '🥗 Vegetarian' },
              { value: 'vegan', label: '🌱 Vegan' },
              { value: 'keto', label: '🥑 Keto' },
              { value: 'paleo', label: '🥩 Paleo' },
              { value: 'mediterranean', label: '🐟 Mediterranean' },
              { value: 'flexible', label: '🔄 Flexible' },
            ] as Array<{ value: DietType; label: string }>
          ).map((diet) => (
            <TouchableOpacity
              key={diet.value}
              style={[
                styles.optionButtonFull,
                {
                  backgroundColor: dietType === diet.value ? theme.colors.success[500] : bgColors.surface,
                  borderColor: dietType === diet.value ? theme.colors.success[500] : bgColors.border,
                },
              ]}
              onPress={() => setDietType(diet.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: dietType === diet.value ? '#FFFFFF' : textColors.primary },
                ]}
              >
                {diet.label}
              </Text>
              {dietType === diet.value && (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Allergies */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>
            Allergies <Text style={{ color: textColors.tertiary }}>- Select all that apply</Text>
          </Text>
          <View style={styles.tagsContainer}>
            {(
              ['none', 'dairy', 'gluten', 'nuts', 'soy', 'eggs', 'fish', 'shellfish'] as Allergy[]
            ).map((allergy) => {
              const isSelected = allergies.includes(allergy);
              return (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected ? theme.colors.error[500] : bgColors.surface,
                      borderColor: isSelected ? theme.colors.error[500] : bgColors.border,
                    },
                  ]}
                  onPress={() => toggleArrayItem(allergies, allergy, setAllergies)}
                >
                  <Text
                    style={[styles.tagText, { color: isSelected ? '#FFFFFF' : textColors.primary }]}
                  >
                    {allergy}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Meals per Day */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColors.primary }]}>Meals per Day</Text>
          <View style={styles.optionsRow}>
            {([3, 4, 5, 6] as MealsPerDay[]).map((meals) => (
              <TouchableOpacity
                key={meals}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      mealsPerDay === meals ? theme.colors.warning[500] : bgColors.surface,
                    borderColor: mealsPerDay === meals ? theme.colors.warning[500] : bgColors.border,
                  },
                ]}
                onPress={() => setMealsPerDay(meals)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: mealsPerDay === meals ? '#FFFFFF' : textColors.primary },
                  ]}
                >
                  {meals}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // Main Render
  // ============================================

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Workout Generator</Text>
        <Text style={styles.headerSubtitle}>
          Step {currentStep + 1} of {TOTAL_STEPS}
        </Text>
      </LinearGradient>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Step Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { backgroundColor: bgColors.primary, borderTopColor: bgColors.border }]}>
        <View style={styles.footerButtons}>
          {currentStep > 0 && (
            <Button variant="secondary" size="lg" onPress={handleBack} style={{ flex: 1, marginRight: 8 }}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={{ flex: currentStep > 0 ? 1 : undefined, marginLeft: currentStep > 0 ? 8 : 0 }}
          >
            {currentStep === TOTAL_STEPS - 1 ? '🚀 Generate Program' : 'Next'}
          </Button>
        </View>
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLine: {
    width: 40,
    height: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  selectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectionCardSubtitle: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  programCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  programCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  programCardSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  programCardMeta: {
    fontSize: 13,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
  },
});
