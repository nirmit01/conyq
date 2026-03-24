// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Article } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM articles';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(title LIKE ? OR summary LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY published_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params) as Array<Article & { tags: string }>;
    const articles: Article[] = rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags as unknown as string),
    }));

    return NextResponse.json({ articles });
  } catch (err) {
    console.error('[API/articles]', err);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
