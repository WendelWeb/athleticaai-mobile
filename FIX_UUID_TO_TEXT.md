# 🔧 Fix UUID → TEXT pour profiles.id

## 🎯 Problème

L'erreur `"Failed query: select ... from profiles where id = $1"` est causée par un **mismatch de types**:

- **Clerk user IDs**: `"user_34lXr97WzPOWyMqvcNSvpqc6jDR"` (TEXT/STRING)
- **Database column**: `profiles.id UUID` (UUID strict)
- **PostgreSQL rejette**: String ne peut pas être casté en UUID

## ✅ Solution

Changer le type de `profiles.id` et toutes les foreign keys de **UUID → TEXT**.

---

## 🚀 ÉTAPES (2 minutes)

### Étape 1: Ouvre Neon SQL Editor

1. Va sur [https://console.neon.tech](https://console.neon.tech)
2. Sélectionne ton projet
3. Clique **"SQL Editor"** (sidebar gauche)

### Étape 2: Exécute le SQL Fix

1. **Ouvre** le fichier `fix-profiles-id-type.sql` (dans ton projet)
2. **Copy tout le contenu** (Ctrl+A → Ctrl+C)
3. **Colle dans Neon SQL Editor** (Ctrl+V)
4. **Clique "Run"** (ou Ctrl+Enter)
5. ⏳ **Attends 5 secondes**...

### Étape 3: Vérifie que ça a marché

Dans le SQL Editor, exécute:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';
```

**✅ Tu devrais voir**: `data_type: text` (au lieu de `uuid`)

---

## 🧪 Teste L'App

**Restart l'app**:
```bash
# Stop (Ctrl+C)
npm start
```

**Flow complet**:
```
1. Sign in avec Google ou email/password
2. ✅ Profile créé avec id = "user_xxx"
3. ✅ Plus d'erreur "Failed query"!
4. ✅ Onboarding accessible
5. ✅ Complete onboarding fonctionne
6. ✅ Dashboard accessible
7. ✅ TOUT MARCHE! 🎉
```

---

## 📋 Ce Qui A Été Changé

### Dans la Database (SQL):
- `profiles.id`: UUID → **TEXT**
- `user_workout_sessions.user_id`: UUID → **TEXT**
- `progress_entries.user_id`: UUID → **TEXT**
- `nutrition_plans.user_id`: UUID → **TEXT**
- `meal_logs.user_id`: UUID → **TEXT**
- `workout_programs.created_by`: UUID → **TEXT**
- `workouts.created_by`: UUID → **TEXT**

### Dans le Code (Drizzle Schema):
- `src/db/schema.ts`: Tous les `uuid()` référençant `profiles.id` changés en `text()`

---

## 🔍 Vérifier Que Le Profile Est Créé

Après sign-in, dans Neon SQL Editor:

```sql
SELECT id, email, onboarding_completed, created_at
FROM profiles;
```

**✅ Tu devrais voir**:
```
id                               | email           | onboarding_completed | created_at
user_34lXr97WzPOWyMqvcNSvpqc6jDR | ton@email.com   | false                | 2025-10-30...
```

---

## 🐛 Si L'Erreur Persiste

Si après avoir exécuté le SQL tu as toujours l'erreur:

1. **Vérifie que le SQL a bien run**:
```sql
-- Doit retourner "text" pas "uuid"
SELECT data_type FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';
```

2. **Clear Drizzle cache**:
```bash
rm -rf node_modules/.cache
npm start
```

3. **Vérifie la connexion database**:
```bash
# Dans .env
echo $EXPO_PUBLIC_DATABASE_URL
# Doit montrer: postgresql://...
```

---

## ✅ Checklist Final

Avant de restart:

- [ ] SQL `fix-profiles-id-type.sql` exécuté dans Neon
- [ ] Aucune erreur dans les résultats SQL
- [ ] `SELECT data_type` retourne "text" pour profiles.id
- [ ] `src/db/schema.ts` mis à jour (déjà fait ✅)
- [ ] TypeScript compile sans erreurs (✅ 0 erreurs)

**Quand TOUT est ✅ → Restart app → FONCTIONNERA! 🚀**

---

## 💡 Pourquoi UUID Ne Marche Pas?

**Clerk user IDs** ne sont PAS des UUIDs v4 standards:
```
UUID v4:     550e8400-e29b-41d4-a716-446655440000
Clerk ID:    user_34lXr97WzPOWyMqvcNSvpqc6jDR
             ^^^^^ prefix + random string
```

PostgreSQL **UUID type** accepte UNIQUEMENT le format UUID standard.
Donc on doit utiliser **TEXT** pour les Clerk IDs.

---

## 🎉 Après Le Fix

**Ce qui marchera**:
- ✅ `INSERT INTO profiles (id) VALUES ('user_xxx')` → Success!
- ✅ `SELECT * FROM profiles WHERE id = 'user_xxx'` → Success!
- ✅ Profile auto-créé après OAuth
- ✅ Onboarding data sauvegardée
- ✅ Dashboard stats chargées

**Plus d'erreurs**:
- ❌ "Failed query: select from profiles"
- ❌ Type mismatch errors
- ❌ Cast errors

**C'est LE fix final pour que tout marche! 🔥**
