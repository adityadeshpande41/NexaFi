export interface Citation {
  title: string;
  source: string;
  url?: string;
}

export interface UserState {
  known: string[];
  inferred: string[];
  missing: string[];
}

export interface WorkflowCard {
  type: 'action' | 'info' | 'alert';
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
  used_vector_search: boolean;
  confidence: number;
  latency_ms: number;
  citations: Citation[];
  state: UserState;
  workflow_card?: WorkflowCard;
}

export interface SessionMetrics {
  llmCalls: number;
  toolCalls: number;
  costEfficiency: 'High' | 'Medium' | 'Low';
  pathType: 'Fast Path' | 'Grounded Path' | 'Workflow Path';
}
