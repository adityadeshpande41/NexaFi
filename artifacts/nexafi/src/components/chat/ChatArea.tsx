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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col relative h-[calc(100vh-4rem)]">
      {/* Background Mesh */}
      <div className="bg-mesh pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none"></div>
      
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 z-0 pb-36">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center mt-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-24 h-24 rounded-full relative mb-8 flex items-center justify-center"
            >
               <img src={`${import.meta.env.BASE_URL}images/orb.png`} alt="Nova Core" className="w-full h-full object-cover animate-pulse-slow opacity-90 rounded-full shadow-2xl shadow-primary/40" />
               <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent rounded-full mix-blend-multiply"></div>
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
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start max-w-3xl mx-auto gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center">
                  <img src={`${import.meta.env.BASE_URL}images/orb.png`} alt="Nova" className="w-5 h-5 object-cover animate-spin opacity-50" style={{ animationDuration: '3s' }} />
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
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4 z-20">
        <div className="max-w-3xl mx-auto relative">
          
          {/* Metrics Strip */}
          {messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute -top-10 left-0 right-0 flex justify-center gap-3 pointer-events-none"
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

          <form onSubmit={handleSubmit} className="relative flex items-end shadow-2xl shadow-black/50 rounded-2xl">
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
              className="w-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none overflow-hidden transition-all text-base min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:bg-card disabled:text-muted-foreground transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3 text-[11px] text-muted-foreground/60">
            Nova can make mistakes. Consider verifying important financial data.
          </div>
        </div>
      </div>
    </div>
  );
}
