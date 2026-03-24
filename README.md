# My ET — AI Native News Experience

A full-stack, AI-powered business news platform inspired by the Economic Times.

## Features

| Feature | Description |
|---|---|
| 🗞️ Personalized Newsroom | AI-ranked feed based on your interests + "Why this matters to you" |
| 🧭 News Navigator | AI briefings: TLDR, Key Insights, Impact, Risks + in-article chat |
| 🎬 AI Video Generator | Article → AI script → FFmpeg video pipeline |
| 🔍 Story Arc Tracker | Timeline, entities, sentiment trend, AI predictions |
| 🌐 Vernacular Engine | Translate to Hindi, Tamil, Bengali with context |
| 💬 AI Chatbot | Context-aware business & finance Q&A |
| 🔊 Read Aloud | Browser TTS for any article or translation |

## Quick Start

```bash
# 1. Clone / unzip the project
# 2. Install dependencies
npm install

# 3. Configure environment (optional — works with mock AI out of the box)
cp .env.example .env.local

# 4. Run the dev server
npm run dev

# 5. Open in browser
open http://localhost:3000
```

## Configuration

Edit `.env.local`:

```env
# AI Provider — leave empty to use built-in mock responses
OPENAI_API_KEY=sk-...          # Optional: enables GPT-4o-mini
ANTHROPIC_API_KEY=sk-ant-...   # Optional: enables Claude Haiku
AI_PROVIDER=mock               # "openai" | "anthropic" | "mock"
```

The app works **fully offline** with mock AI responses. Add an API key to unlock real AI briefings, translations, and chat.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **Database**: SQLite via `better-sqlite3` (zero setup)
- **AI**: OpenAI GPT-4o-mini / Anthropic Claude Haiku / Mock fallback
- **Video**: FFmpeg via `fluent-ffmpeg` (install separately)
- **TTS**: Browser Web Speech API (no external service needed)

## FFmpeg Setup (for Video feature)

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows — download from https://ffmpeg.org/download.html
```

## Project Structure

```
my-et/
├── app/
│   ├── api/                  # API routes
│   ├── newsroom/             # Personalized feed
│   ├── navigator/            # AI briefings
│   ├── video/                # Video generator
│   ├── tracker/              # Story arc tracker
│   ├── vernacular/           # Multilingual engine
│   └── chatbot/              # AI chatbot
├── components/
│   ├── ui/                   # Navbar, Ticker, Skeleton
│   ├── news/                 # ArticleCard
│   └── chat/                 # ChatInterface
├── lib/
│   ├── db.ts                 # SQLite + schema + seed data
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── services/
│   ├── ai.ts                 # AI abstraction (OpenAI/Anthropic/Mock)
│   ├── tts.ts                # Text-to-speech
│   └── video.ts              # FFmpeg pipeline
├── styles/
│   └── globals.css           # Tailwind + custom styles
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Database

SQLite database is auto-created at `./data/my-et.db` on first run. It includes:
- 8 seeded articles from Indian business news
- 1 story arc (India AI Revolution 2024)
- Default user profile with interests

No migration or setup commands needed.

## Deployment

```bash
npm run build
npm start
```

For production, set environment variables in your hosting provider (Vercel, Railway, etc.).
