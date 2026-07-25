'use client';

import Link from 'next/link';

/* ─── Floating Hearts Particle Effect ─── */
function FloatingHearts() {
  const hearts = [
    { emoji: '❤️', left: '10%', size: 'text-lg', animation: 'animate-heart-rise-1' },
    { emoji: '💕', left: '25%', size: 'text-sm', animation: 'animate-heart-rise-2' },
    { emoji: '❤️', left: '45%', size: 'text-xl', animation: 'animate-heart-rise-3' },
    { emoji: '💖', left: '65%', size: 'text-base', animation: 'animate-heart-rise-4' },
    { emoji: '❤️', left: '80%', size: 'text-sm', animation: 'animate-heart-rise-5' },
    { emoji: '💕', left: '90%', size: 'text-lg', animation: 'animate-heart-rise-6' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {hearts.map((h, i) => (
        <span
          key={i}
          className={`absolute bottom-0 ${h.size} ${h.animation} opacity-0`}
          style={{ left: h.left }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}

/* ─── Background Gradient Orbs ─── */
function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Primary large orb – amber to rose */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full animate-orb-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(244,63,94,0.2) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Secondary orb – rose to purple */}
      <div
        className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full animate-orb-drift"
        style={{
          background:
            'radial-gradient(circle, rgba(244,63,94,0.25) 0%, rgba(168,85,247,0.15) 45%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      {/* Accent orb – gold shimmer */}
      <div
        className="absolute -bottom-24 right-1/4 w-[400px] h-[400px] rounded-full animate-orb-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(245,158,11,0.1) 50%, transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '4s',
        }}
      />
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 animate-fade-in-up">
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div
          className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.08] px-6 py-3 backdrop-blur-xl"
          style={{
            background: 'rgba(9, 9, 11, 0.7)',
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-2xl transition-transform duration-300 group-hover:scale-110"
              role="img"
              aria-label="heart"
            >
              ❤️
            </span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent">
              AfriHeart
            </span>
          </Link>

          {/* CTA */}
          <Link
            href="/auth"
            className="relative overflow-hidden rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ea580c, #f43f5e)',
            }}
          >
            <span className="relative z-10">Se connecter</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero Section ─── */
function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Tagline */}
      <div className="animate-fade-in-up opacity-0">
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent animate-shimmer">
            L&apos;amour authentique
          </span>
          <br />
          <span className="text-white/90">commence ici</span>
        </h1>
      </div>

      {/* Subtitle */}
      <div className="animate-fade-in-up-delayed opacity-0">
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl">
          La première plateforme de rencontre sérieuse{' '}
          <span className="font-semibold text-amber-400/90">100% africaine</span>.
          <br className="hidden sm:block" /> Trouvez votre âme sœur en toute sécurité.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="animate-fade-in-up-delayed-2 opacity-0 mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5">
        <Link
          href="/auth"
          className="group relative overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 active:scale-95 animate-glow-pulse"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #f43f5e 100%)',
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            Commencer maintenant
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
          {/* Shine overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            }}
          />
        </Link>

        <Link
          href="#features"
          className="group rounded-2xl border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-base font-semibold text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-amber-500/30 hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          <span className="flex items-center gap-2">
            En savoir plus
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </span>
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}

/* ─── Feature Cards ─── */
const features = [
  {
    emoji: '🛡️',
    title: 'Vérification par Selfie',
    description:
      'Chaque profil est vérifié pour garantir des rencontres authentiques.',
    gradient: 'from-amber-500/20 to-orange-500/10',
    borderHover: 'hover:border-amber-500/30',
    delay: 'animate-scale-in-delayed',
  },
  {
    emoji: '🌍',
    title: 'Connexion Africaine',
    description:
      'Rencontrez des célibataires de toute l\'Afrique et de la diaspora.',
    gradient: 'from-orange-500/20 to-rose-500/10',
    borderHover: 'hover:border-orange-500/30',
    delay: 'animate-scale-in-delayed-2',
  },
  {
    emoji: '💝',
    title: 'Rencontres Sérieuses',
    description:
      'Un algorithme pensé pour des relations durables et significatives.',
    gradient: 'from-rose-500/20 to-pink-500/10',
    borderHover: 'hover:border-rose-500/30',
    delay: 'animate-scale-in-delayed-3',
  },
];

function Features() {
  return (
    <section id="features" className="relative z-10 px-4 pb-32 pt-16">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mb-16 text-center animate-scale-in opacity-0">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Pourquoi choisir{' '}
            <span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
              AfriHeart
            </span>{' '}
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Une plateforme pensée pour vous, avec des fonctionnalités qui font la différence.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] p-8 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 ${feature.borderHover} ${feature.delay} opacity-0`}
              style={{
                background: 'rgba(24, 24, 27, 0.5)',
              }}
            >
              {/* Card gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />

              {/* Content */}
              <div className="relative z-10">
                <span className="mb-5 inline-block text-4xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  {feature.emoji}
                </span>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>

              {/* Subtle shine on hover */}
              <div
                className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Social Proof Banner ─── */
function SocialProof() {
  return (
    <section className="relative z-10 border-y border-white/[0.06] py-16 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: '50K+', label: 'Membres actifs' },
            { value: '12K+', label: 'Couples formés' },
            { value: '30+', label: 'Pays africains' },
            { value: '4.8★', label: 'Note moyenne' },
          ].map((stat, i) => (
            <div key={i} className="group">
              <p className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ─── */
const testimonials = [
  {
    couple: 'Mariama & Koffi',
    location: 'Dakar / Lomé',
    story: '“AfriHeart a changé nos vies. Trouver quelqu’un qui partage notre amour de l’art, de la culture et qui recherche une vraie relation de mariage à distance puis à Lomé était inespéré. Merci AfriHeart !”',
    avatarGradient: 'from-amber-500 to-orange-600',
  },
  {
    couple: 'Aminata & Joel',
    location: 'Abidjan / Kinshasa',
    story: '“La vérification par selfie m’a rassurée dès le premier jour. Nous avons discuté pendant deux mois avant de nous rencontrer à Abidjan. Aujourd’hui, nous sommes fiancés !”',
    avatarGradient: 'from-rose-500 to-purple-600',
  }
];

function Testimonials() {
  return (
    <section className="relative z-10 px-4 py-20 bg-zinc-900/20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ils ont trouvé{' '}
            <span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
              l&apos;amour
            </span>{' '}
            sur AfriHeart
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
            Découvrez les belles histoires des couples formés au sein de notre communauté.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="glass p-8 rounded-3xl relative border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
            >
              <p className="text-sm italic text-zinc-300 leading-relaxed mb-6">
                {t.story}
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGradient} flex items-center justify-center font-bold text-white text-xs`}>
                  {t.couple.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{t.couple}</h4>
                  <p className="text-[10px] text-zinc-500">📍 {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Prêt(e) à trouver{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent">
            l&apos;amour
          </span>{' '}
          ?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-zinc-400">
          Rejoignez des milliers de célibataires africains qui ont déjà fait le pas vers des rencontres authentiques.
        </p>
        <Link
          href="/auth"
          className="group relative mt-10 inline-flex items-center gap-2 overflow-hidden rounded-2xl px-10 py-4 text-lg font-bold text-white shadow-xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #f43f5e 100%)',
          }}
        >
          <span className="relative z-10">Créer mon profil gratuitement</span>
          <svg
            className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] py-10">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">❤️</span>
          <span className="text-sm font-semibold bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
            AfriHeart
          </span>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          © {new Date().getFullYear()} AfriHeart. Tous droits réservés. Fait avec ❤️ pour l&apos;Afrique.
        </p>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white antialiased">
      <GradientOrbs />
      <FloatingHearts />
      <Navbar />
      <Hero />
      <Features />
      <SocialProof />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
