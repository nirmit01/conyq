// app/vernacular/page.tsx
'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/types';
import { LANGUAGES } from '@/lib/types';
import { timeAgo, getCategoryColor } from '@/lib/utils';
import { Loader2, Volume2 } from 'lucide-react';
import { speakText, LANG_CODES } from '@/services/tts';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

export default function VernacularPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [targetLang, setTargetLang] = useState('hindi');
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [originalTitle, setOriginalTitle] = useState(''); // To display the scraped title

  useEffect(() => {
    fetch('/api/articles?limit=8')
      .then(r => r.json())
      .then(({ articles: arts }) => {
        setArticles(arts);
        setSelected(arts[0] ?? null);
        setLoading(false);
      });
  }, []);

  const translateUrl = async () => {
    if (!urlInput.trim() || translating) return;
    
    // Clear selection so the UI switches to URL mode
    setSelected(null); 
    setTranslating(true);
    setTranslation('');
    setOriginalTitle('');
    
    try {
      const targetLangName = LANGUAGES.find(l => l.id === targetLang)?.name || targetLang;

      const res = await fetch('/api/translate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: urlInput,
          targetLanguage: targetLangName 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      
      setTranslation(data.translation);
      setProvider(data.provider);
      setOriginalTitle(data.originalTitle);
    } catch (err) {
      console.error(err);
      setTranslation(`⚠️ ${(err as Error).message}`);
    } finally {
      setTranslating(false);
    }
  };
  const translate = async () => {
    if (!selected || translating) return;
    setTranslating(true);
    setTranslation('');
    
    try {
      // Find the actual language name (e.g., "Hindi", "Tamil", "Bengali")
      const targetLangName = LANGUAGES.find(l => l.id === targetLang)?.name || targetLang;

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: selected.title, 
          // Pass the content (or fallback to summary if content isn't loaded)
          content: selected.content || selected.summary,
          targetLanguage: targetLangName 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      
      setTranslation(data.translation);
      setProvider(data.provider);
    } catch (err) {
      console.error(err);
      setTranslation('⚠️ Translation failed. Please check your AI API key and try again.');
    } finally {
      setTranslating(false);
    }
  };

  const readAloud = () => {
    if (!translation) return;
    const langCode = LANG_CODES[targetLang] ?? 'hi-IN';
    speakText({ text: translation.replace(/\*\*/g, '').replace(/#+/g, ''), lang: langCode, rate: 0.8 });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-950">🌐 Vernacular Engine</h1>
        <p className="text-ink-400 text-sm mt-1">Read business news in Hindi, Tamil, or Bengali with AI context</p>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Article + language selector */}
        <div className="space-y-4">
          {/* Language selector */}
          <div className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Select Language</p>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => { setTargetLang(lang.id); setTranslation(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                    targetLang === lang.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-ink-200 text-ink-600 hover:border-brand-300 bg-white'
                  }`}>
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-xs">{lang.name}</span>
                  <span className={`text-xs font-bold ${targetLang === lang.id ? 'text-brand-100' : 'text-ink-400'}`}>
                    {lang.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Article list */}
          <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
            <div className="p-3 border-b border-ink-100 bg-ink-50">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Select Article</p>
            </div>
            {/* OR Divider */}
          <div className="flex items-center gap-3 my-2">
            <hr className="flex-1 border-ink-200" />
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">OR</span>
            <hr className="flex-1 border-ink-200" />
          </div>

          {/* URL Input Section */}
          <div className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Paste Article URL</p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://economictimes.com/..."
              className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 mb-3"
            />
            <button
              onClick={translateUrl}
              disabled={!urlInput.trim() || translating}
              className="w-full py-2.5 bg-ink-800 text-white rounded-lg font-medium text-sm hover:bg-ink-900 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {translating && !selected
                ? <><Loader2 size={16} className="animate-spin" /> Fetching & Translating…</>
                : `Translate URL`
              }
            </button>
          </div>
            <div className="overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="p-4 text-center text-ink-400 text-sm">Loading…</div>
              ) : articles.map(article => (
                <button
                  key={article.id}
                  onClick={() => { setSelected(article); setTranslation(''); }}
                  className={`w-full text-left p-3 border-b border-ink-50 hover:bg-ink-50 transition-colors flex gap-3 ${selected?.id === article.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}>
                  {article.image_url && (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-ink-100">
                      <Image src={article.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs px-1 py-0.5 rounded capitalize ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <p className="text-xs font-medium text-ink-800 mt-1 line-clamp-2">{article.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Translate button */}
          <button
            onClick={translate}
            disabled={!selected || translating}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {translating
              ? <><Loader2 size={16} className="animate-spin" /> Translating…</>
              : `Translate to ${LANGUAGES.find(l => l.id === targetLang)?.name}`
            }
          </button>
        </div>

        {/* Translation output */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {selected && !translation && !translating && (
            <div className="p-5 border-b border-ink-100">
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${getCategoryColor(selected.category)}`}>
                {selected.category}
              </span>
              <h2 className="font-display text-lg font-semibold text-ink-900 mt-2 leading-snug">{selected.title}</h2>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">{selected.summary}</p>
              <p className="text-xs text-ink-400 mt-3">
                Select a language and click Translate to read in your preferred language
              </p>
            </div>
          )}

          {translating && (
            <div className="flex flex-col items-center justify-center py-16 text-ink-400">
              <Loader2 className="animate-spin mb-3" size={28} />
              <p className="text-sm">Translating with AI…</p>
              <p className="text-xs mt-1 text-ink-300">Context-aware translation in progress</p>
            </div>
          )}

          {translation && (
            <>
              <div className="p-4 border-b border-ink-100 flex items-center justify-between bg-ink-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{LANGUAGES.find(l => l.id === targetLang)?.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">
                      {LANGUAGES.find(l => l.id === targetLang)?.name} Translation
                    </p>
                    {provider && (
                      <p className="text-xs text-ink-400">via {provider}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={readAloud}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs font-medium text-ink-600 hover:bg-white transition-colors">
                  <Volume2 size={13} />
                  Read Aloud
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[65vh]">
                <div className="markdown-content prose prose-sm max-w-none">
                  <ReactMarkdown>{translation}</ReactMarkdown>
                </div>
              </div>

              {/* Original article link */}
              {(selected || originalTitle) && (
                <div className="p-4 border-t border-ink-100 bg-ink-50">
                  <p className="text-xs text-ink-400 mb-1">Original (English)</p>
                  <p className="text-sm font-medium text-ink-700 line-clamp-1">
                    {selected ? selected.title : originalTitle}
                  </p>
                  {selected ? (
                    <a href={`/navigator?article=${selected.id}`} className="text-xs text-brand-600 hover:underline">
                      View AI Briefing →
                    </a>
                  ) : (
                    <a href={urlInput} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">
                      Read Original Article ↗
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {!selected && !translation && !translating && (
            <div className="flex items-center justify-center h-64 text-ink-300 text-center p-8">
              <div>
                <p className="text-4xl mb-3">🌐</p>
                <p className="text-sm text-ink-500">Select an article and language to begin translation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
