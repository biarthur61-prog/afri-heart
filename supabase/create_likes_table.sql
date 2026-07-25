-- ============================================
-- AfriHeart – Script de création de la table likes et vue matches
-- ============================================

-- 1. Création de la table likes
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id) -- Empêcher les likes en double
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_likes_sender ON likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON likes(receiver_id);

-- 3. Activation de Row Level Security (RLS)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Politique : on peut lire si on est l'expéditeur ou le destinataire
CREATE POLICY "Les utilisateurs peuvent voir les likes qui les concernent"
  ON likes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Politique : on peut insérer en tant qu'expéditeur
CREATE POLICY "Les utilisateurs peuvent liker"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Politique : on peut supprimer son propre like
CREATE POLICY "Les utilisateurs peuvent retirer leur like"
  ON likes FOR DELETE
  USING (auth.uid() = sender_id);

-- 4. Vue pour les Matches
-- Un match existe si A like B et B like A
CREATE OR REPLACE VIEW matches AS
SELECT 
  l1.sender_id AS user1_id,
  l1.receiver_id AS user2_id,
  GREATEST(l1.created_at, l2.created_at) AS matched_at
FROM likes l1
JOIN likes l2 ON l1.sender_id = l2.receiver_id AND l1.receiver_id = l2.sender_id
WHERE l1.sender_id < l1.receiver_id; -- Pour éviter les doublons (A-B et B-A)

-- ============================================
-- ✅ Script terminé ! La table likes et la vue matches sont prêtes.
-- ============================================
