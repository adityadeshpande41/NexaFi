import React, { useState } from 'react';
import { TopNav } from '../components/layout/TopNav';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { InsightsPanel } from '../components/insights/InsightsPanel';
import { ChatMessage, ChatResponse } from '../services/apiTypes';
import { sendMessage, getSessionMetrics } from '../services/mockChatService';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemView, setSystemView] = useState(true); // Default to system view to show off the cool stuff
  const [latestResponse, setLatestResponse] = useState<ChatResponse | null>(null);

  const handleSendMessage = async (text: string) => {
    // Optimistic UI update
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Mock API Call
      const res = await sendMessage(text, messages, systemView);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date(),
        workflowCard: res.workflow_card
      };

      setMessages(prev => [...prev, assistantMsg]);
      setResponses(prev => [...prev, res]);
      setLatestResponse(res);
      
      // Auto switch to system view if they send a message to show off the backend logic
      if (!systemView && messages.length === 0) {
        setSystemView(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sessionMetrics = getSessionMetrics(responses);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <ChatArea 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          metrics={sessionMetrics}
        />
        <InsightsPanel 
          systemView={systemView} 
          onToggleView={setSystemView} 
          latestResponse={latestResponse}
        />
      </div>
    </div>
  );
}
