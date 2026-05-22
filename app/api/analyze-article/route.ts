// app/api/analyze-article/route.ts
// Fetches article content from a URL and analyzes it for a specific role using Gemini

import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';
import type { Role } from '../daily-briefing/route';

const ROLE_ANALYSIS_CONTEXT: Record<Role, string> = {
  entrepreneur: `You are analyzing this article for a startup founder or entrepreneur.
Focus on: market opportunities, competitive threats, regulatory implications, customer behavior shifts, funding environment signals, and operational impacts.
Be specific about how this affects a business owner — think about revenue, costs, customers, and competition.`,

  investor: `You are analyzing this article for an equity investor or portfolio manager.
Focus on: market-moving implications, sectoral impact, valuation effects, risk factors, macro signals, and which stocks/sectors win or lose.
Be specific about portfolio implications — think about allocation, risk-reward, and timing.`,

  student: `You are analyzing this article for a business/economics student.
Focus on: core concepts illustrated, real-world application of theory, career implications, vocabulary to learn, and exam-relevant frameworks (Porter's Five Forces, SWOT, macroeconomic models, etc.).
Be educational but engaging — help them connect theory to reality.`,
};

const ROLE_BULLET_PROMPTS: Record<Role, string> = {
  entrepreneur: 'why and how this article is directly relevant to building and running a business in India',
  investor: 'why and how this article should influence investment decisions and portfolio thinking',
  student: 'what concepts to learn from this article, how it connects to academic theory, and how to use it in assignments or interviews',
};

// Article content extractor using native https module for better reliability
async function fetchArticleContent(url: string): Promise<{ title: string; content: string; source: string }> {
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    };

    const req = lib.request(options, (res: any) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect once
        const redirectUrl = new URL(res.headers.location, url);
        fetchArticleContent(redirectUrl.toString()).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let html = '';
      res.on('data', (chunk: Buffer) => { html += chunk.toString(); });
      res.on('end', () => {
        try {
          // Extract title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&ndash;/g, '-').trim() : 'Article';

          // Extract og:title
          const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';

          // Extract meta description
          const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';

          // Extract og:description
          const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';

          // Extract article body
          let content = '';

          // Strategy 1: Try article tag
          const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
          if (articleMatch) {
            content = articleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }

          // Strategy 2: Try common content patterns
          if (!content || content.length < 200) {
            const contentPatterns = [
              /class="[^"]*artText[^"]*"[^>]*>([\s\S]*?)<div/gi,
              /class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<div/gi,
              /class="[^"]*story-body[^"]*"[^>]*>([\s\S]*?)<div/gi,
              /class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<div/gi,
            ];
            for (const pattern of contentPatterns) {
              const matches = [...html.matchAll(pattern)];
              for (const match of matches) {
                const extracted = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (extracted.length > content.length && extracted.length > 100) {
                  content = extracted;
                }
              }
            }
          }

          // Strategy 3: Extract paragraphs
          if (!content || content.length < 200) {
            const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
              .map(m => m[1].replace(/<[^>]+>/g, '').trim())
              .filter(p => p.length > 50 && !p.includes('<script') && !p.includes('<style'));
            content = paragraphs.join(' ');
          }

          // Strategy 4: JSON-LD
          if (!content || content.length < 200) {
            const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
            if (jsonLdMatch) {
              try {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                content = jsonLd.articleBody || jsonLd.text || jsonLd.description || '';
              } catch {}
            }
          }

          // Final fallback
          if (!content || content.length < 100) {
            content = ogDesc || metaDesc || 'Article content could not be extracted.';
          }

          // Determine source
          const hostname = parsedUrl.hostname.replace('www.', '');
          const sourceMap: Record<string, string> = {
            'economictimes.indiatimes.com': 'Economic Times',
            'economictimes.com': 'Economic Times',
            'livemint.com': 'Mint',
            'business-standard.com': 'Business Standard',
            'thehindu.com': 'The Hindu',
            'financialexpress.com': 'Financial Express',
            'moneycontrol.com': 'Moneycontrol',
            'ndtv.com': 'NDTV',
            'reuters.com': 'Reuters',
            'bloomberg.com': 'Bloomberg',
          };
          const source = sourceMap[hostname] || hostname;

          const finalTitle = ogTitle && title === 'Article' ? ogTitle : title;

          resolve({
            title: finalTitle,
            content: content.slice(0, 4000),
            source,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { url, role } = await req.json() as { url: string; role: Role };

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Please enter an article URL.' }, { status: 400 });
    }
    if (!role || !ROLE_ANALYSIS_CONTEXT[role]) {
      return NextResponse.json({ error: 'Please select a valid role.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
    } catch {
      return NextResponse.json({ error: 'Please enter a valid article URL (e.g. https://economictimes.com/...)' }, { status: 400 });
    }

    // Block private IPs
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local') ||
      hostname.startsWith('172.')
    ) {
      return NextResponse.json({ error: 'Cannot fetch articles from local URLs.' }, { status: 400 });
    }

    // Fetch article
    let article: { title: string; content: string; source: string };
    try {
      article = await fetchArticleContent(parsedUrl.toString());
    } catch (fetchErr: any) {
      console.warn('[analyze-article] Fetch failed:', fetchErr.message);
      return NextResponse.json({
        error: fetchErr.message || 'Could not fetch article. The website may be blocking requests.',
        tip: 'Try a direct article URL from Economic Times, Mint, or Business Standard.'
      }, { status: 400 });
    }

    // Build AI prompt
    const messages = [
      {
        role: 'system' as const,
        content: `${ROLE_ANALYSIS_CONTEXT[role]}
You produce sharp, actionable analysis — not summaries. Every point you make should be specific to the article content.
Format your response ONLY as valid JSON (no markdown code blocks):
{ "summary": "string", "bullets": ["string", "string", "string", "string", "string"] }`,
      },
      {
        role: 'user' as const,
        content: `Analyze this article for a ${role}.

ARTICLE TITLE: ${article.title}
SOURCE: ${article.source}
CONTENT: ${article.content}

Provide:
1. "summary": A concise 3-4 sentence summary of the article's key points and significance.
2. "bullets": Exactly 5 bullet points explaining ${ROLE_BULLET_PROMPTS[role]}.
   - Each bullet must START with a bold **Category Label:** (e.g., **Market Signal:**, **Risk Factor:**, **Concept:**)
   - Each bullet must be specific to THIS article
   - Each bullet must be 1-2 sentences

Return ONLY the JSON object.`,
      },
    ];

    const result = await askAI(messages, 1500);

    // Parse JSON response
    let parsed: { summary: string; bullets: string[] };
    try {
      const jsonStart = result.text.indexOf('{');
      const jsonEnd = result.text.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        let jsonString = result.text.substring(jsonStart, jsonEnd + 1);
        jsonString = jsonString.replace(/[\n\r]+/g, ' ');
        parsed = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON object found in response");
      }

      if (!Array.isArray(parsed.bullets)) {
        parsed.bullets = [String(parsed.bullets || "Bullet points missing")];
      }
    } catch (err) {
      console.warn("[analyze-article] JSON Parse failed:", err);
      const cleanText = result.text.replace(/[{}]/g, '').trim();
      parsed = {
        summary: cleanText.slice(0, 300) || 'Analysis completed but formatting was unexpected.',
        bullets: [],
      };
    }

    return NextResponse.json({
      summary: parsed.summary,
      bullets: parsed.bullets,
      title: article.title,
      source: article.source,
      url: parsedUrl.toString(),
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('[API/analyze-article]', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}