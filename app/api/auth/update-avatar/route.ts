import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || undefined);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const { avatar_color } = await req.json();
    if (!avatar_color) return NextResponse.json({ error: 'Color required' }, { status: 400 });
    await pool.execute('UPDATE users SET avatar_color=? WHERE id=?', [avatar_color, payload.id]);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
