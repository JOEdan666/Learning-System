// Review Card types for Intelligent Partner extension

/**
 * Citation with traceable source
 */
export interface Citation {
  quote: string;           // The quoted text
  source: 'selection' | 'page' | 'ai';  // Where it came from
  url: string;             // Page URL
}

/**
 * Risk flag (Day4 feature - placeholder)
 */
export interface RiskFlag {
  label: string;
  quote: string;
  url: string;
}

/**
 * Page Gist response from API
 */
export interface PageGistResponse {
  gistTldr3: string[];     // 3 summary points
  keyPoints: string[];     // 3-5 key points
  citations: Citation[];
}

/**
 * Explain response from API
 */
export interface ExplainResponse {
  tldr3: string[];         // 3 summary points
  explainFull?: string;    // Full explanation (optional)
  citations: Citation[];
}

/**
 * Review Card - the merged card saved from extension
 * Combines Page Gist + Selection + Explain
 */
export interface ReviewCard {
  id: string;

  // Source context
  source: {
    url: string;
    title: string;
    capturedAt: Date;
  };

  // The selected text that triggered this card
  selectionText: string;

  // Explain output
  tldr3: string[];         // 3 summary lines
  keyPoints: string[];     // 3-5 key points

  // Citations with traceable sources
  citations: Citation[];

  // Day4 placeholder - risk flags
  riskFlags?: RiskFlag[];

  // Metadata
  userId?: string;
  guestId?: string;
  status: 'draft' | 'saved';

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request payload for page-gist API
 */
export interface PageGistRequest {
  url: string;
  title: string;
  pageSnippet: string;
}

/**
 * Request payload for explain API
 */
export interface ExplainRequest {
  url: string;
  title: string;
  selectionText: string;
  pageSnippet?: string;
}
