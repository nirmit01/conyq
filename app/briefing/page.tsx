// app/briefing/page.tsx
// Daily Briefing - AI-powered personalized daily news briefing

import { DailyBriefing } from '@/components/ai/DailyBriefing';
import { Sparkles } from 'lucide-react';

export default function BriefingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 page-enter" style={{ color: 'var(--text-primary)' }}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ai-badge">
          <Sparkles size={13} />
          <span>AI-Powered</span>
        </div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Daily Briefing
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Get a personalized 3-minute news briefing tailored to your role — entrepreneur, investor, or student.
          Powered by AI analyzing today's top Indian business news.
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-6">
          {[
            { n: '3 min', label: 'Quick read' },
            { n: '3 roles', label: 'Personalized' },
            { n: '12+', label: 'Stories covered' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-bold text-brand-600">{s.n}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Briefing Component */}
      <div className="max-w-3xl mx-auto">
        <DailyBriefing />
      </div>

      {/* How it works footer */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-display text-lg font-semibold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                role: 'Entrepreneur',
                color: '#7c3aed',
                points: [
                  'Market opportunities & gaps',
                  'Regulatory changes',
                  'Funding signals',
                  'Competitive intel',
                ],
              },
              {
                role: 'Investor',
                color: '#059669',
                points: [
                  'Macro & rate signals',
                  'Sector rotation',
                  'Earnings catalysts',
                  'FII/DII flows',
                ],
              },
              {
                role: 'Student',
                color: '#2563eb',
                points: [
                  'Core concepts in action',
                  'Career signals',
                  'Frameworks (Porter\'s)',
                  'Exam material',
                ],
              },
            ].map(r => (
              <div key={r.role} className="rounded-xl p-4" style={{ backgroundColor: `${r.color}06`, border: `1px solid ${r.color}20` }}>
                <p className="font-semibold text-sm mb-3" style={{ color: r.color }}>{r.role}</p>
                <ul className="space-y-1.5">
                  {r.points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: r.color, marginTop: '2px' }}>→</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}