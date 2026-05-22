// app/analyzer/page.tsx
// Article Analyzer - analyze any news article URL with AI

import { ArticleAnalyzer } from '@/components/ai/ArticleAnalyzer';
import { Sparkles, ExternalLink } from 'lucide-react';

export default function AnalyzerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 page-enter" style={{ color: 'var(--text-primary)' }}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ai-badge">
          <Sparkles size={13} />
          <span>AI-Powered</span>
        </div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Article Analyzer
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Paste any news article URL and get instant AI-powered analysis tailored to your role —
          entrepreneur, investor, or student.
        </p>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
        {[
          { step: '1', title: 'Paste URL', desc: 'Enter any news article link from Economic Times, Mint, Business Standard, etc.' },
          { step: '2', title: 'Select Your Role', desc: 'Choose how you want the analysis tailored — entrepreneur, investor, or student.' },
          { step: '3', title: 'Get Insights', desc: 'Receive actionable analysis with key takeaways and recommendations.' },
        ].map(s => (
          <div key={s.step} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
              {s.step}
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Analyzer Component */}
      <div className="max-w-3xl mx-auto">
        <ArticleAnalyzer />
      </div>

      {/* Supported Sources */}
      <div className="mt-10 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Works with articles from</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Economic Times', 'Mint', 'Business Standard', 'Moneycontrol', 'NDTV', 'The Hindu', 'Financial Express'].map(s => (
            <span key={s} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}