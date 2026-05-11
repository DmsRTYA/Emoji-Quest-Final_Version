import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateToken } from '@/lib/auth';

// ─── Helpers ───────────────────────────────────────────────
function getInitials(n:string):string{const p=n.trim().split(/[\s_]+/);if(p.length>=2)return(p[0][0]+p[1][0]).toUpperCase();const l=n.replace(/[^a-zA-Z]/g,'');return(l.slice(0,2)||'EQ').toUpperCase();}
function colorFromEmail(email:string):string{const p=['#00F5FF','#BF5AF2','#FFD60A','#FF2D78','#30D158','#FF9F0A','#0A84FF','#64D2FF'];let h=0;for(const c of email)h=c.charCodeAt(0)+((h<<5)-h);return p[Math.abs(h)%p.length];}

function decodeJWT(t:string):Record<string,string>|null{
  try{
    const seg=t.split('.');if(seg.length!==3)return null;
    const b64=seg[1].replace(/-/g,'+').replace(/_/g,'/');
    const pad=b64+'='.repeat((4-b64.length%4)%4);
    return JSON.parse(Buffer.from(pad,'base64').toString('utf-8'));
  }catch{return null;}
}

async function upsertUser(googleId:string,email:string,name?:string,picture?:string){
  const[ex]=await pool.execute('SELECT * FROM users WHERE google_id=? OR email=?',[googleId,email]) as any[];
  let u:any;
  if((ex as any[]).length>0){
    u=(ex as any[])[0];
    await pool.execute('UPDATE users SET google_id=?,google_avatar=? WHERE id=?',[googleId,picture||'',u.id]);
    u.google_avatar=picture||u.google_avatar||'';
  }else{
    let base=(name||email.split('@')[0]).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_').replace(/__+/g,'_').replace(/^_+|_+$/g,'').slice(0,18).toLowerCase()||'player';
    let final=base,attempt=0;
    while(true){const[c]=await pool.execute('SELECT id FROM users WHERE username=?',[final]) as any[];if((c as any[]).length===0)break;if(++attempt>999){final=`player_${Date.now()}`;break;}final=`${base}_${attempt}`;}
    const[r]=await pool.execute('INSERT INTO users(username,email,password_hash,avatar_color,google_id,google_avatar,rank_score)VALUES(?,?,?,?,?,?,0)',[final,email,'',colorFromEmail(email),googleId,picture||'']) as any[];
    const[rows]=await pool.execute('SELECT * FROM users WHERE id=?',[(r as any).insertId]) as any[];
    u=(rows as any[])[0];
  }
  return u;
}

function buildUserPayload(u:any,name?:string){
  return{id:u.id,username:u.username,email:u.email,avatar_color:u.avatar_color,avatar_url:u.avatar_url||u.google_avatar||null,initials:getInitials(name||u.username),rank_tier:u.rank_tier,casual_score:u.casual_score,rank_score:u.rank_score,pvp_wins:u.pvp_wins,pvp_losses:u.pvp_losses,total_games:u.total_games};
}

// ─── HTML templates ────────────────────────────────────────
const APP_URL=()=>process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';

function successHTML(token:string,user:object):string{
  const data=JSON.stringify({token,user});
  return`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Login Berhasil – EmojiQuest</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0F;font-family:system-ui,sans-serif;color:#F0F0FF}
.card{text-align:center;padding:40px 32px;background:rgba(26,26,38,.95);border:1px solid rgba(255,255,255,.07);border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,.6);max-width:380px;width:100%}
.ring-wrap{position:relative;width:64px;height:64px;margin:0 auto 20px}.ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(48,209,88,.2);animation:rp 1.4s ease-out forwards}
.ri{position:absolute;inset:8px;border-radius:50%;background:rgba(48,209,88,.1);display:flex;align-items:center;justify-content:center}
@keyframes rp{0%{transform:scale(.6);opacity:0;border-color:rgba(48,209,88,.8)}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1;border-color:rgba(48,209,88,.2)}}
.chk{animation:cd .5s .2s ease forwards;stroke-dasharray:30;stroke-dashoffset:30}@keyframes cd{to{stroke-dashoffset:0}}
h2{font-size:20px;font-weight:700;margin-bottom:8px}p{font-size:13.5px;color:#8888AA;line-height:1.6}
.pw{margin-top:24px;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden}
.pb{height:100%;background:linear-gradient(90deg,#30D158,#00F5FF);animation:fb 2.2s linear forwards}@keyframes fb{from{width:0}to{width:100%}}</style></head>
<body><div class="card"><div class="ring-wrap"><div class="ring"></div><div class="ri"><svg class="chk" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#30D158" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 11 9 16 18 7"/></svg></div></div>
<h2>Login Berhasil</h2><p>Mengarahkan kembali ke EmojiQuest...</p><div class="pw"><div class="pb"></div></div></div>
<script>var d=${data};
function send(){try{if(window.opener&&!window.opener.closed){window.opener.postMessage({type:'GOOGLE_AUTH_SUCCESS',payload:d},window.location.origin);setTimeout(function(){window.close();},400);return true;}}catch(e){}return false;}
function redir(){try{sessionStorage.setItem('__eq_google_token',JSON.stringify(d));}catch(e){}window.location.replace('${APP_URL()}?google_auth=1');}
if(!send()){setTimeout(function(){if(!send())redir();},2200);}
</script></body></html>`;
}

function errorHTML(title:string,desc:string):string{
  const appUrl=APP_URL();
  return`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Login Gagal – EmojiQuest</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0F;font-family:system-ui,sans-serif;color:#F0F0FF}
.card{text-align:center;padding:40px 32px;max-width:400px;width:100%;background:rgba(26,26,38,.95);border:1px solid rgba(255,45,120,.2);border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,.6)}
.icon{width:52px;height:52px;border-radius:50%;background:rgba(255,45,120,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
h2{font-size:20px;font-weight:700;color:#FF2D78;margin-bottom:8px}p{font-size:13.5px;color:#8888AA;line-height:1.6;margin-bottom:20px}
a{display:inline-block;padding:10px 24px;border-radius:12px;background:rgba(0,245,255,.08);border:1px solid rgba(0,245,255,.25);color:#00F5FF;font-weight:600;text-decoration:none;font-size:14px}</style></head>
<body><div class="card"><div class="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF2D78" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
<h2>${title}</h2><p>${desc}</p><a href="${appUrl}">Kembali ke EmojiQuest</a></div>
<script>try{if(window.opener&&!window.opener.closed){window.opener.postMessage({type:'GOOGLE_AUTH_ERROR',error:'${title}'},window.location.origin);window.close();}}catch(e){}</script></body></html>`;
}

const HTML=(s:string)=>new NextResponse(s,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});

// ─── GET /api/auth/google/callback ─────────────────────────
export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const oauthError=searchParams.get('error');
  if(oauthError){
    const msgs:Record<string,[string,string]>={access_denied:['Akses Ditolak','Kamu membatalkan proses login Google.'],temporarily_unavailable:['Google Tidak Tersedia','Coba lagi nanti.']};
    const[t,d]=msgs[oauthError]??['Login Gagal',`Google error: ${oauthError}`];
    return HTML(errorHTML(t,d));
  }

  const code=searchParams.get('code');
  if(code){
    const clientId   =process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID||'';
    const clientSecret=process.env.GOOGLE_CLIENT_SECRET||'';
    if(!clientId||!clientSecret)return HTML(errorHTML('Konfigurasi Tidak Lengkap','GOOGLE_CLIENT_SECRET belum diisi di .env.local'));
    try{
      const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:`${APP_URL()}/api/auth/google/callback`,grant_type:'authorization_code'})});
      const tokens=await res.json();
      if(!res.ok||tokens.error)throw new Error(tokens.error_description||tokens.error||'Token exchange failed');
      const p=decodeJWT(tokens.id_token);
      if(!p?.email||!p?.sub)throw new Error('Invalid id_token');
      const u=await upsertUser(p.sub,p.email,p.name,p.picture);
      const jwt=generateToken({id:u.id,username:u.username,email:u.email});
      return HTML(successHTML(jwt,buildUserPayload(u,p.name)));
    }catch(e:any){console.error('[callback]',e);return HTML(errorHTML('Verifikasi Gagal',e.message||'Terjadi kesalahan saat memverifikasi akun Google.'));}
  }

  const idToken=searchParams.get('id_token');
  if(idToken){
    const p=decodeJWT(idToken);
    if(!p?.email||!p?.sub)return HTML(errorHTML('Token Tidak Valid','id_token dari Google tidak dapat dibaca.'));
    try{
      const u=await upsertUser(p.sub,p.email,p.name,p.picture);
      const jwt=generateToken({id:u.id,username:u.username,email:u.email});
      return HTML(successHTML(jwt,buildUserPayload(u,p.name)));
    }catch(e:any){return HTML(errorHTML('Verifikasi Gagal',e.message||'Terjadi kesalahan.'));}
  }

  return HTML(errorHTML('Permintaan Tidak Valid','Callback tidak menerima parameter yang diharapkan. Pastikan Redirect URI di Google Cloud Console sudah benar: <code>http://localhost:3000/api/auth/google/callback</code>'));
}

export async function POST(req:Request){return GET(req);}
