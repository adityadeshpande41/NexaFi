import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Cpu, Database } from 'lucide-react';
import { ChatMessage, SessionMetrics } from '../../services/apiTypes';
import { STARTER_PROMPTS } from '../../services/mockData';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  metrics: SessionMetrics;
}

export function ChatArea({ messages, onSendMessage, isLoading, metrics }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Scrollable message list ── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, height: 0, overflowY: 'auto', overflowX: 'hidden' }}
        className="px-4 py-8 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center pt-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative mb-8"
              style={{ width: 96, height: 96 }}
            >
              {/* Soft glow halo behind the orb */}
              <span style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                background: 'radial-gradient(circle, hsl(221,83%,53%,0.3) 0%, hsl(262,83%,58%,0.15) 50%, transparent 70%)',
                animation: 'orb-glow 4s ease-in-out infinite',
                filter: 'blur(10px)',
              }} />
              <img
                src={`${import.meta.env.BASE_URL}images/orb.png`}
                alt="Nova Core"
                className="w-full h-full object-cover rounded-full shadow-2xl shadow-primary/40"
                style={{ animation: 'orb-float 5s ease-in-out infinite', position: 'relative' }}
              />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-display font-bold mb-3"
            >
              Hi, I'm Nova.
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg mb-10 max-w-md"
            >
              Your intelligent investing copilot. How can I help you navigate the markets today?
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
            >
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt.text)}
                  className="glass-card text-left px-4 py-3 rounded-xl text-sm font-medium text-foreground/80 hover:text-primary transition-all flex items-center justify-between group"
                >
                  <span>{prompt.text}</span>
                  <Sparkles className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start max-w-3xl mx-auto gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="w-3 h-3 rounded-full bg-white/80 animate-ping" />
                </div>
                <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ── Input area — never scrolls, always visible at bottom ── */}
      <div style={{ flexShrink: 0 }} className="border-t border-white/5 bg-background/95 backdrop-blur-xl px-4 py-4">
        <div className="max-w-3xl mx-auto">

          {/* Metrics strip */}
          <AnimatePresence>
            {messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center gap-3 mb-3"
              >
                <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <Cpu className="w-3 h-3 text-primary" />
                  <span>{metrics.llmCalls} LLM Calls</span>
                </div>
                <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <Database className="w-3 h-3 text-accent" />
                  <span>{metrics.pathType}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="relative flex items-end rounded-2xl shadow-2xl shadow-black/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message Nova..."
              rows={1}
              className="w-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none overflow-hidden text-base min-h-[56px] max-h-[140px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:bg-card disabled:text-muted-foreground transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center mt-2 text-[11px] text-muted-foreground/50">
            Nova can make mistakes. Consider verifying important financial data.
          </p>
        </div>
      </div>
    </div>
  );
}
