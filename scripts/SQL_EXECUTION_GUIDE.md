# 🔥 GUIDE D'EXÉCUTION SQL - 39 WORKOUT PROGRAMS

**Date**: 2025-10-30
**Fichier**: `scripts/seed-all-29-workout-programs.sql`
**Programmes**: **39 workouts professionnels**

---

## 📊 CE QUI SERA INSÉRÉ

### Breakdown Complet:
- **Beginner**: 8 programmes
- **Intermediate**: 15 programmes
- **Advanced**: 12 programmes
- **Expert**: 4 programmes

### **TOTAL: 39 programmes**
- **FREE**: 31 programmes (79%)
- **PREMIUM**: 8 programmes (21%)

### Par Objectif:
- **Build Muscle**: 28 programmes
- **Get Stronger**: 25 programmes
- **Lose Fat**: 6 programmes
- **Improve Endurance**: 9 programmes
- **Athletic Performance**: 11 programmes
- **Stay Healthy**: 12 programmes

---

## 🚀 MÉTHODE 1: NEON DASHBOARD (RECOMMANDÉ)

### Étape 1: Se connecter à Neon
1. Va sur https://console.neon.tech
2. Login avec ton compte
3. Sélectionne ton projet **AthleticaAI**

### Étape 2: Ouvrir SQL Editor
1. Dans le menu gauche, clique sur **SQL Editor**
2. Ou va directement à l'onglet **Query**

### Étape 3: Copier-Coller le SQL
1. Ouvre le fichier `scripts/seed-all-29-workout-programs.sql`
2. **CTRL+A** pour tout sélectionner
3. **CTRL+C** pour copier
4. Dans Neon SQL Editor, **CTRL+V** pour coller

### Étape 4: Exécuter
1. Clique sur le bouton **Run** (ou CTRL+Enter)
2. Attends l'exécution (~5-10 secondes)
3. Vérifie le message de succès ✅

### Étape 5: Vérifier
```sql
-- Compte total
SELECT COUNT(*) as total_programs FROM workout_programs;

-- Par niveau
SELECT
  difficulty_level,
  COUNT(*) as count,
  SUM(CASE WHEN is_premium THEN 1 ELSE 0 END) as premium_count
FROM workout_programs
GROUP BY difficulty_level
ORDER BY
  CASE difficulty_level
    WHEN 'beginner' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'expert' THEN 4
  END;
```

**Résultat attendu**:
```
total_programs: 39

difficulty_level | count | premium_count
beginner         |   8   |      0
intermediate     |  15   |      0
advanced         |  12   |      5
expert           |   4   |      3
```

---

## 🚀 MÉTHODE 2: PSQL (LIGNE DE COMMANDE)

### Prérequis
```bash
# Installer psql (si pas déjà installé)
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client
```

### Étape 1: Récupérer DATABASE_URL
Dans ton `.env`:
```
DATABASE_URL=postgresql://username:password@host/database
```

### Étape 2: Exécuter le fichier
```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql://username:password@host/database"
psql $env:DATABASE_URL -f scripts/seed-all-29-workout-programs.sql

# Mac/Linux
export DATABASE_URL="postgresql://username:password@host/database"
psql $DATABASE_URL -f scripts/seed-all-29-workout-programs.sql
```

### Étape 3: Vérifier
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM workout_programs;"
```

---

## 🚀 MÉTHODE 3: DRIZZLE STUDIO (VISUEL)

### Étape 1: Lancer Drizzle Studio
```bash
npm run db:studio
```

Ouvre http://localhost:4983

### Étape 2: Voir les données
1. Clique sur **workout_programs** dans le menu gauche
2. Tu verras tous les programmes insérés
3. Explore les données visuellement

### Étape 3: Exécuter des requêtes
1. Clique sur l'onglet **Query**
2. Écris des requêtes SQL custom
3. Vois les résultats en temps réel

---

## 🚀 MÉTHODE 4: NODE SCRIPT (AUTOMATISÉ)

### Créer un script d'exécution

**Fichier**: `scripts/execute-sql.ts`
```typescript
import { readFileSync } from 'fs';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function executeSQLFile() {
  try {
    console.log('📂 Reading SQL file...');
    const sqlContent = readFileSync('./scripts/seed-all-29-workout-programs.sql', 'utf-8');

    console.log('🚀 Executing SQL...');
    await db.execute(sql.raw(sqlContent));

    console.log('✅ SQL executed successfully!');

    // Verify
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM workout_programs`);
    console.log(`📊 Total programs: ${result.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

executeSQLFile();
```

### Ajouter dans package.json
```json
{
  "scripts": {
    "seed:sql": "tsx scripts/execute-sql.ts"
  }
}
```

### Exécuter
```bash
npm run seed:sql
```

---

## ⚠️ POINTS IMPORTANTS

### 1. **TRUNCATE CASCADE**
Le script commence par :
```sql
TRUNCATE TABLE workout_programs CASCADE;
```
Cela **SUPPRIME TOUS** les programmes existants !

**Si tu veux AJOUTER sans supprimer**, remplace par :
```sql
-- DELETE FROM workout_programs WHERE created_at < NOW();
-- Ou simplement commenter la ligne TRUNCATE
```

### 2. **UUID Auto-Generated**
Les IDs sont générés automatiquement par PostgreSQL :
```sql
id: uuid('id').primaryKey().defaultRandom()
```
Pas besoin de spécifier les UUIDs dans les INSERTs.

### 3. **ENUMS**
Le script utilise les enums définis dans le schema :
- `difficulty_level`: beginner, intermediate, advanced, expert
- `goal_type`: lose_weight, build_muscle, get_stronger, etc.
- `fitness_level`: beginner, intermediate, advanced, elite

### 4. **Arrays PostgreSQL**
Les colonnes arrays utilisent la syntaxe `ARRAY[...]` :
```sql
target_goals: ARRAY['build_muscle', 'get_stronger']
```

### 5. **Timestamps**
`created_at` et `updated_at` sont auto-générés avec `defaultNow()`.

---

## 🔍 REQUÊTES UTILES APRÈS INSERTION

### Voir tous les programmes FREE
```sql
SELECT name, difficulty_level, workouts_per_week
FROM workout_programs
WHERE is_premium = false
ORDER BY difficulty_level, name;
```

### Voir programmes PREMIUM
```sql
SELECT name, difficulty_level, enrolled_count, average_rating
FROM workout_programs
WHERE is_premium = true
ORDER BY average_rating DESC;
```

### Top 10 programmes par rating
```sql
SELECT name, average_rating, enrolled_count, difficulty_level
FROM workout_programs
WHERE is_published = true
ORDER BY average_rating DESC, enrolled_count DESC
LIMIT 10;
```

### Programmes pour débutant qui veulent build muscle
```sql
SELECT name, description, workouts_per_week, estimated_time_per_workout
FROM workout_programs
WHERE difficulty_level = 'beginner'
  AND 'build_muscle' = ANY(target_goals)
  AND is_published = true
ORDER BY average_rating DESC;
```

### Stats globales
```sql
SELECT
  COUNT(*) as total_programs,
  SUM(CASE WHEN is_premium THEN 1 ELSE 0 END) as premium_programs,
  AVG(average_rating) as avg_rating,
  SUM(enrolled_count) as total_enrollments
FROM workout_programs;
```

---

## 🎯 VÉRIFICATION POST-INSERTION

### Checklist ✅

1. **Count total**:
   ```sql
   SELECT COUNT(*) FROM workout_programs;
   -- Expected: 39
   ```

2. **Check enums**:
   ```sql
   SELECT DISTINCT difficulty_level FROM workout_programs;
   -- Expected: beginner, intermediate, advanced, expert
   ```

3. **Check arrays**:
   ```sql
   SELECT name, target_goals FROM workout_programs LIMIT 5;
   -- Expected: Arrays like {build_muscle,get_stronger}
   ```

4. **Check premium split**:
   ```sql
   SELECT
     is_premium,
     COUNT(*) as count
   FROM workout_programs
   GROUP BY is_premium;
   -- Expected: false: 31, true: 8
   ```

5. **Check ratings**:
   ```sql
   SELECT
     MIN(average_rating) as min_rating,
     MAX(average_rating) as max_rating,
     AVG(average_rating) as avg_rating
   FROM workout_programs;
   -- Expected: All between 4.5 - 4.9
   ```

---

## 🐛 TROUBLESHOOTING

### Erreur: "relation workout_programs does not exist"
**Solution**: Run migrations d'abord
```bash
npm run db:push
```

### Erreur: "invalid input syntax for type uuid"
**Solution**: Les UUIDs sont auto-générés, ne pas les spécifier

### Erreur: "invalid input value for enum"
**Solution**: Vérifier que les enums correspondent au schema

### Erreur: "duplicate key value violates unique constraint"
**Solution**: La table contient déjà des données, use TRUNCATE ou DELETE first

### Erreur: "syntax error at or near..."
**Solution**: Vérifier les apostrophes dans les descriptions (use `''` pour escape)

---

## 📝 NOTES

### Images Unsplash
Toutes les `thumbnail_url` utilisent Unsplash :
- Photos haute qualité
- Gratuites pour usage commercial
- Optimisées avec paramètres `?w=800&q=80`

### Données Réalistes
Les stats sont réalistes :
- `enrolled_count`: 98 - 5832 users
- `completion_rate`: 62% - 89%
- `average_rating`: 4.5 - 4.9 stars

### Descriptions Premium
Chaque programme a une description détaillée (200-400 mots) expliquant :
- Pour qui c'est fait
- Ce qui est inclus
- Résultats attendus
- Niveau requis

---

## 🚀 PROCHAINES ÉTAPES

Après avoir inséré les programmes :

1. **Tester l'affichage**:
   ```bash
   npm start
   # Ouvre l'app et va sur Workouts tab
   ```

2. **Tester les filtres**:
   - Filter par difficulty
   - Filter par goals
   - Search par nom

3. **Tester un programme**:
   - Clique sur un programme
   - Vérifie toutes les infos s'affichent
   - Test le bouton "Start Program"

4. **Seed les exercises** (si pas déjà fait):
   ```bash
   npm run seed:exercises
   ```

5. **Créer des workouts** pour les programmes:
   - Soit manuellement via Drizzle Studio
   - Soit via un script seed additionnel

---

## ✅ CONCLUSION

Une fois ce SQL exécuté, tu auras **39 programmes professionnels** prêts pour production ! 🔥

Chaque programme est :
- ✅ Complet avec toutes les infos
- ✅ Catégorisé correctement
- ✅ Avec ratings et stats réalistes
- ✅ Descriptions détaillées
- ✅ Images professionnelles

**L'app sera PRÊTE pour lancer !** 🚀

---

**Questions? Problèmes? Check le troubleshooting section above!**
