export type PartnerMode = 'Study' | 'Work' | 'Brainstorm';

export interface PartnerSignal {
  title: string;
  domain?: string;
  url?: string;
  timestamp: number;
}

export interface PartnerContext {
  url?: string;
  title?: string;
  domain?: string;
  snippet?: string;
}

export interface PartnerWorldState {
  mode: PartnerMode;
  topic?: string;
  goal?: string;
  context?: PartnerContext;
  recentSignals?: PartnerSignal[];
}

export interface PartnerActionItem {
  text: string;
  checked: boolean;
}

export interface PartnerCitation {
  source: string;
  quote: string;
  ref?: string;
}

export interface PartnerAsset {
  id?: string;
  type: 'insight' | 'action' | 'idea' | 'risk' | 'summary';
  title: string;
  content: Record<string, any>;
  actionItems?: PartnerActionItem[];
  citations?: PartnerCitation[];
  status?: 'draft' | 'saved';
  createdAt?: string;
}

export interface PartnerAskResponse {
  tldr: string[];
  reasoning_points: string[];
  action_items: PartnerActionItem[];
  citations: PartnerCitation[];
  assets: PartnerAsset[];
  messageId: string;
}

export interface PartnerSessionSummary {
  id: string;
  mode: PartnerMode;
  topic?: string | null;
  pageTitle?: string | null;
  pageDomain?: string | null;
  messageCount: number;
  assetCount: number;
  status: 'draft' | 'saved' | 'archived';
  createdAt: string;
}

export interface PartnerSessionDetail {
  session: {
    id: string;
    mode: PartnerMode;
    topic?: string | null;
    goal?: string | null;
    pageUrl?: string | null;
    pageTitle?: string | null;
    pageDomain?: string | null;
    status: 'draft' | 'saved' | 'archived';
    createdAt: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content?: string;
    contentJson?: any;
    createdAt: string;
  }>;
  assets: PartnerAsset[];
}
