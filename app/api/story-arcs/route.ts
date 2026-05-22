// app/api/story-arcs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';

// Static mock story arcs for serverless deployment
const STORY_ARCS = [
  {
    id: 'arc-ai-india-2024',
    title: 'India AI Revolution 2024',
    description: 'Tracking the rise of artificial intelligence adoption across Indian enterprises and government initiatives',
    article_ids: ['art-001', 'art-003', 'art-007'],
    entities: [
      { name: 'Infosys', type: 'Company' },
      { name: 'TCS', type: 'Company' },
      { name: 'NASSCOM', type: 'Organisation' },
      { name: 'Narendra Modi', type: 'Person' },
      { name: 'OpenAI', type: 'Company' },
    ],
    predictions: 'AI adoption in India expected to contribute $500B to GDP by 2030. Expect major policy announcements in Q3.',
    created_at: 1713004800,
    updated_at: 1713004800,
  },
  {
    id: 'arc-markets-rally-2024',
    title: 'Markets Rally on Rate Cut Hopes',
    description: 'Sensex crosses 85,000 as FIIs return and RBI signals pivot to neutral stance',
    article_ids: ['art-002', 'art-005', 'art-008'],
    entities: [
      { name: 'RBI', type: 'Organisation' },
      { name: 'Shaktikanta Das', type: 'Person' },
      { name: 'Sensex', type: 'Index' },
      { name: 'Tata Motors', type: 'Company' },
      { name: 'Reliance Jio', type: 'Company' },
    ],
    predictions: 'With FIIs returning and rate cuts on the horizon, markets could see 10-15% upside by end of FY25.',
    created_at: 1713004800,
    updated_at: 1713004800,
  },
  {
    id: 'arc-ev-push-2024',
    title: 'India EV Acceleration',
    description: 'Government launches ₹15,000 Cr EV Mission 2.0 targeting 30% penetration by 2030',
    article_ids: ['art-006'],
    entities: [
      { name: 'Govt of India', type: 'Organisation' },
      { name: 'Ola Electric', type: 'Company' },
      { name: 'Bajaj Auto', type: 'Company' },
      { name: ' kinetic Green', type: 'Company' },
    ],
    predictions: 'Two-wheeler EV penetration could reach 15% by 2026, driven by new subsidies and improving charging infra.',
    created_at: 1713004800,
    updated_at: 1713004800,
  },
];

export async function GET() {
  try {
    // Return static story arcs (no database needed for serverless)
    return NextResponse.json({ arcs: STORY_ARCS });
  } catch (err) {
    console.error('[API/story-arcs GET]', err);
    return NextResponse.json({ error: 'Failed to fetch story arcs', arcs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { articles } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'No articles provided for analysis.' }, { status: 400 });
    }

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

    let parsed;
    try {
      const jsonStart = result.text.indexOf('{');
      const jsonEnd = result.text.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = result.text.substring(jsonStart, jsonEnd + 1).replace(/[\n\r]+/g, ' ');
        parsed = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch {
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
