// lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { Article } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(unixTs: number): string {
  return formatDistanceToNow(new Date(unixTs * 1000), { addSuffix: true });
}

export function formatDate(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/**
 * Score and rank articles based on user interests.
 * Higher score = more relevant.
 */
export function rankArticles(articles: Article[], interests: string[]): Article[] {
  if (!interests.length) return articles;

  return articles
    .map(article => {
      let score = 0;
      // Category match
      if (interests.includes(article.category)) score += 3;
      // Tag overlap
      const tagOverlap = article.tags.filter(t => interests.includes(t)).length;
      score += tagOverlap * 2;
      // Recency boost (articles < 6 hours old get +1)
      const ageHours = (Date.now() / 1000 - article.published_at) / 3600;
      if (ageHours < 6) score += 1;
      // Sentiment bonus (positive news ranked slightly higher by default)
      score += article.sentiment * 0.5;

      return { ...article, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

export function getSentimentLabel(sentiment: number): { label: string; color: string } {
  if (sentiment > 0.5) return { label: 'Bullish', color: 'text-green-600' };
  if (sentiment > 0.1) return { label: 'Positive', color: 'text-green-500' };
  if (sentiment > -0.1) return { label: 'Neutral', color: 'text-gray-500' };
  if (sentiment > -0.5) return { label: 'Cautious', color: 'text-amber-500' };
  return { label: 'Bearish', color: 'text-red-500' };
}

export function getSentimentEmoji(sentiment: number): string {
  if (sentiment > 0.5) return '🟢';
  if (sentiment > 0.1) return '🔵';
  if (sentiment > -0.1) return '⚪';
  if (sentiment > -0.5) return '🟡';
  return '🔴';
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen).trim() + '…';
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    technology: 'bg-blue-100 text-blue-800',
    finance: 'bg-green-100 text-green-800',
    markets: 'bg-purple-100 text-purple-800',
    startups: 'bg-orange-100 text-orange-800',
    policy: 'bg-red-100 text-red-800',
    macro: 'bg-teal-100 text-teal-800',
    'real-estate': 'bg-yellow-100 text-yellow-800',
    crypto: 'bg-indigo-100 text-indigo-800',
    sustainability: 'bg-emerald-100 text-emerald-800',
    healthcare: 'bg-pink-100 text-pink-800',
  };
  return map[category] ?? 'bg-gray-100 text-gray-800';
}
