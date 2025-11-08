# 🗄️ Neon Database Setup Guide

## 🎯 Problème Actuel

Tu as cette erreur:
```
ERROR Failed query: select ... from "profiles" where "profiles"."id" = $1
```

**Cause**: La table `profiles` (et toutes les autres tables) n'existent PAS encore dans ta database Neon.

**Solution**: Exécuter le SQL pour créer les tables!

---

## ✅ ÉTAPES SIMPLES (5 minutes)

### Étape 1: Va sur Neon Console

1. Ouvre ton navigateur
2. Va sur [https://console.neon.tech](https://console.neon.tech)
3. Sign in avec ton compte
4. Sélectionne ton projet (devrait avoir le nom de ta database)

### Étape 2: Ouvre le SQL Editor

1. Dans le sidebar gauche, clique sur **"SQL Editor"**
2. Tu devrais voir un éditeur SQL vide

### Étape 3: Copie-Colle le SQL

1. **Ouvre le fichier** `neon-setup.sql` (dans ton projet)
2. **Sélectionne TOUT** le contenu (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Colle dans Neon SQL Editor** (Ctrl+V)

### Étape 4: Exécute le SQL

1. **Clique sur "Run"** (ou Ctrl+Enter)
2. ⏳ Attends 5-10 secondes...
3. ✅ Tu devrais voir des messages de succès:
   ```
   CREATE TYPE
   CREATE TYPE
   ...
   CREATE TABLE
   CREATE TABLE
   ...
   CREATE INDEX
   CREATE INDEX
   ```

### Étape 5: Vérifie que ça a marché

Dans le SQL Editor, exécute cette query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

**✅ Tu devrais voir 9 tables**:
- profiles
- workout_programs
- exercises
- workouts
- user_workout_sessions
- progress_entries
- nutrition_plans
- meal_logs

---

## 🧪 Teste L'App Maintenant!

Une fois le SQL exécuté:

1. **Restart l'app** (stop + `npm start`)
2. **Sign in** avec Google ou email/password
3. ✅ **Plus d'erreur "Failed query"!**
4. ✅ **Profile créé automatiquement** dans la table
5. ✅ **Onboarding accessible** sans erreurs
6. ✅ **Completion onboarding fonctionne** (update profile)

---

## 🔍 Vérifier Que Le Profile Est Créé

Après sign-in, va dans Neon SQL Editor et exécute:

```sql
SELECT id, email, full_name, onboarding_completed, created_at
FROM profiles;
```

**✅ Tu devrais voir ton user**:
```
id                                      | email               | full_name | onboarding_completed | created_at
user_34lXr97WzPOWyMqvcNSvpqc6jDR        | ton@email.com       | NULL      | false                | 2025-10-30 ...
```

---

## 📸 Screenshots (pour t'aider)

### 1. Neon Console - SQL Editor
```
┌─────────────────────────────────────┐
│  Neon Console                       │
├─────────────────────────────────────┤
│  Sidebar:                           │
│    - Home                           │
│    - SQL Editor    ← CLIQUE ICI     │
│    - Tables                         │
│    - Settings                       │
└─────────────────────────────────────┘
```

### 2. SQL Editor
```
┌─────────────────────────────────────────────┐
│  SQL Editor                       [Run ▶️]  │
├─────────────────────────────────────────────┤
│                                             │
│  -- Colle le SQL ici                        │
│  CREATE TYPE user_gender AS ENUM ...        │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. Résultats Après Run
```
┌─────────────────────────────────────────────┐
│  Results                                    │
├─────────────────────────────────────────────┤
│  ✅ CREATE TYPE                              │
│  ✅ CREATE TYPE                              │
│  ✅ CREATE TABLE profiles                    │
│  ✅ CREATE TABLE workout_programs            │
│  ✅ CREATE TABLE exercises                   │
│  ✅ CREATE INDEX idx_profiles_email          │
│                                             │
│  Query completed successfully!              │
└─────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Erreur: "type already exists"
**Cause**: Tu as déjà exécuté une partie du SQL

**Solution**:
1. Supprime les types existants:
```sql
DROP TYPE IF EXISTS user_gender CASCADE;
DROP TYPE IF EXISTS fitness_level CASCADE;
DROP TYPE IF EXISTS goal_type CASCADE;
DROP TYPE IF EXISTS workout_type CASCADE;
DROP TYPE IF EXISTS exercise_category CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS workout_status CASCADE;
```
2. Re-run le `neon-setup.sql` complet

### Erreur: "table already exists"
**Cause**: Tu as déjà créé certaines tables

**Solution**:
1. Supprime TOUTES les tables:
```sql
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS nutrition_plans CASCADE;
DROP TABLE IF EXISTS progress_entries CASCADE;
DROP TABLE IF EXISTS user_workout_sessions CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS workout_programs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```
2. Re-run le `neon-setup.sql` complet

### Erreur: "permission denied"
**Cause**: Ton user Neon n'a pas les permissions

**Solution**: Tu dois être admin/owner du projet Neon. Vérifie dans Settings → Members

---

## 📊 Structure Database Finale

```
Neon Database: neondb
│
├── 8 ENUMS
│   ├── user_gender
│   ├── fitness_level
│   ├── goal_type
│   ├── workout_type
│   ├── exercise_category
│   ├── difficulty_level
│   ├── subscription_tier
│   └── workout_status
│
├── 9 TABLES
│   ├── profiles (39 columns) ⭐ MAIN TABLE
│   ├── workout_programs
│   ├── exercises
│   ├── workouts
│   ├── user_workout_sessions
│   ├── progress_entries
│   ├── nutrition_plans
│   └── meal_logs
│
└── 8 INDEXES (for performance)
```

---

## 🎉 Après Setup Réussi

**Ce qui marchera**:
- ✅ Sign up avec email/password → profile créé
- ✅ OAuth Google/Apple → profile créé automatiquement
- ✅ Onboarding steps 1-10 → données sauvegardées
- ✅ Complete onboarding → `onboarding_completed = true`
- ✅ Dashboard tabs → stats chargées depuis DB
- ✅ Progress tracking → données persistées
- ✅ Workouts → sessions enregistrées

**Plus d'erreurs**:
- ❌ "Failed query: select from profiles"
- ❌ "Failed query: update profiles"
- ❌ "Unexpected error completing onboarding"
- ❌ Boucle infinie profile loading

---

## 📝 Notes Importantes

### UUID vs String pour user_id
La table `profiles` utilise `id UUID` pour matcher le Clerk user ID (format: `user_xxx`).

**Clerk user ID exemple**: `user_34lXr97WzPOWyMqvcNSvpqc6jDR`

PostgreSQL accepte ce format dans un champ UUID même si techniquement ce n'est pas un vrai UUID. Ça fonctionne!

### Timestamps
Toutes les timestamps sont en **TIMESTAMPTZ** (avec timezone).

**Format**: `2025-10-30T11:44:22.159Z`

### Arrays
PostgreSQL supporte les arrays nativement:
- `sports_history TEXT[]` → `{football, basketball}`
- `equipment_available TEXT[]` → `{dumbbells, "pull-up bar"}`

---

## 🆘 Besoin d'Aide?

Si ça ne marche pas:

1. **Screenshot** le Neon SQL Editor avec l'erreur
2. **Copy/paste** le message d'erreur complet
3. **Vérifie** que tu es bien sur le projet Neon correct
4. **Check** que le DATABASE_URL dans `.env` correspond au projet Neon

---

## ✅ Checklist Final

Avant de restart l'app:

- [ ] Neon Console ouvert
- [ ] SQL Editor accessible
- [ ] `neon-setup.sql` collé dans l'éditeur
- [ ] "Run" cliqué
- [ ] Aucune erreur dans les résultats
- [ ] Query `SELECT * FROM profiles` fonctionne (retourne 0 rows)
- [ ] `.env` a le bon `EXPO_PUBLIC_DATABASE_URL`

**Quand TOUT est ✅ → Restart app → TOUT MARCHERA! 🚀**
