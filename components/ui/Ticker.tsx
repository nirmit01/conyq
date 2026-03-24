// components/ui/Ticker.tsx
'use client';
import { useEffect, useState } from 'react';

const TICKERS = [
  '📈 SENSEX 84,928 +857 (+1.02%)',
  '📊 NIFTY 25,939 +239 (+0.93%)',
  '💱 USD/INR ₹83.42',
  '🟡 GOLD ₹72,450/10g',
  '🛢️ CRUDE $78.40/bbl',
  '📉 10Y GSEC 6.74% ▼8bps',
  '🏦 RBI REPO 6.50% Unchanged',
  '🌐 BTC $62,840 +2.1%',
  '📦 NIFTY IT 38,210 +1.4%',
  '🚗 NIFTY AUTO 22,560 +0.8%',
];

export function Ticker() {
  const [items] = useState(TICKERS);

  return (
    <div className="bg-ink-950 text-white text-xs py-1.5 overflow-hidden">
      <div className="ticker-inner flex whitespace-nowrap gap-8" style={{ width: 'max-content' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-block px-4 text-ink-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
