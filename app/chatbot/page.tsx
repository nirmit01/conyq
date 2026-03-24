// app/chatbot/page.tsx
'use client';
import { ChatInterface } from '@/components/chat/ChatInterface';

const SUGGESTED = [
  'What is the current RBI repo rate?',
  'Which Indian IT companies are leading in AI?',
  'How does Sensex performance affect retail investors?',
  'Explain FII vs DII in simple terms',
  'What sectors are best for investment right now?',
  'How is India\'s startup ecosystem performing in 2024?',
];

export default function ChatbotPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-950">💬 AI Business Chatbot</h1>
        <p className="text-ink-400 text-sm mt-1">
          Context-aware Q&A on markets, finance, startups, and Indian economy
        </p>
      </div>

      {/* Suggested questions */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Suggested Questions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                // Dispatch a custom event that the ChatInterface picks up
                window.dispatchEvent(new CustomEvent('suggested-question', { detail: q }));
              }}
              className="text-xs px-3 py-1.5 bg-white border border-ink-200 rounded-full text-ink-600 hover:border-brand-400 hover:text-brand-700 transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden shadow-sm" style={{ height: '65vh' }}>
        <div className="p-3 border-b border-ink-100 bg-ink-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs font-semibold text-ink-500">ET AI Assistant · Always On</p>
        </div>
        <div className="h-[calc(100%-44px)]">
          <ChatBotWithSuggestions />
        </div>
      </div>

      <p className="text-center text-xs text-ink-300 mt-3">
        AI may make mistakes. Verify important financial decisions with qualified advisors.
      </p>
    </div>
  );
}

// Wrapper that listens for suggested question events
function ChatBotWithSuggestions() {
  'use client';
  // The ChatInterface handles its own state; suggested questions
  // are handled via the window event + a patched input simulation
  return (
    <ChatInterface
      placeholder="Ask about Indian markets, finance, startups…"
      systemLabel="ET AI Business Assistant"
    />
  );
}
