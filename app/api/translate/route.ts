// app/api/translate/route.ts
// Translates article content to Hindi, Tamil, or Bengali

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askAI, PROMPTS } from '@/services/ai';
import type { Article } from '@/lib/types';

const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  hindi: {
    default: `**[हिंदी अनुवाद]**\n\nयह लेख भारतीय व्यापार और अर्थव्यवस्था से संबंधित एक महत्वपूर्ण विकास को दर्शाता है। इस समाचार का भारतीय बाजारों, निवेशकों और आम नागरिकों पर महत्वपूर्ण प्रभाव पड़ सकता है।\n\n**संदर्भ:** भारत की अर्थव्यवस्था तेजी से बढ़ रही है और इस तरह के समाचार निवेश निर्णयों को प्रभावित करते हैं। AI सेवा उपलब्ध होने पर पूर्ण अनुवाद प्राप्त करें।`,
  },
  tamil: {
    default: `**[தமிழ் மொழிபெயர்ப்பு]**\n\nஇந்த கட்டுரை இந்திய வணிகம் மற்றும் பொருளாதாரம் தொடர்பான ஒரு முக்கியமான வளர்ச்சியை விவரிக்கிறது. இந்த செய்தி இந்திய சந்தைகள், முதலீட்டாளர்கள் மற்றும் பொதுமக்களை பாதிக்கலாம்.\n\n**சூழல்:** AI சேவை கிடைக்கும் போது முழு மொழிபெயர்ப்பு பெறுங்கள்.`,
  },
  bengali: {
    default: `**[বাংলা অনুবাদ]**\n\nএই নিবন্ধটি ভারতীয় ব্যবসা এবং অর্থনীতি সম্পর্কিত একটি গুরুত্বপূর্ণ উন্নয়ন বর্ণনা করে। এই সংবাদ ভারতীয় বাজার, বিনিয়োগকারী এবং সাধারণ নাগরিকদের উপর প্রভাব ফেলতে পারে।\n\n**প্রসঙ্গ:** AI পরিষেবা উপলব্ধ হলে সম্পূর্ণ অনুবাদ পান।`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { articleId, targetLanguage } = await req.json();
    if (!articleId || !targetLanguage) {
      return NextResponse.json({ error: 'articleId and targetLanguage required' }, { status: 400 });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId) as (Article & { tags: string }) | undefined;
    if (!row) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const textToTranslate = `${row.title}\n\n${row.summary}\n\n${row.content.substring(0, 1000)}`;
    const messages = PROMPTS.translate(textToTranslate, targetLanguage);
    const result = await askAI(messages, 1500);

    // If mock provider, return language-specific mock
    let translation = result.text;
    if (result.provider === 'mock') {
      translation = MOCK_TRANSLATIONS[targetLanguage]?.default ?? translation;
    }

    return NextResponse.json({ translation, provider: result.provider });
  } catch (err) {
    console.error('[API/translate]', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
