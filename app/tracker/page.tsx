// app/tracker/page.tsx
'use client';
import { useEffect, useState } from 'react';
import type { StoryArc, Article } from '@/lib/types';
import { timeAgo, getCategoryColor, getSentimentEmoji, getSentimentLabel } from '@/lib/utils';
import { TrendingUp, Users, Brain, Clock, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ArcAnalysis {
  narrative: string;
  sentiment_trend: string;
  key_themes: string[];
  prediction: string;
}

export default function TrackerPage() {
  const [arcs, setArcs] = useState<StoryArc[]>([]);
  const [selected, setSelected] = useState<StoryArc | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [analysis, setAnalysis] = useState<ArcAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/story-arcs').then(r => r.json()),
      fetch('/api/articles?limit=20').then(r => r.json()),
    ]).then(([arcData, artData]) => {
      setArcs(arcData.arcs);
      setArticles(artData.articles);
      if (arcData.arcs.length) selectArc(arcData.arcs[0], artData.articles);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectArc = async (arc: StoryArc, allArticles?: Article[]) => {
    setSelected(arc);
    setAnalysis(null);
    setAnalyzing(true);

    const arcArticles = (allArticles ?? articles).filter(a => arc.article_ids.includes(a.id));

    // Compute average sentiment for display
    const avgSentiment = arcArticles.reduce((s, a) => s + a.sentiment, 0) / (arcArticles.length || 1);
    const sentimentLabel = getSentimentLabel(avgSentiment);

    try {
      const res = await fetch('/api/story-arcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arcId: arc.id }),
      });
      const data = await res.json();
      setAnalysis({
        ...data.analysis,
        sentiment_trend: data.analysis.sentiment_trend || sentimentLabel.label,
      });
    } catch {
      setAnalysis({
        narrative: arc.description ?? 'Story arc analysis in progress.',
        sentiment_trend: sentimentLabel.label,
        key_themes: arc.entities.map(e => e.name),
        prediction: arc.predictions ?? 'Predictions unavailable.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const arcArticles = selected
    ? articles.filter(a => selected.article_ids.includes(a.id))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-950">🔍 Story Arc Tracker</h1>
        <p className="text-ink-400 text-sm mt-1">Follow evolving stories — timelines, entities, sentiment & AI predictions</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-400">
          <Loader2 className="animate-spin mx-auto mb-3" size={28} />
          <p>Loading story arcs…</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-5">
          {/* Arc list */}
          <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
            <div className="p-3 border-b border-ink-100 bg-ink-50">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Active Story Arcs</p>
            </div>
            {arcs.map(arc => (
              <button
                key={arc.id}
                onClick={() => selectArc(arc)}
                className={`w-full text-left p-4 border-b border-ink-50 hover:bg-ink-50 transition-colors ${selected?.id === arc.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}>
                <p className="text-sm font-semibold text-ink-800 line-clamp-2">{arc.title}</p>
                <p className="text-xs text-ink-400 mt-1">{arc.article_ids.length} articles · {timeAgo(arc.updated_at)}</p>
              </button>
            ))}

            {arcs.length === 0 && (
              <div className="p-6 text-center text-ink-300 text-sm">No story arcs available</div>
            )}
          </div>

          {/* Arc detail */}
          {selected && (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-white rounded-xl border border-ink-200 p-5">
                <h2 className="font-display text-xl font-bold text-ink-950 mb-1">{selected.title}</h2>
                <p className="text-sm text-ink-500">{selected.description}</p>

                {/* Entities */}
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={14} className="text-ink-400" />
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Key Entities</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.entities.map((entity, i) => (
                      <span key={i} className="px-2.5 py-1 bg-ink-100 rounded-full text-xs font-medium text-ink-700">
                        {entity.name}
                        <span className="text-ink-400 ml-1">({entity.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-white rounded-xl border border-ink-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-brand-600" />
                  <p className="text-sm font-semibold text-ink-800">AI Arc Analysis</p>
                  {analyzing && <Loader2 size={14} className="animate-spin text-ink-400" />}
                </div>

                {analyzing ? (
                  <div className="space-y-3">
                    {[80, 60, 90, 70].map((w, i) => (
                      <div key={i} className={`shimmer h-4 rounded`} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : analysis ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-ink-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-ink-500 mb-2 uppercase">Narrative</p>
                      <p className="text-sm text-ink-700 leading-relaxed">{analysis.narrative}</p>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-ink-500 mb-2 uppercase flex items-center gap-1">
                        <TrendingUp size={12} /> Sentiment Trend
                      </p>
                      <p className="text-sm font-medium text-ink-800">{analysis.sentiment_trend}</p>
                      {analysis.key_themes?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {analysis.key_themes.map((theme, i) => (
                            <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{theme}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-100 rounded-lg p-4">
                      <p className="text-xs font-semibold text-brand-700 mb-2 uppercase flex items-center gap-1">
                        🔮 AI Prediction
                      </p>
                      <p className="text-sm text-ink-700 leading-relaxed">{analysis.prediction}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-ink-200 p-5">
                <div className="flex items-center gap-1.5 mb-4">
                  <Clock size={14} className="text-ink-400" />
                  <p className="text-sm font-semibold text-ink-800 uppercase tracking-wide text-xs">Story Timeline</p>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-ink-200" />
                  <div className="space-y-4">
                    {arcArticles
                      .sort((a, b) => a.published_at - b.published_at)
                      .map((article, i) => {
                        const sl = getSentimentLabel(article.sentiment);
                        return (
                          <div key={article.id} className="relative flex gap-4 pl-10">
                            <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-ink-200 flex items-center justify-center text-sm">
                              {getSentimentEmoji(article.sentiment)}
                            </div>
                            <div className="flex-1 bg-ink-50 rounded-lg p-3 border border-ink-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-medium ${sl.color}`}>{sl.label}</span>
                                <span className="text-xs text-ink-400">{timeAgo(article.published_at)}</span>
                              </div>
                              <p className="text-sm font-medium text-ink-800 line-clamp-2">{article.title}</p>
                              <Link
                                href={`/navigator?article=${article.id}`}
                                className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                                View AI Briefing →
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
