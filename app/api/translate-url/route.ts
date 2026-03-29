// app/api/translate-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';

// Reuse the robust scraper from your Article Analyzer
// Replace the old fetchArticleContent function with this one
async function fetchArticleContent(url: string): Promise<{ title: string; content: string; source: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Could not fetch article (HTTP ${res.status})`);
  let html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' | Economic Times', '').replace(' - Mint', '').trim() : 'Article';

  // 1. Clean out scripts, styles, and SVGs to prevent junk code from mixing with text
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');

  let content = '';

  // 2. Isolate the main article container (handles ET and other sites)
  let mainContainer = html;
  const containerMatch = html.match(/(class="artText"|class="article-body"|itemprop="articleBody")[^>]*>([\s\S]*)/i);
  if (containerMatch) {
    // Grab a massive chunk of text after the container starts (bypasses the nested </div> bug!)
    mainContainer = containerMatch[2].slice(0, 20000);
  }

  // 3. Safest extraction: Grab all text inside <p> tags within our isolated container
  const paragraphs = [...mainContainer.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim()) // Strip inner HTML tags
    .filter(p => p.length > 50); // Ignore tiny ad/social snippets

  content = paragraphs.join('\n\n');

  // 4. Fallback for sites that just dump raw text without <p> tags
  if (content.length < 300 && containerMatch) {
    // Strip all remaining HTML tags and clean up spaces
    content = mainContainer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // 5. Hard block check
  if (!content || content.length < 100) {
    throw new Error('CONTENT_BLOCKED');
  }

  const hostname = new URL(url).hostname.replace('www.', '');
  
  // Return a max of 4000 chars to keep the AI translation fast and within token limits
  return { title, content: content.slice(0, 4000), source: hostname };
}

export async function POST(req: NextRequest) {
  try {
    const { url, targetLanguage } = await req.json();

    if (!url || !targetLanguage) {
      return NextResponse.json({ error: 'Missing URL or language.' }, { status: 400 });
    }

    // 1. Scrape the article
    // 1. Scrape the article
    let article;
    try {
      article = await fetchArticleContent(url);
    } catch (err) {
      if ((err as Error).message === 'CONTENT_BLOCKED') {
        return NextResponse.json({ error: 'This website is blocking our bot from reading the text. Please try a different article URL.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Could not scrape this URL. The site might be down.' }, { status: 400 });
    }

    // 2. Translate it with AI Context
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert financial journalist and native translator for The Economic Times.
Your task is to translate English business news into ${targetLanguage}.

REQUIREMENTS:
1. Keep financial terms accurate but accessible. Use natural, readable language.
2. Format the response entirely in Markdown.
3. Start with the translated Title as an H2 (##).
4. Provide the translated article body.
5. At the very end, add a section called "💡 AI Context" (translated into ${targetLanguage}). In 2-3 bullet points, explain any complex financial jargon, macroeconomic concepts, or India-specific context mentioned in the article.`
      },
      {
        role: 'user' as const,
        content: `TITLE: ${article.title}\n\nCONTENT:\n${article.content}`
      }
    ];

    const result = await askAI(messages, 1500);

    return NextResponse.json({
      translation: result.text,
      provider: result.provider,
      originalTitle: article.title,
      source: article.source
    });

  } catch (err) {
    console.error('[API/translate-url]', err);
    return NextResponse.json({ error: 'Translation failed.' }, { status: 500 });
  }
}