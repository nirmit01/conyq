// app/api/daily-briefing/route.ts
// Generates a role-specific 3-minute daily news briefing

import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/ai';
import { fetchAllFeeds } from '@/lib/rss';

export type Role = 'entrepreneur' | 'investor' | 'student';

const ROLE_CONTEXT: Record<Role, {
  label: string;
  focus: string;
  lens: string;
  priorities: string[];
}> = {
  entrepreneur: {
    label: 'Entrepreneur',
    focus: 'business opportunities, market gaps, regulatory changes, funding landscape, and competitive dynamics',
    lens: 'How does this affect my business, my costs, my customers, and my competitive moat?',
    priorities: [
      'Market opportunities and new business models',
      'Regulatory changes that open or close doors',
      'Funding environment and investor sentiment',
      'Technology shifts that could disrupt or enable',
      'Consumer behaviour and demand signals',
    ],
  },
  investor: {
    label: 'Investor',
    focus: 'market movements, sectoral trends, macroeconomic signals, valuation implications, and risk factors',
    lens: 'What does this mean for asset prices, portfolio allocation, and risk-reward balance?',
    priorities: [
      'Macro signals: rates, inflation, liquidity',
      'Sectoral rotation and relative strength',
      'Earnings and valuation catalysts',
      'Geopolitical and regulatory risk',
      'FII/DII flows and institutional positioning',
    ],
  },
  student: {
    label: 'Student',
    focus: 'key concepts, career implications, learning opportunities, and real-world applications of academic theory',
    lens: 'What should I understand about this, and how does it connect to what I\'m studying?',
    priorities: [
      'Core economic and business concepts in action',
      'Career and job market implications',
      'Policy and its real-world effects',
      'Company strategies and case study material',
      'Financial literacy and market understanding',
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json() as { role: Role };

    if (!role || !ROLE_CONTEXT[role]) {
      return NextResponse.json({ error: 'Invalid role. Must be entrepreneur, investor, or student.' }, { status: 400 });
    }

    const ctx = ROLE_CONTEXT[role];
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Fetch today's top articles for context
    let newsContext = '';
    try {
      const articles = await fetchAllFeeds();
      const top12 = articles.slice(0, 12);
      newsContext = top12.map((a, i) =>
        `${i + 1}. [${a.category.toUpperCase()}] ${a.title}\n   ${a.summary.slice(0, 200)}`
      ).join('\n\n');
    } catch {
      newsContext = 'Today\'s top Indian business news covering markets, technology, startups, policy and geopolitics.';
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are a senior editor at the Economic Times of India, writing a comprehensive daily news briefing.
Write with authority, clarity, and sharp insight. Format using Markdown. Use headers, bold text, and bullet points effectively.`,
      },
      {
        role: 'user' as const,
        content: `Write a detailed Daily Briefing for today, ${today}, specifically tailored for a ${ctx.label}.

The ${ctx.label}'s lens: "${ctx.lens}"

Their key priorities:
${ctx.priorities.map(p => `- ${p}`).join('\n')}

Today's top Indian business news:
${newsContext}

Write a complete, structured briefing following exactly this format:

1. "The Big Picture" (2-3 sentences summarizing the overall macro mood today).
2. "Top Stories & Impact" - analyze EVERY SINGLE news story provided. For EACH story, provide:
   - A bold headline with an emoji.
   - 1-2 sentences summarizing what happened.
   - A NEW, separate paragraph starting with **The ${ctx.label} Angle:** explaining how this affects them.
3. "Your Action Items" — exactly 3 specific, concrete actions they should take today.`,
      },
    ];

    const result = await askAI(messages, 2500);

    return NextResponse.json({
      briefing: result.text,
      role: ctx.label,
      provider: result.provider,
      date: today,
      article_count: newsContext.split('\n\n').length,
    });
  } catch (err) {
    console.error('[API/daily-briefing]', err);
    return NextResponse.json({ error: 'Failed to generate briefing. Please try again.' }, { status: 500 });
  }
}