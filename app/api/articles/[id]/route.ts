// app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Article } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(params.id) as (Article & { tags: string }) | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment view count
    db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(params.id);

    const article: Article = { ...row, tags: JSON.parse(row.tags as unknown as string) };
    return NextResponse.json({ article });
  } catch (err) {
    console.error('[API/articles/id]', err);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
