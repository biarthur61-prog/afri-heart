-- ============================================
-- AfriHeart – Script de création de la table profiles
-- ============================================
-- À exécuter dans le SQL Editor de votre tableau de bord Supabase :
-- https://supabase.com/dashboard → votre projet → SQL Editor → New Query
-- ============================================

-- 1. Création de la table profiles
-- L'ID référence directement l'utilisateur authentifié via Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone_number  TEXT NOT NULL UNIQUE,
  city          TEXT NOT NULL,
  bio           TEXT DEFAULT '',
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Index sur le numéro de téléphone pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- 3. Index sur la ville pour filtrer les profils par localisation
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- 4. Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger qui appelle la fonction à chaque mise à jour d'un profil
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Activation de Row Level Security (RLS)
-- Chaque utilisateur ne peut voir et modifier que son propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : un utilisateur peut lire son propre profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

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
-- Prochaine étape : configurer la vérification par selfie (is_verified).
-- ============================================
