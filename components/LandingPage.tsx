'use client';
import { useState, useEffect } from 'react';
import { Trophy, Zap, Users, Star, ChevronRight, Sparkles, User as UserIcon } from 'lucide-react';

interface Props { onOpenAuth: (mode: 'login'|'register') => void; onGuestLogin?: () => void; }
const PARTICLES = ['🎯','⭐','💎','🏆','🎮','🌟','💫','🎭','🎲','🔮','✨','🎪'];
const FEATURES = [
  { icon:<Zap size={24}/>, title:'Mode Santai', desc:'Santai dan tebak emoji sesuai keinginanmu. Tidak ada tekanan, murni seru!', accent:'#00F5FF', badge:'CHILL', hover:'rgba(0,245,255,0.06)', hoverBorder:'rgba(0,245,255,0.35)', badgeStyle:{background:'rgba(0,245,255,0.1)',color:'#00F5FF',border:'1px solid rgba(0,245,255,0.2)'}, iconBg:'rgba(0,245,255,0.12)' },
  { icon:<Trophy size={24}/>, title:'Mode Peringkat', desc:'Kumpulkan LP dan naiki tier dari Perunggu hingga Master. Setiap game menambah poin!', accent:'#FFD60A', badge:'RANKED', hover:'rgba(255,214,10,0.06)', hoverBorder:'rgba(255,214,10,0.35)', badgeStyle:{background:'rgba(255,214,10,0.1)',color:'#FFD60A',border:'1px solid rgba(255,214,10,0.2)'}, iconBg:'rgba(255,214,10,0.12)' },
  { icon:<Users size={24}/>, title:'Mode PVP', desc:'Duel real-time 1v1 via WebSocket. Siapa yang lebih cepat menjawab, dialah pemenangnya!', accent:'#BF5AF2', badge:'PVP', hover:'rgba(191,90,242,0.06)', hoverBorder:'rgba(191,90,242,0.35)', badgeStyle:{background:'rgba(191,90,242,0.1)',color:'#BF5AF2',border:'1px solid rgba(191,90,242,0.2)'}, iconBg:'rgba(191,90,242,0.12)' },
];
const STATS=[{v:'60+',l:'Teka-teki Emoji'},{v:'10',l:'Kategori'},{v:'3',l:'Mode Game'},{v:'∞',l:'Play Tanpa Batas'}];

export default function LandingPage({ onOpenAuth, onGuestLogin }: Props) {
  const [particles, setParticles] = useState<any[]>([]);
  const [heroEmojis, setHeroEmojis] = useState(['🎯','🏆','🎮','⭐','🌟']);
  const [hovered, setHovered] = useState<number|null>(null);

  useEffect(()=>{
    setParticles(Array.from({length:12},(_,i)=>({id:i,emoji:PARTICLES[i%PARTICLES.length],x:Math.random()*100,delay:Math.random()*10,dur:10+Math.random()*8})));
    const iv=setInterval(()=>setHeroEmojis(prev=>{const n=[...prev];n[Math.floor(Math.random()*n.length)]=PARTICLES[Math.floor(Math.random()*PARTICLES.length)];return n;}),1600);
    return()=>clearInterval(iv);
  },[]);

  return (
    <div style={{minHeight:'100vh',position:'relative',overflow:'hidden'}}>
      {/* Partikel */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden'}}>
        {particles.map(p=>(
          <div key={p.id} className="particle" style={{left:`${p.x}%`,fontSize:22,opacity:0.15,animationDuration:`${p.dur}s`,animationDelay:`${p.delay}s`}}>{p.emoji}</div>
        ))}
      </div>
      {/* Navigasi */}
      <nav className="navbar" style={{padding:'0 clamp(12px,4vw,24px)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:10,flexWrap:'wrap',gap:'clamp(8px,2vw,16px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'clamp(6px,2vw,10px)'}}>
          <div style={{width:'clamp(28px,6vw,36px)',height:'clamp(28px,6vw,36px)',borderRadius:10,background:'linear-gradient(135deg,#00F5FF,#BF5AF2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={18} color="white"/></div>
          <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,3vw,18px)',background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>EmojiQuest</span>
        </div>
        <div style={{display:'flex',gap:'clamp(6px,1vw,10px)',flexWrap:'wrap'}}>
          <button onClick={()=>onOpenAuth('login')} style={{padding:'clamp(8px,2vw,10px) clamp(12px,3vw,20px)',borderRadius:12,background:'rgba(0,245,255,0.08)',border:'1px solid rgba(0,245,255,0.3)',color:'#00F5FF',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(11px,2vw,14px)',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,245,255,0.14)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,245,255,0.08)';}}>Masuk</button>
          <button onClick={()=>onOpenAuth('register')} style={{padding:'clamp(8px,2vw,10px) clamp(12px,3vw,20px)',borderRadius:12,background:'linear-gradient(135deg,#FFD60A,#FF9F0A)',border:'none',color:'#0A0A0F',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(11px,2vw,14px)',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 4px 14px rgba(255,214,10,0.25)'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(255,214,10,0.4)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 14px rgba(255,214,10,0.25)';}}>Main Gratis</button>
        </div>
      </nav>
      {/* Hero */}
      <section style={{maxWidth:1100,margin:'0 auto',padding:'clamp(40px,10vw,80px) clamp(12px,4vw,24px) clamp(50px,10vw,100px)',textAlign:'center',position:'relative',zIndex:1}}>
        {/* Lencana */}
        <div style={{display:'inline-flex',alignItems:'center',gap:'clamp(6px,2vw,10px)',padding:'clamp(6px,1.5vw,8px) clamp(12px,3vw,20px)',borderRadius:30,background:'rgba(0,245,255,0.07)',border:'1px solid rgba(0,245,255,0.2)',marginBottom:'clamp(16px,4vw,32px)'}}>
          <div style={{width:'clamp(6px,1.5vw,8px)',height:'clamp(6px,1.5vw,8px)',borderRadius:'50%',background:'#00F5FF',animation:'pulse 2s ease-in-out infinite'}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(9px,2vw,11px)',color:'#00F5FF',letterSpacing:'0.18em',textTransform:'uppercase'}}>Game Emoji Multiplayer Real-time</span>
        </div>
        {/* Judul Utama */}
        <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(32px,8vw,80px)',lineHeight:0.95,marginBottom:'clamp(12px,3vw,24px)'}}>
          <span style={{display:'block',color:'#F0F0FF'}}>Pecahkan</span>
          <span className="gt-rainbow" style={{display:'block',marginTop:'clamp(4px,1.5vw,8px)',filter:'drop-shadow(0 0 30px rgba(0,245,255,0.2))'}}>Bahasa Emoji</span>
        </h1>
        <p style={{color:'#8888AA',fontSize:'clamp(13px,2.5vw,20px)',maxWidth:'clamp(280px,90vw,580px)',margin:'0 auto clamp(24px,5vw,48px)',lineHeight:1.6,padding:'0 clamp(8px,2vw,16px)'}}>
          Game tebak emoji paling adiktif. Bertanding secara real-time, naiki tangga peringkat, dan buktikan kamu fasih berbahasa emoji.
        </p>
        {/* Tombol Aksi */}
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:'clamp(8px,2vw,12px)',marginBottom:'clamp(32px,8vw,64px)'}}>
          <button onClick={()=>onOpenAuth('register')} style={{display:'flex',alignItems:'center',gap:'clamp(6px,1.5vw,10px)',padding:'clamp(12px,2.5vw,16px) clamp(20px,4vw,32px)',borderRadius:18,background:'linear-gradient(135deg,#FFD60A,#FF9F0A)',border:'none',color:'#0A0A0F',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,2vw,17px)',cursor:'pointer',boxShadow:'0 4px 20px rgba(255,214,10,0.3)',transition:'all 0.25s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(255,214,10,0.45)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(255,214,10,0.3)';}}>
            <Star size={20}/> Mulai Main Gratis <ChevronRight size={20}/>
          </button>
          <button onClick={()=>onOpenAuth('login')} style={{padding:'clamp(12px,2.5vw,16px) clamp(20px,4vw,32px)',borderRadius:18,background:'rgba(0,245,255,0.08)',border:'1px solid rgba(0,245,255,0.3)',color:'#00F5FF',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(14px,2vw,17px)',cursor:'pointer',transition:'all 0.25s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,245,255,0.14)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,245,255,0.08)';}}>Masuk ke Akun</button>
          {onGuestLogin && (
            <button onClick={onGuestLogin} style={{display:'flex',alignItems:'center',gap:8,padding:'clamp(12px,2.5vw,16px) clamp(20px,4vw,32px)',borderRadius:18,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#F0F0FF',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(14px,2vw,17px)',cursor:'pointer',transition:'all 0.25s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';}}>
              <UserIcon size={20}/> Coba Sebagai Tamu
            </button>
          )}
        </div>
        {/* Tampilan emoji */}
        <div style={{position:'relative',display:'inline-block',marginBottom:'clamp(32px,8vw,80px)',maxWidth:'90vw',overflow:'hidden'}}>
          <div className="neon-border" style={{borderRadius:28}}>
            <div style={{background:'#1A1A26',borderRadius:26,padding:'clamp(16px,3vw,24px) clamp(20px,4vw,40px)',display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(16px,3vw,28px)',flexWrap:'wrap'}}>
              {heroEmojis.map((em,i)=>(
                <span key={i} style={{fontSize:'clamp(36px,6vw,60px)',display:'inline-block',userSelect:'none',animation:`float ${2.2+i*0.3}s ease-in-out ${i*0.22}s infinite`,filter:'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',flexShrink:0}}>{em}</span>
              ))}
            </div>
          </div>
        </div>
        {/* Statistik */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(clamp(140px,40vw,240px),1fr))',gap:'clamp(8px,2vw,12px)',maxWidth:'clamp(280px,90vw,500px)',margin:'0 auto clamp(40px,8vw,80px)'}}>
          {STATS.map((s,i)=>(
            <div key={i} style={{background:'rgba(26,26,38,0.8)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:18,padding:'clamp(12px,2vw,20px)',textAlign:'center'}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(24px,5vw,32px)',background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{s.v}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(8px,1.5vw,10px)',color:'#4A4A6A',letterSpacing:'0.18em',textTransform:'uppercase',marginTop:'clamp(2px,0.5vw,4px)'}}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Kartu fitur */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(clamp(240px,90vw,280px),1fr))',gap:'clamp(12px,2vw,20px)'}}>
          {FEATURES.map((f,i)=>(
            <div key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
              style={{background:'rgba(26,26,38,0.85)',border:`1px solid ${hovered===i?f.hoverBorder:'rgba(255,255,255,0.055)'}`,borderRadius:24,padding:'clamp(16px,3vw,28px)',textAlign:'left',transition:'all 0.3s',transform:hovered===i?'translateY(-4px)':'none',boxShadow:hovered===i?`0 16px 48px rgba(0,0,0,0.3)`:undefined}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'clamp(12px,2vw,20px)'}}>
                <div style={{width:'clamp(40px,8vw,48px)',height:'clamp(40px,8vw,48px)',borderRadius:14,background:f.iconBg,display:'flex',alignItems:'center',justifyContent:'center',color:f.accent}}>{f.icon}</div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(8px,1.5vw,9.5px)',letterSpacing:'0.18em',textTransform:'uppercase',padding:'clamp(2px,0.5vw,4px) clamp(6px,1.5vw,10px)',borderRadius:6,...f.badgeStyle}}>{f.badge}</span>
              </div>
              <h3 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(16px,3.5vw,20px)',color:'#F0F0FF',marginBottom:'clamp(4px,1vw,8px)'}}>{f.title}</h3>
              <p style={{color:'#8888AA',fontSize:'clamp(12px,2.5vw,14px)',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer style={{textAlign:'center',padding:'clamp(12px,3vw,24px)',borderTop:'1px solid rgba(255,255,255,0.05)',color:'#4A4A6A',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(9px,1.5vw,11px)',letterSpacing:'0.1em'}}>
        EMOJIQUEST © 2025 — Next.js · WebSocket · MySQL · Google OAuth
      </footer>
    </div>
  );
}