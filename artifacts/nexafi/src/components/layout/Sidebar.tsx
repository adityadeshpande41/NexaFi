import React from 'react';
import { Plus, MessageSquare, Clock, Zap, Target, Shield, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-card/30 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] hidden lg:flex">
      <div className="p-4">
        <button className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-3 px-4 font-medium transition-all duration-300 group">
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        
        {/* Recent */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent Convos</h3>
          <div className="space-y-1">
            {['Tech earnings impact', 'Rebalancing strategy Q3', 'Tax-loss harvesting'].map((title, i) => (
              <button key={i} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-sm text-foreground/80 hover:text-foreground transition-colors group text-left">
                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Workflows */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Saved Workflows</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-foreground/80 transition-colors text-left">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Weekly Market Prep</span>
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-foreground/80 transition-colors text-left">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Risk Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Context Strip */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="glass-card rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Demo User</p>
              <p className="text-xs text-muted-foreground">Premium Tier</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3 h-3 text-primary" />
              <span>Growth</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-accent" />
              <span>Mod. Risk</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
