// app/briefing/page.tsx
// Hosts both AI features: Daily Briefing + Article Analyzer
import { DailyBriefing } from '@/components/ai/DailyBriefing';
import { ArticleAnalyzer } from '@/components/ai/ArticleAnalyzer';
import { Sparkles } from 'lucide-react';

export default function BriefingPage() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 py-10 page-enter"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* ── Page Header ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ai-badge">
          <Sparkles size={13} />
          <span>AI-Powered Tools</span>
        </div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Your AI News Intelligence Hub
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Stop reading everything. Start understanding what matters — tailored to your exact role,
          goals, and what you need to act on today.
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-6">
          {[
            { n: '3 min', label: 'Daily briefing' },
            { n: '3 roles', label: 'Personalised' },
            { n: 'Any URL', label: 'Article analysis' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-bold text-brand-600">{s.n}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stacked Sections ── */}
      <div className="flex flex-col space-y-12 items-center w-full max-w-4xl mx-auto">
        
        {/* Section 1: Daily Briefing */}
        <div className="w-full">
          <DailyBriefing />
        </div>

        {/* Visual Divider */}
        <hr className="w-full border-t border-gray-200 dark:border-gray-800" />

        {/* Section 2: Article Analyzer */}
        <div className="w-full">
          <ArticleAnalyzer />
        </div>

      </div>

      {/* ── How it works footer ── */}
      <div
        className="mt-10 rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h3 className="font-display text-lg font-semibold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
          How the AI adapts to your role
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              emoji: '🚀',
              role: 'Entrepreneur',
              color: '#7c3aed',
              points: [
                'Market opportunities & gaps',
                'Regulatory changes affecting business',
                'Funding environment signals',
                'Competitive intelligence',
              ],
            },
            {
              emoji: '📈',
              role: 'Investor',
              color: '#059669',
              points: [
                'Macro signals & rate implications',
                'Sectoral rotation opportunities',
                'Earnings & valuation catalysts',
                'FII/DII flow analysis',
              ],
            },
            {
              emoji: '📚',
              role: 'Student',
              color: '#2563eb',
              points: [
                'Academic concepts in action',
                'Career & job market signals',
                'Frameworks (Porter\'s, BCG, etc.)',
                'Interview & exam material',
              ],
            },
          ].map(role => (
            <div
              key={role.role}
              className="rounded-xl p-4"
              style={{ backgroundColor: `${role.color}06`, border: `1px solid ${role.color}20` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{role.emoji}</span>
                <p className="font-semibold text-sm" style={{ color: role.color }}>{role.role}</p>
              </div>
              <ul className="space-y-1.5">
                {role.points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: role.color, marginTop: '2px' }}>→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
