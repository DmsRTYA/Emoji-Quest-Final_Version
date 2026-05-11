import { NextResponse } from 'next/server';
import { getQuestionsByMode } from '@/lib/questions';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') || 'casual') as 'casual' | 'rank' | 'pvp';
  return NextResponse.json({ questions: getQuestionsByMode(mode) });
}
