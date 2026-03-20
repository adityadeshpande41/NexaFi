import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatResponse, ToolCall } from '../../services/apiTypes';
import {
  GitMerge, TerminalSquare, Gauge, Clock,
  BookOpen, UserCircle, Eye, Activity, Layers, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, Zap, Database,
} from 'lucide-react';
import clsx from 'clsx';

interface InsightsPanelProps {
  systemView: boolean;
  onToggleView: (view: boolean) => void;
  latestResponse: ChatResponse | null;
}

function stateToStrings(val: Record<string, unknown> | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  return Object.entries(val)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`);
}

function confColor(c: number): string {
  if (c >= 0.85) return 'from-emerald-500 to-emerald-400';
  if (c >= 0.65) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
}

function intentColor(intent: string): string {
  const map: Record<string, string> = {
    education_basic: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    market_explanation: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    support_issue: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    churn_risk: 'bg-red-500/10 border-red-500/20 text-red-400',
    profile_transparency: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    off_topic: 'bg-white/5 border-white/10 text-muted-foreground',
    blocked: 'bg-red-500/10 border-red-500/20 text-red-400',
  };
  return map[intent] ?? 'bg-primary/10 border-primary/20 text-primary';
}

export function InsightsPanel({ systemView, onToggleView, latestResponse }: InsightsPanelProps) {
  const known = stateToStrings(
    latestResponse?.state?.known as Record<string, unknown> | string[] | null,
  );
  const inferred = stateToStrings(
    latestResponse?.state?.inferred as Record<string, unknown> | string[] | null,
  );
  const missing: string[] = latestResponse?.state?.missing ?? [];

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 border-l border-white/5 bg-background/80 backdrop-blur-3xl flex flex-col h-[calc(100vh-4rem)] relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
      <div className="p-5 border-b border-white/5 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" /> Copilot Insights
        </h2>
        <div className="bg-black/30 p-1 rounded-xl flex items-center border border-white/5 relative">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card border border-white/10 rounded-lg shadow-sm"
            animate={{ left: systemView ? 'calc(50% + 2px)' : '4px' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          />
          <button
            onClick={() => onToggleView(false)}
            className={clsx('flex-1 py-1.5 text-xs font-semibold z-10 transition-colors', !systemView ? 'text-foreground' : 'text-muted-foreground')}
          >
            <div className="flex items-center justify-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5" /> User View
            </div>
          </button>
          <button
            onClick={() => onToggleView(true)}
            className={clsx('flex-1 py-1.5 text-xs font-semibold z-10 transition-colors', systemView ? 'text-foreground' : 'text-muted-foreground')}
          >
            <div className="flex items-center justify-center gap-1.5">
              <TerminalSquare className="w-3.5 h-3.5" /> System View
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
        <AnimatePresence mode="wait">
          {!latestResponse ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-60 pt-20"
            >
              <Eye className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm max-w-[200px]">Send a message to see how Nova processes your intent.</p>
            </motion.div>
          ) : systemView ? (
            <SystemView latestResponse={latestResponse} known={known} inferred={inferred} missing={missing} />
          ) : (
            <UserView latestResponse={latestResponse} />
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

// --- ToolCallCard -----------------------------------------------------------

function ToolCallCard({ tc }: { tc: ToolCall }) {
  const [open, setOpen] = useState(false);
  const apiColor: Record<string, string> = {
    Finnhub:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    OpenAI:   'text-violet-400 bg-violet-500/10 border-violet-500/20',
    ChromaDB: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  const color = apiColor[tc.api] ?? 'text-primary bg-primary/10 border-primary/20';

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span className="text-xs font-mono text-foreground/90 truncate">{tc.tool}()</span>
          <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0', color)}>
            {tc.api}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px] font-mono text-muted-foreground">{tc.endpoint}</span>
              </div>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{tc.description}</p>
              {Object.keys(tc.params).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(tc.params).map(([k, v]) => (
                    <span key={k} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-foreground/60">
                      {k}={String(v)}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={tc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors group"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="underline underline-offset-2 group-hover:no-underline truncate">{tc.url}</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SystemView -------------------------------------------------------------

interface SystemViewProps {
  latestResponse: ChatResponse;
  known: string[];
  inferred: string[];
  missing: string[];
}

function SystemView({ latestResponse, known, inferred, missing }: SystemViewProps) {
  return (
    <motion.div
      key="system"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Intent + Route */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Detected Intent</div>
          <span className={clsx('px-3 py-1.5 rounded-md inline-block text-sm font-semibold border', intentColor(latestResponse.intent))}>
            {latestResponse.intent}
          </span>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{latestResponse.intentDescription}</p>
        </div>
        <div className="h-px w-full bg-white/5" />
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Orchestration Route</div>
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">{latestResponse.route}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Agent: <span className="text-foreground/80 font-mono">{latestResponse.agent_used}</span></span>
          </div>
        </div>
      </div>

      {/* Confidence + Latency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <Gauge className="w-3 h-3" /> Confidence
          </div>
          <div className="text-2xl font-display font-semibold">{(latestResponse.confidence * 100).toFixed(1)}%</div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${latestResponse.confidence * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={clsx('h-full bg-gradient-to-r', confColor(latestResponse.confidence))}
            />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <Clock className="w-3 h-3" /> Latency
          </div>
          <div className="text-2xl font-display font-semibold">
            {latestResponse.latency_ms}<span className="text-sm text-muted-foreground font-sans"> ms</span>
          </div>
          <div className={clsx('text-[10px] mt-1',
            latestResponse.latency_ms < 500 ? 'text-emerald-400' :
            latestResponse.latency_ms < 5000 ? 'text-amber-400' : 'text-blue-400')}>
            {latestResponse.latency_ms < 500 ? '⚡ Rule path' :
             latestResponse.latency_ms < 5000 ? '✓ Within SLA' : '🤖 LLM + tools'}
          </div>
        </div>
      </div>

      {/* Execution context — tool calls */}
      <div className="glass-card rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Execution Context</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Vector Search</span>
            {latestResponse.used_vector_search
              ? <span className="px-2 py-0.5 rounded-md bg-accent/20 text-accent border border-accent/20 text-[10px] font-bold uppercase">Active</span>
              : <span className="px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/10 text-[10px] font-bold uppercase">Bypassed</span>}
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-2">Tools Invoked</span>
            {latestResponse.tool_calls && latestResponse.tool_calls.length > 0 ? (
              <div className="space-y-2">
                {latestResponse.tool_calls.map((tc, i) => (
                  <ToolCallCard key={i} tc={tc} />
                ))}
              </div>
            ) : latestResponse.tools_used.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {latestResponse.tools_used.map(t => (
                  <span key={t} className="px-2 py-1 bg-black/40 border border-white/10 rounded-md text-xs font-mono text-primary/90">{t}()</span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-foreground/50">Zero-shot — no tools needed</span>
            )}
          </div>
        </div>
      </div>

      {/* User state */}
      {(known.length > 0 || inferred.length > 0 || missing.length > 0) && (
        <div className="glass-card rounded-xl p-4 border-l-2 border-l-accent">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">User State</div>
          <div className="space-y-3">
            {known.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1.5">Known</div>
                <div className="flex flex-wrap gap-1">
                  {known.map((k, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {inferred.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1.5">Inferred</div>
                <div className="flex flex-wrap gap-1">
                  {inferred.map((k, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px]">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1.5">Missing</div>
                <div className="flex flex-wrap gap-1">
                  {missing.map((k, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white/5 text-muted-foreground border border-white/10 rounded text-[10px]">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- UserView ---------------------------------------------------------------

interface UserViewProps {
  latestResponse: ChatResponse;
}

function UserView({ latestResponse }: UserViewProps) {
  return (
    <motion.div
      key="user"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      <div className="glass-card rounded-xl p-5 border-t-2 border-t-primary text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">How Nova Helped</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nova analyzed your request, routed it to the right agent, and combined
          {latestResponse.used_vector_search ? ' semantic knowledge retrieval' : ' structured logic'}
          {latestResponse.tools_used.length > 0 ? ' with live data tools' : ''} to generate this response.
        </p>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">What Nova understood</div>
        <span className={clsx('px-3 py-1.5 rounded-md inline-block text-sm font-semibold border', intentColor(latestResponse.intent))}>
          {latestResponse.intent.replace(/_/g, ' ')}
        </span>
        <p className="text-xs text-muted-foreground mt-2">{latestResponse.intentDescription}</p>
      </div>

      {latestResponse.citations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4 text-accent" /> Sources
          </h3>
          {latestResponse.citations.map((cite, i) =>
            cite.url ? (
              <a
                key={i}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between bg-black/20 border border-white/5 rounded-lg p-3 hover:bg-white/5 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div>
                  <div className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">{cite.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cite.source}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary mt-0.5 flex-shrink-0 ml-2" />
              </a>
            ) : (
              <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-3">
                <div className="text-sm font-medium text-foreground/90">{cite.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{cite.source}</div>
              </div>
            ),
          )}
        </div>
      )}

      <div className="glass-card rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Response Quality</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${latestResponse.confidence * 100}%` }}
              transition={{ duration: 1 }}
              className={clsx('h-full bg-gradient-to-r', confColor(latestResponse.confidence))}
            />
          </div>
          <span className="text-sm font-semibold">{(latestResponse.confidence * 100).toFixed(0)}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {latestResponse.confidence >= 0.85
            ? 'High confidence — strong intent match'
            : latestResponse.confidence >= 0.65
            ? 'Good confidence — intent matched with context'
            : 'Lower confidence — consider rephrasing'}
        </p>
      </div>
    </motion.div>
  );
}
