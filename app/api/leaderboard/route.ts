import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'rank';
  try {
    let q = '';
    if (mode === 'casual') {
      q = `SELECT id,username,avatar_color,avatar_url,google_avatar,rank_tier,total_games,casual_score AS score,pvp_wins,
           ROW_NUMBER() OVER (ORDER BY casual_score DESC) AS \`rank\` FROM users ORDER BY casual_score DESC LIMIT 50`;
    } else if (mode === 'rank') {
      q = `SELECT id,username,avatar_color,avatar_url,google_avatar,rank_tier,total_games,rank_score AS score,pvp_wins,
           ROW_NUMBER() OVER (ORDER BY rank_score DESC) AS \`rank\` FROM users ORDER BY rank_score DESC LIMIT 50`;
    } else {
      q = `SELECT id,username,avatar_color,avatar_url,google_avatar,rank_tier,total_games,pvp_wins AS score,pvp_wins,
           ROW_NUMBER() OVER (ORDER BY pvp_wins DESC) AS \`rank\` FROM users ORDER BY pvp_wins DESC LIMIT 50`;
    }
    const [entries] = await pool.execute(q) as any[];
    // Merge avatar
    const mapped = (entries as any[]).map(e => ({
      ...e,
      avatar_url: e.avatar_url || e.google_avatar || null,
    }));

    let myRank: number | null = null;
    const token = getTokenFromHeader(req.headers.get('authorization') || undefined);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const found = mapped.find((e: any) => e.id === payload.id);
        if (found) myRank = found.rank;
      }
    }
    return NextResponse.json({ entries: mapped, myRank });
  } catch (e) { console.error(e); return NextResponse.json({ entries: [], myRank: null }); }
}
