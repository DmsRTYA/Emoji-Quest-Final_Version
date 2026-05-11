import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    if (!username||!email||!password) return NextResponse.json({error:'All fields required'},{status:400});
    if (username.length<3||username.length>20) return NextResponse.json({error:'Username must be 3–20 characters'},{status:400});
    if (password.length<6) return NextResponse.json({error:'Password min 6 characters'},{status:400});

    const [ex] = await pool.execute('SELECT id FROM users WHERE email=? OR username=?',[email,username]) as any[];
    if ((ex as any[]).length>0) return NextResponse.json({error:'Email or username already taken'},{status:409});

    const colors=['#00F5FF','#BF5AF2','#FFD60A','#FF2D78','#30D158','#FF9F0A'];
    const color  = colors[Math.floor(Math.random()*colors.length)];
    const hash   = await hashPassword(password);

    const [r] = await pool.execute(
      'INSERT INTO users (username,email,password_hash,avatar_color) VALUES (?,?,?,?)',
      [username,email,hash,color]
    ) as any[];
    const [rows] = await pool.execute('SELECT * FROM users WHERE id=?',[(r as any).insertId]) as any[];
    const u = (rows as any[])[0];
    const token = generateToken({id:u.id,username:u.username,email:u.email});
    return NextResponse.json({user:toUser(u),token},{status:201});
  } catch(e){ console.error(e); return NextResponse.json({error:'Internal server error'},{status:500}); }
}

function toUser(u:any){
  return {id:u.id,username:u.username,email:u.email,avatar_color:u.avatar_color,
    avatar_url:u.avatar_url||u.google_avatar||null,initials:getInitials(u.username),
    rank_tier:u.rank_tier,casual_score:u.casual_score,rank_score:u.rank_score,
    pvp_wins:u.pvp_wins,pvp_losses:u.pvp_losses,total_games:u.total_games};
}
function getInitials(name:string):string{
  const p=name.trim().replace(/[^a-zA-Z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
  if(p.length>=2)return(p[0][0]+p[1][0]).toUpperCase();
  const l=name.replace(/[^a-zA-Z]/g,'');
  return(l.slice(0,2)||name.slice(0,2)||'EQ').toUpperCase();
}
