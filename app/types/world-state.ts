// World State types for Intelligent Partner

export type Mode = 'Study' | 'Work' | 'Brainstorm';

export interface PageContext {
  url: string;
  title: string;
  domain: string;
  pageSnippet?: string;
}

export interface Signal {
  title: string;
  domain: string;
  url: string;
  timestamp: number;
}

export interface WorldState {
  mode: Mode;
  topic: string;
  topicLocked: boolean; // 用户编辑后锁定，不再自动更新
  goal: string;
  context: PageContext;
  recentSignals: Signal[];
  signalsEnabled: boolean;
}

export interface Citation {
  quote: string;
  source: 'page' | 'selection' | 'context';
  url?: string;
}

export interface AskResult {
  conclusion: string;
  reasoning?: string;
  actions: string[];
  citations: Citation[];
}

export interface Session {
  id: string;
  worldState: WorldState;
  userInput: string;
  intent: 'clarify' | 'next-steps' | 'brainstorm' | 'custom';
  result: AskResult;
  timestamp: number;
  saved: boolean;
}

// API Request/Response types
export interface AskRequest {
  mode: Mode;
  topic: string;
  goal: string;
  context: PageContext;
  userInput: string;
  intent: 'clarify' | 'next-steps' | 'brainstorm' | 'custom';
}

export interface SaveSessionRequest {
  worldState: WorldState;
  userInput: string;
  intent: string;
  result: AskResult;
}

export interface TodayData {
  currentState: WorldState | null;
  recentSessions: Session[];
}
