import { ChatMessage, ChatResponse, SessionMetrics } from './apiTypes';
import { MOCK_RESPONSES } from './mockData';

export const analyzeMessage = (message: string): keyof typeof MOCK_RESPONSES => {
  const lower = message.toLowerCase();
  
  if (lower.includes('etf') || lower.includes('what is') || lower.includes('explain')) {
    return 'education';
  }
  if (lower.includes('nvda') || lower.includes('market') || lower.includes('down') || lower.includes('stock')) {
    return 'market';
  }
  if (lower.includes('error') || lower.includes('bank') || lower.includes('help') || lower.includes('support')) {
    return 'support';
  }
  if (lower.includes('don\'t like') || lower.includes('cancel') || lower.includes('close') || lower.includes('sucks')) {
    return 'churn';
  }
  if (lower.includes('assumption') || lower.includes('know about me') || lower.includes('profile')) {
    return 'profile';
  }
  
  return 'fallback';
};

export const sendMessage = async (
  message: string, 
  history: ChatMessage[], 
  systemView: boolean
): Promise<ChatResponse> => {
  // Simulate network latency (800ms - 1500ms)
  const latency = Math.floor(Math.random() * 700) + 800;
  await new Promise(resolve => setTimeout(resolve, latency));

  const flowKey = analyzeMessage(message);
  const responseData = MOCK_RESPONSES[flowKey];

  // Adjust latency in response to match our artificial delay + processing overhead
  return {
    ...responseData,
    latency_ms: latency + Math.floor(Math.random() * 200)
  };
};

export const getSessionMetrics = (responses: ChatResponse[]): SessionMetrics => {
  if (responses.length === 0) {
    return { llmCalls: 0, toolCalls: 0, costEfficiency: 'High', pathType: 'Fast Path' };
  }
  
  const toolCalls = responses.reduce((acc, curr) => acc + (curr.tools_used?.length || 0), 0);
  const llmCalls = responses.length; // Simplification: 1 call per response, reality would be higher with agents
  
  const latestResponse = responses[responses.length - 1];
  let pathType: SessionMetrics['pathType'] = 'Fast Path';
  if (latestResponse.tools_used.length > 0) pathType = 'Grounded Path';
  if (latestResponse.route.includes('workflow')) pathType = 'Workflow Path';
  
  return {
    llmCalls,
    toolCalls,
    costEfficiency: toolCalls > 2 ? 'Medium' : 'High',
    pathType
  };
};
