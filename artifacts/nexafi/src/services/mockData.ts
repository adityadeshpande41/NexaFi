import { ChatResponse, UserState } from './apiTypes';

const defaultUserState: UserState = {
  known: ['Risk: Moderate', 'Horizon: 10+ years', 'Tier: Premium'],
  inferred: ['Interested in Tech/AI', 'Prefers passive management', 'Price sensitive'],
  missing: ['Exact annual income', 'Dependents', 'Tax bracket']
};

export const MOCK_RESPONSES: Record<string, ChatResponse> = {
  education: {
    response: "An Exchange-Traded Fund (ETF) is a basket of securities you buy or sell through a brokerage firm on a stock exchange. Think of it like a mutual fund, but it trades in real-time like a stock. \n\nGiven your moderate risk profile and long-term horizon, broad-market ETFs are typically a highly recommended foundational asset.",
    intent: "education_basic",
    intentDescription: "User is asking for a definition of a fundamental financial concept.",
    route: "direct_answer_path",
    agent_used: "education_agent",
    tools_used: [],
    used_vector_search: true,
    confidence: 0.98,
    latency_ms: 450,
    citations: [
      { title: "ETFs Explained", source: "Investopedia" },
      { title: "NexaFi Knowledge Base", source: "Internal DB" }
    ],
    state: defaultUserState,
  },
  
  market: {
    response: "Nvidia (NVDA) is experiencing downward pressure this week primarily due to broader macroeconomic factors rather than company-specific news. \n\nThe latest CPI report showed slightly higher-than-expected inflation (3.2%), causing treasury yields to spike. High-growth tech stocks are particularly sensitive to rate changes because their valuations rely heavily on future cash flows.",
    intent: "market_explanation",
    intentDescription: "User is seeking context on current market movements for a specific asset.",
    route: "market_context_path",
    agent_used: "market_agent",
    tools_used: ["market_snapshot", "news_fetch", "macro_calendar"],
    used_vector_search: false,
    confidence: 0.92,
    latency_ms: 1240,
    citations: [
      { title: "Tech Stocks Slide on CPI Print", source: "Bloomberg" },
      { title: "NVDA Weekly Options Chain", source: "CBOE Data" }
    ],
    state: {
      ...defaultUserState,
      inferred: [...defaultUserState.inferred, 'Holds or monitors NVDA']
    },
    workflow_card: {
      type: 'info',
      title: 'NVDA Technical Snapshot',
      items: ['RSI (14): 42 (Approaching Oversold)', 'Support: $840.50', 'Volume: 112% of 30-day avg']
    }
  },

  support: {
    response: "I'm sorry you're having trouble linking your bank. Our integration partner, Plaid, is currently reporting degraded performance for Chase and Wells Fargo connections.\n\nI can notify you as soon as the connection is fully restored, or we can try using the manual micro-deposit method instead.",
    intent: "support_issue",
    intentDescription: "User is reporting a technical issue or bug.",
    route: "support_workflow_path",
    agent_used: "support_agent",
    tools_used: ["check_system_status", "user_log_lookup"],
    used_vector_search: false,
    confidence: 0.99,
    latency_ms: 820,
    citations: [],
    state: defaultUserState,
    workflow_card: {
      type: 'action',
      title: 'Alternative Options',
      items: ['Switch to Micro-deposit verification (Takes 1-2 days)', 'Enable SMS alert when system is restored']
    }
  },

  churn: {
    response: "I'm genuinely sorry to hear that NexaFi isn't meeting your expectations right now. \n\nAs a Premium member, your success is incredibly important to us. Could you share what specific features are falling short? I'd like to help configure the app better for your needs, or if you prefer, I can instantly route you to account management to review your subscription.",
    intent: "churn_risk",
    intentDescription: "User is expressing extreme dissatisfaction or intent to leave.",
    route: "retention_workflow_path",
    agent_used: "retention_agent",
    tools_used: ["sentiment_analyzer", "account_health_check"],
    used_vector_search: false,
    confidence: 0.89,
    latency_ms: 650,
    citations: [],
    state: {
      ...defaultUserState,
      known: [...defaultUserState.known, 'Sentiment: High Risk']
    },
    workflow_card: {
      type: 'alert',
      title: 'Retention Protocol Activated',
      items: ['Priority human support requested', 'Fee waiver eligibility: Yes (3 months)']
    }
  },

  profile: {
    response: "I aim to be completely transparent. Based on our past interactions and your linked accounts, I build a dynamic profile to give you personalized advice. \n\nFor example, I've inferred you have a moderate risk tolerance because your portfolio is 60% equities and 40% fixed income. I also noticed you frequently ask about AI infrastructure, so I prioritize tech news for you. \n\nYou have full control—check the panel on the right to see exactly what I currently know, infer, and am missing about you.",
    intent: "profile_transparency",
    intentDescription: "User is questioning the AI's knowledge base, assumptions, or privacy.",
    route: "profile_state_path",
    agent_used: "profile_agent",
    tools_used: ["memory_retrieval"],
    used_vector_search: true,
    confidence: 0.97,
    latency_ms: 910,
    citations: [
      { title: "NexaFi Privacy Promise", source: "User Settings" }
    ],
    state: defaultUserState
  },
  
  fallback: {
    response: "That's an interesting question. While I'm specialized in financial markets, portfolio strategy, and NexaFi support, I can definitely try to help. Could you provide a bit more context on what you're looking to achieve?",
    intent: "general_inquiry",
    intentDescription: "General conversational input with no direct financial or support mapping.",
    route: "general_chat_path",
    agent_used: "base_llm",
    tools_used: [],
    used_vector_search: false,
    confidence: 0.65,
    latency_ms: 1050,
    citations: [],
    state: defaultUserState
  }
};

export const STARTER_PROMPTS = [
  { text: "What is an ETF?", flow: "education" },
  { text: "Why is NVDA down this week?", flow: "market" },
  { text: "I'm getting an error linking my bank", flow: "support" },
  { text: "What assumptions are you making about me?", flow: "profile" }
];
