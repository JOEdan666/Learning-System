// Wrong Question Type Definitions

export type WrongQuestionStatus = 'active' | 'archived' | 'mastered'
export type WrongQuestionFeedback = 'remember' | 'fuzzy' | 'forgot'
export type ErrorType = 'concept' | 'calculation' | 'careless' | 'method' | 'knowledge_gap' | 'other'

// AI Analysis Result
export interface AIAnalysis {
  errorType: ErrorType
  errorTypeLabel: string
  rootCause: string
  knowledgeGaps: string[]
  suggestions: string[]
  similarTopics: string[]
  difficultyLevel: number // 1-5
  masteryProbability: number // 0-1
  generatedAt: number
}

// Review History Entry
export interface ReviewHistoryEntry {
  reviewedAt: number
  feedback: WrongQuestionFeedback
  stageBeforeReview: number
  stageAfterReview: number
  timeSpent?: number // milliseconds
}

// Main Wrong Question Interface
export interface WrongQuestion {
  id: string
  subject: string
  question: string
  correctAnswer?: string
  userAnswer?: string
  analysis?: string
  source?: string
  tags: string[]

  // Image support
  imageUrls: string[]
  answerImageUrls: string[]

  // AI Analysis
  aiAnalysis?: AIAnalysis

  // Knowledge linkage
  knowledgePoints: string[]
  relatedNotes: string[] // Note IDs
  relatedQuestions: string[] // Other question IDs

  // Review scheduling (Spaced Repetition)
  stage: number
  nextReviewAt: number
  lastReviewedAt?: number
  reviewHistory: ReviewHistoryEntry[]
  reviewCount: number

  // Status
  status: WrongQuestionStatus
  isFavorite: boolean

  // Timestamps
  createdAt: number
  updatedAt: number

  // Sync metadata
  syncStatus?: 'pending' | 'synced' | 'conflict'
  localVersion?: number
  serverVersion?: number
}

// Create payload type
export type CreateWrongQuestionPayload = Omit<
  WrongQuestion,
  'id' | 'createdAt' | 'updatedAt' | 'nextReviewAt' | 'stage' | 'status' | 'reviewHistory' | 'reviewCount' | 'isFavorite'
> & {
  subject: string
  question: string
}

// Statistics types
export interface WrongQuestionStats {
  total: number
  active: number
  archived: number
  mastered: number
  dueToday: number
  bySubject: Record<string, number>
  byErrorType: Record<ErrorType, number>
  accuracyRate: number
  averageStage: number
  streakDays: number
  lastStudyDate?: number
}

export interface DailyStats {
  date: string // YYYY-MM-DD
  reviewed: number
  remembered: number
  forgot: number
  newAdded: number
  accuracy: number
}

export interface WeeklyHeatmapData {
  week: number
  day: number
  count: number
  date: string
}

// Error type display mapping
export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  concept: '概念理解错误',
  calculation: '计算错误',
  careless: '粗心大意',
  method: '方法不当',
  knowledge_gap: '知识漏洞',
  other: '其他'
}

export const ERROR_TYPE_COLORS: Record<ErrorType, string> = {
  concept: '#ef4444',
  calculation: '#f59e0b',
  careless: '#eab308',
  method: '#3b82f6',
  knowledge_gap: '#8b5cf6',
  other: '#6b7280'
}

// Review intervals (days)
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 120]

// Subject colors
export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '语文': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  '数学': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  '英语': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  '物理': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  '化学': { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  '生物': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  '政治': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  '历史': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  '地理': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  '其他': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
}

// Helper functions
export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS['其他']
}

export function calculateNextReview(stage: number): number {
  const days = REVIEW_INTERVALS[stage] || REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export function applyFeedbackToStage(currentStage: number, feedback: WrongQuestionFeedback): number {
  switch (feedback) {
    case 'remember':
      return Math.min(currentStage + 1, REVIEW_INTERVALS.length - 1)
    case 'fuzzy':
      return Math.max(currentStage - 1, 0)
    case 'forgot':
      return 0
    default:
      return currentStage
  }
}
