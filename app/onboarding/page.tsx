'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AFRICAN_COUNTRIES_CITIES: Record<string, string[]> = {
  "Bénin": ["Cotonou", "Porto-Novo", "Parakou", "Abomey", "Ouidah"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora"],
  "Cameroun": ["Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua"],
  "Congo": ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi"],
  "Côte d'Ivoire": ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro"],
  "Gabon": ["Libreville", "Port-Gentil", "Franceville", "Oyem"],
  "Ghana": ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast"],
  "Guinée": ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé"],
  "Mali": ["Bamako", "Sikasso", "Mopti", "Koutiala", "Ségou"],
  "Nigéria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt"],
  "RD Congo": ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Goma"],
  "Sénégal": ["Dakar", "Thiès", "Rufisque", "Ziguinchor", "Saint-Louis"],
  "Togo": ["Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé"],
};

const TOTAL_STEPS = 3;

// ─── Calcul d'âge à partir d'une date ISO ───────────────────────────────────
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ─── Limites de date autorisées (30–45 ans) ─────────────────────────────────
function getMinDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 45);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getMaxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 30);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export default function OnboardingPage() {
  const router = useRouter();

  // Auth & loading state
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ageError, setAgeError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [isSingleParent, setIsSingleParent] = useState(false);
  const [childrenCount, setChildrenCount] = useState<number | ''>('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---------- Auth check ----------
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      const user = session.user;
      setUserId(user.id);
      setUserPhone(user.phone ?? null);
      setUserEmail(user.email ?? null);

      // Pre-fill phone if signed up with phone
      if (user.phone) {
        setPhoneNumber(user.phone);
      }

      // Check existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profile) {
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // ---------- Validation de la date de naissance ──────────────────────────
  const validateAge = useCallback((dob: string): boolean => {
    if (!dob) {
      setAgeError('La date de naissance est obligatoire.');
      return false;
    }
    const age = calculateAge(dob);
    if (age < 30) {
      setAgeError(`Vous devez avoir au moins 30 ans pour rejoindre AfriHeart. (Vous avez ${age} ans)`);
      return false;
    }
    if (age > 45) {
      setAgeError(`AfriHeart est réservé aux personnes de 30 à 45 ans. (Vous avez ${age} ans)`);
      return false;
    }
    setAgeError('');
    return true;
  }, []);

  // ---------- Navigation ----------
  const goNext = useCallback(() => {
    if (step === 1) {
      if (!validateAge(dateOfBirth)) return;
    }
    setDirection('next');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [step, dateOfBirth, validateAge]);

  const goBack = useCallback(() => {
    setDirection('prev');
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  // ---------- Validation ----------
  const canProceedStep1 = fullName.trim().length >= 2 && dateOfBirth.length > 0 && !ageError && gender !== '';
  const canProceedStep2 = phoneNumber.trim().length >= 6 && country !== '' && city !== '';
  const canSubmit = bio.trim().length > 0 && termsAccepted && (!isSingleParent || (isSingleParent && typeof childrenCount === 'number' && childrenCount > 0));

  // ---------- Submit ----------
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Votre session a expiré ou est invalide. Veuillez vous reconnecter.');
        setSubmitting(false);
        router.replace('/auth');
        return;
      }

      const activeUserId = user.id;
      const computedAge = dateOfBirth ? calculateAge(dateOfBirth) : undefined;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: activeUserId,
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          country: country,
          city: city,
          bio: bio.trim(),
          date_of_birth: dateOfBirth || null,
          age: computedAge,
          gender: gender,
          is_single_parent: isSingleParent,
          children_count: isSingleParent ? (childrenCount || 0) : 0,
        });

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('already exists')) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName.trim(),
              phone_number: phoneNumber.trim(),
              country: country,
              city: city,
              bio: bio.trim(),
              date_of_birth: dateOfBirth || null,
              age: computedAge,
              gender: gender,
              is_single_parent: isSingleParent,
              children_count: isSingleParent ? (childrenCount || 0) : 0,
            })
            .eq('id', activeUserId);

          if (updateError) {
            throw updateError;
          }
        } else {
          throw insertError;
        }
      }

      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Erreur détaillée de sauvegarde:', err);

      const errMsg = err?.message || '';
      const errDetails = err?.details || '';
      const errHint = err?.hint || '';
      const errCode = err?.code || '';

      let displayError = 'Erreur lors de la sauvegarde : ';
      if (errMsg) {
        displayError += errMsg;
      } else {
        displayError += typeof err === 'object' ? JSON.stringify(err) : String(err);
      }

      if (errDetails) displayError += ` (Détail: ${errDetails})`;
      if (errHint) displayError += ` (Conseil: ${errHint})`;
      if (errCode) displayError += ` [Code: ${errCode}]`;

      setError(displayError);
      setSubmitting(false);
    }
  };

  // ---------- Loading screen ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // ---------- Step indicator ----------
  const stepLabels = ['Identité', 'Contact', 'Profil'];

  const signedUpWithPhone = !!userPhone;

  // Âge calculé en temps réel pour l'affichage
  const currentAge = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const ageIsValid = currentAge !== null && currentAge >= 30 && currentAge <= 45;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      {/* ── Background gradient orbs ── */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-orange-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-rose-500/8 blur-[90px]" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Glassmorphism card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
          {/* ── Welcome header ── */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bienvenue sur AfriHeart&nbsp;!&nbsp;🎉
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Complétez votre profil pour commencer.
            </p>
          </div>

          {/* ── Progress bar ── */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isActive = step >= stepNum;
                const isCurrent = step === stepNum;
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-950 shadow-lg shadow-amber-500/30 scale-110'
                          : isActive
                            ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                            : 'bg-white/5 text-zinc-500 ring-1 ring-white/10'
                      }`}
                    >
                      {stepNum}
                    </div>
                    <span
                      className={`text-[11px] font-medium transition-colors duration-300 ${
                        isCurrent ? 'text-amber-400' : isActive ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-700 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {/* ── Steps container ── */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
            >
              {/* ─── STEP 1 : Full Name + Date de naissance ─── */}
              <div className="w-full flex-shrink-0 px-0.5">
                <div className="space-y-5">
                  {/* Nom complet */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Nom complet <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Ex : Aminata Diallo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Genre <span className="text-amber-500">*</span>
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30"
                    >
                      <option value="" disabled className="text-zinc-500">Sélectionnez votre genre</option>
                      <option value="male" className="bg-zinc-900 text-white">Homme</option>
                      <option value="female" className="bg-zinc-900 text-white">Femme</option>
                    </select>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Date de naissance <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      min={getMinDate()}
                      max={getMaxDate()}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (e.target.value) validateAge(e.target.value);
                        else setAgeError('');
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:ring-1 bg-white/5
                        ${ageError
                          ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                          : ageIsValid
                            ? 'border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/30'
                            : 'border-white/10 focus:border-amber-500 focus:ring-amber-500/30'
                        }`}
                      style={{ colorScheme: 'dark' }}
                    />

                    {/* Feedback âge en temps réel */}
                    {dateOfBirth && !ageError && currentAge !== null && (
                      <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
                        ${ageIsValid
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}
                      >
                        <span>{ageIsValid ? '✓' : '✗'}</span>
                        <span>
                          {ageIsValid
                            ? `Vous avez ${currentAge} ans — éligible ✨`
                            : `Vous avez ${currentAge} ans — hors de la tranche 30–45 ans`
                          }
                        </span>
                      </div>
                    )}

                    {/* Message d'erreur */}
                    {ageError && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                        <span className="mt-0.5 shrink-0">⚠️</span>
                        <span>{ageError}</span>
                      </div>
                    )}

                    {/* Indication de la plage autorisée */}
                    {!dateOfBirth && (
                      <p className="mt-1.5 text-xs text-zinc-500">
                        AfriHeart est réservé aux personnes entre <span className="text-amber-400 font-medium">30 et 45 ans</span>.
                      </p>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-500">
                    Utilisez votre vrai nom pour que les autres membres puissent vous
                    reconnaître.
                  </p>
                </div>
              </div>

              {/* ─── STEP 2 : Phone + City ─── */}
              <div className="w-full flex-shrink-0 px-0.5">
                <div className="space-y-5">
                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Numéro de téléphone <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+225 07 00 00 00"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      readOnly={signedUpWithPhone}
                      className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30 ${
                        signedUpWithPhone ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    />
                    {signedUpWithPhone && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Numéro lié à votre compte – non modifiable.
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label
                      htmlFor="country"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Pays <span className="text-amber-500">*</span>
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setCity('');
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30"
                    >
                      <option value="" disabled className="text-zinc-500">Sélectionnez votre pays</option>
                      {Object.keys(AFRICAN_COUNTRIES_CITIES).sort().map(c => (
                        <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Ville <span className="text-amber-500">*</span>
                    </label>
                    <select
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!country}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="text-zinc-500">Sélectionnez votre ville</option>
                      {country && AFRICAN_COUNTRIES_CITIES[country]?.map((c) => (
                        <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ─── STEP 3 : Bio + Terms ─── */}
              <div className="w-full flex-shrink-0 px-0.5">
                <div className="space-y-5">
                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="mb-1.5 block text-sm font-medium text-zinc-300"
                    >
                      Bio <span className="text-amber-500">*</span>
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      maxLength={300}
                      placeholder="Parlez-nous de vous en quelques mots…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30"
                    />
                    <div className="mt-1 flex justify-end">
                      <span
                        className={`text-xs font-medium transition-colors ${
                          bio.length >= 280
                            ? 'text-rose-400'
                            : bio.length >= 200
                              ? 'text-amber-400'
                              : 'text-zinc-500'
                        }`}
                      >
                        {bio.length}/300
                      </span>
                    </div>
                  </div>

                  {/* Parent célibataire */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Êtes-vous parent célibataire ?
                    </label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="isSingleParent"
                          checked={!isSingleParent}
                          onChange={() => {
                            setIsSingleParent(false);
                            setChildrenCount('');
                          }}
                          className="h-4 w-4 border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30"
                        />
                        <span className="text-sm text-zinc-300">Non</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="isSingleParent"
                          checked={isSingleParent}
                          onChange={() => setIsSingleParent(true)}
                          className="h-4 w-4 border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30"
                        />
                        <span className="text-sm text-zinc-300">Oui</span>
                      </label>
                    </div>

                    {isSingleParent && (
                      <div className="animate-[fadeIn_0.3s_ease-out]">
                        <label
                          htmlFor="childrenCount"
                          className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                          Nombre d'enfants <span className="text-amber-500">*</span>
                        </label>
                        <select
                          id="childrenCount"
                          value={childrenCount}
                          onChange={(e) => setChildrenCount(Number(e.target.value))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-amber-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-amber-500/30"
                        >
                          <option value="" disabled className="text-zinc-500">Combien d'enfants avez-vous ?</option>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num} className="bg-zinc-900 text-white">
                              {num} {num === 1 ? 'enfant' : 'enfants'}{num === 5 ? ' et plus' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Rappel vérification identité */}
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <span className="text-lg shrink-0">🪪</span>
                    <div className="text-xs leading-relaxed text-zinc-400">
                      <span className="font-semibold text-amber-400">Étape suivante :</span> Après avoir créé votre profil, vous devrez uploader une pièce d&apos;identité (CNI ou Passeport) pour être vérifié et accéder à toutes les fonctionnalités.
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:border-amber-500 checked:bg-amber-500"
                    />
                    <span className="text-xs leading-relaxed text-zinc-400">
                      J&apos;accepte les{' '}
                      <span className="text-amber-400 underline underline-offset-2">
                        conditions d&apos;utilisation
                      </span>{' '}
                      et la{' '}
                      <span className="text-amber-400 underline underline-offset-2">
                        politique de confidentialité
                      </span>{' '}
                      d&apos;AfriHeart.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Error message ── */}
          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="mt-8 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="flex h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-medium text-zinc-300 transition-all duration-300 hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                ← Retour
              </button>
            )}

            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (step === 1 && (!canProceedStep1 || !!ageError)) ||
                  (step === 2 && !canProceedStep2)
                }
                className="ml-auto flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Suivant →
              </button>
            )}

            {step === TOTAL_STEPS && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="ml-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-8 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enregistrement…
                  </>
                ) : (
                  <>✨ Compléter mon profil</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Step count label ── */}
        <p className="mt-4 text-center text-xs text-zinc-600">
          Étape {step} sur {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
