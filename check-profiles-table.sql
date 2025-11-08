-- Vérifier la structure de la table profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Vérifier s'il y a des profiles existants
SELECT id, email, created_at
FROM profiles;
