import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email||!password) return NextResponse.json({error:'Email and password required'},{status:400});
    const [rows] = await pool.execute('SELECT * FROM users WHERE email=?',[email]) as any[];
    if ((rows as any[]).length===0) return NextResponse.json({error:'Invalid email or password'},{status:401});
    const u = (rows as any[])[0];
    if (!u.password_hash) return NextResponse.json({error:'This account uses Google login'},{status:401});
    const ok = await verifyPassword(password,u.password_hash);
    if (!ok) return NextResponse.json({error:'Invalid email or password'},{status:401});
    const token = generateToken({id:u.id,username:u.username,email:u.email});
    return NextResponse.json({user:toUser(u),token});
  } catch(e){ return NextResponse.json({error:'Internal server error'},{status:500}); }
}
function toUser(u:any){return{id:u.id,username:u.username,email:u.email,avatar_color:u.avatar_color,avatar_url:u.avatar_url||u.google_avatar||null,initials:getInitials(u.username),rank_tier:u.rank_tier,casual_score:u.casual_score,rank_score:u.rank_score,pvp_wins:u.pvp_wins,pvp_losses:u.pvp_losses,total_games:u.total_games};}
function getInitials(n:string):string{const p=n.trim().split(/\s+/);if(p.length>=2)return(p[0][0]+p[1][0]).toUpperCase();const l=n.replace(/[^a-zA-Z]/g,'');return(l.slice(0,2)||'EQ').toUpperCase();}
