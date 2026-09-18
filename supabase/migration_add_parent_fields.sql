-- ============================================================
-- AfriHeart - Migration : Ajout des champs pour parents célibataires et genre
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_single_parent BOOLEAN DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;
