export interface Citation {
  title: string;
  source: string;
  url?: string;
}

export interface ToolCall {
  tool: string;
  api: string;
  endpoint: string;
  url: string;
  params: Record<string, unknown>;
  description: string;
}

// State from backend: known/inferred are objects, missing is string[]
export interface UserState {
  known: Record<string, unknown> | string[];
  inferred: Record<string, unknown> | string[];
  missing: string[];
}

export interface WorkflowCard {
  type: string; // backend sends "market_summary", "support_steps", etc.
  title: string;
  items: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  workflowCard?: WorkflowCard;
}

export interface ChatResponse {
  response: string;
  intent: string;
  intentDescription: string;
  route: string;
  agent_used: string;
  tools_used: string[];
  tool_calls: ToolCall[];
  used_vector_search: boolean;
  confidence: number;
  latency_ms: number;
  citations: Citation[];
  state: UserState | null;
  workflow_card?: WorkflowCard;
}

export interface SessionMetrics {
  llmCalls: number;
  toolCalls: number;
  costEfficiency: 'High' | 'Medium' | 'Low';
  pathType: 'Fast Path' | 'Grounded Path' | 'Workflow Path';
}
