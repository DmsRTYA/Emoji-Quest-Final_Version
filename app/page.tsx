'use client';
import { useState, useEffect } from 'react';
import AuthModal from '@/components/AuthModal';
import GameDashboard from '@/components/GameDashboard';
import LandingPage from '@/components/LandingPage';
import { PageLoader } from '@/components/LoadingStates';

export interface User {
  id: number; username: string; email: string;
  avatar_color: string; avatar_url?: string | null; initials?: string;
  rank_tier: string; casual_score: number; rank_score: number;
  pvp_wins: number; pvp_losses: number; total_games: number;
}

export default function Home() {
  const [user,     setUser]     = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Check sessionStorage for Google redirect token
    try {
      const stored = sessionStorage.getItem('__eq_google_token');
      if (stored) {
        sessionStorage.removeItem('__eq_google_token');
        const { token, user: u } = JSON.parse(stored);
        if (token && u) { localStorage.setItem('token', token); setUser(u); setLoading(false); return; }
      }
    } catch {}

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.user) setUser(d.user); })
        .catch(() => {}).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem('token', token); setUser(u); setShowAuth(false);
  };

  if (loading) return <PageLoader label="Memuat EmojiQuest" />;

  return (
    <main style={{ minHeight:'100vh', background:'#0A0A0F', position:'relative' }}>
      {/* Ambient orbs */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        {[
          { t:'-20%', l:'-10%', c:'rgba(0,245,255,0.04)', d:'0s' },
          { t:'auto', l:'auto', c:'rgba(191,90,242,0.04)', d:'1.5s', b:'-20%', r:'-10%' },
          { t:'40%',  l:'40%',  c:'rgba(255,214,10,0.025)', d:'3s' },
        ].map((o,i)=>(
          <div key={i} style={{ position:'absolute', top:o.t, left:o.l, bottom:(o as any).b, right:(o as any).r,
            width:500, height:500, borderRadius:'50%', background:o.c, filter:'blur(100px)',
            animation:`pulse 6s ease-in-out ${o.d} infinite` }} />
        ))}
      </div>
      <div style={{ position:'relative', zIndex:1 }}>
        {user
          ? <GameDashboard user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); }} setUser={setUser} />
          : <LandingPage onOpenAuth={(m) => { setAuthMode(m); setShowAuth(true); }} />
        }
      </div>
      {showAuth && (
        <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onLogin={handleLogin}
          onSwitchMode={() => setAuthMode(m => m==='login'?'register':'login')} />
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </main>
  );
}
