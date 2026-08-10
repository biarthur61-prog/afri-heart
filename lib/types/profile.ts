// Types TypeScript pour la table profiles
// Générés manuellement – à synchroniser avec le schéma Supabase

export interface Profile {
  id: string;             // UUID – référence auth.users(id)
  full_name: string;
  phone_number: string;   // Unique
  city: string;
  bio: string;
  is_verified: boolean;   // Vérification d'identité par CNI / pièce officielle
  created_at: string;     // ISO 8601 timestamp
  updated_at: string;     // ISO 8601 timestamp
  age?: number;           // Calculé depuis date_of_birth (30–45 ans requis)
  date_of_birth?: string; // Format ISO : YYYY-MM-DD
  profession?: string;
  objective?: string;
  search_age_range?: string;
  search_location?: string;
  id_document_url?: string;       // URL Supabase Storage de la pièce d'identité uploadée
  id_document_status?: 'none' | 'pending' | 'verified' | 'rejected'; // Statut vérification
}

// Type pour la création d'un profil (sans les champs auto-générés)
export type ProfileInsert = Pick<Profile, 'id' | 'full_name' | 'phone_number' | 'city'> & {
  bio?: string;
  age?: number;
  date_of_birth?: string;
};

// Type pour la mise à jour d'un profil (tous les champs modifiables sont optionnels)
export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'phone_number' | 'city' | 'bio' | 'age' | 'date_of_birth' | 'profession' | 'objective' | 'search_age_range' | 'search_location' | 'id_document_url' | 'id_document_status'>>;
