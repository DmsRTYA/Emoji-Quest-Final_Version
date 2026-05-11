'use client';
import { useState, useEffect } from 'react';
import { Trophy, Zap, Users, LogOut, Star, Shield, ChevronRight, Award, Home, BarChart2, Crown, Medal } from 'lucide-react';
import type { User } from '@/app/page';
import Avatar from '@/components/Avatar';
import GameScreen from '@/components/GameScreen';
import Leaderboard from '@/components/Leaderboard';
import PVPLobby from '@/components/PVPLobby';
import ProfileCard from '@/components/ProfileCard';

interface Props { user: User; onLogout: () => void; setUser: (u: User) => void; }
type View = 'home'|'casual'|'rank'|'pvp'|'leaderboard'|'profile';

const TIERS: Record<string,{color:string;label:string;icon:string}> = {
  bronze:{color:'#CD7F32',label:'Perunggu',icon:'🥉'}, silver:{color:'#C0C0C0',label:'Perak',icon:'🥈'},
  gold:{color:'#FFD700',label:'Emas',icon:'🥇'}, platinum:{color:'#E5E4E2',label:'Platinum',icon:'💎'},
  diamond:{color:'#B9F2FF',label:'Berlian',icon:'💠'}, master:{color:'#FFD60A',label:'Master',icon:'👑'},
};

function MiniLeaderboard({ user, onViewAll }: { user: User; onViewAll: () => void }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [tab, setTab]         = useState<'rank'|'casual'|'pvp'>('rank');
  const [loading, setLoading] = useState(true);

  const load = (m: string) => {
    setLoading(true);
    const tk = localStorage.getItem('token');
    fetch(`/api/leaderboard?mode=${m}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} })
      .then(r => r.json()).then(d => { setEntries((d.entries || []).slice(0, 5)); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load('rank'); }, []);

  const rankIcon = (r: number) => {
    if (r === 1) return <Crown size={15} color="#FFD60A" />;
    if (r === 2) return <Medal size={15} color="#C0C0C0" />;
    if (r === 3) return <Award size={15} color="#CD7F32" />;
    return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4A4A6A', width:15, textAlign:'center' }}>#{r}</span>;
  };

  return (
    <div style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.055)', borderRadius:24, overflow:'hidden' }}>
      <div style={{ padding:'clamp(12px,4vw,20px) clamp(16px,5vw,24px) 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,214,10,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><BarChart2 size={18} color="#FFD60A"/></div>
          <div>
            <div style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(14px,4vw,16px)', color:'#F0F0FF' }}>Papan Peringkat Global</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#4A4A6A', letterSpacing:'0.1em', marginTop:2 }}>PEMAIN TERBAIK MUSIM INI</div>
          </div>
        </div>
        <button onClick={onViewAll} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#00F5FF', fontFamily:"'Clash Display',sans-serif", fontWeight:600, fontSize:'clamp(12px,3.5vw,13px)', transition:'gap 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.gap='8px')} onMouseLeave={e=>(e.currentTarget.style.gap='4px')}>Lihat Semua <ChevronRight size={16}/></button>
      </div>
      {/* Tabs */}
      <div style={{ padding:'12px clamp(16px,5vw,24px) 0', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {(['rank','casual','pvp'] as const).map(t=>(
          <button key={t} onClick={()=>{ setTab(t); load(t); }}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:"'Clash Display',sans-serif", fontWeight:600, fontSize:'clamp(11px,3vw,12px)', transition:'all 0.2s',
              background: tab===t ? 'rgba(255,255,255,0.07)' : 'none',
              color: tab===t ? (t==='rank'?'#FFD60A':t==='casual'?'#00F5FF':'#BF5AF2') : '#4A4A6A' }}>
            {t==='rank'?'Ranked':t==='casual'?'Santai':'Party Game'}
          </button>
        ))}
      </div>
      <div style={{ padding:'8px 0' }}>
        {loading ? (
          <div style={{ padding:'24px', display:'flex', justifyContent:'center' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:24 }}>
              {[0,1,2,3,4].map(i=><div key={i} style={{ width:3, borderRadius:2, background:'rgba(0,245,255,0.4)', animation:`barB 1s ease-in-out ${i*0.12}s infinite` }}/>)}
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding:'20px', textAlign:'center', color:'#4A4A6A', fontFamily:"'JetBrains Mono',monospace", fontSize:'clamp(11px,3vw,12px)' }}>Belum ada data. Jadilah yang pertama!</div>
        ) : entries.map((e:any) => {
          const isMe = e.id === user.id;
          return (
            <div key={e.id} className="lb-row" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px clamp(16px,5vw,24px)', background: isMe ? 'rgba(0,245,255,0.04)' : undefined, flexWrap:'wrap' }}>
              <div style={{ width:20, display:'flex', justifyContent:'center', flexShrink:0 }}>{rankIcon(e.rank)}</div>
              <Avatar src={e.avatar_url} color={e.avatar_color} name={e.username} initials={e.initials} size="xs" />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:600, fontSize:'clamp(12px,3.5vw,13px)', color: isMe ? '#00F5FF' : '#F0F0FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.username}{isMe?' (kamu)':''}</div>
              </div>
              <div style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(13px,4vw,14px)', color: e.rank===1?'#FFD60A':e.rank===2?'#C0C0C0':e.rank===3?'#CD7F32':'#F0F0FF' }}>
                {tab==='pvp'?`${e.pvp_wins||0}W`:e.score?.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes barB{0%,100%{height:6px}50%{height:22px}}`}</style>
    </div>
  );
}

export default function GameDashboard({ user, onLogout, setUser }: Props) {
  const [view, setView] = useState<View>('home');
  const [isMobile, setIsMobile] = useState(false);
  const tier   = TIERS[user.rank_tier] || TIERS.bronze;
  const winRate = user.pvp_wins + user.pvp_losses > 0 ? Math.round((user.pvp_wins / (user.pvp_wins + user.pvp_losses)) * 100) : 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const refreshUser = () => {
    const tk = localStorage.getItem('token');
    if (!tk) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tk}` } })
      .then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
  };

  if (view === 'casual')      return <GameScreen mode="casual" user={user} onBack={()=>{setView('home');refreshUser();}} onGameEnd={()=>{refreshUser();setView('home');}}/>;
  if (view === 'rank')        return <GameScreen mode="rank"   user={user} onBack={()=>{setView('home');refreshUser();}} onGameEnd={()=>{refreshUser();setView('home');}}/>;
  if (view === 'pvp')         return <PVPLobby   user={user}  onBack={()=>{setView('home');refreshUser();}} setUser={setUser}/>;
  if (view === 'leaderboard') return <Leaderboard user={user} onBack={()=>setView('home')}/>;
  if (view === 'profile')     return <ProfileCard user={user} onBack={()=>{setView('home');refreshUser();}} setUser={setUser}/>;

  const STATS = [
    { label:'Skor Santai', value: user.casual_score.toLocaleString(), color:'#00F5FF', icon:<Zap size={16}/> },
    { label:'Poin Rank',  value: user.rank_score.toLocaleString(),   color:'#FFD60A', icon:<Shield size={16}/> },
    { label:'Rekor Party',   value: `${user.pvp_wins} Menang / ${user.pvp_losses} Kalah`, color:'#BF5AF2', icon:<Users size={16}/> },
    { label:'Rasio Menang',     value: `${winRate}%`, color:'#30D158', icon:<Award size={16}/> },
  ];

  const MODES = [
    { key:'casual', label:'Mode Santai', desc:'Rileks dan tebak emoji tanpa tekanan waktu. Skor tertinggi akan dicatat!', color:'#00F5FF', badge:'SANTAI', icon:<Zap size={24}/>, glow:'0 0 24px rgba(0,245,255,0.25)', hoverBorder:'rgba(0,245,255,0.35)', bg:'rgba(0,245,255,0.1)', badgeStyle:{background:'rgba(0,245,255,0.1)',color:'#00F5FF',border:'1px solid rgba(0,245,255,0.2)'} },
    { key:'rank',   label:'Mode Kompetitif', desc:`Kumpulkan LP dan capai tier tertinggi. Sekarang: ${tier.icon} ${tier.label}`, color:'#FFD60A', badge:'RANKED', icon:<Trophy size={24}/>, glow:'0 0 24px rgba(255,214,10,0.25)', hoverBorder:'rgba(255,214,10,0.35)', bg:'rgba(255,214,10,0.1)', badgeStyle:{background:'rgba(255,214,10,0.1)',color:'#FFD60A',border:'1px solid rgba(255,214,10,0.2)'} },
    { key:'pvp',    label:'Multiplayer Party',    desc:'Buat room bersama teman! 3 Tim, role pemberi clue & penebak. Seru abis!', color:'#BF5AF2', badge:'PARTY MODE', icon:<Users size={24}/>, glow:'0 0 24px rgba(191,90,242,0.25)', hoverBorder:'rgba(191,90,242,0.35)', bg:'rgba(191,90,242,0.1)', badgeStyle:{background:'rgba(191,90,242,0.1)',color:'#BF5AF2',border:'1px solid rgba(191,90,242,0.2)'} },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Navbar - Responsive */}
      <nav className="navbar" style={{ padding:'0 clamp(12px,4vw,16px)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(15px,5vw,17px)', background:'linear-gradient(135deg,#00F5FF,#0099FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>EmojiQuest</span>
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={()=>setView('home')} className={`nav-link ${view==='home'?'active':''}`} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px clamp(8px,3vw,12px)', background:'none', border:'none', cursor:'pointer', borderRadius:8, fontSize:'clamp(12px,3.5vw,14px)', fontFamily:"'General Sans',sans-serif", fontWeight:500, color:view==='home'?'#00F5FF':'#8888AA', transition:'all 0.2s' }}><Home size={16}/><span style={{ display: isMobile ? 'none' : 'inline' }}>Beranda</span></button>
          <button onClick={()=>setView('leaderboard')} className={`nav-link ${(view as string)==='leaderboard'?'active':''}`} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px clamp(8px,3vw,12px)', background:'none', border:'none', cursor:'pointer', borderRadius:8, fontSize:'clamp(12px,3.5vw,14px)', fontFamily:"'General Sans',sans-serif", fontWeight:500, color:(view as string)==='leaderboard' ? '#00F5FF' : '#8888AA', transition:'all 0.2s' }}><Trophy size={16}/><span style={{ display: isMobile ? 'none' : 'inline' }}>Papan Peringkat</span></button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>setView('profile')} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(18,18,26,0.8)', border:'1px solid rgba(42,42,62,0.9)', borderRadius:12, padding:'6px clamp(8px,3vw,12px)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,245,255,0.3)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(42,42,62,0.9)';}}>
            <Avatar src={user.avatar_url} color={user.avatar_color} name={user.username} initials={user.initials} size="xs" />
            <div style={{ display: isMobile ? 'none' : 'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <span style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:600, fontSize:13, color:'#F0F0FF', lineHeight:1 }}>{user.username}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, marginTop:2, color:tier.color }}>{tier.icon} {tier.label}</span>
            </div>
          </button>
          <button onClick={onLogout} title="Keluar" style={{ width:36, height:36, borderRadius:10, background:'rgba(18,18,26,0.8)', border:'1px solid rgba(42,42,62,0.9)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#4A4A6A', transition:'all 0.2s', flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.color='#FF2D78';e.currentTarget.style.borderColor='rgba(255,45,120,0.3)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4A4A6A';e.currentTarget.style.borderColor='rgba(42,42,62,0.9)';}}>
            <LogOut size={16}/>
          </button>
        </div>
      </nav>

      {/* Content - Responsive */}
      <div style={{ flex:1, maxWidth:1100, margin:'0 auto', width:'100%', padding:'clamp(20px,5vw,32px) clamp(12px,4vw,16px)', display:'flex', flexDirection:'column', gap:'clamp(20px,5vw,28px)' }}>
        {/* Welcome */}
        <div className="anim-slide-down">
          <h1 style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(24px,6vw,48px)', color:'#F0F0FF', lineHeight:1.1 }}>
            Selamat Datang, <span style={{ background:'linear-gradient(135deg,#00F5FF,#0099FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{user.username}</span>
          </h1>
          <p style={{ color:'#8888AA', marginTop:8, fontSize:'clamp(13px,3.5vw,14px)' }}>Pilih mode permainanmu dan raih posisi puncak di Papan Peringkat!</p>
        </div>
        
        {/* Stats - Responsive Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap:'clamp(10px,3vw,12px)' }} className="anim-slide-up">
          {STATS.map((s,i)=>(
            <div key={i} style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.055)', borderRadius:18, padding:'clamp(12px,4vw,16px) clamp(12px,4vw,20px)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, color:s.color, flexWrap:'wrap' }}>
                {s.icon}<span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'clamp(8.5px,2.5vw,9.5px)', letterSpacing:'0.15em', textTransform:'uppercase', opacity:0.7 }}>{s.label}</span>
              </div>
              <div style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(18px,5vw,22px)', color:s.color, wordBreak:'break-word' }}>{s.value}</div>
            </div>
          ))}
        </div>
        
        {/* Mini Leaderboard */}
        <MiniLeaderboard user={user} onViewAll={()=>setView('leaderboard')} />
        
        {/* Game modes - Responsive */}
        <div>
          <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(18px,5vw,20px)', color:'#F0F0FF', marginBottom:16, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <Star size={18} color="#FFD60A"/> Pilih Mode Permainan
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap:16 }}>
            {MODES.map((m,i)=>(
              <button key={i} onClick={()=>setView(m.key as View)}
                style={{ background:'rgba(26,26,38,0.85)', border:'1px solid rgba(255,255,255,0.055)', borderRadius:24, padding:'clamp(20px,5vw,28px)', textAlign:'left', cursor:'pointer', transition:'all 0.3s', display:'flex', flexDirection:'column' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=m.hoverBorder;e.currentTarget.style.boxShadow=m.glow;e.currentTarget.style.transform='translateY(-3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.055)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                  <div style={{ width:'clamp(40px,10vw,48px)', height:'clamp(40px,10vw,48px)', borderRadius:14, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', color:m.color, flexShrink:0 }}>{m.icon}</div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'clamp(8.5px,2.5vw,9.5px)', letterSpacing:'0.18em', padding:'4px 10px', borderRadius:6, alignSelf:'flex-start', ...m.badgeStyle }}>{m.badge}</span>
                </div>
                <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontWeight:700, fontSize:'clamp(18px,4.5vw,20px)', color:'#F0F0FF', marginBottom:8 }}>{m.label}</h3>
                <p style={{ color:'#8888AA', fontSize:'clamp(12px,3.5vw,13.5px)', lineHeight:1.6, marginBottom:16, flex:1 }}>{m.desc}</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:m.color, fontFamily:"'Clash Display',sans-serif", fontWeight:600, fontSize:'clamp(12px,3.5vw,13px)', flexWrap:'wrap' }}>
                  {m.key==='pvp'?'Mulai Party Game!':m.key==='rank'?'Mulai Bertanding':'Main Sekarang'} <ChevronRight size={16}/>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}