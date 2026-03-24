// services/ai.ts
// Abstraction layer for AI providers: OpenAI, Anthropic, or Mock

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export interface AIResponse {
  text: string;
  provider: string;
}

// ─── Mock responses ────────────────────────────────────────────────────────────

const MOCK_BRIEFING = (title: string) => `## TLDR
${title} represents a pivotal development in India's economic landscape, with far-reaching implications for investors and consumers alike.

## Key Insights
- **Market Impact**: This development signals a structural shift in the sector, not just a cyclical move.
- **Policy Dimension**: Regulatory tailwinds are aligning with market forces for the first time in years.
- **Consumer Angle**: End-users stand to benefit through better pricing, services, or opportunities.
- **Competitive Dynamics**: Incumbents face pressure to innovate while new entrants see a window of opportunity.

## Impact
The short-term impact is likely to be positive for market sentiment. Medium-term, execution risk and global macro headwinds remain the key variables to watch. Institutional investors are already repositioning.

## Risks
- **Execution Risk**: Large-scale transformations often face implementation delays.
- **Global Macro**: A risk-off environment triggered by US Fed policy or geopolitical events could mute domestic positives.
- **Regulatory Uncertainty**: While current signals are favourable, policy reversals remain a tail risk.
- **Competitive Response**: Established players may respond aggressively, compressing margins.`;

const MOCK_CHAT_RESPONSES = [
  "Based on the article context, this is a significant development that reflects broader trends in India's growth story. The key thing to watch is whether execution matches ambition.",
  "Great question. The implications are multi-layered. In the near term, expect market volatility as participants price in the new information. Longer term, the structural thesis remains intact.",
  "This connects to the larger narrative of India's decade — strong domestic consumption, improving infrastructure, and a young, digitally-native workforce. The article is one data point in that arc.",
  "The risks here are real but manageable. The upside scenario — where everything goes to plan — is well understood. The more interesting question is the downside scenario and how resilient the underlying fundamentals are.",
];

let mockChatIndex = 0;

// ─── Provider implementations ──────────────────────────────────────────────────

async function callOpenAI(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: maxTokens,
  });

  return {
    text: response.choices[0]?.message?.content ?? '',
    provider: 'openai',
  };
}

async function callAnthropic(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemMsg = messages.find(m => m.role === 'system')?.content;
  const userMessages = messages.filter(m => m.role !== 'system') as { role: 'user' | 'assistant'; content: string }[];

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: maxTokens,
    system: systemMsg,
    messages: userMessages,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return { text, provider: 'anthropic' };
}

async function callGemini(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Convert messages → single prompt (Gemini doesn't take chat format like OpenAI)
  const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

  const result = await model.generateContent(prompt);

  return {
    text: result.response.text(),
    provider: "gemini",
  };
}

function callMock(messages: AIMessage[]): AIResponse {
  const lastUser = messages.filter(m => m.role === 'user').pop()?.content ?? '';
  const isChat = !lastUser.includes('Generate a structured news briefing');

  if (isChat) {
    const resp = MOCK_CHAT_RESPONSES[mockChatIndex % MOCK_CHAT_RESPONSES.length];
    mockChatIndex++;
    return { text: resp, provider: 'mock' };
  }

  // Extract title hint from briefing prompt
  const titleMatch = lastUser.match(/Title: (.+)/);
  const title = titleMatch?.[1] ?? 'This market development';
  return { text: MOCK_BRIEFING(title), provider: 'mock' };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function askAI(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const provider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();

  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      return await callOpenAI(messages, maxTokens);
    }
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(messages, maxTokens);
    }
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      return await callGemini(messages, maxTokens);
    }
    // Auto-detect from available keys
    if (provider === 'openai') return await callOpenAI(messages, maxTokens);
    if (provider === 'anthropic') return await callAnthropic(messages, maxTokens);
    if (provider === 'gemini') return await callGemini(messages, maxTokens);
  } catch (err) {
    console.error('[AI] Provider failed, falling back to mock:', err);
  }

  return callMock(messages);
}

// ─── Prompt builders ───────────────────────────────────────────────────────────

export const PROMPTS = {
  briefing: (article: { title: string; content: string; category: string }) => [
    {
      role: 'system' as const,
      content: `You are a senior financial journalist at the Economic Times of India. 
You produce concise, insightful briefings for busy professionals.
Always format your response in Markdown with exactly these four sections:
## TLDR
## Key Insights  
## Impact
## Risks`,
    },
    {
      role: 'user' as const,
      content: `Generate a structured news briefing for this article.

Title: ${article.title}
Category: ${article.category}
Content: ${article.content.substring(0, 2000)}

Produce the TLDR (2-3 sentences), Key Insights (4 bullet points), Impact (2 paragraphs), and Risks (4 bullet points).`,
    },
  ],

  chat: (article: { title: string; summary: string }, history: AIMessage[], question: string) => [
    {
      role: 'system' as const,
      content: `You are an expert financial analyst helping a reader understand a news article.
Be concise, insightful, and reference the article when relevant.
Article context — Title: "${article.title}". Summary: "${article.summary}".`,
    },
    ...history.slice(-6), // Keep last 6 messages for context
    { role: 'user' as const, content: question },
  ],

  translate: (text: string, targetLang: string) => [
    {
      role: 'system' as const,
      content: `You are an expert translator and journalist. Translate the given English financial news text into ${targetLang}. 
Keep financial terms accurate. Use natural, readable language appropriate for news. 
Provide a brief contextual explanation after the translation if helpful.`,
    },
    {
      role: 'user' as const,
      content: `Translate this to ${targetLang}:\n\n${text}`,
    },
  ],

  videoScript: (article: { title: string; summary: string; content: string }) => [
    {
      role: 'system' as const,
      content: `You are a broadcast news scriptwriter. Write a 60-second TV news script (approximately 150 words) 
that can be read aloud clearly. Use short sentences. Start with a strong hook. End with implications.`,
    },
    {
      role: 'user' as const,
      content: `Write a 60-second broadcast script for this story:

Title: ${article.title}
Summary: ${article.summary}
Content: ${article.content.substring(0, 800)}`,
    },
  ],

  storyArc: (articles: Array<{ title: string; summary: string; published_at: number }>) => [
    {
      role: 'system' as const,
      content: `You are a senior investigative journalist tracking ongoing news stories. 
Analyze a series of related articles and identify the narrative arc, key entities, sentiment trend, and make predictions.
Respond in JSON format only.`,
    },
    {
      role: 'user' as const,
      content: `Analyze these related articles and produce a story arc summary:

${articles.map((a, i) => `${i + 1}. [${new Date(a.published_at * 1000).toLocaleDateString()}] ${a.title}: ${a.summary}`).join('\n')}

Return JSON with: { "narrative": string, "sentiment_trend": string, "key_themes": string[], "prediction": string }`,
    },
  ],

  whyMatters: (article: { title: string; summary: string }, interests: string[]) => [
    {
      role: 'system' as const,
      content: 'You are a personalized news assistant. Given a user\'s interests, explain in 1-2 sentences why a specific news article matters to them.',
    },
    {
      role: 'user' as const,
      content: `User interests: ${interests.join(', ')}.
Article: "${article.title}" — ${article.summary}

Write a 1-2 sentence "Why this matters to you" explanation. Be specific and personal.`,
    },
  ],
};
