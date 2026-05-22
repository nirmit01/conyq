// app/navigator/page.tsx
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { BriefingSkeleton, ArticleSkeleton } from '@/components/ui/Skeleton';
import { speakText, stopSpeaking } from '@/services/tts';
import type { Article } from '@/lib/types';
import { Volume2, VolumeX, Sparkles, ChevronRight } from 'lucide-react';
import { cn, timeAgo, getCategoryColor, getSentimentLabel } from '@/lib/utils';
import Image from 'next/image';

function NavigatorInner() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('article');

  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    fetch('/api/articles?limit=20')
      .then(r => r.json())
      .then(({ articles: arts }) => {
        setArticles(arts);
        setArticlesLoading(false);
        if (articleId) {
          const found = arts.find((a: Article) => a.id === articleId);
          if (found) selectArticle(found);
        } else if (arts.length) {
          selectArticle(arts[0]);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectArticle = async (article: Article) => {
    setSelected(article);
    setBriefing('');
    setBriefingLoading(true);
    stopSpeaking();
    setSpeaking(false);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });
      const data = await res.json();
      if (data.error) {
        setBriefing(`⚠️ ${data.error}`);
      } else {
        setBriefing(data.briefing || 'No briefing generated.');
      }
      setProvider(data.provider || '');
    } catch {
      setBriefing('⚠️ Failed to generate briefing. Please try again.');
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      const textToRead = selected ? `${selected.title}. ${(briefing || '').replace(/[#*]/g, '')}` : '';
      speakText({ text: textToRead });
      setSpeaking(true);
    }
  };

  const sentiment = selected ? getSentimentLabel(selected.sentiment) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-950">News Navigator</h1>
        <p className="text-ink-400 text-sm mt-1">AI-powered briefings with TLDR, insights, and chat</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr_340px] gap-5 items-start">
        {/* Article list */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <div className="p-3 border-b border-ink-100 bg-ink-50">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Articles</p>
          </div>
          <div className="overflow-y-auto max-h-[80vh]">
            {articlesLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-3 border-b border-ink-50"><ArticleSkeleton /></div>)
              : articles.map(article => (
                <button
                  key={article.id}
                  onClick={() => selectArticle(article)}
                  className={cn(
                    'w-full text-left p-3 border-b border-ink-50 hover:bg-ink-50 transition-colors flex gap-3',
                    selected?.id === article.id && 'bg-brand-50 border-l-2 border-l-brand-500',
                  )}>
                  {article.image_url && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-ink-100">
                      <Image src={article.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <p className="text-xs font-medium text-ink-800 mt-1 line-clamp-2 leading-snug">
                      {article.title}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">{timeAgo(article.published_at)}</p>
                  </div>
                  {selected?.id === article.id && (
                    <ChevronRight size={14} className="text-brand-500 flex-shrink-0 self-center" />
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Briefing panel */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {selected ? (
            <>
              {selected.image_url && (
                <div className="relative h-52 bg-ink-100">
                  <Image src={selected.image_url} alt={selected.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize text-white bg-white/20 backdrop-blur-sm`}>
                      {selected.category}
                    </span>
                    <h2 className="font-display text-lg font-semibold text-white mt-1 leading-snug line-clamp-3">
                      {selected.title}
                    </h2>
                  </div>
                </div>
              )}

              <div className="p-4 border-b border-ink-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="ai-badge">
                    <Sparkles size={11} /> AI Briefing
                    {provider && <span className="opacity-60">· {provider}</span>}
                  </span>
                  {selected?.url && (
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-ink-500 hover:text-brand-600 transition-colors flex items-center gap-1 px-2 py-1 rounded border border-ink-200 hover:border-brand-300"
                    >
                      Read Full Article
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </a>
                  )}
                  {sentiment && (
                    <span className={`text-xs font-medium ${sentiment.color}`}>
                      {sentiment.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleReadAloud}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    speaking
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'text-ink-500 border-ink-200 hover:bg-ink-50',
                  )}>
                  {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  {speaking ? 'Stop' : 'Read Aloud'}
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[55vh]">
                {briefingLoading ? (
                  <BriefingSkeleton />
                ) : (
                  <div className="markdown-content prose prose-sm max-w-none">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-ink-300 text-center p-8">
              <div>
                <p className="text-4xl mb-3">🧭</p>
                <p className="font-medium text-ink-500">Select an article to generate an AI briefing</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden" style={{ height: '80vh' }}>
          <div className="p-3 border-b border-ink-100 bg-ink-50">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Ask Follow-up Questions</p>
          </div>
          <div className="h-[calc(100%-44px)]">
            <ChatInterface
              articleId={selected?.id}
              placeholder="Ask about this article…"
              systemLabel="Article Q&A"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavigatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-400">Loading Navigator…</div>}>
      <NavigatorInner />
    </Suspense>
  );
}
