import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import clsx from 'clsx';

const INDICES = [
  { name: 'S&P 500',    value: '5,308.13', change: +0.48, symbol: 'SPY'  },
  { name: 'NASDAQ',     value: '16,742.39',change: +0.65, symbol: 'QQQ'  },
  { name: 'Dow Jones',  value: '39,127.14',change: +0.20, symbol: 'DIA'  },
  { name: 'Russell 2000',value: '2,082.11',change: -0.31, symbol: 'IWM'  },
];

const MOVERS = [
  { ticker: 'NVDA', name: 'NVIDIA',    change: -1.02, price: 875.40,  vol: '42.1M' },
  { ticker: 'META', name: 'Meta',      change: +2.34, price: 512.30,  vol: '18.7M' },
  { ticker: 'TSLA', name: 'Tesla',     change: -2.14, price: 248.50,  vol: '89.3M' },
  { ticker: 'AMZN', name: 'Amazon',    change: +0.72, price: 185.70,  vol: '31.2M' },
  { ticker: 'GOOGL', name: 'Alphabet', change: +1.18, price: 174.90,  vol: '22.5M' },
  { ticker: 'MSFT', name: 'Microsoft', change: +0.31, price: 415.20,  vol: '19.8M' },
];

const NEWS = [
  { headline: 'Fed signals potential rate cut in Q3 amid cooling inflation data', time: '2h ago', tag: 'Macro' },
  { headline: 'NVIDIA beats earnings estimates; data center revenue surges 427% YoY', time: '4h ago', tag: 'Earnings' },
  { headline: 'Apple Vision Pro sales disappoint; analysts revise targets downward', time: '6h ago', tag: 'Tech' },
  { headline: 'Oil prices rise on Middle East tensions; energy sector outperforms', time: '8h ago', tag: 'Commodities' },
  { headline: 'Treasury yields climb as jobs report exceeds expectations', time: '1d ago', tag: 'Bonds' },
];

const TAG_COLORS: Record<string, string> = {
  Macro: 'bg-blue-500/10 text-blue-400',
  Earnings: 'bg-emerald-500/10 text-emerald-400',
  Tech: 'bg-violet-500/10 text-violet-400',
  Commodities: 'bg-amber-500/10 text-amber-400',
  Bonds: 'bg-red-500/10 text-red-400',
};

export default function Markets() {
  const [tab, setTab] = useState<'movers' | 'news'>('movers');

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Markets</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live · NYSE/NASDAQ · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Index cards */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {INDICES.map((idx, i) => (
            <motion.div key={idx.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{idx.name}</span>
                {idx.change >= 0
                  ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  : <ArrowDownRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="text-xl font-display font-bold">{idx.value}</div>
              <div className={clsx('text-sm font-semibold mt-1', idx.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          {(['movers', 'news'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize', tab === t ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground')}>
              {t === 'movers' ? 'Top Movers' : 'Market News'}
            </button>
          ))}
        </div>

        {tab === 'movers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Ticker</th>
                  <th className="text-right px-5 py-3">Price</th>
                  <th className="text-right px-5 py-3">Change</th>
                  <th className="text-right px-5 py-3">Volume</th>
                </tr>
              </thead>
              <tbody>
                {MOVERS.map((m, i) => (
                  <motion.tr key={m.ticker} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.ticker.slice(0,2)}</div>
                        <div>
                          <div className="font-semibold">{m.ticker}</div>
                          <div className="text-xs text-muted-foreground">{m.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">${m.price.toFixed(2)}</td>
                    <td className={clsx('px-5 py-3.5 text-right font-mono font-semibold flex items-center justify-end gap-1', m.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {m.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{m.vol}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {tab === 'news' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {NEWS.map((n, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex items-start justify-between gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-snug">{n.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
                </div>
                <span className={clsx('text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0', TAG_COLORS[n.tag] ?? 'bg-white/5 text-muted-foreground')}>{n.tag}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </PageLayout>
  );
}
