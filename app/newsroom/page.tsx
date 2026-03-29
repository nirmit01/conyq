// app/newsroom/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INTEREST_OPTIONS } from '@/lib/types';
import type { Article, User } from '@/lib/types';
import { rankArticles, timeAgo, getCategoryColor, getSentimentEmoji, truncate } from '@/lib/utils';
import { ReadAloud } from '@/components/ui/ReadAloud';
import { Settings, RefreshCw, Volume2, Wifi, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Skeleton ──────────────────────────────────────────────────────────────────
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

// ─── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({
  article,
  whyMatters,
  showWhy,
}: {
  article: Article;
  whyMatters?: string;
  showWhy?: boolean;
}) {
  return (
    <article
      className="rounded-xl overflow-hidden transition-all group"
      style={{
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Image */}
      {article.image_url && (
        <div className="relative h-44 overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
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
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(article.published_at)}</span>
        </div>

        {/* Title */}
        <Link href={`/navigator?article=${article.id}`}>
          <h2
            className="font-display text-base font-semibold leading-snug mb-2 line-clamp-3 group-hover:text-brand-600 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {article.title}
          </h2>
        </Link>

        {/* Summary */}
        <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
          {truncate(article.summary, 140)}
        </p>

        {/* Why This Matters */}
        {showWhy && whyMatters && (
          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}>
            <p className="text-xs font-semibold text-brand-600 mb-1">✨ Why this matters to you</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{whyMatters}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{article.source}</span>
          <div className="flex items-center gap-2">
            <ReadAloud text={`${article.title}. ${article.summary}`} label="" />
            <Link
              href={`/navigator?article=${article.id}`}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              AI Briefing →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NewsroomPage() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [whyMatters, setWhyMatters] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch articles + user ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [artRes, userRes] = await Promise.all([
        fetch('/api/articles?limit=30'),
        fetch('/api/user'),
      ]);
      const { articles: arts, meta } = await artRes.json();
      const { user: u } = await userRes.json();

      setUser(u);
      setSelectedInterests(u.interests ?? []);
      setAllArticles(arts ?? []);
      setIsLive(meta?.live ?? false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch "Why this matters" for top articles ──────────────────────────────
  useEffect(() => {
    if (!allArticles.length || !user?.interests?.length) return;
    const ranked = rankArticles(allArticles, user.interests);
    ranked.slice(0, 4).forEach(async (a) => {
      if (whyMatters[a.id]) return;
      try {
        const res = await fetch('/api/why-matters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: a.id, interests: user.interests }),
        });
        const { text } = await res.json();
        if (text) setWhyMatters(prev => ({ ...prev, [a.id]: text }));
      } catch { /* silent */ }
    });
  }, [allArticles, user]); // eslint-disable-line

  // ── Save interests ─────────────────────────────────────────────────────────
  const saveInterests = async () => {
    setSaving(true);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selectedInterests }),
      });
      setUser(prev => prev ? { ...prev, interests: selectedInterests } : prev);
      setShowSettings(false);
      setActiveCategory('all'); // Reset to show all with new ranking
    } finally {
      setSaving(false);
    }
  };

  // ── Compute displayed articles ─────────────────────────────────────────────
  // 1. Rank by user interests
  const interests = user?.interests ?? [];
  const ranked = interests.length > 0 ? rankArticles(allArticles, interests) : allArticles;

  // 2. Filter by active category tab
  const categoryFiltered = activeCategory === 'all'
    ? ranked
    : ranked.filter(a => a.category === activeCategory);

  // 3. Filter by search
  const displayed = searchQuery
    ? categoryFiltered.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryFiltered;

  // 4. Get unique categories from all articles (for tab bar)
  const categories = ['all', ...Array.from(new Set(allArticles.map(a => a.category))).sort()];

  // Top story
  const topStory = displayed[0];

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8 page-enter"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Your Newsroom
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Personalised for {user?.name ?? 'Guest Reader'} · {displayed.length} stories
            </p>
            {isLive ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Wifi size={11} /> Live RSS
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Database size={11} /> Cached
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              width: '180px',
            }}
          />
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{
              borderColor: showSettings ? '#ea580c' : 'var(--border-color)',
              color: showSettings ? '#ea580c' : 'var(--text-secondary)',
              backgroundColor: showSettings ? 'rgba(234,88,12,0.06)' : 'transparent',
            }}
          >
            <Settings size={15} />
            <span>Interests</span>
            {interests.length > 0 && (
              <span className="ml-1 bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {interests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Interest Settings Panel ── */}
      {showSettings && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Customise your feed
          </h2>
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
                    backgroundColor: isSelected ? '#ea580c' : 'var(--bg-tertiary)',
                    borderColor: isSelected ? '#ea580c' : 'var(--border-color)',
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
            <button
              onClick={saveInterests}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Interests'}
            </button>
            <button
              onClick={() => { setShowSettings(false); setSelectedInterests(user?.interests ?? []); }}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Active interests display ── */}
      {interests.length > 0 && !showSettings && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ranked by:</span>
          {interests.map(id => {
            const opt = INTEREST_OPTIONS.find(o => o.id === id);
            return opt ? (
              <span
                key={id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'rgba(234,88,12,0.1)', color: '#ea580c' }}
              >
                {opt.emoji} {opt.label}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
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
            {cat}
            {cat !== 'all' && (
              <span className="ml-1 text-xs opacity-60">
                ({allArticles.filter(a => a.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Top Story Hero ── */}
      {!loading && topStory && activeCategory === 'all' && !searchQuery && (
        <div className="rounded-xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #c2410c, #ea580c)' }}>
          <p className="text-xs font-medium text-orange-200 mb-1">🔥 Top Story for You</p>
          <h2 className="font-display text-xl font-semibold leading-snug mb-2">
            {topStory.title}
          </h2>
          <p className="text-sm text-orange-100 line-clamp-2">{topStory.summary}</p>
          {whyMatters[topStory.id] && (
            <p className="mt-3 text-xs bg-white/10 rounded-lg p-2.5 text-orange-50">
              ✨ {whyMatters[topStory.id]}
            </p>
          )}
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link
              href={`/navigator?article=${topStory.id}`}
              className="inline-block text-sm font-medium bg-white text-brand-700 px-4 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              Read AI Briefing →
            </Link>
          </div>
        </div>
      )}

      {/* ── Article Grid ── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)
          : displayed.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              whyMatters={whyMatters[article.id]}
              showWhy={idx < 4 && activeCategory === 'all'}
            />
          ))}
      </div>

      {/* ── Empty state ── */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No articles found</p>
          <p className="text-sm mt-1">
            {searchQuery ? `No results for "${searchQuery}"` : 'Try a different category or refresh'}
          </p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
            Refresh Articles
          </button>
        </div>
      )}
    </div>
  );
}
