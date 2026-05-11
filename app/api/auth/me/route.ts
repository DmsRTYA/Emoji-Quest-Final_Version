import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

function getInitials(n:string):string{const p=n.trim().split(/[\s_]+/);if(p.length>=2)return(p[0][0]+p[1][0]).toUpperCase();const l=n.replace(/[^a-zA-Z]/g,'');return(l.slice(0,2)||'EQ').toUpperCase();}

export async function GET(req: Request) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization')||undefined);
    if (!token) return NextResponse.json({error:'Unauthorized'},{status:401});
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({error:'Invalid token'},{status:401});
    const [rows] = await pool.execute('SELECT * FROM users WHERE id=?',[payload.id]) as any[];
    if ((rows as any[]).length===0) return NextResponse.json({error:'Not found'},{status:404});
    const u=(rows as any[])[0];
    return NextResponse.json({user:{
      id:u.id,username:u.username,email:u.email,
      avatar_color:u.avatar_color,
      avatar_url:u.avatar_url||u.google_avatar||null,
      initials:getInitials(u.username),
      rank_tier:u.rank_tier,casual_score:u.casual_score,rank_score:u.rank_score,
      pvp_wins:u.pvp_wins,pvp_losses:u.pvp_losses,total_games:u.total_games,
    }});
  } catch(e){ return NextResponse.json({error:'Internal server error'},{status:500}); }
}
