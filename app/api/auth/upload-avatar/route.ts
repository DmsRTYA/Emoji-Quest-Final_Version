import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || undefined);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const { avatar_data } = await req.json();
    if (!avatar_data) return NextResponse.json({ error: 'No image data' }, { status: 400 });
    if (!avatar_data.startsWith('data:image/')) return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    if (avatar_data.length > 2_800_000) return NextResponse.json({ error: 'Image too large (max 2MB)' }, { status: 400 });
    await pool.execute('UPDATE users SET avatar_url=? WHERE id=?', [avatar_data, payload.id]);
    return NextResponse.json({ success: true, avatar_url: avatar_data });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
