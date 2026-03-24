// app/api/chat/route.ts
// Context-aware chat API for Q&A about articles

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import type { Article, ChatMessage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, articleId, message } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const db = getDb();

    // Load or create session
    let session = sessionId
      ? db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(sessionId) as { id: string; messages: string; article_id: string } | undefined
      : undefined;

    const newSessionId = session?.id ?? uuidv4();
    const history: ChatMessage[] = session ? JSON.parse(session.messages) : [];

    // Fetch article context if provided
    let article = { title: 'General News', summary: 'Business and financial news discussion.' };
    if (articleId) {
      const row = db.prepare('SELECT title, summary FROM articles WHERE id = ?').get(articleId) as { title: string; summary: string } | undefined;
      if (row) article = row;
    }

    // Build AI messages
    const aiMessages = PROMPTS.chat(article, history as Parameters<typeof PROMPTS.chat>[1], message);
    const result = await askAI(aiMessages, 600);

    // Append to history
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: message, ts: Date.now() },
      { role: 'assistant', content: result.text, ts: Date.now() },
    ];

    // Save / update session
    if (session) {
      db.prepare('UPDATE chat_sessions SET messages = ? WHERE id = ?')
        .run(JSON.stringify(updatedHistory), newSessionId);
    } else {
      db.prepare('INSERT INTO chat_sessions (id, article_id, messages) VALUES (?, ?, ?)')
        .run(newSessionId, articleId ?? null, JSON.stringify(updatedHistory));
    }

    return NextResponse.json({
      sessionId: newSessionId,
      response: result.text,
      provider: result.provider,
    });
  } catch (err) {
    console.error('[API/chat]', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
