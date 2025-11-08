# 🚨 ACTIONS MANUELLES REQUISES - TODO LIST

> **IMPORTANT**: Ces étapes sont BLOQUANTES pour tester l'app en production. Mais le code est 99% prêt!

---

## ✅ CHECKLIST COMPLÈTE (Ce que TU dois faire)

### 🔴 CRITIQUE - BLOQUANT (Obligatoire pour app fonctionnelle)

#### 1. **SUPABASE SETUP** (~2 min) - PRIORITÉ #1
**Status**: ✅ Presque fait (tu as déjà fait la majorité!)
**Impact**: BLOQUANT - App ne fonctionne pas sans ça

**Ce qui reste à faire** (JUSTE LES AJOUTS D'AUJOURD'HUI):

- [ ] **1.1** Copier **Project URL** (Settings → API) - si pas déjà fait
- [ ] **1.2** Copier **anon/public key** (Settings → API) - si pas déjà fait
- [ ] **1.3** Aller dans SQL Editor
- [ ] **1.4** Copier-coller le contenu de `supabase/migrations/2025-10-24-workout-player-stats.sql` (200 lignes)
- [ ] **1.5** Cliquer "Run" → Attendre ~30 secondes
- [ ] **1.6** Vérifier "Success. No rows returned" ✅

**Note**: Tu as déjà exécuté `supabase/schema.sql` (tables de base), ce fichier ajoute SEULEMENT:
- 3 index pour performance (stats queries rapides)
- 3 RLS policies (sécurité workout sessions)
- 2 helper functions (calculate streak, get stats summary)

**Fichier à modifier après**:
```bash
# Créer fichier .env à la racine du projet
cp .env.example .env

# Puis éditer .env et remplacer:
EXPO_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ta-cle-anon-ici
```

**Résultat attendu**: Auth fonctionne, workouts se chargent, sessions se sauvent ✅

---

#### 2. **OPENAI API KEY** (~5 min) - PRIORITÉ #2
**Status**: ❌ Pas fait
**Impact**: AI Coach ne génère pas de workouts

**Actions**:
- [ ] **2.1** Aller sur https://platform.openai.com/api-keys
- [ ] **2.2** Créer compte OpenAI (si pas déjà fait)
- [ ] **2.3** Cliquer "Create new secret key"
- [ ] **2.4** Nommer la clé "AthleticaAI Mobile"
- [ ] **2.5** Copier la clé (commence par `sk-...`)
- [ ] **2.6** **ATTENTION**: La clé ne sera plus jamais visible - sauvegarde-la!

**Fichier à modifier**:
```bash
# Dans .env
EXPO_PUBLIC_OPENAI_API_KEY=sk-ta-cle-openai-ici
```

**Coût estimé**: $0.02-0.05 par workout généré (~$5-10/mois pour testing)

**Résultat attendu**: AI Generator crée des workouts science-backed ✅

---

#### 3. **REVENUECAT SETUP** (~20 min) - PRIORITÉ #3
**Status**: ❌ Pas fait
**Impact**: Subscriptions ne fonctionnent pas (paywall vide)

**Guide complet**: `docs/REVENUECAT_SETUP.md` (400+ lignes - step-by-step)

**Actions RAPIDES** (détails dans le guide):
- [ ] **3.1** Créer compte RevenueCat → https://app.revenuecat.com/
- [ ] **3.2** Créer projet "AthleticaAI"
- [ ] **3.3** Ajouter app iOS (Bundle ID: `com.athleticaai.mobile` ou ton choix)
- [ ] **3.4** Ajouter app Android (Package: `com.athleticaai.mobile`)
- [ ] **3.5** Copier **iOS SDK Key** (commence par `appl_...`)
- [ ] **3.6** Copier **Android SDK Key** (commence par `goog_...`)

**Fichier à modifier**:
```bash
# Dans .env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_ta-cle-ios
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_ta-cle-android
```

**Note**: Pour TESTER les achats, tu devras aussi:
- [ ] Créer produits dans App Store Connect (iOS)
- [ ] Créer produits dans Google Play Console (Android)
- [ ] Configurer offerings dans RevenueCat dashboard

**Résultat attendu**: Paywall affiche vrais prix, achats fonctionnent ✅

---

### 🟡 IMPORTANT - Recommandé (Pour analytics & monitoring)

#### 4. **MIXPANEL ANALYTICS** (~5 min) - Optionnel mais recommandé
**Status**: ❌ Pas fait
**Impact**: Pas de tracking événements (conversions, engagement, etc.)

**Actions**:
- [ ] **4.1** Aller sur https://mixpanel.com/
- [ ] **4.2** Créer compte gratuit (plan Free: 100k events/mois)
- [ ] **4.3** Créer projet "AthleticaAI Mobile"
- [ ] **4.4** Copier **Project Token** (Settings → Project)

**Fichier à modifier**:
```bash
# Dans .env
EXPO_PUBLIC_MIXPANEL_TOKEN=ton-token-mixpanel
```

**Code à activer**:
- Dans `src/services/revenuecat/config.ts`, remplacer:
```typescript
// Actuellement (ligne ~25):
function trackRevenueCatEvent(event: string, properties?: Record<string, any>) {
  console.log('[RevenueCat Event]', event, properties);
  // TODO: Replace with Mixpanel.track(event, properties);
}

// Par:
import Mixpanel from 'mixpanel-react-native';

function trackRevenueCatEvent(event: string, properties?: Record<string, any>) {
  Mixpanel.track(event, properties);
}
```

**Résultat attendu**: Tous les événements trackés (signups, purchases, workouts, etc.) ✅

---

### 🟢 BONUS - Optionnel (Pour production avancée)

#### 5. **SENTRY ERROR TRACKING** (~5 min)
**Status**: ❌ Pas fait
**Impact**: Pas de monitoring erreurs production

**Actions**:
- [ ] Aller sur https://sentry.io/
- [ ] Créer compte + projet React Native
- [ ] Copier DSN

```bash
# Dans .env
SENTRY_DSN=https://ton-sentry-dsn
```

---

#### 6. **SEED WORKOUT DATA** (~2 min) - Recommandé pour testing
**Status**: ❌ Pas fait (mais script prêt!)
**Impact**: Pas de workouts dans library pour tester

**Actions**:
```bash
# APRÈS avoir setup Supabase (étape 1)
npx tsx scripts/seed-workouts.ts
```

**Résultat**: 177 exercises + 10 workouts seeded ✅

---

## 📋 RÉSUMÉ ORDRE RECOMMANDÉ

```
1. SUPABASE MIGRATION (2 min) ← CRITIQUE - Juste les ajouts d'aujourd'hui!
2. OPENAI API KEY (5 min) ← CRITIQUE
3. REVENUECAT SETUP (20 min) ← CRITIQUE
4. Seed workout data (2 min) ← Recommandé
5. Mixpanel (5 min) ← Optionnel
6. Sentry (5 min) ← Optionnel

TOTAL TEMPS: ~34 min (core features) - 13 min de gagné! 🚀
```

---

## 🚀 CE QUI FONCTIONNE DÉJÀ (Sans setup!)

**UI/UX** (100% prêt):
- ✅ Écrans auth (Sign In, Sign Up, Forgot Password)
- ✅ Onboarding 10 étapes
- ✅ Dashboard avec stats
- ✅ Workout Library UI
- ✅ Progress charts
- ✅ Profile screen
- ✅ Paywall screen (UI seulement)

**Features CORE** (Code prêt, attend API keys):
- ✅ AI Workout Generator (attend OpenAI key)
- ✅ Workout Player full-screen
- ✅ Post-workout summary
- ✅ Stats service (attend Supabase)
- ✅ RevenueCat integration (attend API keys)
- ✅ Premium gating system
- ✅ Daily limits (AsyncStorage)

**Animations & Polish**:
- ✅ Confetti celebration
- ✅ Haptic feedback partout
- ✅ Dark mode complet
- ✅ Skeleton loaders
- ✅ Pull-to-refresh
- ✅ Error states
- ✅ Empty states

---

## 🎯 QUAND FAIRE CES SETUPS?

**Option 1: Maintenant** (47 min)
- Avantage: App testable immédiatement
- Inconvénient: Pause développement

**Option 2: Plus tard** (quand tu veux tester)
- Avantage: Je peux continuer à builder
- Inconvénient: Features dépendantes bloquées

**Option 3: Par étapes**
- Supabase d'abord (15 min) → Auth + Workouts testables
- OpenAI après (5 min) → AI Coach testable
- RevenueCat à la fin (20 min) → Monetization testable

---

## 🔗 FICHIERS DE RÉFÉRENCE

- `supabase/schema.sql` - SQL à exécuter dans Supabase
- `docs/REVENUECAT_SETUP.md` - Guide RevenueCat complet
- `.env.example` - Template variables d'environnement
- `scripts/seed-workouts.ts` - Script seed data

---

## ❓ AIDE RAPIDE

**Problème**: "Je ne sais pas où mettre les clés API"
**Solution**: Créer fichier `.env` à la racine (copier `.env.example`)

**Problème**: "Supabase tables ne se créent pas"
**Solution**: Vérifier que tu as bien copié-collé TOUT le SQL (1200+ lignes)

**Problème**: "RevenueCat setup trop complexe"
**Solution**: Lire `docs/REVENUECAT_SETUP.md` - chaque étape expliquée

**Problème**: "OpenAI trop cher"
**Solution**: Plan Free $5 credit - suffisant pour 100-200 workouts générés

---

**🔥 L'APP EST 99% PRÊTE - IL MANQUE JUSTE TES CLÉS API! 🚀**
