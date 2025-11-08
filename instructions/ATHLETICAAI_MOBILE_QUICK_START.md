# ⚡ AthleticaAI Mobile - Quick Start Guide

## 🚀 DÉMARRAGE RAPIDE (30 minutes)

### Étape 1: Créer le projet (5 min)

```bash
# Créer le projet Expo avec TypeScript
npx create-expo-app@latest athleticaai-mobile --template expo-template-blank-typescript

cd athleticaai-mobile

# Installer Expo Router
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Installer Reanimated & Gesture Handler
npx expo install react-native-reanimated react-native-gesture-handler
```

### Étape 2: Installer les dépendances (10 min)

```bash
# State Management & Data Fetching
npm install zustand @tanstack/react-query axios

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components
npm install react-native-paper moti @shopify/flash-list

# Backend
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# Payments
npm install react-native-purchases

# Analytics
npm install @amplitude/analytics-react-native

# Utils
npm install date-fns lodash react-native-mmkv

# Icons
npm install lucide-react-native

# Lottie Animations
npx expo install lottie-react-native

# Video
npx expo install expo-av

# Camera
npx expo install expo-camera

# Notifications
npx expo install expo-notifications

# Dev Dependencies
npm install -D @types/lodash
```

### Étape 3: Configuration (5 min)

#### app.json
```json
{
  "expo": {
    "name": "AthleticaAI",
    "slug": "athleticaai-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.athleticaai.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10B981"
      },
      "package": "com.athleticaai.mobile"
    },
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow AthleticaAI to access your camera for form check."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#10B981"
        }
      ]
    ],
    "scheme": "athleticaai",
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

#### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      require.resolve('expo-router/babel'),
    ],
  };
};
```

#### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Étape 4: Structure de base (10 min)

```bash
# Créer la structure
mkdir -p src/{components,features,services,stores,hooks,utils,types,constants,theme}
mkdir -p src/components/{ui,workout,ai,nutrition,progress,social,animations}
mkdir -p src/features/{onboarding,workout,nutrition,progress,ai-coach,social,subscription}
mkdir -p src/services/{api,ai,analytics,notifications,storage,wearables}
mkdir -p assets/{animations,videos,images,fonts}

# Créer les fichiers de base
touch src/theme/index.ts
touch src/constants/colors.ts
touch src/services/api/supabase.ts
touch src/stores/authStore.ts
```

---

## 📝 FICHIERS DE BASE À CRÉER

### 1. Theme (src/theme/index.ts)

```typescript
export const theme = {
  colors: {
    primary: '#10B981',
    secondary: '#3B82F6',
    accent: {
      purple: '#8B5CF6',
      orange: '#F59E0B',
      pink: '#EC4899',
    },
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  typography: {
    h1: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
    h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h3: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    body1: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    body2: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  },
};

export type Theme = typeof theme;
```

### 2. Supabase Client (src/services/api/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 3. Auth Store (src/stores/authStore.ts)

```typescript
import { create } from 'zustand';
import { supabase } from '@/services/api/supabase';

interface AuthStore {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
  },
  
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
}));
```

### 4. Root Layout (app/_layout.tsx)

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(onboarding)" />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### 5. Home Screen (app/(tabs)/index.tsx)

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AthleticaAI</Text>
      <Text style={styles.subtitle}>Your AI Fitness Coach</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
});
```

---

## 🔑 VARIABLES D'ENVIRONNEMENT

Créer `.env` à la racine :

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=your-key

# Mixpanel
EXPO_PUBLIC_MIXPANEL_TOKEN=your-token
```

---

## 🧪 TESTER L'APP

```bash
# Démarrer le serveur dev
npx expo start

# Scanner le QR code avec Expo Go (iOS/Android)
# OU
# Appuyer sur 'i' pour iOS Simulator
# Appuyer sur 'a' pour Android Emulator
```

---

## 📦 PROCHAINES ÉTAPES

### Semaine 1: Foundation
1. ✅ Setup projet
2. ✅ Configuration de base
3. ⏳ Créer design system complet
4. ⏳ Implémenter navigation
5. ⏳ Setup Supabase database
6. ⏳ Créer auth flow

### Semaine 2: Onboarding
1. ⏳ Welcome screens
2. ⏳ 10 étapes onboarding
3. ⏳ Validation forms
4. ⏳ Animations transitions
5. ⏳ Sauvegarde données

### Semaine 3-4: Core Features
1. ⏳ Dashboard home
2. ⏳ Workout library
3. ⏳ Workout player
4. ⏳ Progress tracking
5. ⏳ AI coach chat

---

## 🎯 COMMANDES UTILES

```bash
# Démarrer dev server
npx expo start

# Clear cache
npx expo start -c

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npx eslint .
```

---

## 📚 RESSOURCES

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Supabase**: https://supabase.com/docs
- **RevenueCat**: https://docs.revenuecat.com
- **Reanimated**: https://docs.swmansion.com/react-native-reanimated

---

**Vous êtes prêt à créer AthleticaAI Mobile ! 🚀**

**Prochaine étape**: Copier le MEGA PROMPT dans un nouveau chat et commencer l'implémentation complète !

