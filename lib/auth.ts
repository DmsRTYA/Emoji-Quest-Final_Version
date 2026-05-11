import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';

export async function hashPassword(p: string) { return bcrypt.hash(p, 12); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }

export function generateToken(payload: { id: number; username: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: number; username: string; email: string } | null {
  try { return jwt.verify(token, SECRET) as any; } catch { return null; }
}

export function getTokenFromHeader(auth?: string): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
