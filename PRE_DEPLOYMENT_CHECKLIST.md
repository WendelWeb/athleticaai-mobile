# 🚀 PRE-DEPLOYMENT CHECKLIST - ATHLETICAAI

## ⚠️ ACTIONS CRITIQUES AVANT DÉPLOIEMENT

### 🔐 **SÉCURITÉ & AUTH**

- [ ] **RÉACTIVER EMAIL CONFIRMATION** (Supabase Dashboard → Authentication → Providers → Email)
  - ⚠️ **ACTUELLEMENT DÉSACTIVÉ POUR DEV** ⚠️
  - Réactiver "Confirm email"
  - Tester le flow complet avec email confirmation

- [ ] **Configurer Redirect URLs production** (Supabase Dashboard → Authentication → URL Configuration)
  - [ ] Site URL → `athleticaai://`
  - [ ] Redirect URLs → `athleticaai://auth/callback`
  - [ ] SUPPRIMER les URLs `exp://` et `localhost` de dev

- [ ] **Row Level Security (RLS)** activée sur TOUTES les tables Supabase
  - [ ] `profiles` table
  - [ ] `workouts` table
  - [ ] `exercises` table
  - [ ] `workout_sessions` table
  - [ ] `exercise_logs` table

- [ ] **Variables d'environnement production** (.env.production)
  - [ ] SUPABASE_URL (production)
  - [ ] SUPABASE_ANON_KEY (production)
  - [ ] OPENAI_API_KEY
  - [ ] REVENUECAT keys (iOS + Android)
  - [ ] MIXPANEL_TOKEN
  - [ ] SENTRY_DSN

---

### 📱 **APP CONFIGURATION**

- [ ] **app.json / app.config.js**
  - [ ] `version` mis à jour (ex: "1.0.0")
  - [ ] `ios.buildNumber` incrémenté
  - [ ] `android.versionCode` incrémenté
  - [ ] `scheme: "athleticaai"` vérifié
  - [ ] Privacy policies URLs ajoutées
  - [ ] Terms of service URLs ajoutées

- [ ] **Bundle Identifier / Package Name**
  - [ ] iOS: `com.athleticaai.mobile` (ou ton choix)
  - [ ] Android: `com.athleticaai.mobile` (ou ton choix)

- [ ] **App Store Assets**
  - [ ] Icon 1024x1024px
  - [ ] Screenshots (iPhone 6.7", 6.5", 5.5")
  - [ ] Screenshots (iPad Pro 12.9", 11")
  - [ ] Screenshots Android (Phone + Tablet)
  - [ ] App preview video (optionnel)

---

### 🔧 **CODE CLEANUP**

- [ ] **Supprimer tous les console.log** sensibles
  - Chercher : `console.log.*password`
  - Chercher : `console.log.*token`
  - Chercher : `console.log.*key`

- [ ] **Supprimer les données de test**
  - Pas de users de test en production
  - Pas de workouts "TEST" dans la base

- [ ] **Supprimer les TODO comments**
  - Chercher : `// TODO`
  - Chercher : `// FIXME`

- [ ] **Vérifier .gitignore**
  - `.env` ignoré ✅
  - `.env.production` ignoré ✅
  - Pas de clés API commitées

---

### 🧪 **TESTS**

- [ ] **TypeScript** : `npx tsc --noEmit` → 0 erreurs
- [ ] **Build iOS** : `eas build --platform ios --profile production`
- [ ] **Build Android** : `eas build --platform android --profile production`
- [ ] **Test sur device réel iOS**
- [ ] **Test sur device réel Android**

- [ ] **Flow complet testé** :
  - [ ] Sign up avec email confirmation
  - [ ] Email confirmation link fonctionne
  - [ ] Onboarding 9 steps
  - [ ] Workout detail
  - [ ] Workout player full session
  - [ ] Post-workout summary
  - [ ] Progress tracking
  - [ ] Profile editing
  - [ ] Sign out / Sign in

---

### 💰 **SUBSCRIPTIONS (RevenueCat)**

- [ ] **Products configurés** :
  - [ ] iOS: App Store Connect → In-App Purchases
  - [ ] Android: Google Play Console → In-app products
  - [ ] RevenueCat: Products créés et liés

- [ ] **Entitlements configurés** dans RevenueCat
- [ ] **Webhooks configurés** (RevenueCat → Backend)
- [ ] **Test purchases** sur device réel

---

### 📊 **ANALYTICS & MONITORING**

- [ ] **Mixpanel** configuré et testé
- [ ] **Sentry** configuré pour error tracking
- [ ] **Supabase Analytics** activées
- [ ] **Custom events** trackés :
  - Sign up completed
  - Onboarding completed
  - Workout started
  - Workout completed
  - Subscription purchased

---

### 🌐 **LEGAL & COMPLIANCE**

- [ ] **Privacy Policy** publiée et URL dans app.json
- [ ] **Terms of Service** publiés et URL dans app.json
- [ ] **GDPR compliance** (si EU users)
  - [ ] Data deletion endpoint
  - [ ] Data export endpoint
  - [ ] Cookie consent (si web app)

- [ ] **Apple App Store**
  - [ ] App Privacy details remplis
  - [ ] Age rating correct
  - [ ] App description
  - [ ] Keywords
  - [ ] Categories

- [ ] **Google Play Store**
  - [ ] Privacy Policy URL
  - [ ] Content rating questionnaire
  - [ ] App description
  - [ ] Categories

---

### 🚀 **DEPLOYMENT**

- [ ] **EAS Build Production**
  ```bash
  eas build --platform ios --profile production
  eas build --platform android --profile production
  ```

- [ ] **Submit iOS**
  ```bash
  eas submit --platform ios
  ```

- [ ] **Submit Android**
  ```bash
  eas submit --platform android
  ```

- [ ] **Prepare for review**
  - [ ] Test account credentials (si nécessaire)
  - [ ] Demo video (si features complexes)
  - [ ] Review notes

---

### 📧 **EMAIL TEMPLATES (Supabase)**

- [ ] **Customize email templates** :
  - [ ] Confirm signup email
  - [ ] Reset password email
  - [ ] Magic link email
  - [ ] Change email confirmation

- [ ] **Email design** :
  - [ ] Logo AthleticaAI
  - [ ] Brand colors
  - [ ] Professional copy

---

### 🔔 **PUSH NOTIFICATIONS**

- [ ] **APNs (Apple)** :
  - [ ] Certificate généré
  - [ ] Configuré dans Expo

- [ ] **FCM (Firebase/Google)** :
  - [ ] google-services.json téléchargé
  - [ ] Configuré dans Expo

- [ ] **Test notifications** sur device réel

---

### 🎨 **ASSETS & MEDIA**

- [ ] **Images optimisées** (compression)
- [ ] **Videos optimisées** (si utilisées)
- [ ] **CDN configuré** pour médias (Phase 2)

---

### 💾 **DATABASE**

- [ ] **Supabase production instance** créée (pas dev)
- [ ] **Backup configuré**
- [ ] **Migrations** appliquées
- [ ] **Seed data production** (pas de test data)
- [ ] **Indexes** optimisés pour performance

---

### 📈 **PERFORMANCE**

- [ ] **Bundle size** < 50MB (idéalement < 30MB)
- [ ] **Images** compressées (WebP si possible)
- [ ] **Reanimated** animations 60fps+
- [ ] **Startup time** < 3 secondes

---

### 🔒 **SECURITY FINAL CHECK**

- [ ] **Pas de secrets hardcodés** dans le code
- [ ] **API keys** stockées dans .env uniquement
- [ ] **HTTPS only** pour toutes les APIs
- [ ] **Rate limiting** activé (Supabase)
- [ ] **Input validation** partout

---

## 🎯 **POST-DEPLOYMENT**

Après avoir déployé :

- [ ] **Monitor Sentry** pour erreurs
- [ ] **Monitor Mixpanel** pour analytics
- [ ] **Monitor App Store reviews**
- [ ] **Monitor Supabase usage** (quotas)
- [ ] **Test sur devices réels** après publication
- [ ] **Préparer hotfix build** si nécessaire

---

## 📅 **TIMELINE SUGGÉRÉE**

**1 semaine avant launch** :
- Réactiver email confirmation
- Configurer RevenueCat
- Submit to App Store/Play Store (review takes 1-7 days)

**3 jours avant launch** :
- Tests finaux sur devices réels
- Préparer marketing materials
- Configure analytics dashboards

**Jour du launch** :
- Monitor errors
- Respond to reviews
- Post on social media

---

## ⚠️ **CRITICAL REMINDERS**

### 🔴 **NE PAS OUBLIER** :
1. **RÉACTIVER EMAIL CONFIRMATION** ← CRUCIAL
2. **CHANGER REDIRECT URLs** (enlever localhost)
3. **ACTIVER RLS** sur toutes les tables
4. **TESTER SUBSCRIPTION FLOW** en production

---

## ✅ **QUAND TOUT EST COCHÉ**

Tu es prêt à déployer ! 🚀

**Dernière vérification** :
```bash
npm run typecheck    # 0 errors
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

🔥 **BONNE CHANCE POUR LE LANCEMENT !** 💪
