// app/page.tsx — News-first homepage
'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/types';
import { HeroSection } from '@/components/news/HeroSection';
import { CategorySection } from '@/components/news/CategorySection';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { HeroSkeleton, CategorySectionSkeleton, TrendingSidebarSkeleton } from '@/components/ui/HeroSkeleton';
import { ArticleCard } from '@/components/news/ArticleCard';
import { RefreshCw } from 'lucide-react';

const MAIN_CATEGORIES = ['technology', 'markets', 'finance', 'startups', 'policy'];

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState<{ live: boolean; total: number }>({ live: false, total: 0 });

  const fetchArticles = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/articles?limit=50');
      const data = await res.json();
      setArticles(data.articles ?? []);
      setMeta(data.meta ?? { live: false, total: 0 });
    } catch (err) {
      console.error('Failed to fetch articles', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleRefresh = () => fetchArticles(true);

  // Group articles by category for category sections
  const byCategory = MAIN_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = articles.filter(a => a.category === cat).slice(0, 8);
    return acc;
  }, {} as Record<string, Article[]>);

  // Non-featured articles for the grid below category sections
  const featuredIds = new Set([
    articles[0]?.id,
    articles[1]?.id,
    articles[2]?.id,
    ...Object.values(byCategory).flatMap(a => a.slice(0, 3)).map(a => a.id),
  ]);
  const remainingArticles = articles.filter(a => !featuredIds.has(a.id));

  return (
    <div className="page-enter">
      {/* Page header with live indicator */}
      <div
        className="border-b"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Top Stories
            </h1>
            {meta.live && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {meta.total} articles
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <HeroSkeleton />
          {MAIN_CATEGORIES.slice(0, 2).map(cat => (
            <div key={cat} className="max-w-7xl mx-auto px-4 pb-8">
              <CategorySectionSkeleton />
            </div>
          ))}
        </>
      ) : articles.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-display" style={{ color: 'var(--text-muted)' }}>
            No articles available. Try refreshing.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <HeroSection articles={articles.slice(0, 3)} />

          {/* Category Sections + Trending Sidebar */}
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main content */}
              <div className="lg:col-span-3 space-y-10">
                {MAIN_CATEGORIES.map(cat => byCategory[cat]?.length > 0 && (
                  <CategorySection key={cat} category={cat} articles={byCategory[cat]} />
                ))}

                {/* More articles grid */}
                {remainingArticles.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      More Stories
                    </h2>
                    <div className={`grid gap-4 ${remainingArticles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {remainingArticles.slice(0, 6).map(article => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <TrendingSidebar articles={articles} />

                {/* Quick links card */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3 className="font-display text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Explore Features
                  </h3>
                  <div className="space-y-2">
                    {[
                      { href: '/navigator', label: 'AI Navigator', desc: 'Get AI briefings on any story' },
                      { href: '/briefing', label: 'Daily Briefing', desc: 'Your 3-minute news digest' },
                      { href: '/analyzer', label: 'Article Analyzer', desc: 'Analyze any article with AI' },
                      { href: '/vernacular', label: 'Read in Hindi', desc: 'Translate to Indian languages' },
                    ].map(link => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-ink-50 group"
                        style={{ border: '1px solid var(--border-color)' }}
                      >
                        <div>
                          <p className="text-sm font-semibold group-hover:text-brand-700 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {link.label}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {link.desc}
                          </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }}>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}