/**
 * Morning Ritual Screen
 *
 * Features from ULTIMATE_FEATURES.md:
 * - Daily morning checklist (5 items)
 * - 5:00 AM Club badge
 * - Streak tracking
 * - Progress animation
 * - Motivational quotes
 * - Share accomplishments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Card, Badge } from '@components/ui';

// Daily ritual items
interface RitualItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  xpReward: number;
  color: string;
}

const RITUAL_ITEMS: RitualItem[] = [
  {
    id: '5am-club',
    title: '5:00 AM Club',
    description: 'Wake up at 5:00 AM',
    icon: 'sunny',
    xpReward: 50,
    color: '#F59E0B',
  },
  {
    id: 'morning-mantra',
    title: 'Morning Mantra',
    description: 'Recite your warrior mantra',
    icon: 'chatbubble-ellipses',
    xpReward: 20,
    color: '#8B5CF6',
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Write 3 things you\'re grateful for',
    icon: 'heart',
    xpReward: 20,
    color: '#EC4899',
  },
  {
    id: 'visualization',
    title: 'Visualization',
    description: 'Visualize your ideal day for 5 minutes',
    icon: 'eye',
    xpReward: 30,
    color: '#3B82F6',
  },
  {
    id: 'cold-shower',
    title: 'Cold Shower Challenge',
    description: 'Take a cold shower (30s minimum)',
    icon: 'water',
    xpReward: 40,
    color: '#10B981',
  },
];

const MOTIVATIONAL_QUOTES = [
  "The early bird catches the worm. The disciplined warrior conquers the day.",
  "Win the morning, win the day. Own your ritual.",
  "5 AM is when legends are made. Be a legend.",
  "Discipline is doing what needs to be done, even when you don't want to.",
  "Your morning sets the tone for your entire day. Make it legendary.",
];

export default function MorningRitualScreen() {
  const theme = useStyledTheme();
  const router = useRouter();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);
  const [todayQuote] = useState(
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

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

  // Load saved state on mount
  useEffect(() => {
    loadRitualState();
  }, []);

  const loadRitualState = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const savedDate = await AsyncStorage.getItem('morning_ritual_date');
      const savedCompleted = await AsyncStorage.getItem('morning_ritual_completed');
      const savedStreak = await AsyncStorage.getItem('morning_ritual_streak');

      // Reset if new day
      if (savedDate !== today) {
        // Check if ritual was completed yesterday
        if (savedDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (savedDate === yesterdayStr && savedCompleted) {
            const completed = JSON.parse(savedCompleted);
            // If all items were completed yesterday, increment streak
            if (completed.length === RITUAL_ITEMS.length) {
              const newStreak = (parseInt(savedStreak || '0', 10) + 1);
              setStreak(newStreak);
              await AsyncStorage.setItem('morning_ritual_streak', newStreak.toString());
            } else {
              // Streak broken
              setStreak(0);
              await AsyncStorage.setItem('morning_ritual_streak', '0');
            }
          } else {
            // Streak broken (missed a day)
            setStreak(0);
            await AsyncStorage.setItem('morning_ritual_streak', '0');
          }
        }

        // Reset for today
        setCompletedItems(new Set());
        await AsyncStorage.setItem('morning_ritual_date', today);
        await AsyncStorage.setItem('morning_ritual_completed', JSON.stringify([]));
      } else {
        // Same day - restore state
        if (savedCompleted) {
          const completed = JSON.parse(savedCompleted);
          setCompletedItems(new Set(completed));
        }
        if (savedStreak) {
          setStreak(parseInt(savedStreak, 10));
        }
      }

      setLastCompletionDate(savedDate);
    } catch (error) {
      console.error('Error loading ritual state:', error);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);

      // Celebration haptic for completion
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
      }
    }

    setCompletedItems(newCompleted);

    // Save to AsyncStorage
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('morning_ritual_date', today);
    await AsyncStorage.setItem('morning_ritual_completed', JSON.stringify(Array.from(newCompleted)));
  };

  const handleShare = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const completedCount = completedItems.size;
    const totalCount = RITUAL_ITEMS.length;
    const progress = Math.round((completedCount / totalCount) * 100);

    try {
      await Share.share({
        message: `💪 Morning Ritual: ${completedCount}/${totalCount} completed (${progress}%)\\n🔥 Streak: ${streak} days\\n\\nI'm winning the morning with AthleticaAI!`,
        title: 'My Morning Ritual',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const completedCount = completedItems.size;
  const totalCount = RITUAL_ITEMS.length;
  const progress = (completedCount / totalCount) * 100;
  const totalXP = Array.from(completedItems).reduce((sum, itemId) => {
    const item = RITUAL_ITEMS.find((i) => i.id === itemId);
    return sum + (item?.xpReward || 0);
  }, 0);

  const isFullyCompleted = completedCount === totalCount;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Morning Ritual',
          headerStyle: {
            backgroundColor: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
          },
          headerTintColor: textColors.primary,
          headerRight: () => (
            <Pressable
              onPress={handleShare}
              style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="share-outline" size={24} color={textColors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: bgColors.primary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - Progress Overview */}
        <LinearGradient
          colors={
            isFullyCompleted
              ? ['#10B981', '#059669']
              : theme.isDark
              ? ['#6B7280', '#4B5563']
              : ['#E5E7EB', '#D1D5DB']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            {/* Progress Circle */}
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>
                {completedCount}/{totalCount}
              </Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>

            {/* Stats */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="flame" size={24} color="#FFFFFF" />
                <Text style={styles.heroStatValue}>{streak}</Text>
                <Text style={styles.heroStatLabel}>Day Streak</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Ionicons name="star" size={24} color="#FFFFFF" />
                <Text style={styles.heroStatValue}>{totalXP}</Text>
                <Text style={styles.heroStatLabel}>XP Today</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </LinearGradient>

        {/* Motivational Quote */}
        <Card shadow="sm" padding="md" style={{ marginTop: theme.spacing.lg }}>
          <View style={styles.quoteContainer}>
            <Ionicons name="chatbubble-ellipses" size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.quoteText, { color: textColors.secondary }]}>
              {todayQuote}
            </Text>
          </View>
        </Card>

        {/* Ritual Checklist */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
            Today's Ritual
          </Text>

          {RITUAL_ITEMS.map((item) => {
            const isCompleted = completedItems.has(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => handleToggleItem(item.id)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.ritualItem,
                  { backgroundColor: bgColors.card, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {/* Checkbox */}
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isCompleted ? item.color : 'transparent',
                      borderColor: isCompleted ? item.color : bgColors.border,
                    },
                  ]}
                >
                  {isCompleted && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </View>

                {/* Icon */}
                <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>

                {/* Content */}
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: textColors.primary },
                      isCompleted && styles.itemTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDescription, { color: textColors.secondary }]}>
                    {item.description}
                  </Text>
                </View>

                {/* XP Badge */}
                <Badge
                  variant={isCompleted ? 'success' : 'neutral'}
                  size="sm"
                >
                  {`+${item.xpReward} XP`}
                </Badge>
              </Pressable>
            );
          })}
        </View>

        {/* Completion Celebration */}
        {isFullyCompleted && (
          <Card
            shadow="lg"
            padding="lg"
            style={[styles.celebrationCard, { backgroundColor: theme.colors.success[500] }]}
          >
            <View style={styles.celebrationContent}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationTitle}>Ritual Complete!</Text>
              <Text style={styles.celebrationMessage}>
                You've conquered the morning! {totalXP} XP earned. Keep the streak alive tomorrow!
              </Text>
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  ritualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemDescription: {
    fontSize: 14,
  },
  celebrationCard: {
    marginTop: 24,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
