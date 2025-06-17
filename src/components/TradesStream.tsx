'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface TradeCreatedEvent {
  name: string;
  symbol: string;
  market_cap: number;
  usd_market_cap: number;
  sol_amount: number;
  creator: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function TradesStream() {
  const [trades, setTrades] = useState<TradeCreatedEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // keep a ref so we can decide about auto-scrolling
  const atTopRef = useRef(true);

  // track if the user is reading somewhere lower than the newest message (i.e., not at top)
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 10; // px tolerance
    atTopRef.current = el.scrollTop <= threshold;
  };

  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    const socket: Socket = io('wss://frontend-api-v3.pump.fun', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('tradeCreated', (data: TradeCreatedEvent) => {
      setTrades(prev => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // adjust scroll after new trades render
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const delta = el.scrollHeight - prevScrollHeightRef.current;
    if (atTopRef.current) {
      // stick to top
      el.scrollTop = 0;
    } else if (delta > 0) {
      // maintain viewport
      el.scrollTop += delta;
    }
    prevScrollHeightRef.current = el.scrollHeight;
  }, [trades]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-auto border rounded p-4 bg-white/5"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] gap-3 pb-2 text-xs font-semibold sticky top-0 backdrop-blur bg-white/70 dark:bg-black/50">
        <span>Name</span>
        <span>Symbol</span>
        <span className="text-right">SOL</span>
        <span className="text-right">Market-Cap</span>
        <span className="text-right">USD-Cap</span>
      </div>
      {trades.map((t, i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] gap-3 py-1 border-t border-dashed border-gray-300/40 text-sm"
        >
          <span className="truncate" title={t.name}>{t.name}</span>
          <span className="truncate" title={t.symbol}>{t.symbol}</span>
          <span className="text-right">{(t.sol_amount / 1e9).toFixed(2)}</span>
          <span className="text-right">{t.market_cap.toFixed(2)}</span>
          <span className="text-right">{t.usd_market_cap.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
} 