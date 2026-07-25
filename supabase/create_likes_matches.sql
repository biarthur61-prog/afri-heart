-- ============================================
-- AfriHeart – Script SQL pour les Likes et Matchs
-- ============================================
-- À exécuter dans le SQL Editor de votre tableau de bord Supabase :
-- https://supabase.com/dashboard
-- ============================================

-- 1. Création de la table likes
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  
  -- Empêcher de liker deux fois la même personne
  UNIQUE(sender_id, receiver_id),
  -- Empêcher de se liker soi-même
  CONSTRAINT check_not_self CHECK (sender_id <> receiver_id)
);

-- 2. Création de la table matches
CREATE TABLE IF NOT EXISTS matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_1, user_2),
  CONSTRAINT check_user_order CHECK (user_1 < user_2)
);

-- 3. Indexation pour les performances de requêtage
CREATE INDEX IF NOT EXISTS idx_likes_sender ON likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON matches(user_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON matches(user_2);

-- 4. Activation RLS (Row Level Security)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour la table Likes
CREATE POLICY "Les utilisateurs peuvent insérer leurs propres likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Les utilisateurs peuvent voir les likes qu'ils ont envoyés"
  ON likes FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Les utilisateurs peuvent voir les likes qu'ils ont reçus (pour le système de match)"
  ON likes FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres likes"
  ON likes FOR DELETE
  USING (auth.uid() = sender_id);

-- Politiques de sécurité pour la table Matches
CREATE POLICY "Les utilisateurs peuvent voir leurs propres matchs"
  ON matches FOR SELECT
  USING (auth.uid() = user_1 OR auth.uid() = user_2);

-- 5. Trigger automatique de détection de Match (Logique mutuelle)
CREATE OR REPLACE FUNCTION handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  mutual_exists BOOLEAN;
  u1 UUID;
  u2 UUID;
BEGIN
  -- Vérifier s'il y a un like dans l'autre sens
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    -- Ordonner les UUIDs pour la contrainte check_user_order
    IF NEW.sender_id < NEW.receiver_id THEN
      u1 := NEW.sender_id;
      u2 := NEW.receiver_id;
    ELSE
      u1 := NEW.receiver_id;
      u2 := NEW.sender_id;
    END IF;

    -- Créer le match s'il n'existe pas déjà
    INSERT INTO matches (user_1, user_2)
    VALUES (u1, u2)
    ON CONFLICT (user_1, user_2) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_detect_match
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_mutual_like();
