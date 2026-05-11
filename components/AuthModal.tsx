'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { User as UserType } from '@/app/page';

interface Props {
  mode: 'login' | 'register'; onClose: () => void;
  onLogin: (u: UserType, token: string) => void; onSwitchMode: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: { initialize:(c:any)=>void; prompt:(cb?:any)=>void; } } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0, display:'block' }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Field({ label,type,value,onChange,placeholder,Icon,required,minLength,maxLength,autoComplete,suffix }:
  { label:string;type:string;value:string;onChange:(v:string)=>void;placeholder:string;
    Icon:any;required?:boolean;minLength?:number;maxLength?:number;autoComplete?:string;suffix?:React.ReactNode }) {
  const [focused,setFocused]=useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'#4A4A6A', fontWeight:500 }}>{label}</label>
      <div style={{ position:'relative', display:'flex', alignItems:'center', height:50,
        background: focused ? 'rgba(0,245,255,0.06)' : 'rgba(14,14,22,0.95)',
        border: `1.5px solid ${focused ? 'rgba(0,245,255,0.6)' : 'rgba(42,42,62,0.9)'}`,
        borderRadius:12, boxShadow: focused ? '0 0 0 3px rgba(0,245,255,0.09)' : 'none', transition:'all 0.2s' }}>
        <div style={{ position:'absolute', left:15, display:'flex', alignItems:'center', color: focused ? '#00F5FF' : '#4A4A6A', transition:'color 0.2s', pointerEvents:'none', width:18, height:18 }}>
          <Icon size={16} />
        </div>
        <input type={type} value={value} placeholder={placeholder} required={required} minLength={minLength} maxLength={maxLength} autoComplete={autoComplete}
          onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ flex:1, height:'100%', background:'transparent', border:'none', outline:'none', paddingLeft:44, paddingRight: suffix ? 48 : 16, fontFamily:"'General Sans',sans-serif", fontSize:15, color:'#F0F0FF' }} />
        {suffix && <div style={{ position:'absolute', right:14, display:'flex', alignItems:'center' }}>{suffix}</div>}
      </div>
    </div>
  );
}

export default function AuthModal({ mode, onClose, onLogin, onSwitchMode }: Props) {
  const [username,setUsername]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPass,setShowPass]=useState(false);
  const [loading,setLoading]=useState(false);
  const [gLoading,setGLoading]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [gHover,setGHover]=useState(false);
  const gInit=useRef(false);

  useEffect(()=>{ setError(''); setSuccess(''); setUsername(''); setEmail(''); setPassword(''); setShowPass(false); },[mode]);

  /* Mendengarkan postMessage dari callback popup */
  useEffect(()=>{
    const handler=(e:MessageEvent)=>{
      if(e.origin!==window.location.origin||!e.data)return;
      if(e.data.type==='GOOGLE_AUTH_SUCCESS'){const{token,user}=e.data.payload||{};if(token&&user)onLogin(user,token);}
      if(e.data.type==='GOOGLE_AUTH_ERROR'){setGLoading(false);setError(e.data.error||'Login Google gagal');}
    };
    window.addEventListener('message',handler);
    return()=>window.removeEventListener('message',handler);
  },[onLogin]);

  /* Memuat GIS SDK */
  useEffect(()=>{
    if(!CLIENT_ID||document.getElementById('gsi-script'))return;
    const s=document.createElement('script');
    s.id='gsi-script'; s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true;
    document.head.appendChild(s);
  },[]);

  const handleGoogleClick=()=>{
    if(!CLIENT_ID){setError('Google Client ID belum dikonfigurasi di .env.local');return;}
    setError(''); setGLoading(true);

    const tryPrompt=()=>{
      if(window.google&&!gInit.current){
        window.google.accounts.id.initialize({ client_id:CLIENT_ID, callback:handleGoogleCred, auto_select:false, cancel_on_tap_outside:true });
        gInit.current=true;
      }
      if(window.google){
        window.google.accounts.id.prompt((n:any)=>{
          if(n.isNotDisplayed()||n.isSkippedMoment()) openPopup();
        });
      } else { openPopup(); }
    };

    if(window.google) tryPrompt();
    else{ const s=document.getElementById('gsi-script'); if(s) s.addEventListener('load',tryPrompt,{once:true}); else openPopup(); }
  };

  const openPopup=()=>{
    const appUrl=process.env.NEXT_PUBLIC_APP_URL||window.location.origin;
    const params=new URLSearchParams({
      client_id:CLIENT_ID, redirect_uri:`${appUrl}/api/auth/google/callback`,
      response_type:'code', scope:'openid email profile', access_type:'offline', prompt:'select_account',
    });
    const w=520,h=640,left=Math.round(window.screenX+(window.outerWidth-w)/2),top=Math.round(window.screenY+(window.outerHeight-h)/2);
    const popup=window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`,'google-oauth',`width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);
    if(!popup){setGLoading(false);setError('Popup diblokir browser. Izinkan popup untuk domain ini.');return;}
    const mon=setInterval(()=>{ if(popup.closed){clearInterval(mon);setGLoading(false);} },600);
  };

  const handleGoogleCred=async(resp:{credential:string})=>{
    setGLoading(true); setError('');
    try{
      const res=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:resp.credential})});
      const data=await res.json();
      if(!res.ok)setError(data.error||'Login Google gagal');
      else onLogin(data.user,data.token);
    }catch{setError('Error jaringan.');}
    finally{setGLoading(false);}
  };

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try{
      const ep=mode==='login'?'/api/auth/login':'/api/auth/register';
      const body=mode==='login'?{email,password}:{username,email,password};
      const res=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json();
      if(!res.ok)setError(data.error||'Terjadi kesalahan');
      else if(mode==='register'){setSuccess('Akun berhasil dibuat! Masuk...');setTimeout(()=>onLogin(data.user,data.token),900);}
      else onLogin(data.user,data.token);
    }catch{setError('Error jaringan.');}
    finally{setLoading(false);}
  };

  const EyeBtn=(<button type="button" onClick={()=>setShowPass(v=>!v)} style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'#4A4A6A',display:'flex',alignItems:'center',width:24,height:24,transition:'color 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.color='#9999BB')} onMouseLeave={e=>(e.currentTarget.style.color='#4A4A6A')}>{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button>);

  return (
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(10,10,15,0.9)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)'}} onClick={onClose}>
      <div className="anim-bounce-in" style={{width:'100%',maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{background:'rgba(18,18,28,0.98)',borderRadius:24,border:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 40px 80px rgba(0,0,0,0.7)',overflow:'hidden'}}>
          <div style={{height:3,background:'linear-gradient(90deg,#00F5FF,#BF5AF2,#FFD60A)'}}/>
          {/* Header */}
          <div style={{padding:'26px 28px 16px',position:'relative'}}>
            <button onClick={onClose} style={{position:'absolute',top:18,right:18,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6666AA',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='#F0F0FF';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#6666AA';}}><X size={15}/></button>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:18,background:'linear-gradient(135deg,#00F5FF,#0099FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>EmojiQuest</span>
            </div>
            <h2 style={{fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:25,color:'#F0F0FF',margin:0,lineHeight:1.15}}>{mode==='login'?'Selamat datang kembali!':'Buat akun'}</h2>
            <p style={{color:'#7777A0',fontSize:14,marginTop:7,lineHeight:1.5}}>{mode==='login'?'Masuk untuk melanjutkan petualanganmu':'Bergabunglah dengan ribuan master emoji'}</p>
          </div>
          {/* Body */}
          <div style={{padding:'4px 28px 28px',display:'flex',flexDirection:'column',gap:16}}>
            {/* Tombol Google */}
            {gLoading?(
              <div style={{width:'100%',height:50,borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.15)',borderTopColor:'#00F5FF',animation:'spin 0.75s linear infinite'}}/>
                <span style={{color:'#8888AA',fontSize:14,fontFamily:"'General Sans',sans-serif"}}>Menghubungkan ke Google...</span>
              </div>
            ):(
              <button type="button" onClick={handleGoogleClick} onMouseEnter={()=>setGHover(true)} onMouseLeave={()=>setGHover(false)}
                style={{width:'100%',height:50,display:'flex',alignItems:'center',justifyContent:'center',gap:12,background:gHover?'#f8f9fa':'#ffffff',border:`1.5px solid ${gHover?'#c8cace':'#dadce0'}`,borderRadius:12,cursor:'pointer',fontFamily:"'General Sans','Roboto','Arial',sans-serif",fontSize:15,fontWeight:600,color:'#3c4043',letterSpacing:'0.01em',whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:gHover?'0 4px 16px rgba(0,0,0,0.22)':'0 2px 8px rgba(0,0,0,0.14)'}}>
                <GoogleLogo/>
                <span>{mode==='login'?'Login dengan Google':'Daftar dengan Google'}</span>
              </button>
            )}
            {!CLIENT_ID&&<p style={{textAlign:'center',fontSize:11,color:'#4A4A6A',fontFamily:"'JetBrains Mono',monospace",margin:'-8px 0 0'}}>Atur <code style={{color:'rgba(0,245,255,0.7)'}}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> di .env.local</p>}
            {/* Pemisah */}
            <div className="divider" style={{color:'#44445A',fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:'0.12em'}}>atau lanjutkan dengan email</div>
            {/* Form */}
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:13}} noValidate>
              {mode==='register'&&<Field label="Nama Pengguna" type="text" value={username} onChange={setUsername} placeholder="nama_pengguna_kamu" Icon={User} required minLength={3} maxLength={20} autoComplete="username"/>}
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="kamu@email.com" Icon={Mail} required autoComplete="email"/>
              <Field label="Kata Sandi" type={showPass?'text':'password'} value={password} onChange={setPassword} placeholder="••••••••" Icon={Lock} required minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} suffix={EyeBtn}/>
              {error&&<div className="anim-slide-down" style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',borderRadius:11,background:'rgba(255,45,120,0.08)',border:'1px solid rgba(255,45,120,0.2)',color:'#FF5599',fontSize:13.5,lineHeight:1.55}}><AlertCircle size={16} style={{flexShrink:0,marginTop:1}}/><span>{error}</span></div>}
              {success&&<div className="anim-slide-down" style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',borderRadius:11,background:'rgba(48,209,88,0.08)',border:'1px solid rgba(48,209,88,0.2)',color:'#30D158',fontSize:13.5,lineHeight:1.55}}><CheckCircle2 size={16} style={{flexShrink:0,marginTop:1}}/><span>{success}</span></div>}
              <button type="submit" disabled={loading} style={{width:'100%',height:50,borderRadius:13,border:'none',background:loading?'rgba(255,214,10,0.45)':'linear-gradient(135deg,#FFD60A,#FF9F0A)',cursor:loading?'not-allowed':'pointer',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:16,color:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.25s',boxShadow:loading?'none':'0 4px 18px rgba(255,214,10,0.28)',marginTop:4}}
                onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(255,214,10,0.42)';}}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=loading?'none':'0 4px 18px rgba(255,214,10,0.28)';}}>
                {loading?<><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(10,10,15,0.2)',borderTopColor:'#0A0A0F',animation:'spin 0.75s linear infinite',flexShrink:0}}/>{mode==='login'?'Masuk...':'Membuat akun...'}</>:mode==='login'?'Masuk':'Buat Akun'}
              </button>
            </form>
            <p style={{textAlign:'center',fontSize:14,color:'#4A4A6A',fontFamily:"'General Sans',sans-serif"}}>
              {mode==='login'?'Tidak punya akun? ':'Sudah punya akun? '}
              <button type="button" onClick={onSwitchMode} style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'#00F5FF',fontWeight:600,fontSize:14,fontFamily:"'General Sans',sans-serif"}} onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>
                {mode==='login'?'Daftar':'Masuk'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}