// app/api/why-matters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import type { Article } from '@/lib/types';

const MOCK_WHY: Record<string, string> = {
  technology: '💡 As a tech enthusiast, this directly affects the AI tools and platforms you use daily.',
  finance: '🏦 This monetary shift impacts loan rates, savings returns, and investment decisions you face.',
  markets: '📈 Your portfolio and investment strategy may need recalibration based on this market move.',
  startups: '🚀 The startup funding climate affects innovation cycles and the products that reach you.',
  policy: '⚖️ This policy change will shape the business environment and consumer rights in your sector.',
};

export async function POST(req: NextRequest) {
  try {
    const { articleId, interests } = await req.json();
    const db = getDb();
    const row = db.prepare('SELECT title, summary, category FROM articles WHERE id = ?').get(articleId) as (Pick<Article, 'title' | 'summary' | 'category'>) | undefined;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const messages = PROMPTS.whyMatters(row, interests ?? []);
    const result = await askAI(messages, 150);

    let text = result.text;
    if (result.provider === 'mock') {
      text = MOCK_WHY[row.category] ?? `📰 This story is directly relevant to your interest in ${(interests as string[])[0] ?? 'business news'}.`;
    }

    return NextResponse.json({ text, provider: result.provider });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
