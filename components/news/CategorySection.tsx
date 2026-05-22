// components/news/CategorySection.tsx
'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArticleCardCompact } from './ArticleCardCompact';
import type { Article } from '@/lib/types';

interface Props {
  category: string;
  articles: Article[];
}

export function CategorySection({ category, articles }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!articles.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const categoryLabels: Record<string, string> = {
    technology: 'Tech & AI',
    finance: 'Finance & Banking',
    markets: 'Stock Markets',
    startups: 'Startups & VC',
    policy: 'Policy & Economy',
    macro: 'Macroeconomics',
    'real-estate': 'Real Estate',
    crypto: 'Crypto & Web3',
    sustainability: 'Sustainability',
    healthcare: 'Healthcare',
  };

  const label = categoryLabels[category] ?? category;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {label}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            {articles.length}
          </span>
        </div>
        <a
          href={`/newsroom?category=${category}`}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--color-brand)' }}
        >
          See all →
        </a>
      </div>

      {/* Scrollable cards */}
      <div className="relative group/section">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/section:opacity-100 transition-opacity"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {articles.map(article => (
            <ArticleCardCompact key={article.id} article={article} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/section:opacity-100 transition-opacity"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}