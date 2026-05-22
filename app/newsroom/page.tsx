// app/newsroom/page.tsx
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INTEREST_OPTIONS } from '@/lib/types';
import type { Article } from '@/lib/types';
import { rankArticles, timeAgo, getCategoryColor, getSentimentEmoji, truncate } from '@/lib/utils';
import { ReadAloud } from '@/components/ui/ReadAloud';
import { Settings, RefreshCw, X } from 'lucide-react';

function ArticleSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
      <div className="shimmer h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="shimmer h-5 w-20 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
        </div>
        <div className="shimmer h-5 w-full rounded" />
        <div className="shimmer h-5 w-4/5 rounded" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

function ArticleCard({ article, whyMatters, showWhy }: { article: Article; whyMatters?: string; showWhy?: boolean }) {
  return (
    <article
      className="rounded-xl overflow-hidden transition-all group card-lift"
      style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
    >
      {article.image_url && (
        <div className="relative h-44 overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <Image src={article.image_url} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-sm">
            {getSentimentEmoji(article.sentiment)}
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(article.published_at)}</span>
        </div>
        {article.url ? (
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <h2 className="font-display text-base font-semibold leading-snug mb-2 line-clamp-3 group-hover:text-brand-700 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {article.title}
            </h2>
          </a>
        ) : (
          <Link href={`/navigator?article=${article.id}`}>
            <h2 className="font-display text-base font-semibold leading-snug mb-2 line-clamp-3 group-hover:text-brand-700 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {article.title}
            </h2>
          </Link>
        )}
        <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
          {truncate(article.summary, 140)}
        </p>
        {showWhy && whyMatters && (
          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}>
            <p className="text-xs font-semibold text-brand-600 mb-1">Why this matters</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{whyMatters}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{article.source}</span>
          <div className="flex items-center gap-2">
            <ReadAloud text={`${article.title}. ${article.summary}`} label="" />
            <Link href={`/navigator?article=${article.id}`} className="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline">
              AI Briefing
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-ink-500 flex items-center gap-1 hover:text-brand-600 transition-colors">
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

export default function NewsroomPage() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/articles?limit=50');
      const { articles, meta } = await res.json();
      setAllArticles(articles ?? []);
      setIsLive(meta?.live ?? false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ranked = selectedInterests.length > 0 ? rankArticles(allArticles, selectedInterests) : allArticles;
  const categoryFiltered = activeCategory === 'all' ? ranked : ranked.filter(a => a.category === activeCategory);
  const displayed = debouncedQuery
    ? categoryFiltered.filter(a =>
        a.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        a.summary.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : categoryFiltered;
  const categories = ['all', ...Array.from(new Set(allArticles.map(a => a.category))).sort()];
  const topStory = displayed[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Newsroom</h1>
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {displayed.length} stories
            {debouncedQuery && <span> for <span style={{ color: 'var(--color-brand)' }}>"{debouncedQuery}"</span></span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Search with clear */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                width: '200px',
              }}
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            ) : (
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </span>
            )}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl border transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{
              borderColor: showSettings ? 'var(--color-brand)' : 'var(--border-color)',
              color: showSettings ? 'var(--color-brand)' : 'var(--text-secondary)',
              backgroundColor: showSettings ? 'rgba(234,88,12,0.06)' : 'transparent',
            }}
          >
            <Settings size={15} />
            <span>Interests</span>
            {selectedInterests.length > 0 && (
              <span className="ml-1 bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedInterests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Interest Settings Panel */}
      {showSettings && (
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <h2 className="font-display text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Customise your feed</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Select topics you care about — articles matching these will be ranked higher
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {INTEREST_OPTIONS.map(opt => {
              const isSelected = selectedInterests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedInterests(prev =>
                    prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id]
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                    borderColor: isSelected ? 'var(--color-brand)' : 'var(--border-color)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Done
            </button>
            <button onClick={() => { setShowSettings(false); setSelectedInterests([]); }}
              className="px-4 py-2 rounded-xl text-sm transition-colors" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Active interests */}
      {selectedInterests.length > 0 && !showSettings && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Showing:</span>
          {selectedInterests.map(id => {
            const opt = INTEREST_OPTIONS.find(o => o.id === id);
            return opt ? (
              <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(234,88,12,0.1)', color: 'var(--color-brand)' }}>
                {opt.emoji} {opt.label}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Category Tabs */}
      <div className="relative mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-all"
              style={{
                backgroundColor: activeCategory === cat ? 'var(--text-primary)' : 'var(--bg-card)',
                color: activeCategory === cat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                borderColor: activeCategory === cat ? 'var(--text-primary)' : 'var(--border-color)',
              }}
            >
              {cat === 'all' ? `All (${allArticles.length})` : `${cat} (${allArticles.filter(a => a.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Top Story Hero */}
      {!loading && topStory && activeCategory === 'all' && !debouncedQuery && (
        <div className="rounded-2xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #c2410c, #ea580c)' }}>
          <p className="text-xs font-medium text-orange-200 mb-1">Top Story</p>
          <Link href={`/navigator?article=${topStory.id}`}>
            <h2 className="font-display text-xl font-bold leading-snug mb-2 hover:text-orange-100 transition-colors">
              {topStory.title}
            </h2>
          </Link>
          <p className="text-sm text-orange-100 line-clamp-2">{topStory.summary}</p>
          <div className="mt-3">
            <Link href={`/navigator?article=${topStory.id}`}
              className="inline-block text-sm font-semibold bg-white text-brand-700 px-4 py-1.5 rounded-xl hover:bg-orange-50 transition-colors">
              Read AI Briefing
            </Link>
          </div>
        </div>
      )}

      {/* Article Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)
          : displayed.map((article) => (
              <ArticleCard key={article.id} article={article} showWhy={false} />
            ))}
      </div>

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">Search</span>
          <p className="font-display text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {debouncedQuery ? `No results for "${debouncedQuery}"` : 'No articles found'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {debouncedQuery ? 'Try a different search term' : 'Try a different category'}
          </p>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-brand)' }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}