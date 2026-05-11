import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateToken } from '@/lib/auth';

function getInitials(n:string):string{const p=n.trim().split(/[\s_]+/);if(p.length>=2)return(p[0][0]+p[1][0]).toUpperCase();const l=n.replace(/[^a-zA-Z]/g,'');return(l.slice(0,2)||'EQ').toUpperCase();}
function colorFromEmail(email:string):string{const p=['#00F5FF','#BF5AF2','#FFD60A','#FF2D78','#30D158','#FF9F0A','#0A84FF','#64D2FF'];let h=0;for(const c of email)h=c.charCodeAt(0)+((h<<5)-h);return p[Math.abs(h)%p.length];}
function decodeJWT(t:string){try{const b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(Buffer.from(b+'=='.slice((b.length+2)%4||4),'base64').toString());}catch{return null;}}

async function upsertUser(googleId:string,email:string,name?:string,picture?:string){
  const [ex]=await pool.execute('SELECT * FROM users WHERE google_id=? OR email=?',[googleId,email]) as any[];
  let u:any;
  if((ex as any[]).length>0){
    u=(ex as any[])[0];
    await pool.execute('UPDATE users SET google_id=?,google_avatar=? WHERE id=?',[googleId,picture||'',u.id]);
    u.google_avatar=picture||u.google_avatar||'';
  } else {
    let uname=(name||email.split('@')[0]).replace(/[^a-zA-Z0-9]/g,'_').slice(0,18).toLowerCase()||'player';
    let final=uname,i=0;
    while(true){const[c]=await pool.execute('SELECT id FROM users WHERE username=?',[final]) as any[];if((c as any[]).length===0)break;final=`${uname}_${++i}`;}
    const[r]=await pool.execute('INSERT INTO users (username,email,password_hash,avatar_color,google_id,google_avatar,rank_score) VALUES (?,?,?,?,?,?,0)',[final,email,'',colorFromEmail(email),googleId,picture||'']) as any[];
    const[rows]=await pool.execute('SELECT * FROM users WHERE id=?',[(r as any).insertId]) as any[];
    u=(rows as any[])[0];
  }
  return u;
}

export async function POST(req:Request){
  try{
    const {credential}=await req.json();
    if(!credential)return NextResponse.json({error:'No credential'},{status:400});
    const p=decodeJWT(credential);
    if(!p?.email||!p?.sub)return NextResponse.json({error:'Invalid token'},{status:400});
    const u=await upsertUser(p.sub,p.email,p.name,p.picture);
    const token=generateToken({id:u.id,username:u.username,email:u.email});
    return NextResponse.json({user:{id:u.id,username:u.username,email:u.email,avatar_color:u.avatar_color,avatar_url:u.avatar_url||u.google_avatar||null,initials:getInitials(p.name||u.username),rank_tier:u.rank_tier,casual_score:u.casual_score,rank_score:u.rank_score,pvp_wins:u.pvp_wins,pvp_losses:u.pvp_losses,total_games:u.total_games},token});
  }catch(e:any){console.error(e);return NextResponse.json({error:'Internal server error'},{status:500});}
}
