// app/api/analyze-article/route.ts
// Fetches article content from a URL and analyzes it for a specific role

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

// Simple article content extractor
async function fetchArticleContent(url: string): Promise<{ title: string; content: string; source: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Could not fetch article (HTTP ${res.status})`);

  const html = await res.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' | Economic Times', '').replace(' - Mint', '').trim() : 'Article';

  // Extract meta description as fallback
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';

  // Extract og:description
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';

  // Extract article body — try common selectors
  let content = '';

  // Try <article> tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Try common content divs
  if (!content || content.length < 200) {
    const contentPatterns = [
      /<div[^>]+class="[^"]*artText[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class="[^"]*story-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match) {
        const extracted = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (extracted.length > content.length) content = extracted;
      }
    }
  }

  // Fallback: extract all paragraph text
  if (!content || content.length < 200) {
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(p => p.length > 60);
    content = paragraphs.join(' ');
  }

  // Final fallback
  if (!content || content.length < 100) {
    content = ogDesc || metaDesc || 'Article content could not be extracted. Analysis based on title and metadata.';
  }

  // Determine source from URL
  const hostname = new URL(url).hostname.replace('www.', '');
  const sourceMap: Record<string, string> = {
    'economictimes.indiatimes.com': 'Economic Times',
    'livemint.com': 'Mint',
    'business-standard.com': 'Business Standard',
    'thehindu.com': 'The Hindu',
    'financialexpress.com': 'Financial Express',
    'moneycontrol.com': 'Moneycontrol',
    'ndtv.com': 'NDTV',
    'reuters.com': 'Reuters',
    'bloomberg.com': 'Bloomberg',
  };
  const source = sourceMap[hostname] ?? hostname;

  return {
    title,
    content: content.slice(0, 4000), // Limit for API
    source,
  };
}

// Mock analysis for when no API key is set
function getMockAnalysis(role: Role, title: string) {
  const roleData = {
    entrepreneur: {
      summary: `This article examines a significant shift in India's business landscape that carries direct implications for entrepreneurs. The core development — whether regulatory, market-driven, or technological — creates both a threat and an opportunity depending on how quickly founders can adapt. The piece highlights that incumbents are moving slowly, which is often the clearest signal for startups to act.`,
      bullets: [
        '**Market Signal:** This trend has been validated by large players, meaning the risk of early-mover failure has dropped — now is the time to build, not study',
        '**Cost Implication:** Changes described could affect your operational costs within 2-3 quarters; model this into your next board deck',
        '**Customer Behaviour:** The article implies a shift in what your customers value — review your positioning and messaging against this new reality',
        '**Funding Angle:** Investors following this space will use this as market validation; it strengthens your fundraising narrative if you operate adjacent to this trend',
        '**Competitive Window:** Established players are reacting slowly — you have a 6-12 month window before the market consolidates around new norms',
      ],
    },
    investor: {
      summary: `This article presents material information for portfolio allocation decisions. The developments covered have measurable implications for asset prices across multiple sectors, with the strongest signal pointing to a re-rating opportunity in rate-sensitive financials and a potential headwind for defensives. The macro backdrop described aligns with a risk-on posture for domestic-oriented equities.`,
      bullets: [
        '**Direct Equity Impact:** Companies in this sector face either a margin expansion or compression — check your holdings for exposure and size accordingly',
        '**Sector Rotation Signal:** This development historically precedes a 3-6 month outperformance period for banking and capital goods — consider tactical reallocation',
        '**Risk Factor:** The article mentions a wildcard that markets haven\'t fully priced — this is your edge; position accordingly before the crowd arrives',
        '**Valuation Implication:** If the trend holds, consensus EPS estimates for affected companies are 8-12% too low — this is a buy signal ahead of revisions',
        '**FII Positioning:** Foreign investors will interpret this as a positive macro signal for India; expect incremental inflows into large-cap indices over the next 30 days',
      ],
    },
    student: {
      summary: `This article is a rich case study in applied economics and business strategy. It illustrates several core frameworks from your curriculum in real-time — from macroeconomic policy transmission to competitive strategy. Reading this alongside your textbooks will help you understand why academic models sometimes predict reality perfectly and why they sometimes fail.`,
      bullets: [
        '**Concept: Monetary Policy Transmission** — The article shows how central bank decisions ripple through credit markets, exchange rates, and equity valuations; draw the causal chain for your notes',
        '**Framework: Porter\'s Five Forces** — Map the industry described in this article to all five forces; this makes excellent essay material and shows you can apply theory to live situations',
        '**Career Relevance:** The sector featured here is actively hiring; understanding this trend makes you a stronger candidate in interviews for finance, consulting, or product roles',
        '**Exam Connection:** The macroeconomic dynamics here connect directly to IS-LM and AD-AS models from your macro course — try explaining the article using only those frameworks',
        '**Vocabulary to Add:** Note the financial terminology used (margins, basis points, FII flows, repo rate) — fluency in this language is expected in any business interview',
      ],
    },
  };
  return roleData[role];
}

export async function POST(req: NextRequest) {
  try {
    const { url, role } = await req.json() as { url: string; role: Role };

    // Validation
    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Please enter an article URL.' }, { status: 400 });
    }
    if (!role || !ROLE_ANALYSIS_CONTEXT[role]) {
      return NextResponse.json({ error: 'Please select a valid role.' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
    } catch {
      return NextResponse.json({ error: 'Please enter a valid article URL (e.g. https://economictimes.com/...)' }, { status: 400 });
    }

    // Fetch article
    let article: { title: string; content: string; source: string };
    try {
      article = await fetchArticleContent(parsedUrl.toString());
    } catch (fetchErr) {
      console.warn('[analyze-article] Fetch failed:', fetchErr);
      // Return mock analysis with URL-derived title
      const mock = getMockAnalysis(role, parsedUrl.hostname);
      return NextResponse.json({
        ...mock,
        title: `Article from ${parsedUrl.hostname}`,
        source: parsedUrl.hostname,
        url: parsedUrl.toString(),
        provider: 'mock',
        note: 'Could not fetch article content directly. Showing example analysis — add your Gemini API key for real analysis.',
      });
    }

    // Build AI prompt
    const messages = [
      {
        role: 'system' as const,
        content: `${ROLE_ANALYSIS_CONTEXT[role]}
You produce sharp, actionable analysis — not summaries. Every point you make should be specific to the article content and directly useful to the reader.
Format your response ONLY as valid JSON (no markdown, no code blocks): 
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
   - Each bullet must be specific to THIS article — no generic advice
   - Each bullet must be 1-2 sentences and immediately actionable or insightful

Return ONLY the JSON object.`,
      },
    ];

    // Increased token limit to 1500 to ensure the JSON doesn't get cut off mid-sentence
    const result = await askAI(messages, 1500);

    // Parse JSON response safely
   // Parse JSON response safely
    let parsed: { summary: string; bullets: string[] };
    try {
      const jsonStart = result.text.indexOf('{');
      const jsonEnd = result.text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        let jsonString = result.text.substring(jsonStart, jsonEnd + 1);
        
        // Fix #1: Strip out literal newlines which frequently crash JSON.parse
        jsonString = jsonString.replace(/[\n\r]+/g, ' ');
        
        parsed = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON object found in response");
      }
      
      if (!Array.isArray(parsed.bullets)) {
        parsed.bullets = [String(parsed.bullets || "Bullet points missing")];
      }

    } catch (err) {
  console.warn("[analyze-article] JSON Parse failed, using Smart Fallback extraction.");

  if (result.provider === "mock") {
    parsed = getMockAnalysis(role, article.title);
  } else {
    // Smart fallback: extract text manually if JSON is broken
    const cleanText = result.text;

    // Extract Summary using Regex
    let backupSummary = "Analysis completed, but text extraction failed. Please retry.";
    const sumMatch = cleanText.match(/"summary"\s*:\s*"([\s\S]*?)"\s*,\s*"bullets"/i);

    if (sumMatch) {
      backupSummary = sumMatch[1].replace(/\\"/g, '"').trim();
    } else {
      // Remove braces and excessive whitespace from raw text
      backupSummary = cleanText.replace(/[{}]/g, "").trim();
    }

    parsed = {
      summary: backupSummary,
      bullets: [],
    };
  }
}

    return NextResponse.json({
      summary: parsed.summary,
      bullets: parsed.bullets,
      title: article.title,
      source: article.source,
      url: parsedUrl.toString(),
      provider: result.provider,
      note: (result as any).note, // Pass through any notes (like scrape failures)
    });
  } catch (err) {
    console.error('[API/analyze-article]', err);
    return NextResponse.json({
      error: 'Analysis failed. Please check the URL and try again.',
    }, { status: 500 });
  }
}
