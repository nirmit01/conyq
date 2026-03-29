// app/api/articles/route.ts
// Serves articles from RSS feeds (live) + SQLite (seeded/cached)
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchAllFeeds } from '@/lib/rss';
import type { Article } from '@/lib/types';

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '30');
    const search = searchParams.get('search');
    const source = searchParams.get('source') ?? 'all';

    // 1. Fetch RSS articles (live)
    let rssArticles: Article[] = [];
    if (source !== 'db') {
      try {
        const feeds = await fetchAllFeeds();
        rssArticles = feeds.map(f => ({
          id: f.id,
          title: f.title,
          summary: f.summary,
          content: f.content,
          category: f.category,
          tags: f.tags,
          source: f.source,
          image_url: f.image_url,
          published_at: f.published_at,
          sentiment: f.sentiment,
          view_count: 0,
        })) as Article[];
      } catch (err) {
        console.warn('[API/articles] RSS failed, using DB only:', err);
      }
    }

    // 2. Fetch DB seeded articles
    let dbArticles: Article[] = [];
    if (source !== 'rss') {
      try {
        const db = getDb();
        const rows = db.prepare('SELECT * FROM articles ORDER BY published_at DESC LIMIT 20').all() as Array<Article & { tags: string }>;
        dbArticles = rows.map(r => ({ ...r, tags: JSON.parse(r.tags as unknown as string) }));
      } catch (err) {
        console.warn('[API/articles] DB failed:', err);
      }
    }

    // 3. Merge and deduplicate
    const seen = new Set<string>();
    let merged = [...rssArticles, ...dbArticles].filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    if (category && category !== 'all') merged = merged.filter(a => a.category === category);
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }

    merged = merged.sort((a, b) => b.published_at - a.published_at).slice(0, limit);

    return NextResponse.json({
      articles: merged,
      meta: { total: merged.length, live: rssArticles.length > 0 },
    });
  } catch (err) {
    console.error('[API/articles]', err);
    return NextResponse.json({ error: 'Failed to fetch articles', articles: [] }, { status: 500 });
  }
}
