// app/page.tsx
import Link from 'next/link';

const features = [
  {
    href: '/newsroom',
    emoji: '🗞️',
    title: 'Personalized Newsroom',
    desc: 'News ranked by your interests with AI-generated "Why this matters to you"',
    color: 'from-orange-50 to-amber-50 border-orange-200',
    badge: 'Smart Feed',
  },
  {
    href: '/navigator',
    emoji: '🧭',
    title: 'News Navigator',
    desc: 'AI briefings with TLDR, Key Insights, Impact & Risks. Chat to go deeper.',
    color: 'from-blue-50 to-indigo-50 border-blue-200',
    badge: 'AI Briefings',
  },
  {
    href: '/video',
    emoji: '🎬',
    title: 'AI Video Generator',
    desc: 'Turn any article into a broadcast-style video using AI scripts + FFmpeg.',
    color: 'from-purple-50 to-pink-50 border-purple-200',
    badge: 'FFmpeg',
  },
  {
    href: '/tracker',
    emoji: '🔍',
    title: 'Story Arc Tracker',
    desc: 'Follow evolving stories with timelines, entities, sentiment & predictions.',
    color: 'from-green-50 to-teal-50 border-green-200',
    badge: 'Trending',
  },
  {
    href: '/vernacular',
    emoji: '🌐',
    title: 'Vernacular Engine',
    desc: 'Read news in Hindi, Tamil, or Bengali with contextual AI explanations.',
    color: 'from-yellow-50 to-orange-50 border-yellow-200',
    badge: '3 Languages',
  },
  {
    href: '/chatbot',
    emoji: '💬',
    title: 'AI Chatbot',
    desc: 'Ask anything about business, markets, and economics — context-aware Q&A.',
    color: 'from-rose-50 to-red-50 border-rose-200',
    badge: 'Always On',
  },
];

export default function HomePage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="bg-white border-b border-ink-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="ai-badge mb-4 mx-auto w-fit">AI-Native · Personalized · Multilingual</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-950 mb-4 leading-tight">
            My <span className="text-brand-600">ET</span>
          </h1>
          <p className="text-xl text-ink-500 mb-2 font-light">AI Native News Experience</p>
          <p className="text-ink-400 max-w-xl mx-auto mt-3 leading-relaxed">
            Your personalized business newsroom — powered by AI to brief, explain, translate, and visualise the stories that matter most to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/newsroom"
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm">
              Open My Newsroom →
            </Link>
            <Link href="/navigator"
              className="px-6 py-3 bg-white border border-ink-300 text-ink-700 rounded-lg font-medium hover:bg-ink-50 transition-colors">
              Try AI Briefings
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl text-ink-800 mb-8 text-center">Everything in one newsroom</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <Link key={f.href} href={f.href}
              className={`block rounded-xl border bg-gradient-to-br ${f.color} p-6 hover:shadow-md transition-all group`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{f.emoji}</span>
                <span className="text-xs font-medium px-2 py-1 bg-white/70 rounded-full text-ink-500">{f.badge}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink-900 mb-2 group-hover:text-brand-700 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
              <p className="mt-4 text-sm font-medium text-brand-600 group-hover:underline">Explore →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-ink-950 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '8+', label: 'Live Articles' },
            { n: '6', label: 'AI Features' },
            { n: '3', label: 'Indian Languages' },
            { n: '∞', label: 'Questions Answered' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-brand-400">{s.n}</p>
              <p className="text-ink-300 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
