/**
 * 🔥 ATHLETICA AI - EXERCISE LIBRARY
 * Apple-level UI/UX with advanced animations
 * 120fps Reanimated 3 + Haptic Feedback + Micro-interactions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useStyledTheme } from '@theme/ThemeProvider';
import { Card, Badge } from '@components/ui';
import {
  getExercises,
  getExerciseCategories,
  type Exercise,
  type ExerciseFilters
} from '@services/workouts';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 2 columns with gap
const HEADER_HEIGHT = 280;
const SEARCH_BAR_HEIGHT = 56;

// Animated components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ExercisesScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

  // State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Animations
  const scrollY = useSharedValue(0);
  const searchFocused = useSharedValue(0);

  // Theme colors based on mode
  const textColors = theme.isDark ? theme.colors.dark.text : theme.colors.light.text;
  const bgColors = theme.isDark ? theme.colors.dark : theme.colors.light;

  // Category mapping with proper icons and colors
  const categoryConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; gradient: [string, string] }> = {
    all: { icon: 'grid', color: theme.colors.primary[500], gradient: [theme.colors.primary[500], theme.colors.primary[700]] },
    back: { icon: 'body', color: '#3B82F6', gradient: ['#3B82F6', '#1D4ED8'] },
    chest: { icon: 'flash', color: '#EF4444', gradient: ['#EF4444', '#B91C1C'] },
    shoulders: { icon: 'triangle', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
    arms: { icon: 'barbell', color: '#8B5CF6', gradient: ['#8B5CF6', '#6D28D9'] },
    legs: { icon: 'footsteps', color: '#10B981', gradient: ['#10B981', '#059669'] },
    core: { icon: 'fitness', color: '#F43F5E', gradient: ['#F43F5E', '#E11D48'] },
    cardio: { icon: 'heart', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
    full_body: { icon: 'flame', color: '#F97316', gradient: ['#F97316', '#EA580C'] },
  };

  const difficultyConfig = [
    { value: 'all', label: 'All Levels', color: theme.colors.secondary[400], icon: 'layers' as keyof typeof Ionicons.glyphMap },
    { value: 'beginner', label: 'Beginner', color: '#10B981', icon: 'leaf' as keyof typeof Ionicons.glyphMap },
    { value: 'intermediate', label: 'Intermediate', color: '#F59E0B', icon: 'trending-up' as keyof typeof Ionicons.glyphMap },
    { value: 'advanced', label: 'Advanced', color: '#EF4444', icon: 'flame' as keyof typeof Ionicons.glyphMap },
    { value: 'expert', label: 'Expert', color: '#8B5CF6', icon: 'trophy' as keyof typeof Ionicons.glyphMap },
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const filters: ExerciseFilters = {};
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty;
      if (searchQuery.trim()) filters.search = searchQuery;

      const [exercisesData, categoriesData] = await Promise.all([
        getExercises(filters),
        getExerciseCategories(),
      ]);

      setExercises(exercisesData);

      // Add "All" category and filter invalid ones
      const allCategories = [
        { name: 'all', count: exercisesData.length, icon: 'grid' },
        ...categoriesData
          .filter((cat: any) => cat.category) // Filter out invalid categories
          .map((cat: any) => ({
            name: cat.category,
            count: cat.count,
            icon: categoryConfig[cat.category]?.icon || 'barbell'
          }))
      ];
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category);
  }, []);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDifficulty(difficulty);
  }, []);

  // Handle exercise press
  const handleExercisePress = useCallback((exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/exercises/${exerciseId}` as any);
  }, [router]);

  // Header animation style
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT - 100],
      [1, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Search bar animation
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(searchFocused.value === 1 ? 1.02 : 1);
    return { transform: [{ scale }] };
  });

  // Render exercise card with advanced animations
  const renderExerciseCard = useCallback(({ item, index }: { item: Exercise; index: number }) => {
    const config = categoryConfig[item.category] || categoryConfig.all;

    return (
      <AnimatedTouchable
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        onPress={() => handleExercisePress(item.id)}
        style={[styles.exerciseCard, { width: CARD_WIDTH }]}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cardGradient}
          />

          {/* Difficulty badge */}
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.find(d => d.value === item.difficulty_level)?.color + '20' }]}>
            <Ionicons
              name={difficultyConfig.find(d => d.value === item.difficulty_level)?.icon || 'trophy'}
              size={12}
              color={difficultyConfig.find(d => d.value === item.difficulty_level)?.color || theme.colors.primary[500]}
            />
            <Text style={[styles.difficultyText, { color: difficultyConfig.find(d => d.value === item.difficulty_level)?.color }]}>
              {item.difficulty_level}
            </Text>
          </View>

          {/* Premium badge */}
          {item.is_premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: textColors.primary }]} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.cardMeta}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.cardMetaText, { color: textColors.secondary }]}>
              {item.category}
            </Text>
          </View>

          {/* Equipment tags */}
          {item.equipment_required && item.equipment_required.length > 0 && (
            <View style={styles.equipmentTags}>
              {item.equipment_required.slice(0, 2).map((eq, idx) => (
                <View key={idx} style={[styles.equipmentTag, { backgroundColor: theme.colors.secondary[100] }]}>
                  <Text style={[styles.equipmentTagText, { color: theme.colors.secondary[700] }]} numberOfLines={1}>
                    {eq}
                  </Text>
                </View>
              ))}
              {item.equipment_required.length > 2 && (
                <View style={[styles.equipmentTag, { backgroundColor: theme.colors.secondary[100] }]}>
                  <Text style={[styles.equipmentTagText, { color: theme.colors.secondary[700] }]}>
                    +{item.equipment_required.length - 2}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </AnimatedTouchable>
    );
  }, [handleExercisePress, theme, categoryConfig, difficultyConfig]);

  // Render category chip
  const renderCategoryChip = useCallback(({ item }: { item: { name: string; count: number; icon: string } }) => {
    const isSelected = selectedCategory === item.name;
    const config = categoryConfig[item.name] || categoryConfig.all;

    return (
      <AnimatedTouchable
        entering={SlideInRight.springify()}
        layout={Layout.springify()}
        onPress={() => handleCategorySelect(item.name)}
        style={[
          styles.categoryChip,
          isSelected && { backgroundColor: config.color },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={config.icon}
          size={18}
          color={isSelected ? '#FFFFFF' : config.color}
        />
        <Text style={[
          styles.categoryChipText,
          { color: isSelected ? '#FFFFFF' : textColors.primary }
        ]}>
          {item.name === 'all' ? 'All' : (item.name || '').charAt(0).toUpperCase() + (item.name || '').slice(1)}
        </Text>
        <View style={[
          styles.categoryCount,
          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.colors.secondary[100] }
        ]}>
          <Text style={[
            styles.categoryCountText,
            { color: isSelected ? '#FFFFFF' : theme.colors.secondary[700] }
          ]}>
            {item.count}
          </Text>
        </View>
      </AnimatedTouchable>
    );
  }, [selectedCategory, handleCategorySelect, theme, categoryConfig]);

  // Render difficulty chip
  const renderDifficultyChip = useCallback(({ item }: { item: typeof difficultyConfig[0] }) => {
    const isSelected = selectedDifficulty === item.value;

    return (
      <AnimatedTouchable
        entering={SlideInRight.delay(50).springify()}
        layout={Layout.springify()}
        onPress={() => handleDifficultySelect(item.value)}
        style={[
          styles.difficultyChip,
          isSelected && { backgroundColor: item.color, borderColor: item.color },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={item.icon}
          size={16}
          color={isSelected ? '#FFFFFF' : item.color}
        />
        <Text style={[
          styles.difficultyChipText,
          { color: isSelected ? '#FFFFFF' : textColors.primary }
        ]}>
          {item.label}
        </Text>
      </AnimatedTouchable>
    );
  }, [selectedDifficulty, handleDifficultySelect, theme]);

  // Stats
  const stats = useMemo(() => ({
    total: exercises.length,
    categories: new Set(exercises.map(ex => ex.category)).size,
    premium: exercises.filter(ex => ex.is_premium).length,
  }), [exercises]);

  return (
    <View style={[styles.container, { backgroundColor: bgColors.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Hero Header with Gradient */}
      <AnimatedLinearGradient
        colors={theme.isDark
          ? ['#1F2937', '#111827', bgColors.bg]
          : [theme.colors.primary[50], theme.colors.primary[100], bgColors.bg]
        }
        style={[styles.header, headerAnimatedStyle]}
      >
        <View style={styles.headerContent}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={[styles.headerTitle, { color: textColors.primary }]}>
              Exercise Library
            </Text>
            <Text style={[styles.headerSubtitle, { color: textColors.secondary }]}>
              {stats.total}+ Professional Exercises
            </Text>
          </Animated.View>

          {/* Stats Pills */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsPills}>
            <View style={[styles.statPill, { backgroundColor: theme.colors.primary[100] }]}>
              <Ionicons name="barbell" size={16} color={theme.colors.primary[600]} />
              <Text style={[styles.statPillText, { color: theme.colors.primary[700] }]}>
                {stats.total} Exercises
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.colors.success[100] }]}>
              <Ionicons name="grid" size={16} color={theme.colors.success[600]} />
              <Text style={[styles.statPillText, { color: theme.colors.success[700] }]}>
                {stats.categories} Categories
              </Text>
            </View>
            {stats.premium > 0 && (
              <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={[styles.statPillText, { color: '#D97706' }]}>
                  {stats.premium} Premium
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </AnimatedLinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
          <View style={[styles.searchBar, { backgroundColor: bgColors.surface }]}>
            <Ionicons name="search" size={20} color={textColors.secondary} />
            <TextInput
              style={[styles.searchInput, { color: textColors.primary }]}
              placeholder="Search exercises..."
              placeholderTextColor={textColors.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => {
                searchFocused.value = 1;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onBlur={() => { searchFocused.value = 0; }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={textColors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Category Filters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Categories</Text>
          <FlatList
            horizontal
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.name}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
          />
        </View>

        {/* Difficulty Filters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>Difficulty</Text>
          <FlatList
            horizontal
            data={difficultyConfig}
            renderItem={renderDifficultyChip}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
          />
        </View>

        {/* Exercises Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              {selectedCategory === 'all' ? 'All Exercises' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Exercises`}
            </Text>
            <Text style={[styles.sectionCount, { color: textColors.secondary }]}>
              {exercises.length} found
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: textColors.secondary }]}>Loading exercises...</Text>
            </View>
          ) : exercises.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={64} color={textColors.tertiary} />
              <Text style={[styles.emptyTitle, { color: textColors.primary }]}>No exercises found</Text>
              <Text style={[styles.emptyText, { color: textColors.secondary }]}>
                Try adjusting your filters
              </Text>
            </Animated.View>
          ) : (
            <FlatList
              data={exercises}
              renderItem={renderExerciseCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.exercisesRow}
              scrollEnabled={false}
              contentContainerStyle={styles.exercisesList}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: SEARCH_BAR_HEIGHT,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipsList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  difficultyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  difficultyChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exercisesList: {
    paddingHorizontal: 24,
  },
  exercisesRow: {
    gap: 16,
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    backdropFilter: 'blur(10px)',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
  },
  cardContent: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardMetaText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  equipmentTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equipmentTagText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
