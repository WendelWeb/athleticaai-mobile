/**
 * Custom Exercise Creator - STARTER VERSION
 *
 * Add custom exercises to personal library:
 * - Name, description, category
 * - Difficulty, equipment
 * - Upload thumbnail/video (optional)
 * - Instructions, tips
 *
 * TODO: Full creator with image/video upload, muscle group selector, etc.
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

export default function CreateExerciseScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('strength');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [equipment, setEquipment] = useState('');

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
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    Alert.alert('Success', 'Custom exercise created! (Starter version)', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColors.primary }]}>
      <Stack.Screen
        options={{
          title: 'Create Exercise',
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
            Starter version. Full creator coming soon:{'\n'}• Image/Video upload{'\n'}• Muscle group
            selector{'\n'}• Instructions editor{'\n'}• Form tips
          </Text>
        </View>

        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>
            EXERCISE DETAILS
          </Text>

          <Text style={[styles.label, { color: textColors.primary }]}>Exercise Name *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: bgColors.surface,
              color: textColors.primary,
              borderColor: bgColors.border,
            }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Bulgarian Split Squat"
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
            placeholder="Describe the exercise..."
            placeholderTextColor={textColors.tertiary}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.label, { color: textColors.primary }]}>Equipment</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: bgColors.surface,
              color: textColors.primary,
              borderColor: bgColors.border,
            }]}
            value={equipment}
            onChangeText={setEquipment}
            placeholder="e.g., Barbell, Dumbbells, None"
            placeholderTextColor={textColors.tertiary}
          />
        </View>

        {/* Media Upload Placeholder */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.sectionTitle, { color: textColors.secondary }]}>MEDIA</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: bgColors.surface, borderColor: bgColors.border }]}
            onPress={() => Alert.alert('Coming Soon', 'Image/video upload will be here')}
          >
            <Ionicons name="cloud-upload-outline" size={32} color={textColors.tertiary} />
            <Text style={[styles.uploadText, { color: textColors.secondary }]}>
              Upload Photo/Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.createButton, { backgroundColor: theme.colors.success[500] }]}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Exercise</Text>
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
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadText: { fontSize: 14, fontWeight: '600', marginTop: 12 },
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
