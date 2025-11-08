/**
 * Custom Program Builder - STARTER VERSION
 *
 * Create workout program from scratch:
 * - Name, description, duration
 * - Add workouts (days/weeks)
 * - Browse & add exercises
 * - Set sets/reps/rest per exercise
 * - Save as custom program
 *
 * TODO: Full builder with drag-drop, exercise library picker, etc.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStyledTheme } from '@theme/ThemeProvider';

export default function CreateProgramScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

  const [programName, setProgramName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('12');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState('3');

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
    tertiary: theme.isDark ? theme.colors.dark.text.tertiary : theme.colors.light.text.tertiary,
  };

  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    border: theme.isDark ? theme.colors.dark.border : theme.colors.light.border,
  };

  const handleCreate = () => {
    if (!programName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }

    Alert.alert('Success', 'Program created! (Starter version)', [
      { text: 'OK', onPress: () => router.replace('/(tabs)/workouts') },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      <Stack.Screen
        options={{
          title: 'Create Program',
          headerShown: true,
          headerStyle: { backgroundColor: bgColors.primary },
          headerTintColor: textColors.primary,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary[100] }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary[600]} />
          <Text style={[styles.infoText, { color: theme.colors.primary[700] }]}>
            Starter version. Full builder coming soon with:{'\n'}• Exercise library picker{'\n'}•
            Drag-drop workouts{'\n'}• Sets/reps/rest editor{'\n'}• Templates system
          </Text>
        </View>

        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>
            PROGRAM DETAILS
          </Text>

          <Text style={[styles.label, { color: textColors.primary }]}>Program Name *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: bgColors.surface,
              color: textColors.primary,
              borderColor: bgColors.border,
            }]}
            value={programName}
            onChangeText={setProgramName}
            placeholder="e.g., My Custom Full Body"
            placeholderTextColor={textColors.tertiary}
          />

          <Text style={[styles.label, { color: textColors.primary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: bgColors.surface,
              color: textColors.primary,
              borderColor: bgColors.border,
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your program..."
            placeholderTextColor={textColors.tertiary}
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={[styles.label, { color: textColors.primary }]}>Duration (weeks)</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: bgColors.surface,
                  color: textColors.primary,
                  borderColor: bgColors.border,
                }]}
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={[styles.label, { color: textColors.primary }]}>Workouts/week</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: bgColors.surface,
                  color: textColors.primary,
                  borderColor: bgColors.border,
                }]}
                value={workoutsPerWeek}
                onChangeText={setWorkoutsPerWeek}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
          </View>
        </View>

        {/* Workouts Placeholder */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>WORKOUTS</Text>
          <Text style={[styles.placeholderText, { color: textColors.secondary }]}>
            Add workouts and exercises here.{'\n\n'}Full interface coming soon with exercise picker,
            sets/reps editor, and drag-drop reordering.
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => Alert.alert('Coming Soon', 'Exercise picker will open here')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.createButton, { backgroundColor: theme.colors.success[500] }]}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Program</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: { height: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  placeholderText: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  addButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
  },
  createButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
