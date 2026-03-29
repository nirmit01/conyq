// app/api/daily-briefing/route.ts
// Generates a role-specific 3-minute daily news briefing
// Uses today's top RSS articles as context

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

// Fallback mock briefings per role
const MOCK_BRIEFINGS: Record<Role, string> = {
  entrepreneur: `# 🚀 Your 3-Minute Entrepreneur Briefing

**Good morning, Founder.** Here's what matters to your business today.

---

## 🔑 The Big Picture
India's growth trajectory continues to favour digital-first businesses. With inflation cooling and the RBI signalling a potential rate pivot, credit conditions for SMEs and startups could ease meaningfully in the next two quarters — a significant tailwind if you're planning to raise debt or expand.

## 💡 Opportunity Signals
**AI adoption is accelerating faster than hiring.** Large enterprises are allocating significant budget to AI tools, but implementation expertise is scarce. If you're building in the B2B AI tooling space, enterprise appetite has rarely been stronger.

**EV ecosystem gaps remain wide.** The government's ₹15,000 Cr EV push creates second-order opportunities beyond just vehicle manufacturing — charging infrastructure, battery management software, fleet telematics, and financing products are all underserved.

## ⚡ Watch Closely
Regulatory changes in fintech lending norms could affect customer acquisition costs if you rely on BNPL or credit-led growth loops. Review your unit economics under a tighter credit scenario.

## 📊 Market Pulse
- Startup funding recovered 23% in Q3 — late-stage deals dominate, but seed activity is picking up
- B2B SaaS multiples stabilising around 6-8x ARR for profitable companies
- Southeast Asia expansion paths opening up for Indian SaaS founders

## ✅ Your Action Items
1. **Reassess your AI stack** — are you using AI to reduce headcount costs or drive revenue? The market rewards the latter
2. **Map the EV opportunity** — even non-EV businesses should audit how electrification affects their supply chain
3. **Stress-test your CAC** — model a scenario where credit costs rise 200bps for your customers

---
*Briefing covers top stories from the last 24 hours · Estimated read: 3 minutes*`,

  investor: `# 📈 Your 3-Minute Investor Briefing

**Good morning.** Here's the market intelligence that moves portfolios today.

---

## 🎯 The Macro Setup
The RBI's shift to a neutral stance is the single most important macro development of the quarter. Markets are pricing in 50-75bps of cuts through 2025. This changes the calculus for rate-sensitive sectors: banking, real estate, and NBFCs all look more interesting than they did six months ago.

## 📊 Sectoral Signals

**Overweight thesis strengthening:**
- **IT Services** — AI adoption tailwinds, deal wins accelerating post-wage cycle normalisation
- **Auto** — JLR margin expansion proves Indian auto can compete globally; EV transition creating winners
- **Banking** — Credit costs near cyclical lows; liability franchise advantage compounds

**Underweight / watch:**
- **Consumer Staples** — Rural recovery slower than urban; input costs may inflate if monsoon disappoints
- **Metals** — China demand uncertainty caps the upside; watch inventory cycles closely

## 🌐 FII Watch
Foreign flows turned positive last week at ₹10,400 Cr in a single session — the highest in 14 months. This follows US Fed's 50bps cut signalling. Sustained FII buying at this level could push Nifty to test 26,500 in the near term.

## ⚠️ Risk Factors
- Valuations at 21x forward earnings leave little room for earnings misses
- Geopolitical risk (Middle East, Taiwan Strait) could trigger risk-off at any point
- Crude oil above $90 would import inflation and pressure the RBI

## ✅ Portfolio Moves to Consider
1. **Add rate-sensitive exposure** — HDFC Bank, SBI, top-tier NBFCs on dips
2. **Review your IT allocation** — Q2 results will be the tell; don't chase before earnings
3. **Keep 8-10% cash** — the correction risk is real at these valuations

---
*Briefing covers top stories from the last 24 hours · Estimated read: 3 minutes*`,

  student: `# 📚 Your 3-Minute Student Briefing

**Good morning, Scholar.** Today's news is a live classroom — here's what to learn from it.

---

## 🧠 The Big Concept Today: Monetary Policy Transmission
The RBI held rates at 6.5% but changed its stance to "neutral." This is a perfect real-world example of **forward guidance** — a tool central banks use to influence expectations without actually changing rates yet.

**Why it matters for your studies:**
This bridges macroeconomics theory (IS-LM models, Taylor Rule) with market reality. The bond market moved before any rate was actually cut — prices reflect expectations, not just current facts.

## 📖 Case Study: Infosys AI Strategy
Infosys announcing ₹10,000 Cr AI revenue target is a textbook **Blue Ocean Strategy** play — they're not just competing in existing markets, they're trying to define a new category (enterprise AI services).

**Connect this to:**
- Porter's Five Forces: How does AI change the competitive dynamics of IT services?
- BCG Matrix: Which of Infosys's business units are now Stars vs Cash Cows?
- Agency theory: How do you align 200,000 employees around an AI transformation?

## 💼 Career Intelligence
- **Demand is surging** for roles at the intersection of finance + technology
- Data Science and AI roles in BFSI sector up 40% YoY
- MBA applications to IIMs up 18% — competition for top roles intensifying

## 📰 Vocabulary Builder
- **FII (Foreign Institutional Investor):** Large foreign funds that buy Indian stocks
- **EBIT Margin:** Earnings Before Interest & Tax as % of revenue — measures operational efficiency
- **Repo Rate:** The rate at which RBI lends to banks — the lever for controlling inflation

## ✅ Study Actions
1. **Write a 200-word analysis** of why Sensex crossing 85,000 matters (or doesn't) for the average Indian
2. **Map Jio's international expansion** to the Uppsala Internationalisation Model you studied
3. **Quiz yourself:** What's the difference between WPI and CPI inflation? (Hint: today's news mentions both)

---
*Briefing covers top stories from the last 24 hours · Estimated read: 3 minutes*`,
};

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json() as { role: Role };

    if (!role || !ROLE_CONTEXT[role]) {
      return NextResponse.json({ error: 'Invalid role. Must be entrepreneur, investor, or student.' }, { status: 400 });
    }

    const ctx = ROLE_CONTEXT[role];

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



    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const messages = [
      {
        role: 'system' as const,
        content: `You are a senior editor at the Economic Times of India, writing a comprehensive, highly detailed daily news briefing.
You write with authority, clarity, and sharp insight.
Format using Markdown. Use headers, bold text, and bullet points effectively.`,
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
2. "Top Stories & Impact" - THIS IS THE MOST IMPORTANT SECTION. You must analyze EVERY SINGLE news story provided in the context above. Do not skip any. For EACH story, provide:
   - A bold headline with an emoji.
   - 1-2 sentences summarizing what happened.
   - A NEW, separate paragraph starting with **The ${ctx.label} Angle:** 1-2 sentences explaining EXACTLY how this specific news affects them, their portfolio, their business, or their studies.
3. "Your Action Items" — exactly 3 specific, concrete actions they should take today based on the news.

Make it comprehensive and detailed. Do not skip any of the provided news context.`,
      },
    ];

    // INCREASED TOKEN LIMIT: Changed from 1200 to 2500 to allow for much longer, detailed responses
    const result = await askAI(messages, 2500);

    // If mock response, use our rich pre-written mock
    if (result.provider === 'mock') {
      return NextResponse.json({
        briefing: MOCK_BRIEFINGS[role],
        role: ctx.label,
        provider: 'mock',
        date: today,
        article_count: 0,
      });
    }

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
