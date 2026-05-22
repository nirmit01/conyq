// components/news/ArticleCardCompact.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, getCategoryColor } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  article: Article;
  size?: 'sm' | 'md';
}

export function ArticleCardCompact({ article, size = 'md' }: Props) {
  return (
    <article
      className="flex gap-3 group cursor-pointer flex-shrink-0"
      style={{
        width: size === 'sm' ? '280px' : '320px',
      }}
    >
      {article.image_url && (
        <div className="relative w-28 h-20 md:w-32 md:h-22 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{timeAgo(article.published_at)}</span>
        </div>
        {article.url ? (
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <h3
              className="font-display text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {article.title}
            </h3>
          </a>
        ) : (
          <Link href={`/navigator?article=${article.id}`}>
            <h3
              className="font-display text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {article.title}
            </h3>
          </Link>
        )}
        <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
          {article.source}
        </p>
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            Read
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
        )}
      </div>
    </article>
  );
}