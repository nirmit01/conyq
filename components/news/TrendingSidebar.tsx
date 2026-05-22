// components/news/TrendingSidebar.tsx
'use client';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import type { Article } from '@/lib/types';
import { timeAgo, getCategoryColor } from '@/lib/utils';

interface Props {
  articles: Article[];
}

export function TrendingSidebar({ articles }: Props) {
  const trending = [...articles]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 5);

  if (!trending.length) return null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: 'var(--color-brand)' }} />
        <h3 className="font-display text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Most Read
        </h3>
      </div>

      <div className="space-y-4">
        {trending.map((article, i) => (
          <div key={article.id} className="flex gap-3 group">
            <span
              className="text-2xl font-bold flex-shrink-0 w-7 text-center"
              style={{ color: 'var(--text-faint)' }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
              <Link href={`/navigator?article=${article.id}`}>
                <h4 className="text-sm font-medium leading-snug line-clamp-2 mt-1 group-hover:text-brand-700 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {article.title}
                </h4>
              </Link>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(article.published_at)} · {article.view_count > 0 ? `${article.view_count} views` : article.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}