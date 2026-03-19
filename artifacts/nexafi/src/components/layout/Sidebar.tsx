import React from 'react';
import { Plus, MessageSquare, Zap, Shield, Target, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  onNewChat: () => void;
  recentChats: { id: string; title: string }[];
  onSelectChat?: (id: string) => void;
  onStarterPrompt: (msg: string) => void;
}

const WORKFLOWS = [
  { icon: <Zap className="w-4 h-4 text-amber-400" />, label: 'Weekly Market Prep', prompt: 'Give me a weekly market prep summary for tech stocks' },
  { icon: <Shield className="w-4 h-4 text-emerald-400" />, label: 'Risk Audit', prompt: 'What assumptions are you making about me?' },
];

export function Sidebar({ onNewChat, recentChats, onStarterPrompt }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-card/30 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] hidden lg:flex">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-3 px-4 font-medium transition-all duration-300 group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">

        {/* Recent conversations */}
        {recentChats.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent</h3>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-sm text-foreground/80 hover:text-foreground transition-colors group text-left"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Quick prompts */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Quick Prompts</h3>
          <div className="space-y-1">
            {[
              'What is an ETF?',
              'Why is NVDA down this week?',
              "I'm getting an error linking my bank",
              'What assumptions are you making about me?',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => onStarterPrompt(prompt)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-foreground/70 hover:text-foreground transition-colors text-left"
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-xs">{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Workflows */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Saved Workflows</h3>
          <div className="space-y-1">
            {WORKFLOWS.map((w, i) => (
              <button
                key={i}
                onClick={() => onStarterPrompt(w.prompt)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-foreground/80 hover:text-foreground transition-colors text-left"
              >
                {w.icon}
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User strip */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="glass-card rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Alex</p>
              <p className="text-xs text-muted-foreground">Premium · demo_user_1</p>
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
