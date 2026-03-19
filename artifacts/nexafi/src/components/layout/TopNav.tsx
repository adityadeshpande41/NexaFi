import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell, Settings, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export function TopNav() {
  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="NexaFi Logo" className="w-5 h-5 object-contain" />
          <div className="absolute inset-0 bg-white/20 rounded-lg mix-blend-overlay"></div>
        </div>
        <span className="font-display font-bold text-xl tracking-wide text-foreground">
          Nexa<span className="text-primary-foreground/70 font-light">Fi</span>
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-foreground/90 hover:text-primary transition-colors flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Copilot
        </Link>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Portfolio
        </Link>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Markets
        </Link>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Workflows
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all">
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="h-5 w-px bg-white/10 mx-1"></div>
        
        <button className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Live Demo Mode
        </button>
      </div>
    </header>
  );
}
