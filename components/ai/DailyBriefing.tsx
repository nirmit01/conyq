'use client';
// components/ai/DailyBriefing.tsx
// Feature 1: Role-based 3-minute daily news briefing

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ReadAloud } from '@/components/ui/ReadAloud';
import { Sparkles, ChevronDown, RefreshCw, Clock, Newspaper } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'entrepreneur' | 'investor' | 'student';

interface BriefingResult {
  briefing: string;
  role: string;
  provider: string;
  date: string;
  article_count: number;
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES: {
  id: Role;
  label: string;
  emoji: string;
  desc: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'entrepreneur',
    label: 'Entrepreneur',
    emoji: '🚀',
    desc: 'Opportunities, market gaps & business moves',
    accentColor: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.25)',
  },
  {
    id: 'investor',
    label: 'Investor',
    emoji: '📈',
    desc: 'Markets, sectors & portfolio signals',
    accentColor: '#059669',
    bgColor: 'rgba(5,150,105,0.06)',
    borderColor: 'rgba(5,150,105,0.25)',
  },
  {
    id: 'student',
    label: 'Student',
    emoji: '📚',
    desc: 'Concepts, career intel & exam material',
    accentColor: '#2563eb',
    bgColor: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.25)',
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function BriefingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="shimmer h-6 w-48 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-4/5 rounded" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-5 w-40 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-4 w-5/6 rounded" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-5 w-36 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-4/5 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="shimmer h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DailyBriefing() {
  const [selectedRole, setSelectedRole] = useState<Role>('entrepreneur');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const activeRole = ROLES.find(r => r.id === selectedRole)!;

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setResult(data);
      setGenerated(true);
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setGenerated(false);
    setError('');
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
          background: 'linear-gradient(135deg, rgba(234,88,12,0.08), rgba(234,88,12,0.03))',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Newspaper size={16} className="text-white" />
              </div>
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Daily AI Briefing
              </h2>
              <span className="ai-badge">
                <Sparkles size={10} /> AI-Powered
              </span>
            </div>
            <p className="text-sm ml-10" style={{ color: 'var(--text-muted)' }}>
              Today's top Indian business news, personalised for your role in 3 minutes
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>~3 min read</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* ── Role Selector ── */}
        {!generated && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              1. Choose your role
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(role => {
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                    style={{
                      borderColor: isActive ? role.accentColor : 'var(--border-color)',
                      backgroundColor: isActive ? role.bgColor : 'var(--bg-tertiary)',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                      boxShadow: isActive ? `0 4px 12px ${role.accentColor}25` : 'none',
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: role.accentColor }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl">{role.emoji}</span>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isActive ? role.accentColor : 'var(--text-primary)' }}
                      >
                        {role.label}
                      </p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                        {role.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Role badge when result shown ── */}
        {generated && result && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeRole.emoji}</span>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.date}</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: activeRole.accentColor }}
                >
                  {result.role} Briefing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ReadAloud
                text={result.briefing.replace(/[#*`]/g, '').replace(/\n+/g, '. ')}
                label="Listen"
              />
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={11} /> New Briefing
              </button>
            </div>
          </div>
        )}

        {/* ── Generate Button ── */}
        {!generated && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              2. Generate your briefing
            </p>
            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading
                  ? 'var(--bg-tertiary)'
                  : `linear-gradient(135deg, ${activeRole.accentColor}, ${activeRole.accentColor}dd)`,
                color: loading ? 'var(--text-muted)' : '#fff',
                boxShadow: loading ? 'none' : `0 4px 14px ${activeRole.accentColor}40`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Crafting your briefing…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate {activeRole.label} Briefing
                  <span className="opacity-75 text-xs font-normal">~5 seconds</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            className="rounded-xl p-4 mb-4 flex items-start gap-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-600">Generation failed</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: activeRole.accentColor, animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: activeRole.accentColor, animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: activeRole.accentColor, animationDelay: '300ms' }}
              />
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                Reading today's news and crafting your briefing…
              </span>
            </div>
            <BriefingSkeleton />
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}
          >
            {/* Provider badge */}
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Powered by {result.provider} · {result.article_count > 0 ? `${result.article_count} articles analysed` : 'Sample briefing'}
                </span>
              </div>
              <span className="ai-badge"><Sparkles size={9} /> AI</span>
            </div>

            {/* Markdown content */}
            <div
              className="p-5 overflow-y-auto markdown-content prose prose-sm max-w-none"
              style={{ maxHeight: '520px' }}
            >
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1
                      className="font-display text-xl font-bold mb-4"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2
                      className="font-display text-base font-semibold mt-5 mb-2 flex items-center gap-1.5"
                      style={{ color: activeRole.accentColor }}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3
                      className="text-sm font-semibold mt-3 mb-1.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p
                      className="text-sm leading-relaxed mb-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li
                      className="text-sm leading-relaxed mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {children}
                    </strong>
                  ),
                  hr: () => (
                    <hr
                      className="my-4"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                  ),
                }}
              >
                {result.briefing}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
