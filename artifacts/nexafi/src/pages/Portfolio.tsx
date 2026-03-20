import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import clsx from 'clsx';

const HOLDINGS = [
  { ticker: 'NVDA', name: 'NVIDIA Corp',        shares: 12,  price: 875.40,  change: -1.02, weight: 28.4 },
  { ticker: 'AAPL', name: 'Apple Inc',           shares: 25,  price: 189.30,  change: +0.54, weight: 22.1 },
  { ticker: 'MSFT', name: 'Microsoft Corp',      shares: 10,  price: 415.20,  change: +0.31, weight: 18.6 },
  { ticker: 'VOO',  name: 'Vanguard S&P 500 ETF',shares: 8,   price: 492.10,  change: +0.18, weight: 16.3 },
  { ticker: 'TSLA', name: 'Tesla Inc',           shares: 15,  price: 248.50,  change: -2.14, weight: 9.8  },
  { ticker: 'AMZN', name: 'Amazon.com Inc',      shares: 5,   price: 185.70,  change: +0.72, weight: 4.8  },
];

const ALLOCATION = [
  { label: 'Technology', pct: 68, color: 'bg-blue-500' },
  { label: 'ETFs',       pct: 16, color: 'bg-violet-500' },
  { label: 'Consumer',   pct: 10, color: 'bg-emerald-500' },
  { label: 'Other',      pct: 6,  color: 'bg-amber-500' },
];

const totalValue = HOLDINGS.reduce((s, h) => s + h.shares * h.price, 0);
const dayChange = HOLDINGS.reduce((s, h) => s + (h.shares * h.price * h.change / 100), 0);

export default function Portfolio() {
  const [tab, setTab] = useState<'holdings' | 'allocation'>('holdings');

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Portfolio</h1>
            <p className="text-muted-foreground mt-1">Alex's brokerage · Fidelity ····9203</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <DollarSign className="w-3.5 h-3.5" /> Total Value
            </div>
            <div className="text-3xl font-display font-bold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Today's P&L
            </div>
            <div className={clsx('text-3xl font-display font-bold flex items-center gap-2', dayChange >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {dayChange >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              ${Math.abs(dayChange).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <BarChart2 className="w-3.5 h-3.5" /> Positions
            </div>
            <div className="text-3xl font-display font-bold">{HOLDINGS.length}</div>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          {(['holdings', 'allocation'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize', tab === t ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground')}>
              {t}
            </button>
          ))}
        </div>

        {/* Holdings table */}
        {tab === 'holdings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Asset</th>
                  <th className="text-right px-5 py-3">Price</th>
                  <th className="text-right px-5 py-3">Change</th>
                  <th className="text-right px-5 py-3">Value</th>
                  <th className="text-right px-5 py-3">Weight</th>
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h, i) => (
                  <motion.tr key={h.ticker} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{h.ticker.slice(0,2)}</div>
                        <div>
                          <div className="font-semibold text-foreground">{h.ticker}</div>
                          <div className="text-xs text-muted-foreground">{h.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">${h.price.toFixed(2)}</td>
                    <td className={clsx('px-5 py-3.5 text-right font-mono font-semibold', h.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {h.change >= 0 ? '+' : ''}{h.change.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">${(h.shares * h.price).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${h.weight}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{h.weight}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Allocation */}
        {tab === 'allocation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sector Allocation</h3>
            {ALLOCATION.map((a, i) => (
              <div key={a.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground/80">{a.label}</span>
                  <span className="font-semibold">{a.pct}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className={clsx('h-full rounded-full', a.color)} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs text-amber-400">⚠ Heavy tech concentration (68%). Consider diversifying into bonds or international ETFs.</p>
            </div>
          </motion.div>
        )}

      </div>
    </PageLayout>
  );
}
