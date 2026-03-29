// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { Article } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(unixTs: number): string {
  try {
    return formatDistanceToNow(new Date(unixTs * 1000), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function formatDate(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/**
 * Score and rank articles by user interests.
 * Works correctly for both RSS (live) and DB (seeded) articles.
 */
export function rankArticles(articles: Article[], interests: string[]): Article[] {
  if (!interests || interests.length === 0) return articles;

  const interestSet = new Set(interests.map(i => i.toLowerCase().trim()));

  return articles
    .map(article => {
      let score = 0;

      // Category exact match (highest weight)
      const cat = (article.category ?? '').toLowerCase().trim();
      if (interestSet.has(cat)) score += 5;

      // Tag overlap
      const tags = Array.isArray(article.tags) ? article.tags : [];
      tags.forEach(tag => {
        if (interestSet.has(tag.toLowerCase().trim())) score += 3;
      });

      // Title keyword match (partial — catches things like "RBI" matching "finance")
      const titleLower = article.title.toLowerCase();
      const CATEGORY_KEYWORDS: Record<string, string[]> = {
        technology: ['ai', 'tech', 'software', 'digital', 'startup', 'app', 'data', 'cyber', 'robot'],
        finance: ['rbi', 'bank', 'rate', 'loan', 'credit', 'npa', 'nbfc', 'interest', 'monetary'],
        markets: ['sensex', 'nifty', 'bse', 'nse', 'stock', 'share', 'ipo', 'rally', 'fii', 'dii', 'market'],
        startups: ['startup', 'unicorn', 'funding', 'venture', 'vc', 'seed', 'series'],
        policy: ['government', 'ministry', 'policy', 'scheme', 'budget', 'parliament', 'regulation'],
        macro: ['gdp', 'inflation', 'cpi', 'wpi', 'economy', 'fiscal', 'trade', 'export', 'import'],
        sustainability: ['ev', 'electric', 'solar', 'green', 'climate', 'carbon', 'renewable'],
        crypto: ['bitcoin', 'crypto', 'blockchain', 'defi', 'nft', 'web3', 'token'],
        healthcare: ['health', 'pharma', 'hospital', 'drug', 'medicine', 'vaccine', 'clinical'],
        'real-estate': ['real estate', 'property', 'housing', 'realty', 'rera', 'apartment', 'commercial'],
      };

      interestSet.forEach(interest => {
        const keywords = CATEGORY_KEYWORDS[interest] ?? [];
        keywords.forEach(kw => {
          if (titleLower.includes(kw)) score += 2;
        });
      });

      // Recency boost (articles less than 3 hours old get +2, < 12 hours +1)
      const ageHours = (Date.now() / 1000 - article.published_at) / 3600;
      if (ageHours < 3)  score += 2;
      else if (ageHours < 12) score += 1;

      // Small sentiment bonus
      score += (article.sentiment ?? 0) * 0.3;

      return { ...article, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

export function getSentimentLabel(sentiment: number): { label: string; color: string } {
  if (sentiment > 0.5)  return { label: 'Bullish',  color: 'text-green-600' };
  if (sentiment > 0.1)  return { label: 'Positive', color: 'text-green-500' };
  if (sentiment > -0.1) return { label: 'Neutral',  color: 'text-gray-500' };
  if (sentiment > -0.5) return { label: 'Cautious', color: 'text-amber-500' };
  return { label: 'Bearish', color: 'text-red-500' };
}

export function getSentimentEmoji(sentiment: number): string {
  if (sentiment > 0.5)  return '🟢';
  if (sentiment > 0.1)  return '🔵';
  if (sentiment > -0.1) return '⚪';
  if (sentiment > -0.5) return '🟡';
  return '🔴';
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen).trim() + '…';
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    technology:    'bg-blue-100 text-blue-800',
    finance:       'bg-green-100 text-green-800',
    markets:       'bg-purple-100 text-purple-800',
    startups:      'bg-orange-100 text-orange-800',
    policy:        'bg-red-100 text-red-800',
    macro:         'bg-teal-100 text-teal-800',
    'real-estate': 'bg-yellow-100 text-yellow-800',
    crypto:        'bg-indigo-100 text-indigo-800',
    sustainability:'bg-emerald-100 text-emerald-800',
    healthcare:    'bg-pink-100 text-pink-800',
  };
  return map[category] ?? 'bg-gray-100 text-gray-800';
}
