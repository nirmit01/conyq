// app/api/briefing/route.ts
// Generates an AI-powered news briefing for a given article

import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';
import type { Article } from '@/lib/types';

const BRIEFING_SYSTEM = `You are an expert business news analyst for Indian markets. You write sharp, well-structured briefings that busy professionals can read in under 60 seconds.
Your briefings must include:
1. **TL;DR** — One sentence summary of the most important takeaway
2. **What happened** — 2-3 sentences on the key facts
3. **Why it matters** — 1-2 sentences on the business/market impact
4. **Key numbers** — Any relevant statistics, percentages, or figures if mentioned
5. **What to watch** — 1-2 sentences on what comes next

Use markdown formatting. Be direct and specific — no fluff, no generic statements.`;

function buildBriefingPrompt(article: Article): { role: 'user' | 'system' | 'assistant'; content: string }[] {
  const content = (article.content || article.summary || '').slice(0, 3000);
  const publishedDate = article.published_at
    ? new Date(typeof article.published_at === 'number' ? article.published_at * 1000 : article.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown';

  return [
    { role: 'system' as const, content: BRIEFING_SYSTEM },
    {
      role: 'user' as const,
      content: `Generate a briefing for this article.

TITLE: ${article.title}
SOURCE: ${article.source || 'News'}
CATEGORY: ${article.category}
PUBLISHED: ${publishedDate}

SUMMARY: ${article.summary || 'No summary available'}
${content ? `\nFULL CONTENT:\n${content}` : ''}

Write a professional briefing in markdown format with TL;DR, What happened, Why it matters, Key numbers (if available), and What to watch sections. Be specific to this article's content.`,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { article?: Article; articleId?: string };
    const { article } = body;

    if (!article) {
      return NextResponse.json({ error: 'Article data required' }, { status: 400 });
    }

    // Ensure tags is an array
    const safeArticle: Article = {
      ...article,
      tags: Array.isArray(article.tags) ? article.tags : [],
      summary: article.summary || '',
      content: article.content || '',
    };

    const messages = buildBriefingPrompt(safeArticle);
    const result = await askAI(messages, 1200);

    return NextResponse.json({ briefing: result.text, provider: result.provider });
  } catch (err) {
    console.error('[API/briefing]', err);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}