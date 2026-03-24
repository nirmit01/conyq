// app/api/video/route.ts
// Triggers AI script generation + FFmpeg video pipeline

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import { generateVideo } from '@/services/video';
import type { Article } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 });

    const db = getDb();
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId) as (Article & { tags: string }) | undefined;
    if (!row) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    // Check if video already exists
    const existing = db.prepare('SELECT * FROM generated_videos WHERE article_id = ? AND status = ?')
      .get(articleId, 'done') as { id: string; video_path: string; script: string } | undefined;

    if (existing) {
      return NextResponse.json({
        jobId: existing.id,
        status: 'done',
        videoPath: existing.video_path,
        script: existing.script,
      });
    }

    const videoId = uuidv4();

    // Insert job as pending
    db.prepare('INSERT INTO generated_videos (id, article_id, status) VALUES (?, ?, ?)').run(videoId, articleId, 'processing');

    // Generate script
    const scriptMessages = PROMPTS.videoScript(row as Article);
    const scriptResult = await askAI(scriptMessages, 300);
    const script = scriptResult.text;

    // Update script in DB
    db.prepare('UPDATE generated_videos SET script = ? WHERE id = ?').run(script, videoId);

    // Generate video (async, fire and update)
    try {
      const videoPath = await generateVideo({
        articleId,
        title: row.title,
        script,
      });

      const relativePath = videoPath.replace(process.cwd() + '/public', '');
      db.prepare('UPDATE generated_videos SET status = ?, video_path = ? WHERE id = ?')
        .run('done', relativePath, videoId);

      return NextResponse.json({
        jobId: videoId,
        status: 'done',
        videoPath: relativePath,
        script,
        provider: scriptResult.provider,
      });
    } catch (videoErr) {
      db.prepare('UPDATE generated_videos SET status = ? WHERE id = ?').run('error', videoId);
      return NextResponse.json({
        jobId: videoId,
        status: 'error',
        script,
        error: (videoErr as Error).message,
        provider: scriptResult.provider,
      });
    }
  } catch (err) {
    console.error('[API/video]', err);
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

  const db = getDb();
  const job = db.prepare('SELECT * FROM generated_videos WHERE id = ?').get(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json(job);
}
