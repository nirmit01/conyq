// app/api/story-arcs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';

export async function POST(req: NextRequest) {
  try {
    const { articles } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'No articles provided for analysis.' }, { status: 400 });
    }

    // Define the prompt directly here (instead of importing from ai.ts)
    const messages = [
      {
        role: 'system' as const,
        content: `You are a senior investigative journalist tracking ongoing news stories.
Analyze related articles and identify the narrative arc, key entities, sentiment trend, and make predictions.
Respond ONLY with valid JSON, no markdown, no code blocks.`
      },
      {
        role: 'user' as const,
        content: `Analyze these related articles and produce a story arc summary:

${articles.map((a: any, i: number) => {
  const date = a.published_at ? new Date(a.published_at * 1000).toLocaleDateString() : 'Recent';
  return `${i + 1}. [${date}] ${a.title}: ${a.summary}`;
}).join('\n')}

Return JSON exactly in this format: 
{ "narrative": "string", "sentiment_trend": "string", "key_themes": ["string", "string"], "prediction": "string" }`
      }
    ];

    const result = await askAI(messages, 1000);

    // Safe JSON parsing (the same bulletproof logic from the Article Analyzer!)
    let parsed;
    try {
      const jsonStart = result.text.indexOf('{');
      const jsonEnd = result.text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        // Strip newlines to prevent JSON.parse crashes
        const jsonString = result.text.substring(jsonStart, jsonEnd + 1).replace(/[\n\r]+/g, ' ');
        parsed = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (err) {
      console.warn("[story-arcs] JSON Parse failed. Using fallback.");
      // Fallback if the AI messes up the formatting
      parsed = {
        narrative: "Analysis generated, but the AI formatting was slightly off. Please try again.",
        sentiment_trend: "Unknown",
        key_themes: ["Formatting Error"],
        prediction: "Please refresh the analysis."
      };
    }

    return NextResponse.json(parsed);

  } catch (err) {
    console.error('[API/story-arcs]', err);
    return NextResponse.json({ error: 'Failed to generate story arc.' }, { status: 500 });
  }
}