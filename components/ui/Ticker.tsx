// components/ui/Ticker.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface MarketData {
  symbol: string;
  value: string;
  change?: string;
  changePercent?: string;
  direction: 'up' | 'down' | 'neutral';
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

const DEFAULT_TICKERS = [
  { symbol: 'SENSEX', value: '84,928', change: '+857', changePercent: '+1.02%', direction: 'up' as const },
  { symbol: 'NIFTY 50', value: '25,939', change: '+239', changePercent: '+0.93%', direction: 'up' as const },
  { symbol: 'NIFTY IT', value: '38,210', change: '+530', changePercent: '+1.4%', direction: 'up' as const },
  { symbol: 'NIFTY AUTO', value: '22,560', change: '+178', changePercent: '+0.8%', direction: 'up' as const },
  { symbol: 'USD/INR', value: '₹83.42', direction: 'neutral' as const },
  { symbol: 'GOLD', value: '₹72,450/10g', change: '-120', changePercent: '-0.17%', direction: 'down' as const },
  { symbol: 'CRUDE', value: '$78.40/bbl', change: '+0.82', changePercent: '+1.06%', direction: 'up' as const },
  { symbol: 'BTC/USD', value: '$62,840', change: '+2.1%', direction: 'up' as const },
];

function formatTickerItem(item: MarketData): { text: string; direction: 'up' | 'down' | 'neutral' } {
  const arrow = item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : '';
  const changeStr = item.changePercent || (item.change ? ` ${arrow}${item.change}` : '');
  return {
    text: `${item.symbol} ${item.value}${changeStr}`,
    direction: item.direction,
  };
}

export function Ticker() {
  const [items, setItems] = useState<{ text: string; direction: 'up' | 'down' | 'neutral' }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const res = await fetch('/api/market-data');
        if (res.ok) {
          const data: TickerData = await res.json();

          // Convert to array and format
          const formattedItems = Object.values(data).map(formatTickerItem);
          // Duplicate for seamless scrolling
          setItems([...formattedItems, ...formattedItems]);
          setLastUpdated(new Date());
        } else {
          // Use default
          const defaultItems = DEFAULT_TICKERS.map(formatTickerItem);
          setItems([...defaultItems, ...defaultItems]);
        }
      } catch {
        // Use default
        const defaultItems = DEFAULT_TICKERS.map(formatTickerItem);
        setItems([...defaultItems, ...defaultItems]);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || items.length === 0) {
    return (
      <div className="bg-ink-950 text-white text-xs py-1.5 overflow-hidden">
        <div className="flex gap-8 px-4">
          {DEFAULT_TICKERS.slice(0, 6).map((item, i) => (
            <span key={i} className="inline-block text-ink-300">
              {item.symbol} {item.value}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink-950 text-white text-xs py-1.5 overflow-hidden relative">
      <div className="ticker-inner flex whitespace-nowrap gap-8" style={{ width: 'max-content' }}>
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-block px-4 ${
              item.direction === 'up' ? 'text-green-400' :
              item.direction === 'down' ? 'text-red-400' :
              'text-ink-200'
            }`}
          >
            {item.text}
          </span>
        ))}
      </div>
      {lastUpdated && (
        <div className="absolute right-4 top-1 text-[10px] text-ink-500 hidden sm:block">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}