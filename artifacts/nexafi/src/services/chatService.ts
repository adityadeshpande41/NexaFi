/**
 * chatService.ts - Real API client for the NexaFi backend.
 * Calls /api/chat which is proxied by Vite → Express → Python FastAPI.
 * No CORS issues, works locally out of the box.
 */

import { ChatMessage, ChatResponse, SessionMetrics } from './apiTypes';

// Always use relative path — Vite proxies /api to the Express server
const API_BASE = '/api';

const DEMO_USER_ID = 'demo_user_1';

export const sendMessage = async (
  message: string,
  history: ChatMessage[],
  systemView: boolean,
  sessionId: string
): Promise<ChatResponse> => {
  const payload = {
    user_id: DEMO_USER_ID,
    session_id: sessionId,
    message,
    history: history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content })),
    system_view: systemView,
  };

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backend error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Normalize backend response to match frontend's ChatResponse type
  return {
    response: data.response,
    intent: data.intent,
    intentDescription: intentLabel(data.intent),
    route: data.route,
    agent_used: data.agent_used,
    tools_used: data.tools_used ?? [],
    used_vector_search: data.used_vector_search ?? false,
    confidence: data.confidence ?? 0,
    latency_ms: data.latency_ms ?? 0,
    citations: data.citations ?? [],
    state: data.state ?? { known: [], inferred: [], missing: [] },
    workflow_card: data.workflow_card ?? undefined,
  };
};

export const getSessionMetrics = (responses: ChatResponse[]): SessionMetrics => {
  if (responses.length === 0) {
    return { llmCalls: 0, toolCalls: 0, costEfficiency: 'High', pathType: 'Fast Path' };
  }

  const toolCalls = responses.reduce((acc, r) => acc + (r.tools_used?.length || 0), 0);
  const llmCalls = responses.length;
  const latest = responses[responses.length - 1];

  let pathType: SessionMetrics['pathType'] = 'Fast Path';
  if (latest.tools_used.length > 0) pathType = 'Grounded Path';
  if (latest.route.includes('workflow')) pathType = 'Workflow Path';

  return {
    llmCalls,
    toolCalls,
    costEfficiency: toolCalls > 2 ? 'Medium' : 'High',
    pathType,
  };
};

// Human-readable intent labels for the InsightsPanel
function intentLabel(intent: string): string {
  const labels: Record<string, string> = {
    education_basic: 'User is asking for a definition of a financial concept.',
    market_explanation: 'User is seeking context on current market movements.',
    support_issue: 'User is reporting a technical issue or product problem.',
    churn_risk: 'User is expressing dissatisfaction or intent to leave.',
    profile_transparency: 'User is asking what the system knows about them.',
    off_topic: 'Message is outside the finance/product domain.',
  };
  return labels[intent] ?? 'General financial or product inquiry.';
}
