// Types TypeScript pour la table profiles
// Générés manuellement – à synchroniser avec le schéma Supabase

export interface Profile {
  id: string;             // UUID – référence auth.users(id)
  full_name: string;
  phone_number: string;   // Unique
  city: string;
  bio: string;
  is_verified: boolean;   // Vérification par selfie
  created_at: string;     // ISO 8601 timestamp
  updated_at: string;     // ISO 8601 timestamp
  age?: number;
  profession?: string;
  objective?: string;
  search_age_range?: string;
  search_location?: string;
}

// Type pour la création d'un profil (sans les champs auto-générés)
export type ProfileInsert = Pick<Profile, 'id' | 'full_name' | 'phone_number' | 'city'> & {
  bio?: string;
};

// Type pour la mise à jour d'un profil (tous les champs modifiables sont optionnels)
export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'phone_number' | 'city' | 'bio' | 'age' | 'profession' | 'objective' | 'search_age_range' | 'search_location'>>;
