// app/api/market-data/route.ts
// Fetches live market data for the ticker from free public APIs

import { NextResponse } from 'next/server';

// Cache market data for 5 minutes
let cachedData: any = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface MarketData {
  symbol: string;
  value: string;
  change?: string;
  changePercent?: string;
  direction: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface TickerData {
  sensex: MarketData;
  nifty: MarketData;
  niftyIt: MarketData;
  niftyAuto: MarketData;
  usdinr: MarketData;
  gold: MarketData;
  crude: MarketData;
  gsec: MarketData;
  rbi: MarketData;
  btc: MarketData;
}

const DEFAULT_DATA: TickerData = {
  sensex: { symbol: 'SENSEX', value: '84,928', change: '+857', changePercent: '+1.02%', direction: 'up' },
  nifty: { symbol: 'NIFTY 50', value: '25,939', change: '+239', changePercent: '+0.93%', direction: 'up' },
  niftyIt: { symbol: 'NIFTY IT', value: '38,210', change: '+530', changePercent: '+1.4%', direction: 'up' },
  niftyAuto: { symbol: 'NIFTY AUTO', value: '22,560', change: '+178', changePercent: '+0.8%', direction: 'up' },
  usdinr: { symbol: 'USD/INR', value: '₹83.42', direction: 'neutral' },
  gold: { symbol: 'GOLD', value: '₹72,450/10g', change: '-120', changePercent: '-0.17%', direction: 'down' },
  crude: { symbol: 'CRUDE', value: '$78.40/bbl', change: '+0.82', changePercent: '+1.06%', direction: 'up' },
  gsec: { symbol: '10Y GSEC', value: '6.74%', change: '-8bps', direction: 'down' },
  rbi: { symbol: 'RBI REPO', value: '6.50%', change: 'Unchanged', direction: 'neutral' },
  btc: { symbol: 'BTC/USD', value: '$62,840', change: '+2.1%', direction: 'up' },
};

export async function GET() {
  // Return cached data if still valid
  if (cachedData && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }

  try {
    const data = await fetchAllLiveData();
    cachedData = data;
    cacheTime = Date.now();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/market-data]', error);
    return NextResponse.json(DEFAULT_DATA);
  }
}

async function fetchAllLiveData(): Promise<TickerData> {
  const data = { ...DEFAULT_DATA };

  // Fetch multiple data sources in parallel
  const [forexResult, btcResult, niftyResult] = await Promise.allSettled([
    fetchUSDINR(),
    fetchBTCData(),
    fetchNiftyData(),
  ]);

  if (forexResult.status === 'fulfilled' && forexResult.value) {
    data.usdinr = forexResult.value;
  }

  if (btcResult.status === 'fulfilled' && btcResult.value) {
    data.btc = btcResult.value;
  }

  if (niftyResult.status === 'fulfilled' && niftyResult.value) {
    data.nifty = niftyResult.value;
  }

  return data;
}

async function fetchUSDINR(): Promise<MarketData | null> {
  try {
    // Using exchangerate-api free tier
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const forexData = await response.json();
    const inrRate = forexData.rates?.INR;

    if (inrRate) {
      return {
        symbol: 'USD/INR',
        value: '₹' + inrRate.toFixed(2),
        direction: 'neutral',
        unit: 'INR per USD',
      };
    }
  } catch (e) {
    console.log('USD/INR fetch failed');
  }
  return null;
}

async function fetchBTCData(): Promise<MarketData | null> {
  try {
    // Using CoinGecko free API (no API key required)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const btcData = await response.json();
    const btc = btcData.bitcoin;

    if (btc && btc.usd) {
      const change = btc.usd_24h_change ?? 0;
      return {
        symbol: 'BTC/USD',
        value: '$' + btc.usd.toLocaleString('en-US', { maximumFractionDigits: 0 }),
        change: (change >= 0 ? '+' : '') + change.toFixed(1) + '%',
        direction: change >= 0 ? 'up' : 'down',
      };
    }
  } catch (e) {
    console.log('BTC fetch failed');
  }
  return null;
}

async function fetchNiftyData(): Promise<MarketData | null> {
  try {
    // Try Yahoo Finance
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (result) {
      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = ((change / previousClose) * 100).toFixed(2);

      return {
        symbol: 'NIFTY 50',
        value: currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        change: (change >= 0 ? '+' : '') + Math.abs(change).toFixed(2),
        changePercent: (change >= 0 ? '+' : '') + changePercent + '%',
        direction: change >= 0 ? 'up' : 'down',
      };
    }
  } catch (e) {
    console.log('NIFTY fetch failed');
  }
  return null;
}