import React, { useState, useRef } from 'react';
import { TopNav } from '../components/layout/TopNav';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { InsightsPanel } from '../components/insights/InsightsPanel';
import { ChatMessage, ChatResponse } from '../services/apiTypes';
import { sendMessage, getSessionMetrics } from '../services/chatService';

interface RecentChat {
  id: string;
  title: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemView, setSystemView] = useState(true);
  const [latestResponse, setLatestResponse] = useState<ChatResponse | null>(null);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(`session_${Date.now()}`).current;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendMessage(text, messages, systemView, sessionId);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date(),
        workflowCard: res.workflow_card,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setResponses(prev => [...prev, res]);
      setLatestResponse(res);

      // Add to recent chats (first 5 words of user message as title)
      const title = text.split(' ').slice(0, 5).join(' ') + (text.split(' ').length > 5 ? '…' : '');
      setRecentChats(prev => [{ id: userMsg.id, title }, ...prev].slice(0, 6));

    } catch (err: any) {
      setError(err?.message ?? 'Failed to reach backend. Is the server running?');
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setResponses([]);
    setLatestResponse(null);
    setError(null);
  };

  const sessionMetrics = getSessionMetrics(responses);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <TopNav onSendMessage={handleSendMessage} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          onNewChat={handleNewChat}
          recentChats={recentChats}
          onStarterPrompt={handleSendMessage}
        />
        <div className="flex-1 flex flex-col relative">
          {/* Error banner */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl backdrop-blur-md max-w-lg text-center">
              {error}
            </div>
          )}
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            metrics={sessionMetrics}
          />
        </div>
        <InsightsPanel
          systemView={systemView}
          onToggleView={setSystemView}
          latestResponse={latestResponse}
        />
      </div>
    </div>
  );
}
