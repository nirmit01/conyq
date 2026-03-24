// app/api/briefing/route.ts
// Generates an AI-powered news briefing for a given article

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import type { Article } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 });

    const db = getDb();
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId) as (Article & { tags: string }) | undefined;
    if (!row) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const article = { ...row, tags: JSON.parse(row.tags as unknown as string) };
    const messages = PROMPTS.briefing(article);
    const result = await askAI(messages, 1000);

    return NextResponse.json({ briefing: result.text, provider: result.provider });
  } catch (err) {
    console.error('[API/briefing]', err);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}
