// services/ai.ts
// AI abstraction: Gemini (primary)

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };
export interface AIResponse { text: string; provider: string; }

// ─── Gemini ────────────────────────────────────────────────────────────────────
export async function callGemini(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not set. Please add your Gemini API key to .env.local');
  }

  // Separate system message and user messages
  const systemMsg = messages.find(m => m.role === 'system')?.content;
  const userMessages = messages.filter(m => m.role !== 'system');

  // Convert messages to Gemini format
  const contents = userMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  };

  // Attach system instruction for Gemini 1.5+
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || res.statusText;
    throw new Error(`Gemini API Error (${res.status}): ${errorMessage}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) throw new Error('Gemini returned an empty response.');

  return { text, provider: 'gemini' };
}

// ─── Public API ────────────────────────────────────────────────────────────────
export async function askAI(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      return await callGemini(messages, maxTokens);
    }
    throw new Error('GEMINI_API_KEY not configured');
  } catch (err) {
    console.error('[AI] Request failed:', (err as Error).message);
    return {
      text: `**Configuration Error:** ${(err as Error).message}\n\nPlease add your Gemini API key to .env.local as GEMINI_API_KEY`,
      provider: 'error'
    };
  }
}