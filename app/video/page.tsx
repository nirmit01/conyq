// app/video/page.tsx
// Canvas-based in-browser video generator — no FFmpeg needed
'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Article } from '@/lib/types';
import { timeAgo, getCategoryColor } from '@/lib/utils';
import { Film, Loader2, Download, Play, Square, RotateCcw } from 'lucide-react';

type VideoStatus = 'idle' | 'scripting' | 'rendering' | 'done' | 'error';

export default function VideoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [script, setScript] = useState('');
  const [provider, setProvider] = useState('');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const DURATION = 30; // seconds

  useEffect(() => {
    fetch('/api/articles?limit=10')
      .then(r => r.json())
      .then(({ articles: arts }) => { setArticles(arts); setLoading(false); });
  }, []);

  // Canvas animation loop
  const renderFrame = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const t = Math.min(elapsed / DURATION, 1);
    setProgress(Math.round(t * 100));

    if (t >= 1) {
      setPlaying(false);
      setProgress(100);
      drawFrame(ctx, canvas, selected, script, 1);
      return;
    }

    drawFrame(ctx, canvas, selected, script, t);
    animFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    article: Article,
    scriptText: string,
    t: number,
  ) => {
    const W = canvas.width;
    const H = canvas.height;

    // Background gradient (animated)
    const hue = 20 + t * 10;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, `hsl(${hue}, 40%, 8%)`);
    grad.addColorStop(1, `hsl(${hue + 20}, 30%, 12%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Animated accent line
    const lineW = W * (0.05 + t * 0.9);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(40, H - 8, lineW - 40, 4);

    // MY ET watermark
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = '#ea580c';
    ctx.textAlign = 'left';
    ctx.fillText('My ET', 40, 44);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('AI Native News', 40, 64);

    // Category badge
    const cat = (article.category ?? 'news').toUpperCase();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fb923c';
    const catW = ctx.measureText(cat).width + 20;
    const catX = W - catW - 40;
    ctx.fillStyle = 'rgba(234,88,12,0.25)';
    ctx.beginPath();
    ctx.roundRect(catX, 30, catW, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fb923c';
    ctx.textAlign = 'right';
    ctx.fillText(cat, W - 50, 47);

    // Title — fade in
    const titleAlpha = Math.min(1, t * 5);
    ctx.globalAlpha = titleAlpha;
    const titleLines = wrapText(ctx, article.title, W - 80, 'bold 28px Georgia, serif');
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const titleStartY = H / 2 - (titleLines.length * 38) / 2;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 40, titleStartY + i * 38);
    });
    ctx.globalAlpha = 1;

    // Script text — scrolls in after t > 0.2
    if (t > 0.2 && scriptText) {
      const scriptAlpha = Math.min(1, (t - 0.2) * 4);
      ctx.globalAlpha = scriptAlpha * 0.75;
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#d4c4a8';
      ctx.textAlign = 'left';
      const maxChars = Math.floor((t - 0.2) / 0.8 * scriptText.length);
      const visibleScript = scriptText.slice(0, maxChars);
      const scriptLines = wrapText(ctx, visibleScript, W - 80, '15px sans-serif').slice(0, 3);
      const scriptY = H - 80;
      scriptLines.forEach((line, i) => {
        ctx.fillText(line, 40, scriptY + i * 22);
      });
      ctx.globalAlpha = 1;
    }

    // Timer bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, H - 4, W * t, 4);
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] => {
    ctx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 4);
  };

  const startPlayback = () => {
    if (!canvasRef.current || !selected) return;
    cancelAnimationFrame(animFrameRef.current);
    setPlaying(true);
    setProgress(0);
    startTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const stopPlayback = () => {
    cancelAnimationFrame(animFrameRef.current);
    setPlaying(false);
  };

  const resetVideo = () => {
    stopPlayback();
    setProgress(0);
    const canvas = canvasRef.current;
    if (canvas && selected) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawFrame(ctx, canvas, selected, script, 0);
    }
  };

  const downloadFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `my-et-${selected?.id ?? 'video'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generate = async () => {
    if (!selected || status === 'scripting' || status === 'rendering') return;
    setStatus('scripting');
    setScript('');
    setError('');
    stopPlayback();
    setProgress(0);

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: selected.id }),
      });
      const data = await res.json();
      setScript(data.script ?? selected.summary);
      setProvider(data.provider ?? 'mock');
      setStatus('rendering');

      // Draw initial frame on canvas
      const canvas = canvasRef.current;
      if (canvas && selected) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawFrame(ctx, canvas, selected, data.script ?? selected.summary, 0);
      }
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  // Draw static frame when article changes
  useEffect(() => {
    if (!selected || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    stopPlayback();
    setStatus('idle');
    setScript('');
    setProgress(0);
    drawFrame(ctx, canvas, selected, '', 0);
  }, [selected]); // eslint-disable-line

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 page-enter"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">🎬 AI Video Generator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Article → AI Script → Animated Canvas Video · No FFmpeg required
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: Article selector */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          <div
            className="p-3 border-b"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              1. Select Article
            </p>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
            ) : articles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelected(article)}
                className="w-full text-left p-3 border-b transition-colors"
                style={{
                  borderColor: 'var(--border-light)',
                  backgroundColor: selected?.id === article.id ? 'rgba(234,88,12,0.08)' : 'transparent',
                  borderLeft: selected?.id === article.id ? '3px solid #ea580c' : '3px solid transparent',
                }}
              >
                <div className="flex gap-3">
                  {article.image_url && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-ink-100">
                      <Image src={article.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <p className="text-xs font-medium mt-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {article.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(article.published_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Video canvas + controls */}
        <div className="space-y-4">
          {/* Canvas */}
          <div className="video-canvas-wrapper w-full" style={{ background: '#000', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-auto block"
              style={{ display: 'block' }}
            />
            {!selected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <p className="text-4xl mb-3">🎬</p>
                <p className="text-sm opacity-60">Select an article to preview</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {status === 'done' && (
            <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!selected || status === 'scripting'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {status === 'scripting' ? (
                <><Loader2 size={15} className="animate-spin" /> Generating Script…</>
              ) : (
                <><Film size={15} /> Generate Video</>
              )}
            </button>

            {/* Playback controls */}
            {status === 'done' && (
              <>
                <button
                  onClick={playing ? stopPlayback : startPlayback}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-brand-50"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  {playing ? <><Square size={14} /> Stop</> : <><Play size={14} /> Play</>}
                </button>
                <button
                  onClick={resetVideo}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  onClick={downloadFrame}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  <Download size={14} /> Save Frame
                </button>
                {provider && (
                  <span className="ai-badge ml-auto">{provider}</span>
                )}
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Script display */}
          {script && (
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                📜 AI-Generated Broadcast Script
              </p>
              <p className="text-sm leading-relaxed font-mono" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {script}
              </p>
            </div>
          )}

          {/* How it works */}
          {status === 'idle' && (
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                How the Video Pipeline Works
              </p>
              <div className="space-y-2">
                {[
                  { n: '1', t: 'Select Article', d: 'Pick any live or seeded news article' },
                  { n: '2', t: 'AI Script', d: 'AI writes a 60-second broadcast script' },
                  { n: '3', t: 'Canvas Render', d: 'Animated text + graphics rendered in browser' },
                  { n: '4', t: 'Play & Download', d: 'Play the animation or save a frame as PNG' },
                ].map(s => (
                  <div key={s.n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {s.n}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.t}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.d}</p>
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
