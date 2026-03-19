import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ChatMessage } from '../../services/apiTypes';
import { Bot, User, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
      className={clsx(
        "flex w-full gap-4 max-w-3xl mx-auto",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden">
             <img src={`${import.meta.env.BASE_URL}images/orb.png`} alt="Nova" className="w-full h-full object-cover animate-pulse-slow opacity-80" />
             <div className="absolute inset-0 bg-primary/20 mix-blend-color"></div>
          </div>
        </div>
      )}

      <div className={clsx(
        "flex flex-col gap-2 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={clsx(
          "px-5 py-3.5 text-sm md:text-base whitespace-pre-wrap leading-relaxed shadow-lg",
          isUser 
            ? "bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-tr-sm"
            : "bg-card/80 backdrop-blur-md border border-white/10 text-foreground/90 rounded-2xl rounded-tl-sm"
        )}>
          {message.content}
        </div>

        {/* Workflow Card (if attached to assistant message) */}
        {!isUser && message.workflowCard && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 w-full glass-card p-4 rounded-xl border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              {message.workflowCard.type === 'action' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {message.workflowCard.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {message.workflowCard.type === 'info' && <Info className="w-4 h-4 text-primary" />}
              <span className="font-semibold text-sm tracking-wide text-foreground">{message.workflowCard.title}</span>
            </div>
            <ul className="space-y-2">
              {message.workflowCard.items.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <span className="text-[10px] text-muted-foreground/60 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
