// app/newsroom/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { ArticleCard } from '@/components/news/ArticleCard';
import { ArticleSkeleton } from '@/components/ui/Skeleton';
import { rankArticles } from '@/lib/utils';
import { INTEREST_OPTIONS } from '@/lib/types';
import type { Article, User } from '@/lib/types';
import { Settings, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewsroomPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [whyMatters, setWhyMatters] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [artRes, userRes] = await Promise.all([
        fetch('/api/articles?limit=20'),
        fetch('/api/user'),
      ]);
      const { articles: arts } = await artRes.json();
      const { user: u } = await userRes.json();
      setUser(u);
      setSelectedInterests(u.interests);
      const ranked = rankArticles(arts, u.interests);
      setArticles(ranked);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch "why matters" for top 3 articles
  useEffect(() => {
    if (!articles.length || !user) return;
    const top3 = articles.slice(0, 3);
    top3.forEach(async (a) => {
      if (whyMatters[a.id]) return;
      try {
        const res = await fetch('/api/why-matters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: a.id, interests: user.interests }),
        });
        const { text } = await res.json();
        setWhyMatters(prev => ({ ...prev, [a.id]: text }));
      } catch { /* silent */ }
    });
  }, [articles, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveInterests = async () => {
    setSaving(true);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selectedInterests }),
      });
      setShowSettings(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">Your Newsroom</h1>
          <p className="text-ink-400 text-sm mt-1">
            Personalised for {user?.name ?? 'you'} · {articles.length} stories
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors text-ink-500">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowSettings(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors">
            <Settings size={15} />
            <span>Interests</span>
          </button>
        </div>
      </div>

      {/* Interest settings panel */}
      {showSettings && (
        <div className="bg-white border border-ink-200 rounded-xl p-5 mb-6 shadow-sm animate-slide-up">
          <h2 className="font-semibold text-ink-800 mb-3">Customise your feed</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {INTEREST_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedInterests(prev =>
                  prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id]
                )}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  selectedInterests.includes(opt.id)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300',
                )}>
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveInterests} disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : 'Save Interests'}
            </button>
            <button onClick={() => setShowSettings(false)}
              className="px-4 py-2 border border-ink-200 rounded-lg text-sm text-ink-600 hover:bg-ink-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-all',
              activeCategory === cat
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400',
            )}>
            {cat}
          </button>
        ))}
      </div>

      {/* Top story highlight */}
      {!loading && filteredArticles.length > 0 && activeCategory === 'all' && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-5 mb-6 text-white">
          <p className="text-xs font-medium text-brand-200 mb-1">🔥 Top Story for You</p>
          <h2 className="font-display text-xl font-semibold leading-snug mb-2">
            {filteredArticles[0].title}
          </h2>
          <p className="text-sm text-brand-100 line-clamp-2">{filteredArticles[0].summary}</p>
          {whyMatters[filteredArticles[0].id] && (
            <p className="mt-3 text-xs bg-white/10 rounded-lg p-2 text-brand-50">
              ✨ {whyMatters[filteredArticles[0].id]}
            </p>
          )}
          <a href={`/navigator?article=${filteredArticles[0].id}`}
            className="mt-3 inline-block text-sm font-medium bg-white text-brand-700 px-4 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
            Read AI Briefing →
          </a>
        </div>
      )}

      {/* Article grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)
          : filteredArticles.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              whyMatters={whyMatters[article.id]}
              showWhyMatters={idx < 3}
            />
          ))}
      </div>

      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-16 text-ink-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No articles found for this category</p>
          <p className="text-sm mt-1">Try adjusting your interests or selecting a different category</p>
        </div>
      )}
    </div>
  );
}
