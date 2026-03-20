import React, { useState } from 'react';
import { Activity, Bell, Settings, Sparkles, X, User, Link2, BellRing, Shield, Key, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavProps {
  onSendMessage?: (msg: string) => void;
}

type SettingsPage = 'menu' | 'profile' | 'accounts' | 'notifications' | 'privacy' | 'apikeys';

const SETTINGS_ITEMS = [
  { id: 'profile' as SettingsPage,       icon: User,     label: 'Profile & Preferences' },
  { id: 'accounts' as SettingsPage,      icon: Link2,    label: 'Linked Accounts' },
  { id: 'notifications' as SettingsPage, icon: BellRing, label: 'Notifications' },
  { id: 'privacy' as SettingsPage,       icon: Shield,   label: 'Privacy & Data' },
  { id: 'apikeys' as SettingsPage,       icon: Key,      label: 'API Keys' },
];

function Row({ label, value, badge, badgeText }: { label: string; value: string; badge?: 'green' | 'gray'; badgeText?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground/90">{value}</span>
        {badge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badge === 'green' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-foreground/80">{label}</span>
      <button
        onClick={() => setOn(v => !v)}
        className={`w-8 h-4 rounded-full transition-colors relative ${on ? 'bg-primary' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function SettingsContent({ page }: { page: SettingsPage }) {
  if (page === 'profile') return (
    <div className="space-y-0.5">
      <Row label="Name" value="Alex Chen" />
      <Row label="Email" value="alex@demo.com" />
      <Row label="Plan" value="Premium" badge="green" badgeText="Active" />
      <Row label="Risk Tolerance" value="Moderate" />
      <Row label="Investing Style" value="Growth-oriented" />
      <Row label="Primary Interest" value="Tech stocks & ETFs" />
    </div>
  );
  if (page === 'accounts') return (
    <div className="space-y-0.5">
      <Row label="Chase Bank" value="Checking ····4821" badge="green" badgeText="Connected" />
      <Row label="Fidelity" value="Brokerage ····9203" badge="green" badgeText="Connected" />
      <Row label="Robinhood" value="Not linked" badge="gray" badgeText="Add" />
    </div>
  );
  if (page === 'notifications') return (
    <div className="space-y-0.5">
      <Toggle label="Price alerts" defaultOn={true} />
      <Toggle label="Portfolio rebalance" defaultOn={true} />
      <Toggle label="Weekly market prep" defaultOn={true} />
      <Toggle label="News digest" defaultOn={false} />
      <Toggle label="Earnings reminders" defaultOn={false} />
    </div>
  );
  if (page === 'privacy') return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">NexaFi stores your profile, chat history, and inferred preferences. Your data is never sold to third parties.</p>
      <Toggle label="Personalised recommendations" defaultOn={true} />
      <Toggle label="Usage analytics" defaultOn={false} />
    </div>
  );
  if (page === 'apikeys') return (
    <div className="space-y-0.5">
      <Row label="Finnhub" value="d6u5···vg" badge="green" badgeText="Active" />
      <Row label="OpenAI" value="sk-···mini" badge="green" badgeText="Active" />
      <p className="text-xs text-muted-foreground pt-2">Keys are stored server-side only.</p>
    </div>
  );
  return null;
}

export function TopNav({ onSendMessage }: TopNavProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPage, setSettingsPage] = useState<SettingsPage>('menu');

  const NOTIFS = [
    { text: 'NVDA down 1.02% today', time: 'Just now', color: 'text-red-400', prompt: 'Why is NVDA down today?' },
    { text: 'Portfolio rebalance suggested', time: '2h ago', color: 'text-amber-400', prompt: 'Show me portfolio rebalancing suggestions' },
    { text: 'Weekly market prep ready', time: '1d ago', color: 'text-blue-400', prompt: 'Give me a weekly market prep summary for tech stocks' },
  ];

  const openSettings = () => { setSettingsPage('menu'); setShowSettings(true); setShowNotifs(false); };
  const closeSettings = () => { setShowSettings(false); setSettingsPage('menu'); };
  const currentItem = SETTINGS_ITEMS.find(s => s.id === settingsPage);

  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-wide text-foreground">
          Nexa<span className="text-primary/70 font-light">Fi</span>
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-foreground/90 hover:text-primary transition-colors flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Copilot
        </Link>
        <Link href="/portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
        <Link href="/markets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
        <Link href="/workflows" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Workflows</Link>
      </nav>

      <div className="flex items-center gap-2 relative">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setShowNotifs(v => !v); closeSettings(); }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-12 w-72 glass-panel rounded-xl p-3 space-y-1 border border-white/10 shadow-2xl z-50">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notifications</span>
                  <button onClick={() => setShowNotifs(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                {NOTIFS.map((n, i) => (
                  <div key={i} onClick={() => { onSendMessage?.(n.prompt); setShowNotifs(false); }} className="px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
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
          <button onClick={openSettings} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-all">
            <Settings className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-12 w-64 glass-panel rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  {settingsPage !== 'menu' ? (
                    <button onClick={() => setSettingsPage('menu')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Settings</span>
                  )}
                  <button onClick={closeSettings}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
                </div>
                <div className="p-3">
                  <AnimatePresence mode="wait">
                    {settingsPage === 'menu' ? (
                      <motion.div key="menu" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-0.5">
                        {SETTINGS_ITEMS.map(item => (
                          <button key={item.id} onClick={() => setSettingsPage(item.id)} className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-white/5 text-sm text-foreground/80 hover:text-foreground transition-colors group">
                            <div className="flex items-center gap-2.5">
                              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              {item.label}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                          </button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key={settingsPage} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <div className="flex items-center gap-2 mb-3 px-1">
                          {currentItem && <currentItem.icon className="w-4 h-4 text-primary" />}
                          <span className="text-sm font-semibold text-foreground">{currentItem?.label}</span>
                        </div>
                        <SettingsContent page={settingsPage} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        <button onClick={() => onSendMessage?.('Give me a full demo of NexaFi capabilities — market data, portfolio analysis, and education features.')} className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Live Demo
        </button>
      </div>
    </header>
  );
}
