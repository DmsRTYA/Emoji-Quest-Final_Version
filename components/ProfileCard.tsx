'use client';
import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Camera, FolderOpen, X, Check, AlertCircle, TrendingUp, Trophy, Zap, Users, Shield, Star, Award } from 'lucide-react';
import type { User } from '@/app/page';
import Avatar from '@/components/Avatar';

interface Props { user: User; onBack: () => void; setUser: (u: User) => void; }

const TIER_CFG: Record<string,{label:string;color:string;next:string;nextLabel:string;min:number;max:number}> = {
  bronze:   {label:'Bronze',   color:'#CD7F32',next:'silver',  nextLabel:'Silver',   min:0,    max:500},
  silver:   {label:'Silver',   color:'#C0C0C0',next:'gold',    nextLabel:'Gold',     min:500,  max:1200},
  gold:     {label:'Gold',     color:'#FFD700',next:'platinum',nextLabel:'Platinum', min:1200, max:2200},
  platinum: {label:'Platinum', color:'#E5E4E2',next:'diamond', nextLabel:'Diamond',  min:2200, max:3500},
  diamond:  {label:'Diamond',  color:'#B9F2FF',next:'master',  nextLabel:'Master',   min:3500, max:5000},
  master:   {label:'Master',   color:'#FFD60A',next:'master',  nextLabel:'MAX',      min:5000, max:5000},
};

const COLORS = ['#00F5FF','#BF5AF2','#FFD60A','#FF2D78','#30D158','#FF9F0A','#0A84FF','#64D2FF','#FF6961','#B388FF','#FFCDD2','#E8F5E9'];

export default function ProfileCard({ user, onBack, setUser }: Props) {
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  const [uploadOk,     setUploadOk]     = useState(false);
  const [colorLoading, setColorLoading] = useState('');
  const [preview,      setPreview]      = useState<string|null>(null);
  const [showMenu,     setShowMenu]     = useState(false);
  const [cameraOn,     setCameraOn]     = useState(false);
  const fileRef   = useRef<HTMLInputElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);

  const tier = TIER_CFG[user.rank_tier] || TIER_CFG.bronze;
  const winRate = user.pvp_wins+user.pvp_losses>0 ? Math.round((user.pvp_wins/(user.pvp_wins+user.pvp_losses))*100) : 0;
  const progress = tier.max>tier.min ? Math.min(100,Math.round(((user.rank_score-tier.min)/(tier.max-tier.min))*100)) : 100;
  const tk = ()=>localStorage.getItem('token')||'';

  /* ── Upload photo ── */
  const uploadAvatar = useCallback(async(base64:string)=>{
    setUploading(true); setUploadError(''); setUploadOk(false);
    try{
      const res=await fetch('/api/auth/upload-avatar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk()}`},body:JSON.stringify({avatar_data:base64})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Upload failed');
      setUser({...user,avatar_url:base64});
      setPreview(null); setUploadOk(true);
      setTimeout(()=>setUploadOk(false),2500);
    }catch(e:any){ setUploadError(e.message); }
    finally{ setUploading(false); }
  },[user,setUser]);

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>2_000_000){setUploadError('Image too large (max 2MB)');return;}
    const r=new FileReader(); r.onload=ev=>setPreview(ev.target?.result as string); r.readAsDataURL(f);
    setShowMenu(false); e.target.value='';
  };

  const openCamera=async()=>{
    setShowMenu(false); setUploadError('');
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});
      streamRef.current=stream; setCameraOn(true);
      setTimeout(()=>{ if(videoRef.current){videoRef.current.srcObject=stream; videoRef.current.play();} },80);
    }catch{ setUploadError('Camera permission denied or not available.'); }
  };

  const capture=()=>{
    const v=videoRef.current,c=canvasRef.current; if(!v||!c) return;
    c.width=v.videoWidth; c.height=v.videoHeight;
    c.getContext('2d')?.drawImage(v,0,0);
    const d=c.toDataURL('image/jpeg',0.85);
    stopCamera(); setPreview(d);
  };

  const stopCamera=()=>{
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current=null; setCameraOn(false);
  };

  /* ── Avatar color ── */
  const updateColor=async(color:string)=>{
    setColorLoading(color);
    try{
      const res=await fetch('/api/auth/update-avatar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk()}`},body:JSON.stringify({avatar_color:color})});
      if(res.ok){ setUser({...user,avatar_color:color}); }
    }catch{}
    finally{ setColorLoading(''); }
  };

  const STATS=[
    {label:'Casual Score',value:user.casual_score.toLocaleString(),color:'#00F5FF',bg:'rgba(0,245,255,0.08)',icon:<Zap size={18}/>},
    {label:'Rank Points', value:user.rank_score.toLocaleString(),  color:'#FFD60A',bg:'rgba(255,214,10,0.08)',icon:<Trophy size={18}/>},
    {label:'PVP Wins',    value:user.pvp_wins.toString(),           color:'#BF5AF2',bg:'rgba(191,90,242,0.08)',icon:<Users size={18}/>},
    {label:'Win Rate',    value:`${winRate}%`,                      color:'#30D158',bg:'rgba(48,209,88,0.08)', icon:<TrendingUp size={18}/>},
    {label:'Total Games', value:user.total_games.toString(),        color:'#FF9F0A',bg:'rgba(255,159,10,0.08)',icon:<Star size={18}/>},
    {label:'PVP Losses',  value:user.pvp_losses.toString(),         color:'#8888AA',bg:'rgba(136,136,170,0.08)',icon:<Shield size={18}/>},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column'}}>
      {/* Nav */}
      <nav style={{height:64,background:'rgba(10,10,15,0.92)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px',display:'flex',alignItems:'center'}}>
        <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#8888AA',fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:'0.1em',marginRight:16,transition:'color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.color='#8888AA';}}><ArrowLeft size={18}/> BACK</button>
        <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:17,color:'#F0F0FF'}}>My Profile</span>
      </nav>

      <div style={{maxWidth:560,margin:'0 auto',width:'100%',padding:'32px 16px',display:'flex',flexDirection:'column',gap:16}}>

        {/* ── Avatar Card ── */}
        <div style={{background:'rgba(22,22,34,0.97)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:24,overflow:'hidden'}}>
          <div style={{height:3,background:'linear-gradient(90deg,#00F5FF,#BF5AF2,#FFD60A)'}}/>
          <div style={{padding:'28px 24px',textAlign:'center'}}>

            {/* Camera view */}
            {cameraOn&&(
              <div style={{position:'relative',marginBottom:20,borderRadius:16,overflow:'hidden',background:'#000'}}>
                <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',maxHeight:240,objectFit:'cover',display:'block'}}/>
                <canvas ref={canvasRef} style={{display:'none'}}/>
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px',display:'flex',justifyContent:'center',gap:10,background:'linear-gradient(to top,rgba(0,0,0,0.7),transparent)'}}>
                  <button onClick={capture} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:12,background:'linear-gradient(135deg,#FFD60A,#FF9F0A)',border:'none',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:13,color:'#0A0A0F'}}><Camera size={15}/> Capture</button>
                  <button onClick={stopCamera} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,color:'#F0F0FF'}}><X size={15}/> Cancel</button>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview&&!cameraOn&&(
              <div style={{marginBottom:20,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                <p style={{fontFamily:"'General Sans',sans-serif",fontSize:13,color:'#8888AA'}}>Preview — looks good?</p>
                <img src={preview} alt="preview" style={{width:96,height:96,borderRadius:20,objectFit:'cover',border:'3px solid rgba(0,245,255,0.3)'}}/>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>uploadAvatar(preview)} disabled={uploading} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:12,background:'linear-gradient(135deg,#FFD60A,#FF9F0A)',border:'none',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:13,color:'#0A0A0F',opacity:uploading?0.6:1}}>
                    {uploading?<><div style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(10,10,15,0.3)',borderTopColor:'#0A0A0F',animation:'spin 0.75s linear infinite'}}/> Uploading...</>:<><Check size={15}/> Use this photo</>}
                  </button>
                  <button onClick={()=>setPreview(null)} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,color:'#F0F0FF'}}><X size={15}/> Cancel</button>
                </div>
              </div>
            )}

            {/* Normal avatar display */}
            {!cameraOn&&!preview&&(
              <>
                <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
                  <Avatar src={user.avatar_url} color={user.avatar_color} name={user.username} initials={user.initials} size="xl" radius="22px" />
                  <div style={{position:'absolute',bottom:-6,right:-6,width:28,height:28,borderRadius:'50%',background:tier.color,border:'2px solid #0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
                    {user.rank_tier==='master'?'👑':user.rank_tier==='diamond'?'💠':user.rank_tier==='platinum'?'💎':user.rank_tier==='gold'?'🥇':user.rank_tier==='silver'?'🥈':'🥉'}
                  </div>
                </div>
                <h2 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:24,color:'#F0F0FF',margin:'0 0 4px'}}>{user.username}</h2>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#4A4A6A',marginBottom:8}}>{user.email}</p>
                <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:20,marginBottom:20,background:`${tier.color}22`,color:tier.color}}>
                  <span style={{background:`${tier.color}22`,color:tier.color,padding:'4px 14px',borderRadius:20,fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:'0.1em',display:'inline-flex',alignItems:'center',gap:6}}>
                    <Award size={12}/> {tier.label} Tier
                  </span>
                </div>

                {/* Upload button */}
                <div style={{position:'relative',display:'inline-block'}}>
                  <button onClick={()=>setShowMenu(m=>!m)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(0,245,255,0.08)',border:'1px solid rgba(0,245,255,0.25)',cursor:'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,color:'#00F5FF',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,245,255,0.14)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,245,255,0.08)';}}>
                    <Camera size={15}/> Change Photo
                  </button>
                  {showMenu&&(
                    <div className="anim-slide-down" style={{position:'absolute',top:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',width:220,background:'rgba(22,22,34,0.98)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,0.5)',zIndex:20}}>
                      <button onClick={openCamera} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'14px 18px',background:'none',border:'none',borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',color:'#8888AA',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,transition:'all 0.2s',textAlign:'left'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#8888AA';}}>
                        <Camera size={16} color="#00F5FF"/> Take a photo
                      </button>
                      <button onClick={()=>{fileRef.current?.click();setShowMenu(false);}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'14px 18px',background:'none',border:'none',cursor:'pointer',color:'#8888AA',fontFamily:"'Clash Display',sans-serif",fontWeight:600,fontSize:13,transition:'all 0.2s',textAlign:'left'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#8888AA';}}>
                        <FolderOpen size={16} color="#BF5AF2"/> Choose from gallery
                      </button>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
              </>
            )}

            {/* Upload feedback */}
            {uploadOk&&<div className="anim-fade-in" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'#30D158',fontSize:13,fontFamily:"'General Sans',sans-serif",marginTop:12}}><Check size={15}/> Photo updated!</div>}
            {uploadError&&<div className="anim-fade-in" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'#FF2D78',fontSize:13,fontFamily:"'General Sans',sans-serif",marginTop:12}}><AlertCircle size={15}/> {uploadError}</div>}

            {/* Rank progress */}
            {!cameraOn&&!preview&&user.rank_tier!=='master'&&(
              <div style={{marginTop:24}}>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:'#4A4A6A',marginBottom:8}}>
                  <span>{tier.label}</span><span>{progress}%</span><span>{tier.nextLabel}</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:3,transition:'width 0.6s ease',background:`linear-gradient(90deg,${tier.color},${TIER_CFG[tier.next]?.color||tier.color})`,width:`${progress}%`}}/>
                </div>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'#4A4A6A',marginTop:6}}>{tier.max-user.rank_score} pts to {tier.nextLabel}</p>
              </div>
            )}
            {!cameraOn&&!preview&&user.rank_tier==='master'&&(
              <div style={{marginTop:20,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#FFD60A',letterSpacing:'0.2em',animation:'pulse 2s ease-in-out infinite'}}>⚡ MAX RANK ACHIEVED ⚡</div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {STATS.map((s,i)=>(
            <div key={i} style={{background:'rgba(26,26,38,0.85)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:18,padding:'16px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:s.bg,color:s.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{s.icon}</div>
              <div>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:20,color:s.color}}>{s.value}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:'#4A4A6A',letterSpacing:'0.1em',marginTop:1}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Avatar Color Picker ── */}
        <div style={{background:'rgba(26,26,38,0.85)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:20,padding:'20px 24px'}}>
          <h3 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:16,color:'#F0F0FF',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
            <Star size={16} color="#FFD60A"/> Avatar Color
          </h3>
          <p style={{fontFamily:"'General Sans',sans-serif",fontSize:12,color:'#4A4A6A',marginBottom:16}}>Warna yang ditampilkan saat tidak ada foto profil</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            {COLORS.map(c=>(
              <button key={c} onClick={()=>updateColor(c)} title={c}
                style={{width:38,height:38,borderRadius:12,background:c,border:`2px solid ${user.avatar_color===c?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',transform:user.avatar_color===c?'scale(1.15)':'scale(1)',boxShadow:user.avatar_color===c?`0 0 14px ${c}88`:'none'}}
                onMouseEnter={e=>{if(user.avatar_color!==c){e.currentTarget.style.transform='scale(1.1)';}}}
                onMouseLeave={e=>{e.currentTarget.style.transform=user.avatar_color===c?'scale(1.15)':'scale(1)';}}>
                {colorLoading===c&&<div style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(10,10,15,0.4)',borderTopColor:'#0A0A0F',animation:'spin 0.75s linear infinite'}}/>}
                {user.avatar_color===c&&!colorLoading&&<Check size={16} color="#0A0A0F" strokeWidth={3}/>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
