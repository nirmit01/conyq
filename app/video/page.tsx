// app/video/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Article } from '@/lib/types';
import { timeAgo, getCategoryColor } from '@/lib/utils';
import { Film, Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VideoResult {
  jobId: string;
  status: 'processing' | 'done' | 'error';
  videoPath?: string;
  script?: string;
  error?: string;
  provider?: string;
}

export default function VideoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VideoResult | null>(null);

  useEffect(() => {
    fetch('/api/articles?limit=8')
      .then(r => r.json())
      .then(({ articles: arts }) => { setArticles(arts); setLoading(false); });
  }, []);

  const generate = async () => {
    if (!selected || generating) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: selected.id }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ jobId: '', status: 'error', error: String(err) });
    } finally {
      setGenerating(false);
    }
  };

  const isVideo = result?.videoPath?.endsWith('.mp4');
  const isPlaceholder = result?.videoPath?.endsWith('.json');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-950">🎬 AI Video Generator</h1>
        <p className="text-ink-400 text-sm mt-1">
          Article → AI Script → FFmpeg Video · Select an article and click Generate
        </p>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Article selector */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <div className="p-3 border-b border-ink-100 bg-ink-50">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">1. Select Article</p>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="p-6 text-center text-ink-300">Loading articles…</div>
            ) : articles.map(article => (
              <button
                key={article.id}
                onClick={() => { setSelected(article); setResult(null); }}
                className={`w-full text-left p-4 border-b border-ink-50 hover:bg-ink-50 transition-colors ${selected?.id === article.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}>
                <div className="flex gap-3">
                  {article.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-ink-100">
                      <Image src={article.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <p className="text-xs font-medium text-ink-800 mt-1 line-clamp-2">{article.title}</p>
                    <p className="text-xs text-ink-400 mt-1">{timeAgo(article.published_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Video output */}
        <div className="space-y-4">
          {/* Generate button */}
          <div className="bg-white rounded-xl border border-ink-200 p-5">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">2. Generate Video</p>
            {selected ? (
              <div>
                <p className="text-sm text-ink-700 font-medium mb-1 line-clamp-2">{selected.title}</p>
                <p className="text-xs text-ink-400 mb-4">{timeAgo(selected.published_at)}</p>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors">
                  {generating ? (
                    <><Loader2 size={16} className="animate-spin" /> Generating Script & Video…</>
                  ) : (
                    <><Film size={16} /> Generate Video</>
                  )}
                </button>
                <p className="text-xs text-ink-400 mt-2">
                  {generating ? 'This may take 15-30 seconds depending on your system' : 'Uses AI to write script, then FFmpeg to render video'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-400">← Select an article first</p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white rounded-xl border border-ink-200 p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                {result.status === 'done' && <CheckCircle size={18} className="text-green-500" />}
                {result.status === 'error' && <AlertCircle size={18} className="text-red-500" />}
                <span className={`text-sm font-medium ${result.status === 'done' ? 'text-green-700' : 'text-red-700'}`}>
                  {result.status === 'done' ? 'Video Generated' : 'Generation Failed'}
                </span>
                {result.provider && (
                  <span className="ai-badge ml-auto">{result.provider}</span>
                )}
              </div>

              {/* Video player */}
              {isVideo && result.videoPath && (
                <div className="rounded-lg overflow-hidden bg-black">
                  <video controls className="w-full" style={{ maxHeight: '360px' }}>
                    <source src={result.videoPath} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {/* Placeholder info (FFmpeg not available) */}
              {(isPlaceholder || result.status === 'error') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">FFmpeg Video Generation</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {result.error?.includes('ffmpeg') || isPlaceholder
                        ? 'FFmpeg is not installed on this system. The AI script was generated successfully. Install FFmpeg to enable actual video rendering.'
                        : result.error}
                    </p>
                    <p className="text-xs text-amber-600 mt-1 font-mono">npm install -g ffmpeg  OR  brew install ffmpeg</p>
                  </div>
                </div>
              )}

              {/* Script */}
              {result.script && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Play size={13} className="text-brand-600" />
                    <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide">AI-Generated Script</p>
                  </div>
                  <div className="bg-ink-50 rounded-lg p-4 text-sm text-ink-700 font-mono leading-relaxed whitespace-pre-wrap border border-ink-200">
                    {result.script}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          {!result && !generating && (
            <div className="bg-ink-50 rounded-xl border border-ink-200 p-5">
              <p className="text-sm font-semibold text-ink-700 mb-3">How the AI Video Pipeline Works</p>
              <div className="space-y-3">
                {[
                  { n: '1', title: 'Article Input', desc: 'Select any article from the feed' },
                  { n: '2', title: 'AI Script Writing', desc: 'AI generates a 60-second broadcast script' },
                  { n: '3', title: 'FFmpeg Rendering', desc: 'FFmpeg renders a title-card video with text overlay' },
                  { n: '4', title: 'Video Output', desc: 'Download or play the generated MP4' },
                ].map(step => (
                  <div key={step.n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step.n}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink-800">{step.title}</p>
                      <p className="text-xs text-ink-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
