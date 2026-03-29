// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';

export async function POST(req: NextRequest) {
  try {
    const { title, content, targetLanguage } = await req.json();

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing article content or target language.' }, 
        { status: 400 }
      );
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert financial journalist and native translator for The Economic Times.
Your task is to translate English business news into ${targetLanguage}.

REQUIREMENTS:
1. Keep financial terms accurate but accessible. Use natural, readable language.
2. Format the response entirely in Markdown.
3. Start with the translated Title as an H2 (##).
4. Provide the translated article body.
5. At the very end, add a section called "💡 AI Context" (translated into ${targetLanguage}). In 2-3 bullet points, explain any complex financial jargon, macroeconomic concepts, or India-specific context mentioned in the article so a layperson can easily understand it.`
      },
      {
        role: 'user' as const,
        content: `TITLE: ${title || 'Business News'}\n\nCONTENT:\n${content}`
      }
    ];

    // Give it 1000 tokens since translations + context can get a bit long
    const result = await askAI(messages, 1000);

    return NextResponse.json({
      translation: result.text,
      provider: result.provider
    });

  } catch (err) {
    console.error('[API/translate]', err);
    return NextResponse.json(
      { error: 'Translation failed. Please try again.' }, 
      { status: 500 }
    );
  }
}