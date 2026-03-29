// lib/rss.ts
// Fetches and parses RSS feeds from Indian business news sources
// No API key required — completely free

export interface RSSArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  image_url?: string;
  published_at: number; // Unix timestamp
  sentiment: number;    // Will be computed client-side
}

// ─── Feed sources ─────────────────────────────────────────────────────────────
export const RSS_FEEDS = [
  {
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    source: 'Economic Times',
    category: 'markets',
  },
  {
    url: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms',
    source: 'Economic Times',
    category: 'technology',
  },
  {
    url: 'https://economictimes.indiatimes.com/small-biz/startups/rssfeeds/7058272.cms',
    source: 'Economic Times',
    category: 'startups',
  },
  {
    url: 'https://www.livemint.com/rss/economy',
    source: 'Mint',
    category: 'macro',
  },
  {
    url: 'https://www.livemint.com/rss/markets',
    source: 'Mint',
    category: 'markets',
  },
  {
    url: 'https://www.business-standard.com/rss/finance.rss',
    source: 'Business Standard',
    category: 'finance',
  },
  {
    url: 'https://www.business-standard.com/rss/technology.rss',
    source: 'Business Standard',
    category: 'technology',
  },
];

// ─── Simple sentiment scorer ───────────────────────────────────────────────────
const POSITIVE_WORDS = [
  'surge', 'rally', 'gain', 'profit', 'growth', 'record', 'high', 'rise',
  'boost', 'strong', 'beat', 'exceed', 'expand', 'win', 'positive', 'upgrade',
  'bullish', 'recovery', 'invest', 'success', 'launch', 'partnership',
];
const NEGATIVE_WORDS = [
  'fall', 'drop', 'loss', 'decline', 'crash', 'slump', 'weak', 'risk',
  'concern', 'warning', 'cut', 'low', 'bearish', 'sell', 'downgrade',
  'crisis', 'debt', 'fraud', 'penalty', 'fine', 'layoff', 'recession',
];

export function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) score += 0.1; });
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) score -= 0.1; });
  return Math.max(-1, Math.min(1, score));
}

// ─── Tag extractor ─────────────────────────────────────────────────────────────
const TAG_KEYWORDS: Record<string, string[]> = {
  'sensex': ['sensex', 'bse'],
  'nifty': ['nifty', 'nse'],
  'rbi': ['rbi', 'reserve bank', 'repo rate'],
  'rupee': ['rupee', 'inr', 'currency'],
  'ai': ['artificial intelligence', 'ai ', 'genai', 'generative ai', 'chatgpt'],
  'startup': ['startup', 'unicorn', 'funding round'],
  'ipo': ['ipo', 'initial public offering', 'listing'],
  'bank': ['bank', 'banking', 'nbfc'],
  'ev': ['electric vehicle', ' ev ', 'tesla', 'ola electric'],
  'it': ['infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra'],
};

export function extractTags(text: string, category: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [category];
  Object.entries(TAG_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some(kw => lower.includes(kw))) tags.push(tag);
  });
  return [...new Set(tags)].slice(0, 6);
}

// ─── XML parser helper ─────────────────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (cdataMatch) return cdataMatch[1].trim();

  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractImageFromItem(item: string): string | undefined {
  // Try media:content
  const media = item.match(/media:content[^>]+url="([^"]+)"/i);
  if (media) return media[1];

  // Try enclosure
  const enclosure = item.match(/enclosure[^>]+url="([^"]+)"/i);
  if (enclosure) return enclosure[1];

  // Try og:image in description
  const ogImg = item.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
  if (ogImg) return ogImg[1];

  return undefined;
}

function parseDate(dateStr: string): number {
  if (!dateStr) return Math.floor(Date.now() / 1000);
  try {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
}

// ─── Main fetch function ───────────────────────────────────────────────────────
export async function fetchRSSFeed(feed: typeof RSS_FEEDS[0]): Promise<RSSArticle[]> {
  // Use a CORS proxy for client-side, direct fetch for server-side
  const isServer = typeof window === 'undefined';
  const url = isServer
    ? feed.url
    : `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;

  const res = await fetch(url, {
  cache: 'no-store',
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyET/1.0)' },
});

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  let xmlText: string;
  if (isServer) {
    xmlText = await res.text();
  } else {
    const json = await res.json();
    xmlText = json.contents;
  }

  // Parse items
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  return itemMatches.slice(0, 8).map((item) => {
    const title = extractXmlTag(item, 'title');
    const description = extractXmlTag(item, 'description');
    const fullContent = extractXmlTag(item, 'content:encoded') || description;
    const pubDate = extractXmlTag(item, 'pubDate');
    const link = extractXmlTag(item, 'link');
    const image = extractImageFromItem(item);

    // Clean HTML from content
    const cleanContent = fullContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanDesc = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const combinedText = `${title} ${cleanDesc} ${cleanContent}`;
    const sentiment = scoreSentiment(combinedText);
    const tags = extractTags(combinedText, feed.category);

    // Generate stable ID from title + source
    const id = `rss-${slugify(title)}-${slugify(feed.source)}`;

    return {
      id,
      title: title || 'Untitled',
      summary: cleanDesc.slice(0, 300) || cleanContent.slice(0, 300),
      content: cleanContent || cleanDesc,
      category: feed.category,
      tags,
      source: feed.source,
      sourceUrl: link,
      image_url: image || `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 20))}/800/450`,
      published_at: parseDate(pubDate),
      sentiment,
    };
  }).filter(a => a.title && a.title !== 'Untitled');
}

// Fetch all feeds in parallel
export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchRSSFeed(feed))
  );

  const articles: RSSArticle[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    } else {
      console.warn(`[RSS] Feed failed (${RSS_FEEDS[i].source}):`, result.reason?.message);
    }
  });

  // Sort by date, deduplicate by title similarity
  const seen = new Set<string>();
  return articles
    .sort((a, b) => b.published_at - a.published_at)
    .filter(a => {
      const key = a.title.slice(0, 50).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
