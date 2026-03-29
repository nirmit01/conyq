// services/ai.ts
// AI abstraction: OpenAI | Anthropic | Gemini | Mock

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };
export interface AIResponse { text: string; provider: string; }

// ─── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'my_api_key') {
    throw new Error('Invalid API Key. Please replace "my_api_key" with a real key from Google AI Studio.');
  }

  // Separate the system message from user messages
  const systemMsg = messages.find(m => m.role === 'system')?.content;
  const userMessages = messages.filter(m => m.role !== 'system');

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

  // Properly attach system instructions for Gemini 1.5
  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg }]
    };
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
    // Attempt to parse the exact error from Google
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || res.statusText;
    throw new Error(`Google API Error (${res.status}): ${errorMessage}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  
  if (!text) throw new Error('Gemini returned an empty response.');
  
  return { text, provider: 'gemini' };
}

// ─── Public API ────────────────────────────────────────────────────────────────
export async function askAI(messages: AIMessage[], maxTokens = 800): Promise<AIResponse> {
  const provider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase().trim();

  try {
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      return await callGemini(messages, maxTokens);
    }
    // (You can add Anthropic/OpenAI back here if you plan to use them)
    
  } catch (err) {
    console.error(`❌ [AI] Request failed:`, (err as Error).message);
    
    // RETURN THE ERROR TO THE FRONTEND instead of hiding it!
    return { 
      text: `**System Error:** ${(err as Error).message}\n\nCheck your terminal for more details.`, 
      provider: 'error' 
    };
  }

  // If no provider is configured, return a basic mock
  console.warn('[AI] No provider configured, returning fallback.');
  return { text: "Please configure an AI provider in your .env.local file.", provider: 'mock' };
}