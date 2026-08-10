-- ============================================================
-- AfriHeart – Migration : Ajout des champs identité & date de naissance
-- ============================================================
-- À exécuter dans le SQL Editor de votre tableau de bord Supabase :
-- https://supabase.com/dashboard → votre projet → SQL Editor → New Query
-- ============================================================

-- 1. Ajouter la colonne date_of_birth (si elle n'existe pas encore)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Ajouter la colonne age calculé (optionnel, utile pour les recherches)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age INTEGER;

-- 3. Ajouter l'URL de la pièce d'identité uploadée
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- 4. Ajouter le statut de vérification de la pièce d'identité
--    Valeurs : 'none' | 'pending' | 'verified' | 'rejected'
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS id_document_status TEXT DEFAULT 'none'
  CHECK (id_document_status IN ('none', 'pending', 'verified', 'rejected'));

-- 5. Contrainte : l'âge doit être entre 30 et 45 ans (via date_of_birth)
--    On ajoute une contrainte CHECK sur date_of_birth
ALTER TABLE profiles
  ADD CONSTRAINT IF NOT EXISTS chk_age_range
  CHECK (
    date_of_birth IS NULL OR (
      date_part('year', age(date_of_birth)) >= 30
      AND date_part('year', age(date_of_birth)) <= 45
    )
  );

-- ============================================================
-- 6. Bucket Supabase Storage pour les pièces d'identité
-- ============================================================
-- Créez manuellement le bucket dans :
-- Supabase Dashboard → Storage → New Bucket
--   Nom : identity-docs
--   Public : NON (privé)
--
-- Puis ajoutez ces politiques RLS sur le bucket :

-- Politique upload : l'utilisateur peut uploader dans son propre dossier
-- INSERT INTO storage.policies (bucket_id, name, definition, action)
-- VALUES (
--   'identity-docs',
--   'Users can upload their own identity docs',
--   '(auth.uid()::text = (storage.foldername(name))[1])',
--   'INSERT'
-- );

-- Politique lecture admin uniquement :
-- (configurer via le dashboard ou via service_role key)

-- ============================================================
-- 7. Mettre à jour is_verified = false pour tous les profils existants
--    (au cas où des anciens enregistrements auraient is_verified = true sans CNI)
-- UPDATE profiles SET is_verified = false WHERE id_document_url IS NULL;
-- ============================================================

-- ✅ Migration terminée !
-- Prochaine étape : créer le bucket 'identity-docs' dans Supabase Storage.
