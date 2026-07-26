'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types/profile';
import PaystackPop from '@paystack/inline-js';

type Tab = 'discover' | 'likes' | 'messages' | 'profile';

// Liste factice d'utilisateurs au cas où le projet n'a pas encore été peuplé
const BACKUP_PROFILES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Mariama Diop',
    phone_number: '+221 77 123 45 67',
    city: 'Dakar',
    bio: 'Passionnée de culture, de gastronomie africaine et de voyages. Je cherche une relation sérieuse basée sur la complicité et le respect mutuel. ✨',
    is_verified: true,
    age: 26,
    objective: 'Mariage / Sérieux'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Koffi Mensah',
    phone_number: '+228 90 98 76 54',
    city: 'Lomé',
    bio: 'Entrepreneur dans la tech, j’aime l’art contemporain, le jazz et la lecture. Cherche une personne ambitieuse avec qui partager des projets de vie.',
    is_verified: false,
    age: 31,
    objective: 'Relation durable'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Aminata Touré',
    phone_number: '+225 07 45 67 89',
    city: 'Abidjan',
    bio: 'Souriante et dynamique ! J’aime cuisiner de bons plats d’Afrique de l’Ouest et faire du sport. À la recherche de mon âme sœur.',
    is_verified: true,
    age: 28,
    objective: 'Mariage / Sérieux'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'Joel Mukendi',
    phone_number: '+243 81 234 56 78',
    city: 'Kinshasa',
    bio: 'Architecte passionné de design. J’aime voyager à travers le continent pour découvrir nos richesses culturelles. Faisons connaissance ! 🌍',
    is_verified: true,
    age: 33,
    objective: 'Rencontre amicale d’abord'
  }
];

export default function DashboardPage() {
  const router = useRouter();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard navigation & UI state
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Real Database Likes & Matches states
  const [dbLikesSent, setDbLikesSent] = useState<any[]>([]);
  const [dbLikesReceived, setDbLikesReceived] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // Premium / VIP modal state
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipModalSource, setVipModalSource] = useState<'likes_limit' | 'received_likes' | 'sidebar' | 'messages_limit'>('likes_limit');
  const [isVip, setIsVip] = useState(false);
  const [vipCheckoutState, setVipCheckoutState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);

  // Chat tracking state
  const [sentMessagesCount, setSentMessagesCount] = useState(0);
  const [typingChatId, setTypingChatId] = useState<string | null>(null);

  // Filters for Discovery
  const [filterCity, setFilterCity] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterObjective, setFilterObjective] = useState('');

  // Profile Edit fields
  const [editFullName, setEditFullName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState<number | ''>('');
  const [editProfession, setEditProfession] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editSearchAgeRange, setEditSearchAgeRange] = useState('');
  const [editSearchLocation, setEditSearchLocation] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  // Message chat simulation
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: 'me' | 'them', text: string, time: string }[]>>({
    '11111111-1111-1111-1111-111111111111': [
      { sender: 'them', text: 'Bonjour ! J’ai vu ton profil et je le trouve très intéressant.', time: '14:02' },
      { sender: 'me', text: 'Bonjour Mariama ! Merci beaucoup, c’est partagé. Comment vas-tu ?', time: '14:05' },
      { sender: 'them', text: 'Je vais bien merci, je suis à Dakar en ce moment et toi ? ☀️', time: '14:06' },
    ]
  });

  // ---------- Load Auth & Profile & Likes & Profiles list ----------
  const loadDashboardData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/auth');
        return;
      }

      setCurrentUser(user);

      // Fetch current user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        router.replace('/onboarding');
        return;
      }

      const prof = profileData as Profile;
      setCurrentProfile(prof);
      
      // Populate edit fields
      setEditFullName(prof.full_name || '');
      setEditCity(prof.city || '');
      setEditBio(prof.bio || '');
      setEditPhone(prof.phone_number || '');
      setEditAge(prof.age || '');
      setEditProfession(prof.profession || '');
      setEditObjective(prof.objective || '');
      setEditSearchAgeRange(prof.search_age_range || '');
      setEditSearchLocation(prof.search_location || '');

      // Fetch other users' profiles
      const { data: otherProfiles, error: otherProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (otherProfilesError) {
        console.error('Erreur chargement profils:', otherProfilesError);
      }

      // Fetch likes sent by current user
      const { data: sentLikes, error: sentLikesError } = await supabase
        .from('likes')
        .select('*')
        .eq('sender_id', user.id);

      if (!sentLikesError && sentLikes) {
        setDbLikesSent(sentLikes);
      }

      // Fetch likes received by current user
      const { data: receivedLikes, error: receivedLikesError } = await supabase
        .from('likes')
        .select('*')
        .eq('receiver_id', user.id);

      if (!receivedLikesError && receivedLikes) {
        setDbLikesReceived(receivedLikes);
      }

      // Fetch matches
      const { data: userMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);

      if (!matchesError && userMatches) {
        setMatches(userMatches);
      }

      // Si aucun profil n'est dans la base, on utilise les profils fictifs (BACKUP) pour peupler la démo
      const finalOtherProfiles = otherProfiles && otherProfiles.length > 0
        ? otherProfiles.map(p => ({
            ...p,
            age: p.age || Math.floor(Math.random() * 15) + 22,
            objective: p.objective || ['Mariage / Sérieux', 'Relation durable', 'Rencontre amicale d’abord'][Math.floor(Math.random() * 3)]
          }))
        : BACKUP_PROFILES.map(p => ({
            ...p,
            // If they match our likes arrays, keep them aligned
            liked: sentLikes?.some(l => l.receiver_id === p.id)
          }));

      setProfiles(finalOtherProfiles);
    } catch (err) {
      console.error('Erreur dashboard init:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  // ---------- Sign Out ----------
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  // ---------- Real VIP Checkout with Paystack ----------
  function handleVipCheckout() {
    if (vipCheckoutState !== 'idle') return;
    
    // Step 1: processing state (loading on button)
    setVipCheckoutState('processing');

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
      email: currentUser?.email || 'user@example.com',
      amount: 4900 * 100, // 4900 XOF en centimes/kobo
      metadata: {
        custom_fields: [
          {
            display_name: "Plan Type",
            variable_name: "plan_type",
            value: "VIP Subscription",
          },
        ],
      },
      onSuccess: (transaction: any) => {
        // Step 2: success screen
        setVipCheckoutState('success');

        setTimeout(() => {
          // Step 3: activate VIP + close modal + celebration effect
          setIsVip(true);
          setShowVipModal(false);
          setVipCheckoutState('idle'); // reset for next time
          
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }, 3000);
      },
      onCancel: () => {
        setVipCheckoutState('idle');
      },
      onError: (error: any) => {
        setVipCheckoutState('idle');
        console.error("Paystack error:", error);
      },
    });
  }

  // ---------- Real DB Like Action (with Premium check) ----------
  const handleLike = async (profileId: string) => {
    if (!currentUser) return;

    // Check if already liked in local state
    const alreadyLiked = dbLikesSent.some(l => l.receiver_id === profileId);

    if (alreadyLiked) {
      // Dislike: always update local state first for instant feedback
      setDbLikesSent(prev => prev.filter(l => l.receiver_id !== profileId));

      // Try to remove from DB silently (may fail for demo profiles)
      try {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('sender_id', currentUser.id)
          .eq('receiver_id', profileId);

        if (error) {
          // Log silently — demo profiles won't exist in DB, that's expected
          console.info('Dislike DB skipped (demo profile or RLS):', error.message);
        }
      } catch (err: any) {
        console.info('Dislike DB catch (ignored):', err?.message);
      }
    } else {
      // Like: check VIP limit of 10 likes per day
      if (dbLikesSent.length >= 10 && !isVip) {
        setVipModalSource('likes_limit');
        setShowVipModal(true);
        return;
      }

      // Optimistic update — instantly show filled heart before DB responds
      setDbLikesSent(prev => [
        ...prev,
        { sender_id: currentUser.id, receiver_id: profileId, _optimistic: true }
      ]);

      // Try to persist in DB
      try {
        const { error } = await supabase
          .from('likes')
          .insert({ sender_id: currentUser.id, receiver_id: profileId });

        if (error) {
          const isFkError =
            error.code === '23503' || error.message?.includes('foreign key');

          if (isFkError) {
            // Demo profile: like is already shown locally, nothing to undo
            console.info(`Like simulé localement pour le profil de démo : ${profileId}`);
          } else {
            // Unexpected DB error: roll back optimistic update silently
            console.error('Like DB error:', error.message, error.details, error.hint);
            setDbLikesSent(prev => prev.filter(l => l.receiver_id !== profileId));
          }
          return;
        }

        // DB success: confirm the optimistic entry (remove _optimistic flag)
        setDbLikesSent(prev =>
          prev.map(l =>
            l.receiver_id === profileId && l._optimistic
              ? { sender_id: currentUser.id, receiver_id: profileId }
              : l
          )
        );

        // Refresh after a short delay to catch any new matches from the DB trigger
        setTimeout(() => { loadDashboardData(); }, 400);
      } catch (err: any) {
        // Network or unexpected error — keep optimistic like in local state
        console.info('Like DB catch (local only):', err?.message);
      }
    }
  };


  // ---------- Message Action (Go to Chat) ----------
  const startChat = (profile: any) => {
    setSelectedChat(profile);
    setActiveTab('messages');
  };

  // ---------- Send Simulated Message ----------
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    if (!isVip && sentMessagesCount >= 2) {
      setVipModalSource('messages_limit');
      setShowVipModal(true);
      return;
    }

    const chatId = selectedChat.id;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsgObj = { sender: 'me' as const, text: newMessage.trim(), time: timeStr };
    const currentChat = chatHistories[chatId] || [];

    setChatHistories({
      ...chatHistories,
      [chatId]: [...currentChat, newMsgObj]
    });
    setNewMessage('');
    setSentMessagesCount(prev => prev + 1);

    // Simulate typing
    setTypingChatId(chatId);

    // Simulate reply from the other person after 2s
    setTimeout(() => {
      const responses = [
        "C'est génial ! Dis-m'en plus sur toi 😊",
        "J'aime beaucoup ta vision de la vie. Faisons plus ample connaissance !",
        "Je suis un peu occupée actuellement, mais je te réponds très vite !",
        "Super ! Est-ce que tu es souvent sur Abidjan ou Dakar ?",
        "Ça me ferait plaisir de discuter au téléphone un de ces jours."
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      const responseTime = new Date();
      const responseTimeStr = `${String(responseTime.getHours()).padStart(2, '0')}:${String(responseTime.getMinutes()).padStart(2, '0')}`;

      setChatHistories(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), { sender: 'them', text: randomReply, time: responseTimeStr }]
      }));
      setTypingChatId(null);
    }, 2000);
  };

  // ---------- Save Profile Changes ----------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentProfile) return;

    setProfileSaving(true);
    setProfileSaveSuccess(false);
    setProfileSaveError('');

    try {
      // Try to save core fields to DB
      const updatePayload: any = {
        full_name: editFullName.trim(),
        city: editCity.trim(),
        bio: editBio.trim(),
        phone_number: editPhone.trim(),
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setCurrentProfile({
        ...currentProfile,
        full_name: editFullName.trim(),
        city: editCity.trim(),
        bio: editBio.trim(),
        phone_number: editPhone.trim(),
        age: editAge === '' ? undefined : Number(editAge),
        profession: editProfession.trim(),
        objective: editObjective.trim(),
        search_age_range: editSearchAgeRange.trim(),
        search_location: editSearchLocation.trim()
      });
      setProfileSaveSuccess(true);
    } catch (err: any) {
      console.error(err);
      setProfileSaveError(err.message || 'Impossible de sauvegarder les modifications.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ---------- Maps profiles sent/received ----------
  const likedByMe = useMemo(() => {
    return profiles.filter(p => dbLikesSent.some(l => l.receiver_id === p.id));
  }, [profiles, dbLikesSent]);

  const likedByOthers = useMemo(() => {
    return profiles.filter(p => dbLikesReceived.some(l => l.sender_id === p.id));
  }, [profiles, dbLikesReceived]);

  // ---------- Filters Logic ----------
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesCity = !filterCity || p.city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesObjective = !filterObjective || p.objective === filterObjective;
      
      let matchesAge = true;
      if (filterAge) {
        if (filterAge === '18-25') matchesAge = p.age >= 18 && p.age <= 25;
        else if (filterAge === '26-35') matchesAge = p.age >= 26 && p.age <= 35;
        else if (filterAge === '36+') matchesAge = p.age >= 36;
      }

      return matchesCity && matchesAge && matchesObjective;
    });
  }, [profiles, filterCity, filterAge, filterObjective]);

  // ---------- Cities for suggestions ----------
  const uniqueCities = useMemo(() => {
    const citiesSet = new Set(profiles.map(p => p.city));
    return Array.from(citiesSet);
  }, [profiles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Chargement de votre univers AfriHeart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex relative overflow-hidden">
      
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-48 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 -left-48 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] animate-glow-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up text-4xl"
              style={{
                left: `${Math.random() * 100}vw`,
                top: '100vh',
                animationDuration: `${Math.random() * 2 + 3}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              {['✨', '💖', '👑', '🎉', '🥂'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
          <style>{`
            @keyframes float-up {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
            }
            .animate-float-up {
              animation: float-up linear forwards;
            }
          `}</style>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-zinc-900/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col justify-between p-6">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-heart-beat inline-block">❤️</span>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
                AfriHeart
              </span>
            </div>

            {/* Menu options */}
            <nav className="space-y-1.5">
              {[
                { id: 'discover', label: 'Découvrir', icon: '🔍' },
                { id: 'likes', label: 'Mes Likes', icon: '💖', badge: dbLikesSent.length > 0 ? dbLikesSent.length : undefined },
                { id: 'messages', label: 'Messagerie', icon: '💬', badge: Object.keys(chatHistories).length > 0 ? 1 : undefined },
                { id: 'profile', label: 'Mon Profil', icon: '👤' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-amber-400 border border-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* VIP Status Card */}
            {isVip ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>
                  <div>
                    <p className="text-xs font-bold text-amber-400">AfriHeart VIP</p>
                    <p className="text-[10px] text-zinc-400">Likes illimités activés ✨</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVip(false)}
                  className="w-full text-[10px] text-zinc-500 hover:text-zinc-300 border border-white/5 rounded-lg py-1 cursor-pointer transition-colors"
                >
                  Désactiver le mode VIP
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setVipModalSource('sidebar'); setShowVipModal(true); }}
                className="w-full p-4 rounded-2xl bg-white/[0.02] border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all cursor-pointer text-left group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">Passer à VIP 👑</span>
                  <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md">4 900 XOF</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">Likes illimités · Voir qui vous a liké · Badge vérifié</p>
                <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-1 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (dbLikesSent.length / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-zinc-600">Likes restants : {Math.max(0, 10 - dbLikesSent.length)}/10</p>
              </button>
            )}
          </div>

          {/* User profile Summary footer */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-sm">
                {currentProfile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-zinc-200">{currentProfile?.full_name}</p>
                <p className="text-xs text-zinc-500 truncate">{currentProfile?.city}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-900/90 border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">AfriHeart</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-400 hover:text-white focus:outline-none cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Main View Area */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-20 md:pt-0 pb-12 px-6 md:px-10 relative z-10">
        
        {/* TAB 1: DISCOVER */}
        {activeTab === 'discover' && (
          <div className="max-w-6xl mx-auto py-8 space-y-8 animate-slide-up">
            
            {/* Header & filters bar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Rencontrez des célibataires</h1>
                <p className="text-zinc-400 text-sm mt-1">Trouvez la personne qui partagera vos valeurs africaines.</p>
              </div>

              {/* Discovery Quick Filters */}
              <div className="flex flex-wrap items-center gap-2.5 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500 outline-none"
                >
                  <option value="">Toutes les Villes</option>
                  {uniqueCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filterAge}
                  onChange={(e) => setFilterAge(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500 outline-none"
                >
                  <option value="">Tous les Âges</option>
                  <option value="18-25">18 - 25 ans</option>
                  <option value="26-35">26 - 35 ans</option>
                  <option value="36+">36 ans et +</option>
                </select>

                <select
                  value={filterObjective}
                  onChange={(e) => setFilterObjective(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500 outline-none"
                >
                  <option value="">Tous les Objectifs</option>
                  <option value="Mariage / Sérieux">Mariage / Sérieux</option>
                  <option value="Relation durable">Relation durable</option>
                  <option value="Rencontre amicale d’abord">Rencontre amicale d’abord</option>
                </select>

                {(filterCity || filterAge || filterObjective) && (
                  <button
                    onClick={() => {
                      setFilterCity('');
                      setFilterAge('');
                      setFilterObjective('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Profile Grid or Empty State */}
            {filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 glass rounded-3xl border border-white/10 max-w-xl mx-auto mt-12 animate-slide-up-delayed">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-4xl mb-6 animate-pulse">
                  🌍
                </div>
                <h3 className="text-xl font-bold mb-2">Bienvenue {currentProfile?.full_name} !</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                  Vous êtes l&apos;un des pionniers sur <span className="text-amber-400 font-medium">AfriHeart</span> dans votre région. De nouveaux profils arrivent très vite !
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    onClick={() => {
                      setFilterCity('');
                      setFilterAge('');
                      setFilterObjective('');
                    }}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white cursor-pointer hover:opacity-95"
                  >
                    Effacer les filtres
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    Compléter mon profil
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((p) => {
                  const isLiked = dbLikesSent.some(l => l.receiver_id === p.id);
                  const isMatch = matches.some(m => (m.user_1 === p.id || m.user_2 === p.id));
                  
                  return (
                    <div
                      key={p.id}
                      className="group relative overflow-hidden rounded-2xl glass hover:border-amber-500/30 transition-all duration-500 flex flex-col justify-between"
                    >
                      <div className="h-44 bg-gradient-to-br from-zinc-800 via-amber-900/40 to-rose-950/50 relative p-4 flex flex-col justify-between">
                        
                        <div className="flex items-center justify-between w-full">
                          <span className="bg-black/60 backdrop-blur-md text-[10px] text-zinc-300 font-semibold px-2 py-0.5 rounded-full border border-white/5">
                            📍 {p.city}
                          </span>
                          
                          {isMatch ? (
                            <span className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              💘 Match !
                            </span>
                          ) : p.is_verified ? (
                            <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              ✓ Vérifié
                            </span>
                          ) : null}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-zinc-700/20 text-8xl font-black group-hover:scale-110 transition-transform duration-700 select-none">
                            {p.full_name.charAt(0)}
                          </span>
                        </div>

                        <div className="relative z-10">
                          <h3 className="text-lg font-bold text-white flex items-center gap-1.5 drop-shadow-md">
                            {p.full_name.split(' ')[0]}, {p.age} ans
                          </h3>
                          <span className="text-[10px] text-amber-300/90 font-medium tracking-wide uppercase drop-shadow-md">
                            {p.objective}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-zinc-900/20">
                        <p className="text-zinc-300 text-xs leading-relaxed line-clamp-3 mb-6">
                          {p.bio || 'Aucune biographie rédigée.'}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLike(p.id)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/5'
                            }`}
                          >
                            <span>❤️</span>
                            {isLiked ? 'Liké' : 'Liker'}
                          </button>
                          
                          <button
                            onClick={() => startChat(p)}
                            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Envoyer un message"
                          >
                            💬
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIKES */}
        {activeTab === 'likes' && (
          <div className="max-w-4xl mx-auto py-8 space-y-12 animate-slide-up">
            
            {/* Section: Mes Coups de Cœur */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Mes Likes & Intérêts</h1>
              <p className="text-zinc-400 text-sm mt-1">Gérez vos coups de cœur et découvrez qui s&apos;intéresse à vous.</p>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-2 text-zinc-200">Mes coups de cœur ({likedByMe.length})</h2>
              
              {likedByMe.length === 0 ? (
                <div className="text-center p-8 glass rounded-2xl max-w-sm mx-auto">
                  <span className="text-3xl block mb-2">💔</span>
                  <p className="text-zinc-400 text-xs">Aucun coup de cœur envoyé pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {likedByMe.map(p => (
                    <div key={p.id} className="glass p-4 rounded-xl flex gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-lg">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{p.full_name}</h4>
                          <p className="text-zinc-500 text-xs">{p.city}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startChat(p)}
                          className="p-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Discuter
                        </button>
                        <button
                          onClick={() => handleLike(p.id)}
                          className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-rose-400 rounded-lg text-xs cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Ils m&apos;ont liké (PREMIUM Restriction) */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-200">Ils vous ont liké ({likedByOthers.length})</h2>
                {!isVip && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Premium requis 👑
                  </span>
                )}
              </div>

              {likedByOthers.length === 0 ? (
                <div className="text-center p-8 glass rounded-2xl max-w-sm mx-auto">
                  <span className="text-3xl block mb-2">⭐</span>
                  <p className="text-zinc-400 text-xs">Personne ne vous a encore liké. Complétez votre bio !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {likedByOthers.map(p => (
                    <div key={p.id} className="glass p-4 rounded-xl flex gap-4 items-center justify-between relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        {/* Blur avatar if not VIP */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-lg transition-all ${
                          !isVip ? 'blur-md select-none' : ''
                        }`}>
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          {/* Blur name if not VIP */}
                          <h4 className={`font-bold text-sm transition-all ${!isVip ? 'blur-md select-none' : ''}`}>
                            {p.full_name}
                          </h4>
                          <p className={`text-zinc-500 text-xs transition-all ${!isVip ? 'blur-md select-none' : ''}`}>
                            {p.city}
                          </p>
                        </div>
                      </div>

                      {/* Display Action Button or Premium Block */}
                      {isVip ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startChat(p)}
                            className="p-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Discuter
                          </button>
                          <button
                            onClick={() => handleLike(p.id)}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-rose-400 rounded-lg text-xs cursor-pointer"
                          >
                            Liker en retour
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setVipModalSource('received_likes'); setShowVipModal(true); }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer"
                        >
                          Débloquer 👑
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* VIP Banner if not VIP */}
              {!isVip && likedByOthers.length > 0 && (
                <div className="glass p-6 rounded-2xl border border-amber-500/20 text-center max-w-xl mx-auto space-y-4 bg-gradient-to-r from-amber-500/5 to-rose-500/5">
                  <span className="text-3xl">👑</span>
                  <h3 className="font-bold text-sm">Découvrez qui vous aime avec AfriHeart VIP</h3>
                  <p className="text-zinc-400 text-xs max-w-md mx-auto">
                    Ne laissez pas passer votre âme sœur. Accédez instantanément à la liste complète des personnes qui vous ont liké en passant à notre abonnement VIP.
                  </p>
                  <button
                    onClick={() => { setVipModalSource('received_likes'); setShowVipModal(true); }}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    Passer à AfriHeart VIP
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="max-w-5xl mx-auto py-8 animate-slide-up h-[calc(100vh-180px)] flex flex-col md:flex-row gap-6">
            
            {/* Conversations list sidebar */}
            <div className="w-full md:w-80 glass rounded-2xl p-4 flex flex-col overflow-y-auto">
              <h2 className="font-bold text-lg mb-4 text-zinc-200">Discussions</h2>
              <div className="space-y-1">
                {likedByMe.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-6">
                    Aimez un profil et commencez à discuter avec lui.
                  </p>
                )}
                {likedByMe.map(p => {
                  const isActive = selectedChat?.id === p.id;
                  const chatHistory = chatHistories[p.id] || [];
                  const lastMsg = chatHistory[chatHistory.length - 1];

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedChat(p)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-sm">
                        {p.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-bold text-xs truncate text-zinc-200">{p.full_name}</h4>
                          <span className="text-[9px] text-zinc-500 font-medium">{lastMsg?.time || ''}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] truncate">
                          {lastMsg ? lastMsg.text : 'Démarrer la discussion'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation detail area */}
            <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
              {selectedChat ? (
                <>
                  {/* Chat header */}
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-xs">
                        {selectedChat.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white">{selectedChat.full_name}</h4>
                          <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            En ligne
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500">📍 {selectedChat.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages body */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {(chatHistories[selectedChat.id] || []).map((msg, i) => {
                      const isMe = msg.sender === 'me';
                      return (
                        <div
                          key={i}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                            isMe
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-tr-none'
                              : 'bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none'
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <span className="text-[9px] text-white/50 block text-right mt-1.5 font-medium">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    {typingChatId === selectedChat.id && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="max-w-[70%] rounded-2xl px-4 py-2.5 text-xs bg-white/5 border border-white/5 text-zinc-400 rounded-tl-none flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="italic text-[10px]">{selectedChat.full_name.split(' ')[0]} est en train d'écrire...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-zinc-900/30 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Écrire à ${selectedChat.full_name.split(' ')[0]}...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder-zinc-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center"
                    >
                      Envoyer
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-4xl block mb-2">💬</span>
                  <h4 className="font-semibold text-sm text-zinc-400">Aucune discussion sélectionnée</h4>
                  <p className="text-zinc-500 text-xs max-w-xs mt-1">
                    Sélectionnez une discussion pour commencer à échanger avec vos matchs et likes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto py-8 space-y-8 animate-slide-up">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Mon Profil</h1>
              <p className="text-zinc-400 text-sm mt-1">Gérez et mettez à jour vos informations AfriHeart.</p>
            </div>

            {/* Profile Editing Form */}
            <form onSubmit={handleSaveProfile} className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-8 relative overflow-hidden">
              
              {/* Background ambient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Photo & En-tête */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-white/5 relative z-10">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                    {currentProfile?.full_name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-zinc-800 border-2 border-zinc-950 rounded-full flex items-center justify-center text-xs shadow-lg group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                    📷
                  </div>
                </div>
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <h2 className="text-2xl font-bold text-white">{currentProfile?.full_name || 'Votre Nom'}</h2>
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 rounded-full">
                    {isVip ? (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        👑 Membre VIP ✨
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                        Compte Gratuit
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Feedback */}
              {profileSaveSuccess && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-500/5">
                  <span className="text-xl">✨</span>
                  <p className="text-sm font-semibold text-emerald-300">Profil mis à jour avec succès ! ✨</p>
                </div>
              )}
              {profileSaveError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 flex items-center gap-3 animate-fade-in">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm font-semibold text-rose-300">{profileSaveError}</p>
                </div>
              )}

              {/* Section 1: Informations personnelles */}
              <div className="space-y-5 relative z-10">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <span className="text-amber-500">📝</span> Informations personnelles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Nom complet</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20"
                      placeholder="Ex: Tra Bi Arthur"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Ville de résidence</label>
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      required
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20 appearance-none"
                    >
                      <option value="">Sélectionnez votre ville</option>
                      {['Abidjan', 'Dakar', 'Kinshasa', 'Bamako', 'Paris', 'Conakry', 'Libreville', 'Lomé'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Âge</label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value ? Number(e.target.value) : '')}
                      min="18" max="100"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20"
                      placeholder="Ex: 28"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Profession</label>
                    <input
                      type="text"
                      value={editProfession}
                      onChange={(e) => setEditProfession(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20"
                      placeholder="Ex: Architecte, Entrepreneur..."
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Objectif de rencontre</label>
                    <select
                      value={editObjective}
                      onChange={(e) => setEditObjective(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20 appearance-none"
                    >
                      <option value="">Sélectionnez un objectif</option>
                      <option value="Mariage / Relation sérieuse">💍 Mariage / Relation sérieuse</option>
                      <option value="Relation durable">🤝 Relation durable</option>
                      <option value="Rencontre amicale">👋 Rencontre amicale</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">À propos de moi</label>
                    <textarea
                      rows={4}
                      maxLength={300}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full resize-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20"
                      placeholder="Parlez-nous de vous, de vos passions, de ce que vous recherchez..."
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-zinc-500 font-medium">{editBio.length}/300</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Préférences de recherche */}
              <div className="space-y-5 pt-6 border-t border-white/5 relative z-10">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <span className="text-rose-500">🎯</span> Préférences de recherche
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Tranche d'âge recherchée</label>
                    <select
                      value={editSearchAgeRange}
                      onChange={(e) => setEditSearchAgeRange(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20 appearance-none"
                    >
                      <option value="">Indifférent</option>
                      <option value="18-25">18 - 25 ans</option>
                      <option value="26-35">26 - 35 ans</option>
                      <option value="36-45">36 - 45 ans</option>
                      <option value="46+">46 ans et plus</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 ml-1">Localisation souhaitée</label>
                    <select
                      value={editSearchLocation}
                      onChange={(e) => setEditSearchLocation(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all hover:border-white/20 appearance-none"
                    >
                      <option value="">Toutes les villes</option>
                      <option value="Ma ville uniquement">Ma ville uniquement</option>
                      <option value="Internationale">Internationale (Toute l'Afrique & Diaspora)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-2">
                  {currentProfile?.is_verified ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      ✓ Profil Vérifié
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      🔒 En attente de Selfie
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════
           PREMIUM VIP MODAL
      ══════════════════════════════════════════ */}
      {showVipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            // Prevent closing during payment flow
            if (vipCheckoutState === 'idle' && e.target === e.currentTarget) {
              setShowVipModal(false);
              setVipCheckoutState('idle');
            }
          }}
        >
          {/* Modal card */}
          <div
            className="w-full max-w-lg relative rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, #09090b 60%, #1c1008 100%)',
              boxShadow: '0 0 0 1px rgba(251,191,36,0.35), 0 0 80px rgba(251,191,36,0.12), 0 32px 80px rgba(0,0,0,0.7)'
            }}
          >
            {/* Top shimmer bar */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl" />

            {/* Close button — hidden during processing/success */}
            {vipCheckoutState === 'idle' && (
              <button
                onClick={() => { setShowVipModal(false); setVipCheckoutState('idle'); }}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer text-sm"
                aria-label="Fermer"
              >
                ✕
              </button>
            )}

            {/* ── STATE: SUCCESS ── */}
            {vipCheckoutState === 'success' && (
              <div className="p-10 flex flex-col items-center justify-center gap-5 min-h-[320px] text-center">
                {/* Animated checkmark circle */}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316, #e11d48)',
                    boxShadow: '0 0 60px rgba(251,191,36,0.45), 0 0 120px rgba(244,63,94,0.20)',
                    animation: 'pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
                  }}
                >
                  🎉
                </div>
                <div className="space-y-2">
                  <h2
                    className="text-3xl font-black tracking-tight"
                    style={{ background: 'linear-gradient(90deg, #fbbf24, #fb923c, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Félicitations ! 🎉
                  </h2>
                  <p className="text-white font-semibold text-base mt-2">
                    Vous êtes désormais membre <span className="text-amber-400">VIP AfriHeart</span>.
                  </p>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                    Profitez de vos avantages exclusifs dès maintenant !
                  </p>
                </div>
                {/* Stars decoration */}
                <div className="flex items-center gap-1 mt-2">
                  {['✨','⭐','✨','⭐','✨'].map((s, i) => (
                    <span
                      key={i}
                      className="text-lg"
                      style={{ animation: `pop-in 0.4s ${0.1 * i}s cubic-bezier(0.175,0.885,0.32,1.275) both` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs">Fermeture automatique dans quelques secondes…</p>
                <style>{`
                  @keyframes pop-in {
                    from { opacity: 0; transform: scale(0.3); }
                    to   { opacity: 1; transform: scale(1); }
                  }
                `}</style>
              </div>
            )}

            {/* ── STATE: IDLE or PROCESSING (normal view) ── */}
            {(vipCheckoutState === 'idle' || vipCheckoutState === 'processing') && (
              <div className="p-8 space-y-6">
                {/* Crown + heading */}
                <div className="text-center space-y-3">
                  <div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316, #e11d48)', boxShadow: '0 12px 40px rgba(251,191,36,0.35)' }}
                  >
                    👑
                  </div>
                  <div>
                    <h2
                      className="text-3xl font-black tracking-tight"
                      style={{ background: 'linear-gradient(90deg, #fbbf24, #fb923c, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      AfriHeart VIP
                    </h2>
                    <p className="text-zinc-300 text-sm mt-1 font-medium">
                      {vipModalSource === 'likes_limit' && 'Vous avez atteint votre limite quotidienne de 10 cœurs.'}
                      {vipModalSource === 'received_likes' && 'Découvrez qui a flashé sur votre profil.'}
                      {vipModalSource === 'messages_limit' && 'Vous avez atteint votre limite de messages gratuits.'}
                      {vipModalSource === 'sidebar' && "Débloquez toute l'expérience AfriHeart."}
                    </p>
                  </div>
                </div>

                {/* Feature list */}
                <div className="space-y-2.5">
                  {[
                    { icon: '❤️', title: 'Likes illimités', desc: 'Aimez autant de profils que vous voulez, sans limites quotidiennes.' },
                    { icon: '👀', title: 'Voir qui a flashé sur vous', desc: 'Découvrez instantanément la liste complète de vos admirateurs.' },
                    { icon: '💬', title: 'Messagerie illimitée', desc: 'Discutez librement avec tous les profils, sans restriction.' },
                    { icon: '✨', title: 'Badge Profil Vérifié', desc: 'Obtenez 3x plus de réponses grâce au badge de confiance VIP.' },
                  ].map((f) => (
                    <div
                      key={f.title}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{f.title}</p>
                        <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">{f.desc}</p>
                      </div>
                      <span className="ml-auto text-amber-400 flex-shrink-0 mt-1">✓</span>
                    </div>
                  ))}
                </div>

                {/* Pricing plans */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Monthly */}
                  <button
                    onClick={handleVipCheckout}
                    disabled={vipCheckoutState !== 'idle'}
                    className="relative flex flex-col items-center gap-1 p-4 rounded-2xl border border-white/10 hover:border-amber-500/40 bg-white/[0.03] hover:bg-amber-500/5 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300">1 mois</span>
                    <span className="text-xl font-black text-white">4 900</span>
                    <span className="text-[10px] text-zinc-500">XOF / mois</span>
                  </button>

                  {/* Annual — highlighted */}
                  <button
                    onClick={handleVipCheckout}
                    disabled={vipCheckoutState !== 'idle'}
                    className="relative flex flex-col items-center gap-1 p-4 rounded-2xl border transition-all cursor-pointer group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(244,63,94,0.10))',
                      border: '1px solid rgba(251,191,36,0.35)',
                      boxShadow: '0 0 24px rgba(251,191,36,0.10)'
                    }}
                  >
                    <span
                      className="absolute -top-px left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-900 rounded-b-lg"
                      style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
                    >
                      Meilleur choix
                    </span>
                    <span className="text-xs font-semibold text-amber-400 mt-3">Annuel</span>
                    <span className="text-xl font-black text-white">29 900</span>
                    <span className="text-[10px] text-zinc-400">XOF / an</span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
                    >
                      Économisez 50%
                    </span>
                  </button>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={handleVipCheckout}
                  disabled={vipCheckoutState !== 'idle'}
                  className="w-full py-4 rounded-2xl font-black text-base text-zinc-950 tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-90 disabled:cursor-wait relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #f59e0b, #f97316, #e11d48)',
                    boxShadow: '0 8px 32px rgba(251,191,36,0.35)'
                  }}
                >
                  {vipCheckoutState === 'processing' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement sécurisé...
                    </span>
                  ) : (
                    'Passer VIP maintenant 👑'
                  )}
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => { setShowVipModal(false); setVipCheckoutState('idle'); }}
                  disabled={vipCheckoutState !== 'idle'}
                  className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Plus tard, je reste en version gratuite
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
