import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

function getRankTier(score: number): string {
  if (score >= 5000) return 'master';
  if (score >= 3500) return 'diamond';
  if (score >= 2200) return 'platinum';
  if (score >= 1200) return 'gold';
  if (score >= 500)  return 'silver';
  return 'bronze';
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || undefined);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { mode, score, correct, total } = await req.json();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id=?', [payload.id]) as any[];
    if ((rows as any[]).length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const user = (rows as any[])[0];

    await pool.execute(
      'INSERT INTO game_sessions(id,user_id,mode,score,questions_answered,correct_answers,status) VALUES(?,?,?,?,?,?,?)',
      [uuidv4(), payload.id, mode, score, total, correct, 'finished']
    );
    await pool.execute(
      'INSERT INTO leaderboard_entries(user_id,mode,score) VALUES(?,?,?)',
      [payload.id, mode, score]
    );

    const updates: string[] = ['total_games=total_games+1'];
    const params: any[] = [];
    let lpGained = 0;

    if (mode === 'casual') {
      if (score > user.casual_score) { updates.push('casual_score=?'); params.push(score); }
    } else if (mode === 'rank') {
      const accuracy  = total > 0 ? correct / total : 0;
      const base      = Math.round(score * 0.18);
      const accBonus  = Math.round(accuracy * 60);
      const perf      = correct === total ? 25 : 0;
      lpGained        = Math.max(10, base + accBonus + perf);
      const newScore  = user.rank_score + lpGained;
      updates.push('rank_score=?', 'rank_tier=?');
      params.push(newScore, getRankTier(newScore));
    }

    params.push(payload.id);
    await pool.execute(`UPDATE users SET ${updates.join(',')} WHERE id=?`, params);
    const [updated] = await pool.execute('SELECT * FROM users WHERE id=?', [payload.id]) as any[];
    const u = (updated as any[])[0];

    return NextResponse.json({
      success: true, lpGained,
      user: { casual_score: u.casual_score, rank_score: u.rank_score, rank_tier: u.rank_tier, total_games: u.total_games },
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
