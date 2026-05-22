// components/news/ArticleCard.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, getCategoryColor, getSentimentEmoji, truncate } from '@/lib/utils';
import type { Article } from '@/lib/types';
import { Volume2 } from 'lucide-react';
import { speakText } from '@/services/tts';

interface Props {
  article: Article;
  whyMatters?: string;
  showWhyMatters?: boolean;
}

export function ArticleCard({ article, whyMatters, showWhyMatters }: Props) {
  const handleReadAloud = (e: React.MouseEvent) => {
    e.preventDefault();
    speakText({ text: `${article.title}. ${article.summary}` });
  };

  return (
    <article className="bg-white rounded-xl border border-ink-200 overflow-hidden hover:shadow-md transition-all group animate-fade-in card-lift">
      {/* Image */}
      {article.image_url && (
        <div className="relative h-44 overflow-hidden bg-ink-100">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-sm">
            {getSentimentEmoji(article.sentiment)}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Category + Time */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="text-xs text-ink-400">{timeAgo(article.published_at)}</span>
        </div>

        {/* Title */}
        {article.url ? (
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <h2 className="font-display text-base font-semibold text-ink-900 leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-3">
              {article.title}
            </h2>
          </a>
        ) : (
          <Link href={`/navigator?article=${article.id}`}>
            <h2 className="font-display text-base font-semibold text-ink-900 leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-3">
              {article.title}
            </h2>
          </Link>
        )}

        {/* Summary */}
        <p className="text-sm text-ink-500 leading-relaxed line-clamp-2 mb-3">
          {truncate(article.summary, 140)}
        </p>

        {/* Why This Matters */}
        {showWhyMatters && whyMatters && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-brand-700 mb-1">✨ Why this matters to you</p>
            <p className="text-xs text-brand-800 leading-relaxed">{whyMatters}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-400">{article.source}</span>
            {article.view_count > 0 && (
              <span className="text-xs text-ink-300">· {article.view_count} views</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadAloud}
              className="p-1.5 rounded-md text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Read aloud">
              <Volume2 size={14} />
            </button>
            <Link
              href={`/navigator?article=${article.id}`}
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              AI Briefing
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-ink-500 hover:text-brand-600 transition-colors flex items-center gap-1">
                Read
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
