'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Zap, Users, Crown, Medal, Award, TrendingUp, Star, Home, BarChart2 } from 'lucide-react';
import type { User } from '@/app/page';
import Avatar from '@/components/Avatar';
import { BarLoader } from '@/components/LoadingStates';

interface Entry { rank:number;id:number;username:string;avatar_color:string;avatar_url?:string|null;initials?:string;rank_tier:string;score:number;total_games:number;pvp_wins?:number; }
interface Props { user: User; onBack: () => void; }
type Tab = 'rank'|'casual'|'pvp';
const TIERS:Record<string,{label:string;color:string}> = {bronze:{label:'Perunggu',color:'#CD7F32'},silver:{label:'Perak',color:'#C0C0C0'},gold:{label:'Emas',color:'#FFD700'},platinum:{label:'Platinum',color:'#E5E4E2'},diamond:{label:'Berlian',color:'#B9F2FF'},master:{label:'Master',color:'#FFD60A'}};

export default function Leaderboard({ user, onBack }: Props) {
  const [tab,     setTab]     = useState<Tab>('rank');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank,  setMyRank]  = useState<number|null>(null);

  const load=(m:Tab)=>{
    setLoading(true);
    const tk=localStorage.getItem('token');
    fetch(`/api/leaderboard?mode=${m}`,{headers:tk?{Authorization:`Bearer ${tk}`}:{}})
      .then(r=>r.json()).then(d=>{setEntries(d.entries||[]);setMyRank(d.myRank||null);setLoading(false);})
      .catch(()=>setLoading(false));
  };
  useEffect(()=>{ load(tab); },[tab]);

  const rankIcon=(r:number)=>{
    if(r===1) return <Crown size={18} color="#FFD60A"/>;
    if(r===2) return <Medal size={18} color="#C0C0C0"/>;
    if(r===3) return <Award size={18} color="#CD7F32"/>;
    return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#4A4A6A',width:18,textAlign:'center'}}>#{r}</span>;
  };

  const rowStyle=(r:number,isMe:boolean)=>({
    borderLeft:`3px solid ${r===1?'rgba(255,214,10,0.5)':r===2?'rgba(192,192,192,0.3)':r===3?'rgba(205,127,50,0.3)':isMe?'rgba(0,245,255,0.4)':'transparent'}`,
    background:r===1?'rgba(255,214,10,0.06)':r===2?'rgba(255,255,255,0.03)':r===3?'rgba(205,127,50,0.05)':isMe?'rgba(0,245,255,0.04)':'transparent',
  });

  const top3=entries.slice(0,3);
  const TABS=[
    {id:'rank'as Tab,label:'Peringkat',icon:<Trophy size={15}/>,active:{bg:'rgba(255,214,10,0.1)',color:'#FFD60A'}},
    {id:'casual'as Tab,label:'Santai',icon:<Zap size={15}/>,active:{bg:'rgba(0,245,255,0.1)',color:'#00F5FF'}},
    {id:'pvp'as Tab,label:'PVP',icon:<Users size={15}/>,active:{bg:'rgba(191,90,242,0.1)',color:'#BF5AF2'}},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column'}}>
      {/* Navbar - Fully Responsive */}
      <nav style={{
        height: 'auto',
        minHeight: 64,
        background:'rgba(10,10,15,0.92)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'12px clamp(12px,4vw,16px)',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        position:'sticky',
        top:0,
        zIndex:40,
        gap:12,
        flexWrap:'wrap'
      }}>
        {/* Logo - tetap kiri */}
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,17px)',background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>EmojiQuest</span>
        </div>

        {/* Navigasi Tengah - wrap di mobile */}
        <div style={{
          display:'flex',
          gap:4,
          flexWrap:'wrap',
          justifyContent:'center',
          order: 1
        }}>
          <button onClick={onBack} style={{
            display:'flex',
            alignItems:'center',
            gap:4,
            padding:'6px clamp(8px,3vw,14px)',
            borderRadius:8,
            border:'none',
            cursor:'pointer',
            color:'#8888AA',
            fontFamily:"'General Sans',sans-serif",
            fontWeight:500,
            fontSize:'clamp(11px,3vw,14px)',
            background:'none',
            transition:'all 0.2s'
          }} onMouseEnter={e=>{e.currentTarget.style.color='#F0F0FF';e.currentTarget.style.background='rgba(255,255,255,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.color='#8888AA';e.currentTarget.style.background='none';}}>
            <span>Beranda</span>
          </button>
          <button style={{
            display:'flex',
            alignItems:'center',
            gap:4,
            padding:'6px clamp(8px,3vw,14px)',
            borderRadius:8,
            border:'none',
            cursor:'pointer',
            color:'#00F5FF',
            fontFamily:"'General Sans',sans-serif",
            fontWeight:500,
            fontSize:'clamp(11px,3vw,14px)',
            background:'none',
            position:'relative'
          }}>
            <span>Papan Peringkat</span>
            <div style={{position:'absolute',bottom:-1,left:'50%',transform:'translateX(-50%)',width:20,height:2,background:'#00F5FF',borderRadius:1,boxShadow:'0 0 8px rgba(0,245,255,0.6)'}}/>
          </button>
        </div>

        {/* Tombol Kembali - wrap di mobile */}
        <button onClick={onBack} style={{
          display:'flex',
          alignItems:'center',
          gap:4,
          background:'none',
          border:'none',
          cursor:'pointer',
          color:'#8888AA',
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:'clamp(10px,2.5vw,11px)',
          letterSpacing:'0.1em',
          transition:'color 0.2s',
          flexShrink:0,
          padding:'6px 8px'
        }} onMouseEnter={e=>{e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.color='#8888AA';}}>
          <span>KEMBALI</span>
        </button>
      </nav>

<div style={{maxWidth:680,margin:'0 auto',width:'100%',padding:'clamp(32px,8vw,48px) clamp(12px,4vw,16px) clamp(20px,5vw,32px) clamp(12px,4vw,16px)',flex:1}}>        {/* Title - Responsive */}
        <div className="anim-slide-down" style={{marginBottom:'clamp(20px,5vw,28px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4,flexWrap:'wrap'}}>
            <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,214,10,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><TrendingUp size={20} color="#FFD60A"/></div>
            <h1 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(24px,6vw,32px)',color:'#F0F0FF',margin:0}}>Peringkat Global</h1>
          </div>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(9px,2.5vw,10.5px)',color:'#4A4A6A',letterSpacing:'0.12em',marginLeft:4}}>DIPERBARUI SECARA REAL-TIME · 50 PEMAIN TERBAIK</p>
        </div>

        {/* Podium - Responsif untuk mobile */}
{!loading&&top3.length>=3&&(
  <div className="anim-slide-up" style={{marginTop:'clamp(16px,4vw,24px)', marginBottom:24, overflowX:'auto'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:'clamp(8px,3vw,12px)',height:'clamp(140px,25vw,160px)',minWidth:280}}>
              {/* 2nd */}
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <Avatar src={top3[1]?.avatar_url} color={top3[1]?.avatar_color} name={top3[1]?.username} initials={top3[1]?.initials} size="sm" radius="12px"/>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(10px,3vw,12px)',color:'#8888AA',maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>{top3[1]?.username}</div>
                <div style={{width:'100%',background:'linear-gradient(to top,rgba(192,192,192,0.12),transparent)',borderRadius:'10px 10px 0 0',borderTop:'1px solid rgba(192,192,192,0.2)',display:'flex',alignItems:'center',justifyContent:'center',height:'clamp(60px,12vw,72px)'}}><Medal size={22} color="#C0C0C0"/></div>
              </div>
              {/* 1st */}
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <Crown size={18} color="#FFD60A" style={{animation:'float 2.5s ease-in-out infinite'}}/>
                <Avatar src={top3[0]?.avatar_url} color={top3[0]?.avatar_color} name={top3[0]?.username} initials={top3[0]?.initials} size="md" radius="14px"/>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(10px,3vw,12px)',color:'#FFD60A',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>{top3[0]?.username}</div>
                <div style={{width:'100%',background:'linear-gradient(to top,rgba(255,214,10,0.15),transparent)',borderRadius:'10px 10px 0 0',borderTop:'1px solid rgba(255,214,10,0.3)',display:'flex',alignItems:'center',justifyContent:'center',height:'clamp(80px,16vw,100px)'}}><Trophy size={26} color="#FFD60A" style={{filter:'drop-shadow(0 0 8px rgba(255,214,10,0.5))'}}/></div>
              </div>
              {/* 3rd */}
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <Avatar src={top3[2]?.avatar_url} color={top3[2]?.avatar_color} name={top3[2]?.username} initials={top3[2]?.initials} size="sm" radius="12px"/>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'clamp(10px,3vw,12px)',color:'#8888AA',maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>{top3[2]?.username}</div>
                <div style={{width:'100%',background:'linear-gradient(to top,rgba(205,127,50,0.12),transparent)',borderRadius:'10px 10px 0 0',borderTop:'1px solid rgba(205,127,50,0.2)',display:'flex',alignItems:'center',justifyContent:'center',height:'clamp(40px,8vw,48px)'}}><Award size={18} color="#CD7F32"/></div>
              </div>
            </div>
          </div>
        )}

        {/* My rank - Responsive */}
        {myRank&&(
          <div style={{background:'rgba(26,26,38,0.85)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'clamp(10px,3vw,12px) clamp(12px,4vw,20px)',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <Avatar src={user.avatar_url} color={user.avatar_color} name={user.username} initials={user.initials} size="xs"/>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,3.5vw,14px)',color:'#F0F0FF'}}>{user.username} <span style={{color:'#4A4A6A',fontWeight:400}}>(kamu)</span></div>
            </div>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(16px,4.5vw,18px)',background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>#{myRank}</div>
          </div>
        )}

        {/* Tabs - Responsive */}
        <div style={{display:'flex',gap:8,padding:6,background:'rgba(18,18,26,0.8)',borderRadius:14,marginBottom:20,flexWrap:'wrap'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'clamp(8px,3vw,10px) clamp(10px,3vw,16px)',borderRadius:10,border:'none',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(12px,3.5vw,13px)',transition:'all 0.2s',minWidth:'fit-content',...(tab===t.id?t.active:{background:'none',color:'#4A4A6A'})}}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* List - Responsive */}
        <div style={{background:'rgba(26,26,38,0.85)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:20,overflow:'hidden'}}>
          {loading?(
            <div style={{padding:'48px 0',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <BarLoader color={tab==='rank'?'#FFD60A':tab==='casual'?'#00F5FF':'#BF5AF2'} />
            </div>
          ):entries.length===0?(
            <div style={{padding:'48px 0',textAlign:'center',color:'#4A4A6A',fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(12px,3vw,13px)'}}>Belum ada data. Jadilah yang pertama!</div>
          ):(
            <div style={{}}>
              {entries.map((e,i)=>{
                const isMe=e.id===user.id;
                const tier=TIERS[e.rank_tier]||TIERS.bronze;
                const val=tab==='pvp'?(e.pvp_wins||0):e.score;
                return (
                  <div key={e.id} className="lb-row" style={{display:'flex',alignItems:'center',gap:'clamp(8px,3vw,14px)',padding:'clamp(10px,3vw,14px) clamp(12px,4vw,20px)',borderBottom:i<entries.length-1?'1px solid rgba(255,255,255,0.04)':'none',flexWrap:'wrap',...rowStyle(e.rank,isMe)}}>
                    <div style={{width:22,display:'flex',justifyContent:'center',flexShrink:0}}>{rankIcon(e.rank)}</div>
                    <Avatar src={e.avatar_url} color={e.avatar_color} name={e.username} initials={e.initials} size="sm" radius="10px"/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:'clamp(13px,3.5vw,14px)',color:isMe?'#00F5FF':'#F0F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.username}{isMe?' (kamu)':''}</div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2,flexWrap:'wrap'}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(9px,2.5vw,10px)',color:tier.color}}>{tier.label}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(9px,2.5vw,10px)',color:'#4A4A6A'}}>{e.total_games} permainan</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:'clamp(14px,4vw,16px)',color:e.rank===1?'#FFD60A':e.rank===2?'#C0C0C0':e.rank===3?'#CD7F32':isMe?'#00F5FF':'#F0F0FF'}}>{val.toLocaleString()}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'clamp(8px,2.5vw,9.5px)',color:'#4A4A6A',marginTop:1}}>{tab==='pvp'?'kemenangan':'poin'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}