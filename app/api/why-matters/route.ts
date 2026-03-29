// app/api/why-matters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';

export async function POST(req: NextRequest) {
  // 1. Declare 'interests' OUTSIDE the try block so the catch block can see it!
  let interests = ['business and finance'];

  try {
    const body = await req.json();
    
    const title = body.article?.title || body.title || 'this news article';
    const summary = body.article?.summary || body.summary || '';
    
    // 2. Update interests if the frontend provided them
    if (Array.isArray(body.interests) && body.interests.length > 0) {
      interests = body.interests;
    } else if (typeof body.interests === 'string' && body.interests.trim() !== '') {
      interests = [body.interests];
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are a personalized news assistant. Given a user's interests, explain in exactly 1-2 sentences why a news article matters to them personally. Be specific, not generic.`
      },
      {
        role: 'user' as const,
        content: `User interests: ${interests.join(', ')}.
Article: "${title}" — ${summary}

Write a 1-2 sentence "Why this matters to you" explanation. Start with an emoji relevant to the topic.`
      }
    ];

    const result = await askAI(messages, 300);

    return NextResponse.json({
      explanation: result.text,
      provider: result.provider
    });

  } catch (err) {
    console.error('[API/why-matters]', err);
    
    const errorMessage = (err as Error).message;
    
    // Now the catch block can safely access 'interests[0]'!
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
      return NextResponse.json({ 
        explanation: `💡 Highly relevant to your interest in ${interests[0]}. (AI cooling down to prevent rate limits)`,
        provider: 'fallback'
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate personalized explanation.' },
      { status: 500 }
    );
  }
}