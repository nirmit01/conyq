// components/news/HeroSection.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { timeAgo, getCategoryColor, getSentimentEmoji } from '@/lib/utils';
import type { Article } from '@/lib/types';
import { Volume2, Zap } from 'lucide-react';
import { speakText } from '@/services/tts';

interface Props {
  articles: Article[];
}

export function HeroSection({ articles }: Props) {
  if (!articles.length) return null;

  const [hero, ...secondary] = articles.slice(0, 3);
  const secondaryArticles = secondary.slice(0, 2);

  const handleReadAloud = (article: Article) => {
    speakText({ text: `${article.title}. ${article.summary}` });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Main hero article */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden group" style={{ minHeight: '420px' }}>
          {hero.image_url && (
            <Image
              src={hero.image_url}
              alt={hero.title}
              fill
              priority
              className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
              unoptimized
            />
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />

          {/* Live badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(hero.category)}`}>
              {hero.category}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-white/60 text-xs mb-2">
              {hero.source} · {timeAgo(hero.published_at)}
            </p>
            {hero.url ? (
              <a href={hero.url} target="_blank" rel="noopener noreferrer" className="block">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-3 group-hover:text-orange-200 transition-colors">
                  {hero.title}
                </h2>
              </a>
            ) : (
              <Link href={`/navigator?article=${hero.id}`}>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-3 group-hover:text-orange-200 transition-colors">
                  {hero.title}
                </h2>
              </Link>
            )}
            <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mb-4">
              {hero.summary}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleReadAloud(hero)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                title="Read aloud"
              >
                <Volume2 size={15} />
              </button>
              <Link
                href={`/navigator?article=${hero.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Zap size={14} />
                AI Briefing
              </Link>
              {hero.url ? (
                <a
                  href={hero.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  Read Full Article
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Secondary articles */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {secondaryArticles.map(article => (
            <div
              key={article.id}
              className="relative rounded-2xl overflow-hidden group flex-1"
              style={{ minHeight: '200px' }}
            >
              {article.image_url && (
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  unoptimized
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)',
                }}
              />
              <div className="absolute top-3 left-3">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white/50 text-[10px] mb-1">
                  {article.source} · {timeAgo(article.published_at)}
                </p>
                {article.url ? (
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <h3 className="font-display text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors">
                      {article.title}
                    </h3>
                  </a>
                ) : (
                  <Link href={`/navigator?article=${article.id}`}>
                    <h3 className="font-display text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                )}
                <p className="text-white/60 text-xs mt-1 line-clamp-1">
                  {getSentimentEmoji(article.sentiment)} {article.summary}
                </p>
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Read Full Article
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                ) : (
                  <Link
                    href={`/navigator?article=${article.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    AI Briefing
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}