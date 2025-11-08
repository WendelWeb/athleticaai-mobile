/**
 * Tabs Layout - Bottom tab navigation with custom center button
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyledTheme } from '@theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const theme = useStyledTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Calculate safe tab bar height
  // iOS: Home indicator needs ~34px, add 20px padding = 54px + icon height
  // Android: Gesture navigation can be 48-60px, add safe padding
  // We ensure minimum padding even if insets.bottom is 0
  const MIN_BOTTOM_PADDING = Platform.OS === 'ios' ? 20 : 16;
  const tabBarPaddingBottom = Math.max(insets.bottom, MIN_BOTTOM_PADDING);

  // Dynamic height calculation: base height + bottom padding
  // This ensures tab bar is always above system buttons
  const BASE_TAB_HEIGHT = 50; // Height for icons + labels
  const tabBarHeight = BASE_TAB_HEIGHT + tabBarPaddingBottom + 8; // +8 for top padding

  // Custom Create Button Component (Instagram/TikTok style)
  const CreateButton = () => {
    return (
      <TouchableOpacity
        onPress={() => {
          Platform.OS === 'ios' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/(tabs)/create');
        }}
        activeOpacity={0.8}
        style={customStyles.createButtonContainer}
      >
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[600]]}
          style={customStyles.createButton}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.isDark
          ? theme.colors.dark.text.tertiary
          : theme.colors.light.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.isDark
            ? theme.colors.dark.surface
            : theme.colors.light.surface,
          borderTopColor: theme.isDark
            ? theme.colors.dark.border
            : theme.colors.light.border,
          borderTopWidth: 1,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      {/* CUSTOM CREATE BUTTON (Instagram/TikTok style) */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => <CreateButton />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Styles for custom create button
const customStyles = StyleSheet.create({
  createButtonContainer: {
    top: -20, // Raise button above tab bar
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

