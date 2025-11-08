/**
 * Edit Profile Screen - Modify Onboarding Info
 *
 * Allows user to edit all information provided during onboarding
 *
 * Features:
 * - All onboarding fields editable
 * - Validation
 * - Save to database
 * - Beautiful UX
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { getProfile, updateProfile } from '@/services/drizzle/profile';
import { Button } from '@components/ui';

export default function EditProfileScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const { user } = useClerkAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form data
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('beginner');
  const [primaryGoal, setPrimaryGoal] = useState<'lose_weight' | 'build_muscle' | 'get_stronger' | 'improve_endurance' | 'stay_healthy' | 'athletic_performance'>('stay_healthy');
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [minutesPerSession, setMinutesPerSession] = useState('30');
  const [motivation, setMotivation] = useState('');

  // Colors
  const bgColor = theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg;
  const surfaceColor = theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface;
  const textPrimary = theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary;
  const textSecondary = theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary;
  const borderColor = theme.isDark ? theme.colors.dark.border : theme.colors.light.border;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { profile } = await getProfile(user.id);
        if (profile) {
          setFullName(profile.full_name || '');
          setAge(profile.age?.toString() || '');
          setGender(profile.gender || 'male');
          setHeightCm(profile.height_cm?.toString() || '');
          setWeightKg(profile.weight_kg?.toString() || '');
          setTargetWeightKg(profile.target_weight_kg?.toString() || '');
          setTargetDate(profile.target_date || '');
          setFitnessLevel(profile.fitness_level || 'beginner');
          setPrimaryGoal(profile.primary_goal || 'stay_healthy');
          setDaysPerWeek(profile.days_per_week?.toString() || '3');
          setMinutesPerSession(profile.minutes_per_session?.toString() || '30');
          setMotivation(profile.motivation || '');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!age || parseInt(age) < 13 || parseInt(age) > 120) {
      Alert.alert('Validation Error', 'Please enter a valid age (13-120)');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSaving(true);

    try {
      // Calculate birth year
      const birthYear = new Date().getFullYear() - parseInt(age);
      const dateOfBirth = `${birthYear}-01-01`;

      await updateProfile(user.id, {
        full_name: fullName.trim(),
        age: parseInt(age),
        date_of_birth: dateOfBirth,
        gender,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        target_weight_kg: targetWeightKg ? parseFloat(targetWeightKg) : undefined,
        target_date: targetDate || undefined,
        fitness_level: fitnessLevel,
        primary_goal: primaryGoal,
        days_per_week: parseInt(daysPerWeek),
        minutes_per_session: parseInt(minutesPerSession),
        motivation: motivation.trim() || undefined,
      });

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <LinearGradient
        colors={
          theme.isDark
            ? ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.7)', 'transparent']
            : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.7)', 'transparent']
        }
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: surfaceColor }]}
          >
            <Ionicons name="chevron-back" size={24} color={textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: textPrimary }]}>Edit Profile</Text>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Form */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Info Section */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Personal Information</Text>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Age *</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={age}
            onChangeText={setAge}
            placeholder="25"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Gender</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGender(option.value as any);
                }}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: gender === option.value ? theme.colors.primary[500] : surfaceColor,
                    borderColor: gender === option.value ? theme.colors.primary[500] : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: gender === option.value ? '#FFFFFF' : textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Physical Stats Section */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 32 }]}>
          Physical Stats
        </Text>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="175"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="70"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Target Weight (kg)</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={targetWeightKg}
            onChangeText={setTargetWeightKg}
            placeholder="65"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Target Date</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={textSecondary}
          />
        </View>

        {/* Fitness Goals Section */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 32 }]}>
          Fitness Goals
        </Text>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Fitness Level</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'elite', label: 'Elite' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFitnessLevel(option.value as any);
                }}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor:
                      fitnessLevel === option.value ? theme.colors.primary[500] : surfaceColor,
                    borderColor:
                      fitnessLevel === option.value ? theme.colors.primary[500] : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: fitnessLevel === option.value ? '#FFFFFF' : textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Primary Goal</Text>
          <View style={styles.optionsColumn}>
            {[
              { value: 'lose_weight', label: 'Lose Weight' },
              { value: 'build_muscle', label: 'Build Muscle' },
              { value: 'get_stronger', label: 'Get Stronger' },
              { value: 'improve_endurance', label: 'Improve Endurance' },
              { value: 'stay_healthy', label: 'Stay Healthy' },
              { value: 'athletic_performance', label: 'Athletic Performance' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPrimaryGoal(option.value as any);
                }}
                style={[
                  styles.optionChipFull,
                  {
                    backgroundColor:
                      primaryGoal === option.value ? theme.colors.primary[500] : surfaceColor,
                    borderColor:
                      primaryGoal === option.value ? theme.colors.primary[500] : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: primaryGoal === option.value ? '#FFFFFF' : textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Schedule Section */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 32 }]}>
          Workout Schedule
        </Text>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Days Per Week</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
            placeholder="3"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>Minutes Per Session</Text>
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor }]}
            value={minutesPerSession}
            onChangeText={setMinutesPerSession}
            placeholder="30"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        {/* Motivation Section */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 32 }]}>
          Motivation
        </Text>

        <View style={[styles.inputGroup, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.label, { color: textSecondary }]}>What Motivates You?</Text>
          <TextInput
            style={[styles.textArea, { color: textPrimary, borderColor }]}
            value={motivation}
            onChangeText={setMotivation}
            placeholder="Why is this goal important to you?"
            placeholderTextColor={textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save Changes
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsColumn: {
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  optionChipFull: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 32,
  },
});
