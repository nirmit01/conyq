// lib/db.ts
// SQLite database singleton using better-sqlite3

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/my-et.db';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const dir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(path.resolve(DB_PATH));
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Guest',
      interests TEXT NOT NULL DEFAULT '[]',   -- JSON array of interest tags
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- Insert default user if not exists
    INSERT OR IGNORE INTO users (id, name, interests)
    VALUES ('default', 'Guest Reader', '["technology","finance","markets","startups"]');

    -- Articles table (cached / seeded articles)
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',        -- JSON array
      source TEXT NOT NULL DEFAULT 'ET',
      image_url TEXT,
      published_at INTEGER NOT NULL DEFAULT (unixepoch()),
      sentiment REAL DEFAULT 0,              -- -1 to 1
      view_count INTEGER DEFAULT 0
    );

    -- Story arcs (grouped articles)
    CREATE TABLE IF NOT EXISTS story_arcs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      article_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
      entities TEXT NOT NULL DEFAULT '[]',    -- JSON array of {name, type}
      predictions TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- Chat sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      article_id TEXT,
      messages TEXT NOT NULL DEFAULT '[]',   -- JSON array of {role, content, ts}
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Generated videos
    CREATE TABLE IF NOT EXISTS generated_videos (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      script TEXT,
      audio_path TEXT,
      video_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- pending|processing|done|error
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- User bookmarks
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      article_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id, article_id)
    );
  `);

  // Seed sample articles if table is empty
  const count = (db.prepare('SELECT COUNT(*) as n FROM articles').get() as { n: number }).n;
  if (count === 0) seedArticles(db);
}

function seedArticles(db: Database.Database) {
  const articles = getSeedArticles();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles (id, title, summary, content, category, tags, source, image_url, published_at, sentiment)
    VALUES (@id, @title, @summary, @content, @category, @tags, @source, @image_url, @published_at, @sentiment)
  `);

  const insertMany = db.transaction((items: ReturnType<typeof getSeedArticles>) => {
    for (const item of items) stmt.run(item);
  });

  insertMany(articles);

  // Seed one story arc
  db.prepare(`
    INSERT OR IGNORE INTO story_arcs (id, title, description, article_ids, entities, predictions)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'arc-ai-india-2024',
    'India AI Revolution 2024',
    'Tracking the rise of artificial intelligence adoption across Indian enterprises and government initiatives',
    JSON.stringify(['art-001', 'art-003', 'art-007']),
    JSON.stringify([
      { name: 'Infosys', type: 'Company' },
      { name: 'TCS', type: 'Company' },
      { name: 'NASSCOM', type: 'Organisation' },
      { name: 'Narendra Modi', type: 'Person' },
    ]),
    'AI adoption in India expected to contribute $500B to GDP by 2030. Expect major policy announcements in Q3.',
  );
}

function getSeedArticles() {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: 'art-001',
      title: 'Infosys Launches AI-First Strategy, Targets ₹10,000 Cr Revenue from GenAI by 2026',
      summary: 'India\'s second-largest IT firm unveils a bold generative AI roadmap, betting on enterprise adoption to fuel next wave of growth.',
      content: `Infosys on Thursday announced a sweeping "AI-First" transformation strategy, setting an ambitious target of generating ₹10,000 crore in revenue from generative AI-related services by fiscal year 2026. The move marks the most aggressive AI pivot yet by any Indian IT major.

CEO Salil Parekh, speaking at the company's annual investor day in Bengaluru, outlined a three-pronged approach: building proprietary AI models tuned for enterprise workflows, embedding AI into its Cobalt cloud platform, and reskilling 200,000 employees in AI-adjacent skills within 18 months.

"We are not just adopting AI — we are becoming an AI company," Parekh said. "Every engagement we sign from here on will have an AI component."

The announcement sent Infosys shares up 4.2% on the BSE, touching ₹1,842 intraday before settling at ₹1,819. Analysts at Kotak Institutional Equities raised their target price to ₹2,000, citing the clarity of the AI roadmap.

The strategy comes as global enterprises face mounting pressure to demonstrate AI ROI. Infosys has already signed deals worth $2.3 billion in AI-assisted digital transformation engagements in the first half of FY25, ahead of its own internal projections.

Critics, however, note that execution risk remains high. "The gap between AI ambition and AI revenue is still wide across the industry," cautioned Pareekh Jain, an independent IT analyst. "Infosys has the talent and client base, but converting pilots to production is a different game."

The company said it would invest ₹2,500 crore in AI infrastructure over the next two fiscal years, including GPU clusters and a new AI research lab in Hyderabad in partnership with IIT-H.`,
      category: 'technology',
      tags: JSON.stringify(['ai', 'infosys', 'it-sector', 'genai', 'india-tech']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/infosys-ai/800/450',
      published_at: now - 3600,
      sentiment: 0.72,
    },
    {
      id: 'art-002',
      title: 'RBI Holds Rates at 6.5%, Signals Pivot as Inflation Eases to 4.2%',
      summary: 'The Reserve Bank of India\'s monetary policy committee unanimously voted to keep the repo rate unchanged while shifting stance to "neutral", raising hopes of rate cuts in early 2025.',
      content: `The Reserve Bank of India kept its benchmark repo rate unchanged at 6.5% on Friday, but in a significant pivot, changed its policy stance from "withdrawal of accommodation" to "neutral" — a move markets interpreted as the central bank laying groundwork for rate cuts ahead.

The six-member Monetary Policy Committee (MPC) voted unanimously on the rate decision and 5-1 on the stance change, with external member Jayanth Varma dissenting in favour of an immediate 25 basis point cut.

RBI Governor Shaktikanta Das, addressing reporters at Mint Street, said the decision reflected confidence that the inflation trajectory was "durably converging" toward the 4% target. Retail inflation for September came in at 4.2%, the lowest in nine months, driven by easing food prices.

"The stance change is a significant signal," said Sonal Varma, chief economist at Nomura India. "If food inflation stays benign through the winter, a February cut looks very likely."

Markets reacted positively. The Nifty 50 gained 0.8% and the 10-year government bond yield fell 8 basis points to 6.74%, the lowest since March. Bank Nifty outperformed, rising 1.4% as cheaper borrowing costs would expand net interest margins for lenders.

The RBI revised its FY25 GDP growth forecast marginally upward to 7.2% from 7.1%, citing resilient services exports and improving rural demand. Inflation forecast for the full year was cut to 4.5% from 4.7%.

Economists at Goldman Sachs now price in 75 basis points of cumulative cuts through 2025, beginning in February, though Das cautioned against "premature exuberance."`,
      category: 'finance',
      tags: JSON.stringify(['rbi', 'monetary-policy', 'interest-rates', 'inflation', 'banking']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/rbi-rate/800/450',
      published_at: now - 7200,
      sentiment: 0.55,
    },
    {
      id: 'art-003',
      title: 'Reliance Jio Eyes Global Expansion: $5B Plan to Launch in Southeast Asia and Africa',
      summary: 'Mukesh Ambani\'s telecom giant is eyeing aggressive international expansion, with plans to replicate its disruptive pricing playbook in six new markets.',
      content: `Reliance Jio is planning a $5 billion international expansion over the next five years, targeting markets in Southeast Asia and Africa where low-cost, high-speed connectivity remains elusive, three people familiar with the matter told ET.

The company has held preliminary discussions with regulators in Indonesia, Vietnam, Nigeria, and Kenya, and is evaluating spectrum acquisition strategies in each market, the people said, requesting anonymity as the talks are confidential.

If successful, the move would mark the most ambitious overseas bet by an Indian telecom company — and could position Jio as a global disruptor in the same way it upended India's telecom market with free voice calls and cheap data in 2016.

"Jio's model — cheap devices, bundled content, aggressive pricing — is replicable in markets where incumbents are still charging $15–20 per GB," said Naveen Kulkarni, telecom analyst at Axis Securities.

The expansion is being led by Jio Platforms, the holding company that houses Jio's digital businesses, and would leverage its existing technology stack including its home-built 5G core network. Jio became the first company globally to deploy a fully cloud-native 5G network at scale.

A Reliance spokesperson declined to comment on "market speculation." The company's annual report hinted at global ambitions, with Chairman Mukesh Ambani stating Jio aimed to be "a global digital services company" within a decade.

Analysts estimate Africa's mobile data market alone will be worth $80 billion by 2030, growing at 12% annually. Southeast Asia's digital economy is projected at $300 billion by 2025.`,
      category: 'markets',
      tags: JSON.stringify(['jio', 'reliance', 'telecom', 'expansion', 'africa', 'southeast-asia']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/jio-global/800/450',
      published_at: now - 10800,
      sentiment: 0.68,
    },
    {
      id: 'art-004',
      title: 'India\'s Startup Funding Rebounds: $3.2B Raised in Q3, Highest in Six Quarters',
      summary: 'Venture capital flows into Indian startups surged in Q3 2024, signalling renewed investor confidence after two years of funding winter.',
      content: `Indian startups raised $3.2 billion across 312 deals in the third quarter of 2024 — the highest quarterly funding in six quarters — as global investors returned to emerging markets following signals of monetary easing from major central banks, according to data from Tracxn and Venture Intelligence.

The rebound was led by late-stage rounds, with fintech, SaaS, and climate tech attracting the lion's share. Notably, B2B SaaS emerged as the standout sector, accounting for nearly 28% of total capital deployed.

Meesho, the social commerce unicorn backed by SoftBank and Fidelity, anchored the quarter with a $275 million Series G at a $3.5 billion valuation — down from its 2021 peak of $4.9 billion but representing a stabilisation in founder expectations.

"The hangover from 2021 valuations is clearing. Founders are realistic, investors are disciplined, and the quality of deals is significantly better," said Mukul Arora, partner at Elevation Capital.

Early-stage activity also picked up, with 187 seed and pre-Series A deals — up 23% from Q2. AI-native startups captured 34% of early-stage capital, with applications spanning legal tech, vernacular content, and agritech.

Tiger Global, Sequoia India (now Peak XV), and Accel were the most active investors by deal count. New entrants included Abu Dhabi's Mubadala, which made its first direct Indian startup bet — a $40 million check into climate fintech Pyse.

The IPO pipeline also strengthened, with Swiggy, Vishal Mega Mart, and NTPC Green Energy filing DRHPs in the quarter.`,
      category: 'startups',
      tags: JSON.stringify(['startups', 'venture-capital', 'funding', 'india-tech', 'vc']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/india-startups/800/450',
      published_at: now - 14400,
      sentiment: 0.81,
    },
    {
      id: 'art-005',
      title: 'Sensex Crosses 85,000 Milestone: Bulls in Control as FIIs Return',
      summary: 'The BSE Sensex breached the 85,000 mark for the first time ever on Monday, driven by foreign institutional buying and strong domestic macro data.',
      content: `The BSE Sensex crossed the historic 85,000 mark on Monday for the first time in its 48-year history, completing a 10,000-point rally in just 47 trading sessions as foreign institutional investors poured money into Indian equities amid expectations of rate cuts globally.

The index hit an all-time high of 85,163 before closing at 84,928, up 1.02% or 857 points. The NSE Nifty 50 settled at 25,939, up 0.93%. Market capitalisation of BSE-listed companies crossed ₹470 lakh crore.

Foreign portfolio investors (FPIs) were net buyers of ₹10,400 crore in equities on Monday — the highest single-day inflow in 14 months — as the US Federal Reserve's half-point rate cut last week made emerging markets more attractive.

"India remains a preferred destination because of structural growth, political stability, and a young demographic. This is not hot money — these are strategic allocations," said Andrew Holland, CEO of Avendus Capital Alternate Strategies.

Auto, banking, and capital goods sectors led the rally. Mahindra & Mahindra hit a new 52-week high at ₹3,020. HDFC Bank rose 2.1%. L&T gained 1.8%.

Not everyone is sanguine. Veteran investor Shankar Sharma warned that valuations — with the Nifty trading at 21x one-year forward earnings — leave little room for error. "A single global shock could trigger a 10–15% correction," he told ET.

Retail participation continues to be a pillar of market resilience, with SIP inflows touching a record ₹23,547 crore in September.`,
      category: 'markets',
      tags: JSON.stringify(['sensex', 'bse', 'markets', 'fii', 'stocks', 'rally']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/sensex-85k/800/450',
      published_at: now - 18000,
      sentiment: 0.75,
    },
    {
      id: 'art-006',
      title: 'Centre Unveils National EV Mission 2.0: ₹15,000 Cr Subsidy Push for Two-Wheelers',
      summary: 'The government\'s revamped EV policy doubles down on two-wheelers and public charging infrastructure, aiming for 30% EV penetration by 2030.',
      content: `The Union government on Tuesday launched the National Electric Vehicle Mission 2.0, a ₹15,000 crore incentive programme focused on accelerating adoption of electric two-wheelers and building a nationwide public charging network, Heavy Industries Minister H.D. Kumaraswamy announced in New Delhi.

The mission — a successor to the FAME-II scheme that lapsed in March — offers point-of-sale subsidies of up to ₹15,000 per electric two-wheeler purchased by consumers in income groups below ₹8 lakh per annum. It also provides ₹10 lakh grants to states setting up fast-charging corridors on national highways.

"This is the most aggressive EV policy India has ever seen," said Sulajja Firodia Motwani, CEO of Kinetic Green, which makes electric scooters. "Demand was already building; this accelerates it to a step change."

Shares of EV makers surged on the news. Ola Electric gained 8.3%, Bajaj Auto (whose Chetak accounts for 18% of market share) rose 3.1%, and TVS Motor climbed 4.4%. Battery maker Amara Raja added 5.6%.

The policy sets a 30% EV penetration target for two-wheelers by 2030, up from the current 5.6%. It also mandates that 25% of all new government fleet purchases be electric from 2025 onwards.

For four-wheelers, the policy extends the existing Production Linked Incentive (PLI) scheme and adds a new consumer incentive of ₹25,000 for EVs priced below ₹15 lakh.

Environmentalists broadly welcomed the move but urged faster timelines on phasing out internal combustion engines.`,
      category: 'policy',
      tags: JSON.stringify(['ev', 'electric-vehicles', 'policy', 'sustainability', 'government']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/ev-india/800/450',
      published_at: now - 21600,
      sentiment: 0.63,
    },
    {
      id: 'art-007',
      title: 'ChatGPT Creator OpenAI Raises $6.6B at $157B Valuation; Eyes India as Key Market',
      summary: 'OpenAI closes its largest funding round yet, with investors including Microsoft, SoftBank, and UAE\'s MGX, and signals aggressive expansion into India\'s 140-million-strong English-speaking market.',
      content: `OpenAI has raised $6.6 billion in a funding round that values the San Francisco-based AI company at $157 billion — making it one of the most valuable private companies in the world — with investors betting on the explosive growth of enterprise AI and the company's ambitions in emerging markets, including India.

The round, led by Thrive Capital with participation from Microsoft, Nvidia, SoftBank, UAE sovereign fund MGX, and Tiger Global, follows OpenAI's revenue surpassing $3.4 billion annualised in August, up from $1.6 billion at the start of 2024.

India figures prominently in the company's growth strategy. CEO Sam Altman, who visited India in June and met Prime Minister Narendra Modi, confirmed that OpenAI is exploring a local data centre partnership and a customised model for Indian languages.

"India is our second-largest user base globally, and it's growing faster than any other market," Altman said in a statement. "We are deeply committed to building AI that works for India."

OpenAI's ChatGPT has approximately 35 million monthly active users in India, per third-party estimates, and the company's enterprise product has been adopted by Tata Consultancy Services, Wipro, and HCL Technologies for client-facing deployments.

The new capital will be used for compute infrastructure (primarily GPU clusters), safety research, and international market development. OpenAI also said it would transition from a non-profit to a for-profit public benefit corporation structure — a move that has drawn scrutiny from co-founder Elon Musk, who is involved in ongoing litigation with the company.

Indian AI startup founders expressed mixed reactions: concern about competition, but optimism that a rising tide lifts all boats for the broader ecosystem.`,
      category: 'technology',
      tags: JSON.stringify(['openai', 'chatgpt', 'ai', 'funding', 'india', 'generative-ai']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/openai-india/800/450',
      published_at: now - 25200,
      sentiment: 0.58,
    },
    {
      id: 'art-008',
      title: 'Tata Motors Reports Record Q2 Profit of ₹3,343 Cr; JLR Drives Margins Higher',
      summary: 'Driven by strong Jaguar Land Rover performance and robust domestic SUV sales, Tata Motors posted its highest-ever quarterly net profit.',
      content: `Tata Motors reported a consolidated net profit of ₹3,343 crore for the second quarter of FY25, its highest ever, beating analyst estimates of ₹2,900 crore and doubling year-on-year. The performance was led by blockbuster results at Jaguar Land Rover (JLR), its British luxury arm, and resilient domestic sales.

JLR's EBIT margin expanded to 9.2% from 6.1% a year ago, as supply chain normalisation, better pricing on models like the Defender and Range Rover Sport, and a richer product mix boosted profitability. JLR's revenue grew 5% in British pound terms to £7.3 billion.

In India, Tata Motors' domestic business posted revenue of ₹16,240 crore, up 8% YoY, with its SUV lineup — Nexon, Harrier, and Punch — continuing to dominate the sub-₹20 lakh segment. Electric vehicle sales contributed ₹2,100 crore to domestic revenue.

"This is a quality beat," said Pramod Kumar, analyst at IIFL Securities. "JLR margins are structurally higher now, and the India business is firing on all cylinders."

Net debt fell to £1.1 billion from £2.4 billion a year ago, with management guiding for a net cash position at JLR by March 2025 — a milestone that could unlock a dividend from the subsidiary.

Tata Motors' stock rose 5.8% to ₹1,062 on Thursday, touching a fresh 52-week high. It is the second-best performing Nifty 50 stock year-to-date, up 64%.

The company guided for 8–10% revenue growth in FY25 and said it would invest ₹15,000 crore in EVs and connected vehicle technology over the next three years.`,
      category: 'markets',
      tags: JSON.stringify(['tata-motors', 'jlr', 'automobiles', 'earnings', 'ev', 'results']),
      source: 'Economic Times',
      image_url: 'https://picsum.photos/seed/tata-motors/800/450',
      published_at: now - 28800,
      sentiment: 0.82,
    },
  ];
}
