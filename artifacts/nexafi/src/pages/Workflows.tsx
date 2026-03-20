import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, TrendingUp, BookOpen, Bell, ChevronRight, CheckCircle2, Clock, Play, Pause } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useLocation } from 'wouter';
import clsx from 'clsx';

const WORKFLOWS = [
  {
    id: 'weekly-prep',
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Weekly Market Prep',
    description: 'Every Monday morning — summarise last week, flag key events this week, suggest watchlist adjustments.',
    steps: ['Pull S&P 500 weekly performance', 'Scan earnings calendar', 'Check Fed/macro events', 'Generate watchlist delta', 'Send summary to Nova chat'],
    schedule: 'Every Monday 8:00 AM',
    lastRun: '2 days ago',
    status: 'active',
    prompt: 'Give me a weekly market prep summary for tech stocks — last week performance, key events this week, and watchlist adjustments.',
  },
  {
    id: 'risk-audit',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Risk Audit',
    description: 'Weekly portfolio risk check — concentration, volatility exposure, and rebalancing suggestions.',
    steps: ['Calculate sector concentration', 'Measure beta vs S&P 500', 'Flag positions >25% weight', 'Compare to risk profile', 'Generate rebalance plan'],
    schedule: 'Every Friday 4:30 PM',
    lastRun: '5 days ago',
    status: 'active',
    prompt: 'Run a full portfolio risk audit — check sector concentration, flag overweight positions, and suggest a rebalancing plan based on my risk profile.',
  },
  {
    id: 'earnings-watch',
    icon: Bell,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Earnings Watchlist',
    description: 'Track upcoming earnings for your holdings and generate pre-earnings briefings.',
    steps: ['Scan holdings for upcoming earnings', 'Pull analyst consensus estimates', 'Summarise last 4 quarters', 'Flag high-risk positions', 'Brief Nova 24h before'],
    schedule: 'Daily 7:00 AM',
    lastRun: '1 day ago',
    status: 'active',
    prompt: 'Check upcoming earnings for my holdings — pull analyst estimates, summarise recent quarters, and flag any high-risk positions ahead of earnings.',
  },
  {
    id: 'education',
    icon: BookOpen,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Learning Path',
    description: 'Personalised finance education — one concept per day based on your portfolio and activity.',
    steps: ['Analyse recent chat topics', 'Select relevant concept', 'Pull from knowledge base', 'Generate bite-sized lesson', 'Deliver via Nova chat'],
    schedule: 'Daily 9:00 AM',
    lastRun: '12 hours ago',
    status: 'paused',
    prompt: 'Based on my portfolio and recent activity, teach me one relevant finance concept today.',
  },
];

export default function Workflows() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, 'active' | 'paused'>>(
    Object.fromEntries(WORKFLOWS.map(wf => [wf.id, wf.status as 'active' | 'paused']))
  );
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [, navigate] = useLocation();

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatuses(prev => ({ ...prev, [id]: prev[id] === 'active' ? 'paused' : 'active' }));
  };

  const runNow = (wf: typeof WORKFLOWS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (running[wf.id]) return;
    setRunning(prev => ({ ...prev, [wf.id]: true }));
    // Store the prompt so Home.tsx can pick it up on mount
    sessionStorage.setItem('nexafi_pending_prompt', wf.prompt);
    setTimeout(() => navigate('/'), 600);
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">Automated routines that run in the background and brief Nova.</p>
        </motion.div>

        <div className="space-y-3">
          {WORKFLOWS.map((wf, i) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={clsx('glass-card rounded-2xl border overflow-hidden', wf.border)}
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', wf.bg)}>
                  <wf.icon className={clsx('w-5 h-5', wf.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{wf.title}</span>
                    <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', statuses[wf.id] === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground')}>
                      {statuses[wf.id].toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{wf.description}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-xs text-muted-foreground">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {wf.lastRun}
                  </div>
                  <ChevronRight className={clsx('w-4 h-4 transition-transform', expanded === wf.id && 'rotate-90')} />
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === wf.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 px-5 py-4 space-y-4"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Steps</div>
                      <ol className="space-y-1.5">
                        {wf.steps.map((step, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Schedule</div>
                        <p className="text-sm text-foreground/80">{wf.schedule}</p>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Last Run</div>
                        <p className="text-sm text-foreground/80">{wf.lastRun}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={(e) => runNow(wf, e)}
                      disabled={running[wf.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {running[wf.id]
                        ? <><span className="w-2.5 h-2.5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> Launching…</>
                        : <><Play className="w-3 h-3" /> Run Now</>}
                    </button>
                    <button
                      onClick={(e) => toggleStatus(wf.id, e)}
                      className={clsx('px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors', statuses[wf.id] === 'active' ? 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20')}
                    >
                      {statuses[wf.id] === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add workflow CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5 border border-dashed border-white/10 flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground/80">Create a custom workflow</p>
            <p className="text-xs text-muted-foreground mt-0.5">Describe what you want automated and Nova will build it.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors">
            <Zap className="w-4 h-4" /> New Workflow
          </button>
        </motion.div>

      </div>
    </PageLayout>
  );
}
