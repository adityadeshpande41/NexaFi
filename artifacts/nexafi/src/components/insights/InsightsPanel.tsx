import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatResponse } from '../../services/apiTypes';
import { 
  GitMerge, 
  TerminalSquare, 
  Gauge, 
  Clock, 
  BookOpen, 
  UserCircle,
  Eye,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface InsightsPanelProps {
  systemView: boolean;
  onToggleView: (view: boolean) => void;
  latestResponse: ChatResponse | null;
}

export function InsightsPanel({ systemView, onToggleView, latestResponse }: InsightsPanelProps) {
  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 border-l border-white/5 bg-background/80 backdrop-blur-3xl flex flex-col h-[calc(100vh-4rem)] relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
      
      {/* Header & Toggle */}
      <div className="p-5 border-b border-white/5 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" /> Copilot Insights
        </h2>
        
        <div className="bg-black/30 p-1 rounded-xl flex items-center border border-white/5 relative">
          <motion.div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card border border-white/10 rounded-lg shadow-sm"
            animate={{ left: systemView ? 'calc(50% + 2px)' : '4px' }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
          <button 
            onClick={() => onToggleView(false)}
            className={clsx("flex-1 py-1.5 text-xs font-semibold z-10 transition-colors", !systemView ? "text-foreground" : "text-muted-foreground")}
          >
            <div className="flex items-center justify-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5" /> User View
            </div>
          </button>
          <button 
            onClick={() => onToggleView(true)}
            className={clsx("flex-1 py-1.5 text-xs font-semibold z-10 transition-colors", systemView ? "text-foreground text-gradient" : "text-muted-foreground")}
          >
             <div className="flex items-center justify-center gap-1.5">
              <TerminalSquare className="w-3.5 h-3.5" /> System View
            </div>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
        <AnimatePresence mode="wait">
          {!latestResponse ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-60"
            >
              <Eye className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm max-w-[200px]">Send a message to see how Nova processes your intent.</p>
            </motion.div>
          ) : systemView ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Intent & Route Card */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Detected Intent</div>
                  <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md inline-block text-sm font-semibold">
                    {latestResponse.intent}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {latestResponse.intentDescription}
                  </p>
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
                    <span className="text-xs text-muted-foreground">Handled by: <span className="text-foreground/80 font-mono">{latestResponse.agent_used}</span></span>
                  </div>
                </div>
              </div>

              {/* Technical Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <Gauge className="w-3 h-3" /> Confidence
                  </div>
                  <div className="text-2xl font-display font-semibold text-foreground">
                    {(latestResponse.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${latestResponse.confidence * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 flex flex-col justify-center">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <Clock className="w-3 h-3" /> Latency
                  </div>
                  <div className="text-2xl font-display font-semibold text-foreground">
                    {latestResponse.latency_ms} <span className="text-sm text-muted-foreground font-sans">ms</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Faster than 92% SLA</div>
                </div>
              </div>

              {/* Tools & Execution */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Execution Context</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">Vector Search</span>
                    {latestResponse.used_vector_search ? (
                      <span className="px-2 py-0.5 rounded-md bg-accent/20 text-accent border border-accent/20 text-[10px] font-bold uppercase tracking-wider">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/10 text-[10px] font-bold uppercase tracking-wider">Bypassed</span>
                    )}
                  </div>
                  <div>
                     <span className="text-xs text-muted-foreground block mb-1.5">Tools Invoked</span>
                     {latestResponse.tools_used.length > 0 ? (
                       <div className="flex flex-wrap gap-1.5">
                         {latestResponse.tools_used.map(t => (
                           <span key={t} className="px-2 py-1 bg-black/40 border border-white/10 rounded-md text-xs font-mono text-primary/90">
                             {t}()
                           </span>
                         ))}
                       </div>
                     ) : (
                       <span className="text-xs font-medium text-foreground/50">Zero-shot response</span>
                     )}
                  </div>
                </div>
              </div>

              {/* User State Mutated */}
              <div className="glass-card rounded-xl p-4 border-l-2 border-l-accent">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">User State Context</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Known Attributes</div>
                    <div className="flex flex-wrap gap-1">
                      {latestResponse.state.known.map((k,i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] whitespace-nowrap">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Inferred Attributes (Dynamic)</div>
                    <div className="flex flex-wrap gap-1">
                      {latestResponse.state.inferred.map((k,i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] whitespace-nowrap">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="user"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              {/* Product Friendly View */}
               <div className="glass-card rounded-xl p-5 border-t-2 border-t-primary text-center">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                   <Sparkles className="w-6 h-6 text-primary" />
                 </div>
                 <h3 className="font-semibold text-foreground mb-2">How Nova Helped</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   Nova securely analyzed your portfolio context and combined it with real-time market data to provide this answer.
                 </p>
               </div>

               {latestResponse.citations.length > 0 && (
                 <div className="space-y-3">
                   <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                     <BookOpen className="w-4 h-4 text-accent" /> Sources Checked
                   </h3>
                   {latestResponse.citations.map((cite, i) => (
                     <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors cursor-pointer group">
                       <div className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">{cite.title}</div>
                       <div className="text-xs text-muted-foreground mt-1">{cite.source}</div>
                     </div>
                   ))}
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
