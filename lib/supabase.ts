import { createClient } from '@supabase/supabase-js';

// Variables d'environnement Supabase
// À configurer dans votre fichier .env.local :
//   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'La variable d\'environnement NEXT_PUBLIC_SUPABASE_URL est manquante. ' +
    'Ajoutez-la dans votre fichier .env.local.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'La variable d\'environnement NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante. ' +
    'Ajoutez-la dans votre fichier .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
