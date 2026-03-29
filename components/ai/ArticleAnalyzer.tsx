'use client';
// components/ai/ArticleAnalyzer.tsx
// Feature 2: Role-based article analysis from URL

import { useState, useRef } from 'react';
import { Search, Sparkles, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Link2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'entrepreneur' | 'investor' | 'student';

interface AnalysisResult {
  summary: string;
  bullets: string[];
  title: string;
  source: string;
  url: string;
  provider: string;
  note?: string;
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES: {
  id: Role;
  label: string;
  emoji: string;
  bulletTitle: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'entrepreneur',
    label: 'Entrepreneur',
    emoji: '🚀',
    bulletTitle: 'Why This Matters for Your Business',
    accentColor: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  {
    id: 'investor',
    label: 'Investor',
    emoji: '📈',
    bulletTitle: 'Investment Implications',
    accentColor: '#059669',
    bgColor: 'rgba(5,150,105,0.06)',
    borderColor: 'rgba(5,150,105,0.2)',
  },
  {
    id: 'student',
    label: 'Student',
    emoji: '📚',
    bulletTitle: 'Learning Points & Career Relevance',
    accentColor: '#2563eb',
    bgColor: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.2)',
  },
];

// ─── Quick URL suggestions ─────────────────────────────────────────────────────
const QUICK_URLS = [
  { label: 'Economic Times', url: 'https://economictimes.indiatimes.com', emoji: '📰' },
  { label: 'Mint', url: 'https://www.livemint.com', emoji: '📊' },
  { label: 'Business Standard', url: 'https://www.business-standard.com', emoji: '📈' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AnalysisSkeleton({ color }: { color: string }) {
  return (
    <div className="space-y-5">
      {/* Summary skeleton */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="shimmer h-4 w-4 rounded-full" />
          <div className="shimmer h-4 w-24 rounded" />
        </div>
        <div className="space-y-2">
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-4 w-5/6 rounded" />
          <div className="shimmer h-4 w-4/5 rounded" />
          <div className="shimmer h-4 w-3/4 rounded" />
        </div>
      </div>
      {/* Bullets skeleton */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: `${color}06`, border: `1px solid ${color}20` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="shimmer h-4 w-4 rounded-full" />
          <div className="shimmer h-4 w-40 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-3">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 shimmer"
                style={{ minWidth: '20px' }}
              />
              <div className="flex-1 space-y-1.5">
                <div className="shimmer h-3.5 w-full rounded" />
                <div className="shimmer h-3.5 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bullet item ──────────────────────────────────────────────────────────────
function BulletItem({ text, index, color }: { text: string; index: number; color: string }) {
  // Bold the label if it starts with **Label:**
  const boldMatch = text.match(/^\*\*(.+?):\*\*(.+)$/s);

  return (
    <div
      className="flex gap-3 p-3 rounded-xl transition-colors group"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
        style={{ backgroundColor: color, color: '#fff', minWidth: '24px' }}
      >
        {index + 1}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {boldMatch ? (
          <>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {boldMatch[1]}:
            </strong>
            {boldMatch[2]}
          </>
        ) : (
          text
        )}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ArticleAnalyzer() {
  const [url, setUrl] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('investor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRole = ROLES.find(r => r.id === selectedRole)!;

  const analyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl ?? url).trim();

    if (!targetUrl) {
      setError('Please enter an article URL to analyze.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
    setUrl('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http')) setUrl(text);
    } catch { /* browser may block */ }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02))',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Article Analyzer
              </h2>
              <span className="ai-badge">
                <Sparkles size={10} /> Role-Based
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Paste any news article URL — get a summary + personalised insights for your role
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* ── Input form ── */}
        {!result && (
          <div className="space-y-5">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                1. Article URL
              </label>
              <div className="relative">
                <Link2
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && analyze()}
                  placeholder="https://economictimes.com/markets/stocks/..."
                  className="w-full pl-9 pr-24 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                    // @ts-ignore
                    '--tw-ring-color': activeRole.accentColor + '60',
                  }}
                />
                <button
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Paste
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle size={13} className="text-red-500" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              {/* Quick source links */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</span>
                {QUICK_URLS.map(q => (
                  <button
                    key={q.url}
                    onClick={() => setUrl(q.url)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-tertiary)',
                    }}
                  >
                    {q.emoji} {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                2. Analyse as
              </label>
              <div className="flex gap-2">
                {ROLES.map(role => {
                  const isActive = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all text-sm font-medium"
                      style={{
                        borderColor: isActive ? role.accentColor : 'var(--border-color)',
                        backgroundColor: isActive ? role.bgColor : 'var(--bg-tertiary)',
                        color: isActive ? role.accentColor : 'var(--text-secondary)',
                        transform: isActive ? 'translateY(-1px)' : 'none',
                        boxShadow: isActive ? `0 3px 10px ${role.accentColor}20` : 'none',
                      }}
                    >
                      <span>{role.emoji}</span>
                      <span>{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={() => analyze()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading
                  ? 'var(--bg-tertiary)'
                  : `linear-gradient(135deg, ${activeRole.accentColor}, ${activeRole.accentColor}cc)`,
                color: loading ? 'var(--text-muted)' : '#fff',
                boxShadow: loading ? 'none' : `0 4px 14px ${activeRole.accentColor}35`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Fetching & analysing article…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Analyse as {activeRole.emoji} {activeRole.label}
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="mt-5">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: activeRole.bgColor, border: `1px solid ${activeRole.borderColor}` }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: activeRole.accentColor, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: activeRole.accentColor }}>
                Fetching article and crafting {activeRole.label.toLowerCase()} insights…
              </p>
            </div>
            <AnalysisSkeleton color={activeRole.accentColor} />
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Article header */}
            <div
              className="flex items-start justify-between gap-3 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {result.source}
                </p>
                <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                  {result.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  title="Open original article"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  title="Analyse another article"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Provider + note */}
            {result.note && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ backgroundColor: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}
              >
                <AlertCircle size={13} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <p style={{ color: 'var(--text-secondary)' }}>{result.note}</p>
              </div>
            )}

            {/* Summary */}
            <div
              className="rounded-xl p-5"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={15} style={{ color: activeRole.accentColor }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Article Summary
                </h3>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: activeRole.bgColor,
                    color: activeRole.accentColor,
                    border: `1px solid ${activeRole.borderColor}`,
                  }}
                >
                  {result.provider}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {result.summary}
              </p>
            </div>

            {/* Role-specific bullets */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: activeRole.bgColor,
                border: `1px solid ${activeRole.borderColor}`,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{activeRole.emoji}</span>
                <h3 className="text-sm font-semibold" style={{ color: activeRole.accentColor }}>
                  {activeRole.bulletTitle}
                </h3>
              </div>
              <div className="space-y-2.5">
                {result.bullets.map((bullet, i) => (
                  <BulletItem
                    key={i}
                    text={bullet}
                    index={i}
                    color={activeRole.accentColor}
                  />
                ))}
              </div>
            </div>

            {/* Analyse again button */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
              }}
            >
              <RefreshCw size={14} /> Analyse Another Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
