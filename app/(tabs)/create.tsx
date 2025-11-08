/**
 * Create Screen - Post photos/videos
 *
 * Features:
 * - Take photo with camera
 * - Pick from gallery
 * - Add caption
 * - Share to community
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledTheme } from '@theme/ThemeProvider';
import * as Haptics from 'expo-haptics';

export default function CreateScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const bgColors = {
    primary: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
    surface: theme.isDark ? theme.colors.dark.surface : theme.colors.light.surface,
    card: theme.isDark ? theme.colors.dark.card : theme.colors.light.card,
  };

  const textColors = {
    primary: theme.isDark ? theme.colors.dark.text.primary : theme.colors.light.text.primary,
    secondary: theme.isDark ? theme.colors.dark.text.secondary : theme.colors.light.text.secondary,
  };

  const handleTakePhoto = async () => {
    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Navigate to post creation with image
        // TODO: Implement post creation flow
        Alert.alert('Success', 'Photo taken! (Post creation coming soon)', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo', [{ text: 'OK' }]);
    }
  };

  const handlePickImage = async () => {
    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select images.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Navigate to post creation with image
        // TODO: Implement post creation flow
        Alert.alert('Success', 'Image selected! (Post creation coming soon)', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image', [{ text: 'OK' }]);
    }
  };

  const handlePickVideo = async () => {
    Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select videos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Navigate to post creation with video
        // TODO: Implement post creation flow
        Alert.alert('Success', 'Video selected! (Post creation coming soon)', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColors.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={textColors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColors.primary }]}>Create Post</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content - ScrollView to see all options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: textColors.primary }]}>
          Share Your Journey
        </Text>
        <Text style={[styles.subtitle, { color: textColors.secondary }]}>
          Inspire the community with your fitness progress
        </Text>

        {/* Action Cards */}
        <View style={styles.actionsGrid}>
          {/* Take Photo */}
          <TouchableOpacity
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            style={[styles.actionCard, { backgroundColor: bgColors.card }]}
          >
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.actionIconContainer}
            >
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: textColors.primary }]}>Take Photo</Text>
            <Text style={[styles.actionSubtitle, { color: textColors.secondary }]}>
              Capture the moment
            </Text>
          </TouchableOpacity>

          {/* Pick Image */}
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={[styles.actionCard, { backgroundColor: bgColors.card }]}
          >
            <LinearGradient
              colors={[theme.colors.success[500], theme.colors.success[600]]}
              style={styles.actionIconContainer}
            >
              <Ionicons name="images" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: textColors.primary }]}>Photo Library</Text>
            <Text style={[styles.actionSubtitle, { color: textColors.secondary }]}>
              Choose from gallery
            </Text>
          </TouchableOpacity>

          {/* Pick Video */}
          <TouchableOpacity
            onPress={handlePickVideo}
            activeOpacity={0.8}
            style={[styles.actionCard, { backgroundColor: bgColors.card }]}
          >
            <LinearGradient
              colors={[theme.colors.error[500], theme.colors.error[600]]}
              style={styles.actionIconContainer}
            >
              <Ionicons name="videocam" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: textColors.primary }]}>Record Video</Text>
            <Text style={[styles.actionSubtitle, { color: textColors.secondary }]}>
              Share a video
            </Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  actionsGrid: {
    gap: 16,
  },
  actionCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
  },
});
