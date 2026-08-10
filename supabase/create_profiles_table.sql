-- ============================================
-- AfriHeart – Script de création de la table profiles
-- ============================================
-- À exécuter dans le SQL Editor de votre tableau de bord Supabase :
-- https://supabase.com/dashboard → votre projet → SQL Editor → New Query
-- ============================================

-- 1. Création de la table profiles
-- L'ID référence directement l'utilisateur authentifié via Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  phone_number        TEXT NOT NULL UNIQUE,
  city                TEXT NOT NULL,
  bio                 TEXT DEFAULT '',
  is_verified         BOOLEAN DEFAULT FALSE,    -- Validé manuellement par un admin après CNI
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  -- ── Contrainte 1 : Âge obligatoire 30–45 ans ──────────────────────────────
  date_of_birth       DATE,
  age                 INTEGER,
  CONSTRAINT chk_age_range CHECK (
    date_of_birth IS NULL OR (
      date_part('year', age(date_of_birth)) >= 30
      AND date_part('year', age(date_of_birth)) <= 45
    )
  ),

  -- ── Champs optionnels du profil ─────────────────────────────────────────
  profession          TEXT,
  objective           TEXT,
  search_age_range    TEXT,
  search_location     TEXT,

  -- ── Contrainte 2 : Pièce d'identité / CNI ──────────────────────────────
  id_document_recto_url     TEXT,                     -- URL Supabase Storage du Recto
  id_document_verso_url     TEXT,                     -- URL Supabase Storage du Verso
  id_document_status  TEXT DEFAULT 'none'        -- Statut de vérification
    CHECK (id_document_status IN ('none', 'pending', 'verified', 'rejected'))
);

-- 2. Index sur le numéro de téléphone pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- 3. Index sur la ville pour filtrer les profils par localisation
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- 4. Index sur le statut de vérification (utile pour les requêtes admin)
CREATE INDEX IF NOT EXISTS idx_profiles_id_document_status ON profiles(id_document_status);

-- 5. Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger qui appelle la fonction à chaque mise à jour d'un profil
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Activation de Row Level Security (RLS)
-- Chaque utilisateur ne peut voir et modifier que son propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : un utilisateur peut lire son propre profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique : n'importe quel utilisateur authentifié peut lire les profils des autres
-- (nécessaire pour la vue Découvrir – le paywall est côté frontend)
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les autres profils"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : un utilisateur peut insérer son propre profil
CREATE POLICY "Les utilisateurs peuvent créer leur profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politique : un utilisateur peut modifier son propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ✅ Script terminé ! La table profiles est prête.
-- Prochaine étape :
--   1. Exécuter migration_add_identity_fields.sql si la table existe déjà
--   2. Créer le bucket 'identity-docs' dans Supabase Storage (privé)
--   3. Ajouter les politiques RLS sur le bucket (upload par user, lecture admin)
-- ============================================
