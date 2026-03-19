import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ChatMessage } from '../../services/apiTypes';
import { CheckCircle2, AlertTriangle, Info, TrendingUp, Headphones, Heart, BarChart2 } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

// Map backend card types to icons
function CardIcon({ type }: { type: string }) {
  switch (type) {
    case 'market_summary': return <TrendingUp className="w-4 h-4 text-blue-400" />;
    case 'support_steps':  return <Headphones className="w-4 h-4 text-emerald-400" />;
    case 'retention_offer': return <Heart className="w-4 h-4 text-pink-400" />;
    case 'action':         return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'alert':          return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    default:               return <Info className="w-4 h-4 text-primary" />;
  }
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
      {/* Nova avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <BarChart2 className="w-4 h-4 text-white" />
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

        {/* Workflow Card */}
        {!isUser && message.workflowCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-1 w-full glass-card p-4 rounded-xl border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <CardIcon type={message.workflowCard.type} />
              <span className="font-semibold text-sm tracking-wide text-foreground">
                {message.workflowCard.title}
              </span>
            </div>
            <ul className="space-y-2">
              {message.workflowCard.items.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
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
