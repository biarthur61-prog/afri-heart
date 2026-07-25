'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ─── Country Codes ──────────────────────────────────────────────
const countryCodes = [
  { code: '+225', country: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
  { code: '+224', country: 'Guinée', flag: '🇬🇳' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+229', country: 'Bénin', flag: '🇧🇯' },
  { code: '+243', country: 'RD Congo', flag: '🇨🇩' },
  { code: '+242', country: 'Congo', flag: '🇨🇬' },
];

// ─── Types ──────────────────────────────────────────────────────
type AuthMode = 'login' | 'signup';
type AuthMethod = 'email' | 'phone';

export default function AuthPage() {
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('email');

  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone fields
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Reset form on mode/method change ────────────────────────
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setOtpSent(false);
    setOtpCode('');
  }, [mode, method]);

  // ── Profile check & redirect ────────────────────────────────
  const handleAuthSuccess = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profile) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch {
      // If profiles table doesn't exist yet, go to onboarding
      router.push('/onboarding');
    }
  };

  // ── Email Auth ──────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user?.identities?.length === 0) {
          setError('Un compte avec cet email existe déjà.');
        } else if (data.user) {
          setSuccess(
            'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.'
          );
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) throw signInError;
        if (data.user) {
          setSuccess('Connexion réussie ! Redirection en cours...');
          await handleAuthSuccess(data.user.id);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP Send ──────────────────────────────────────────
  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phoneNumber.trim()) {
      setError('Veuillez entrer votre numéro de téléphone.');
      return;
    }

    const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\s/g, '')}`;
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });
      if (otpError) throw otpError;
      setOtpSent(true);
      setSuccess('Code OTP envoyé ! Vérifiez vos SMS.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP Verify ────────────────────────────────────────
  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otpCode.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres.');
      return;
    }

    const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\s/g, '')}`;
    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otpCode,
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      if (data.user) {
        setSuccess('Vérification réussie ! Redirection en cours...');
        await handleAuthSuccess(data.user.id);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden px-4 py-12">
      {/* ── Background gradient orbs ────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-rose-500/10 blur-[100px]" />
      </div>

      {/* ── Card ─────────────────────────────────────────────── */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          mounted
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Back to home */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-amber-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Retour à l&apos;accueil
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* ── Logo ───────────────────────────────────────── */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <svg
                className="h-7 w-7 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Afri
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Heart
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === 'login'
                ? 'Connectez-vous à votre compte'
                : 'Créez votre compte gratuitement'}
            </p>
          </div>

          {/* ── Auth Mode Tabs (Connexion / Inscription) ──── */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                  mode === m
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* ── Auth Method Tabs (Email / Téléphone) ──────── */}
          <div className="mb-6 flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
            {(['email', 'phone'] as const).map((mt) => (
              <button
                key={mt}
                onClick={() => setMethod(mt)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-300 ${
                  method === mt
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mt === 'email' ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    Email
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    Téléphone
                  </>
                )}
              </button>
            ))}
          </div>

          {/* ── Feedback Messages ─────────────────────────── */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300 animate-[fadeIn_0.3s_ease-out]">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 animate-[fadeIn_0.3s_ease-out]">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* ── EMAIL FORM ────────────────────────────────── */}
          {method === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-300"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-300"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                {mode === 'signup' && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Minimum 6 caractères
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Chargement...
                  </span>
                ) : mode === 'login' ? (
                  'Se connecter'
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>
          )}

          {/* ── PHONE FORM ────────────────────────────────── */}
          {method === 'phone' && !otpSent && (
            <form onSubmit={handlePhoneSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-zinc-300"
                >
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  {/* Country code selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setCountryDropdownOpen(!countryDropdownOpen)
                      }
                      className="flex h-full items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white transition-all duration-200 hover:border-white/20 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="text-zinc-300">
                        {selectedCountry.code}
                      </span>
                      <svg
                        className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${
                          countryDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {countryDropdownOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-56 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
                        {countryCodes.map((c) => (
                          <button
                            type="button"
                            key={c.code}
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountryDropdownOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                              selectedCountry.code === c.code
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="flex-1 truncate">
                              {c.country}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {c.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone input */}
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07 00 00 00 00"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le code OTP'
                )}
              </button>
            </form>
          )}

          {/* ── OTP VERIFICATION FORM ─────────────────────── */}
          {method === 'phone' && otpSent && (
            <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
              <div className="mb-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-center">
                <p className="text-sm text-amber-200/80">
                  Code envoyé au{' '}
                  <span className="font-medium text-amber-300">
                    {selectedCountry.flag} {selectedCountry.code}{' '}
                    {phoneNumber}
                  </span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-1.5 block text-sm font-medium text-zinc-300"
                >
                  Code de vérification
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="000000"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  Entrez le code à 6 chiffres reçu par SMS
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Vérification...
                  </span>
                ) : (
                  'Vérifier le code'
                )}
              </button>

              {/* Resend / change number */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  ← Changer le numéro
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setOtpCode('');
                    setOtpSent(false);
                    setError(null);
                    setSuccess(null);
                    // Slight delay then re-send
                    setTimeout(() => {
                      handlePhoneSendOtp(
                        e as unknown as React.FormEvent
                      );
                    }, 100);
                  }}
                  className="text-xs text-amber-400/80 transition-colors hover:text-amber-400"
                >
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {/* ── 'Ou' Divider ─────────────────────────────── */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs font-medium text-zinc-600">Ou</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* ── Mode switch prompt ────────────────────────── */}
          <p className="text-center text-sm text-zinc-400">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-medium text-amber-400 transition-colors hover:text-amber-300"
                >
                  S&apos;inscrire
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-medium text-amber-400 transition-colors hover:text-amber-300"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          En continuant, vous acceptez nos{' '}
          <span className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-400 cursor-pointer">
            Conditions d&apos;utilisation
          </span>{' '}
          et notre{' '}
          <span className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-400 cursor-pointer">
            Politique de confidentialité
          </span>
        </p>
      </div>
    </div>
  );
}
