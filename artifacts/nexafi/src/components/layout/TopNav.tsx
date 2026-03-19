import React, { useState } from 'react';
import { Activity, Bell, Settings, Sparkles, X } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavProps {
  onSendMessage?: (msg: string) => void;
}

export function TopNav({ onSendMessage }: TopNavProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const NOTIFS = [
    { text: 'NVDA down 1.02% today', time: 'Just now', color: 'text-red-400' },
    { text: 'Portfolio rebalance suggested', time: '2h ago', color: 'text-amber-400' },
    { text: 'Weekly market prep ready', time: '1d ago', color: 'text-blue-400' },
  ];

  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-wide text-foreground">
          Nexa<span className="text-primary/70 font-light">Fi</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-foreground/90 hover:text-primary transition-colors flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Copilot
        </Link>
        <button
          onClick={() => onSendMessage?.('Show me a portfolio overview and rebalancing suggestions')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Portfolio
        </button>
        <button
          onClick={() => onSendMessage?.('What are the top market movers today?')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Markets
        </button>
        <button
          onClick={() => onSendMessage?.('What is my weekly market prep workflow?')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Workflows
        </button>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2 relative">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); setShowSettings(false); }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-12 w-72 glass-panel rounded-xl p-3 space-y-1 border border-white/10 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notifications</span>
                  <button onClick={() => setShowNotifs(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                {NOTIFS.map((n, i) => (
                  <div key={i} className="px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <p className={`text-sm font-medium ${n.color}`}>{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => { setShowSettings(v => !v); setShowNotifs(false); }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-12 w-56 glass-panel rounded-xl p-3 space-y-1 border border-white/10 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Settings</span>
                  <button onClick={() => setShowSettings(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                {['Profile & Preferences', 'Linked Accounts', 'Notifications', 'Privacy & Data', 'API Keys'].map((item, i) => (
                  <button key={i} className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-foreground/80 hover:text-foreground transition-colors">
                    {item}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        <button className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Live Demo
        </button>
      </div>
    </header>
  );
}
