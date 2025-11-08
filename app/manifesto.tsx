/**
 * Manifesto Screen - The Warrior Philosophy
 *
 * Features from ULTIMATE_FEATURES.md:
 * - The AthleticaAI Manifesto
 * - 10 Commandments of the Warrior
 * - Core Values
 * - Share functionality
 * - Inspirational design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyledTheme } from '@theme/ThemeProvider';

const MANIFESTO = `Nous sommes les Warriors.

Nous choisissons la discipline sur le confort.
Nous transformons la douleur en pouvoir.
Nous ne cherchons pas l'excuse, nous trouvons le chemin.

Chaque rep est une prière. Chaque workout est un rituel.

Nous ne sommes pas nés forts. Nous nous sommes forgés.

Nous sommes AthleticaAI. Nous sommes inarrêtables.`;

const COMMANDMENTS = [
  { id: 1, text: 'Tu ne skiperas point', icon: 'fitness' },
  { id: 2, text: 'Tu célébreras les victoires des autres', icon: 'people' },
  { id: 3, text: 'Tu partageras tes connaissances', icon: 'book' },
  { id: 4, text: "Tu embrasseras l'inconfort", icon: 'flame' },
  { id: 5, text: 'Tu seras patient avec toi-même', icon: 'time' },
  { id: 6, text: 'Tu nourriras ton esprit autant que ton corps', icon: 'nutrition' },
  { id: 7, text: 'Tu resteras humble dans la victoire', icon: 'ribbon' },
  { id: 8, text: 'Tu te relèveras après chaque chute', icon: 'trending-up' },
  { id: 9, text: "Tu inspireras par l'exemple", icon: 'star' },
  { id: 10, text: 'Tu laisseras un héritage', icon: 'trophy' },
];

const CORE_VALUES = [
  { name: 'Discipline', icon: 'checkmark-circle', color: '#3B82F6' },
  { name: 'Résilience', icon: 'shield', color: '#8B5CF6' },
  { name: 'Communauté', icon: 'people', color: '#10B981' },
  { name: 'Progression', icon: 'trending-up', color: '#F59E0B' },
  { name: 'Mindset', icon: 'bulb', color: '#EF4444' },
  { name: 'Authenticité', icon: 'heart', color: '#EC4899' },
];

export default function ManifestoScreen() {
  const theme = useStyledTheme();
  const router = useRouter();

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

  const handleShare = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await Share.share({
        message: `💪 The AthleticaAI Warrior Manifesto\n\n${MANIFESTO}\n\nJoin the movement: AthleticaAI`,
        title: 'Warrior Manifesto',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Warrior Manifesto',
          headerStyle: {
            backgroundColor: theme.isDark ? theme.colors.dark.bg : theme.colors.light.bg,
          },
          headerTintColor: textColors.primary,
          headerRight: () => (
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
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
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={
            theme.isDark
              ? ['#8B5CF6', '#3B82F6', '#10B981']
              : ['#A78BFA', '#60A5FA', '#34D399']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="shield" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>The Warrior Manifesto</Text>
          <Text style={styles.heroSubtitle}>
            Our Philosophy. Our Identity. Our Way.
          </Text>
        </LinearGradient>

        {/* Manifesto Text */}
        <View style={[styles.section, { backgroundColor: bgColors.card }]}>
          <Text style={[styles.manifestoText, { color: textColors.primary }]}>
            {MANIFESTO}
          </Text>
        </View>

        {/* 10 Commandments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              10 Commandments of the Warrior
            </Text>
          </View>

          <View style={styles.commandmentsList}>
            {COMMANDMENTS.map((commandment) => (
              <View
                key={commandment.id}
                style={[styles.commandmentItem, { backgroundColor: bgColors.card }]}
              >
                <View
                  style={[
                    styles.commandmentNumber,
                    { backgroundColor: theme.colors.primary[500] },
                  ]}
                >
                  <Text style={styles.commandmentNumberText}>{commandment.id}</Text>
                </View>
                <View style={styles.commandmentContent}>
                  <Ionicons
                    name={commandment.icon as any}
                    size={20}
                    color={theme.colors.primary[500]}
                  />
                  <Text style={[styles.commandmentText, { color: textColors.primary }]}>
                    {commandment.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Core Values */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond" size={28} color={theme.colors.secondary[500]} />
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>
              Core Values
            </Text>
          </View>

          <View style={styles.valuesGrid}>
            {CORE_VALUES.map((value) => (
              <View
                key={value.name}
                style={[styles.valueCard, { backgroundColor: bgColors.card }]}
              >
                <View style={[styles.valueIcon, { backgroundColor: value.color + '20' }]}>
                  <Ionicons name={value.icon as any} size={28} color={value.color} />
                </View>
                <Text style={[styles.valueName, { color: textColors.primary }]}>
                  {value.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tribal Salutation */}
        <View style={[styles.salutationCard, { backgroundColor: bgColors.card }]}>
          <Ionicons name="flash" size={32} color={theme.colors.warning[500]} />
          <View style={styles.salutationContent}>
            <Text style={[styles.salutationTitle, { color: textColors.primary }]}>
              Stay Strong, Warrior!
            </Text>
            <Text style={[styles.salutationSubtitle, { color: textColors.secondary }]}>
              Forge On! No Excuses! We Rise Together!
            </Text>
          </View>
        </View>

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
    paddingBottom: 24,
  },
  hero: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  manifestoText: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commandmentsList: {
    gap: 12,
  },
  commandmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  commandmentNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandmentNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commandmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commandmentText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  salutationCard: {
    marginTop: 24,
    marginHorizontal: 24,
    flexDirection: 'row',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  salutationContent: {
    flex: 1,
  },
  salutationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  salutationSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
