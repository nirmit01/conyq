// lib/types.ts
// Shared TypeScript types across the application

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  url?: string;
  image_url?: string;
  published_at: number; // Unix timestamp
  sentiment: number;    // -1 to 1
  view_count: number;
  relevanceScore?: number;
  whyMatters?: string;
}

export interface User {
  id: string;
  name: string;
  interests: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface ChatSession {
  id: string;
  user_id: string;
  article_id?: string;
  messages: ChatMessage[];
  created_at: number;
}

export interface StoryArc {
  id: string;
  title: string;
  description?: string;
  article_ids: string[];
  entities: Entity[];
  predictions?: string;
  created_at: number;
  updated_at: number;
  articles?: Article[];
  arcAnalysis?: {
    narrative: string;
    sentiment_trend: string;
    key_themes: string[];
    prediction: string;
  };
}

export interface Entity {
  name: string;
  type: 'Company' | 'Person' | 'Organisation' | 'Place' | 'Policy';
}

export interface GeneratedVideo {
  id: string;
  article_id: string;
  script?: string;
  audio_path?: string;
  video_path?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  created_at: number;
}

export interface NewsBriefing {
  tldr: string;
  key_insights: string[];
  impact: string;
  risks: string[];
  raw: string;
  provider: string;
}

export const INTEREST_OPTIONS = [
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'finance', label: 'Finance & Banking', emoji: '🏦' },
  { id: 'markets', label: 'Stock Markets', emoji: '📈' },
  { id: 'startups', label: 'Startups & VC', emoji: '🚀' },
  { id: 'policy', label: 'Policy & Government', emoji: '⚖️' },
  { id: 'macro', label: 'Macroeconomics', emoji: '🌐' },
  { id: 'real-estate', label: 'Real Estate', emoji: '🏢' },
  { id: 'crypto', label: 'Crypto & Web3', emoji: '₿' },
  { id: 'sustainability', label: 'Sustainability', emoji: '🌱' },
  { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
];

export const LANGUAGES = [
  { id: 'hindi', label: 'हिंदी', name: 'Hindi', flag: '🇮🇳' },
  { id: 'tamil', label: 'தமிழ்', name: 'Tamil', flag: '🇮🇳' },
  { id: 'bengali', label: 'বাংলা', name: 'Bengali', flag: '🇮🇳' },
];
