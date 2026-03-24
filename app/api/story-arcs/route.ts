// app/api/story-arcs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import type { Article, StoryArc } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const arcs = db.prepare('SELECT * FROM story_arcs ORDER BY updated_at DESC').all() as Array<StoryArc & { article_ids: string; entities: string }>;

    const result = arcs.map(arc => ({
      ...arc,
      article_ids: JSON.parse(arc.article_ids as unknown as string),
      entities: JSON.parse(arc.entities as unknown as string),
    }));

    return NextResponse.json({ arcs: result });
  } catch (err) {
    console.error('[API/story-arcs]', err);
    return NextResponse.json({ error: 'Failed to fetch story arcs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { arcId } = await req.json();
    const db = getDb();

    const arc = db.prepare('SELECT * FROM story_arcs WHERE id = ?').get(arcId) as (StoryArc & { article_ids: string; entities: string }) | undefined;
    if (!arc) return NextResponse.json({ error: 'Arc not found' }, { status: 404 });

    const articleIds: string[] = JSON.parse(arc.article_ids as unknown as string);
    const articles = articleIds
      .map(id => db.prepare('SELECT title, summary, published_at FROM articles WHERE id = ?').get(id))
      .filter(Boolean) as Array<{ title: string; summary: string; published_at: number }>;

    const messages = PROMPTS.storyArc(articles);
    const result = await askAI(messages, 500);

    let analysis = { narrative: '', sentiment_trend: '', key_themes: [], prediction: '' };
    try {
      const clean = result.text.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis.narrative = result.text;
      analysis.prediction = arc.predictions ?? 'Analysis pending.';
    }

    return NextResponse.json({ analysis, provider: result.provider });
  } catch (err) {
    console.error('[API/story-arcs POST]', err);
    return NextResponse.json({ error: 'Arc analysis failed' }, { status: 500 });
  }
}
