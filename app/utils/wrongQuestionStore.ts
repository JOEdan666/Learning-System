'use client'

export type WrongQuestionStatus = 'active' | 'archived'
export type WrongQuestionFeedback = 'remember' | 'fuzzy' | 'forgot'

export interface WrongQuestion {
  id: string
  subject: string
  question: string
  correctAnswer?: string
  userAnswer?: string
  analysis?: string
  source?: string
  tags?: string[]
  createdAt: number
  lastReviewedAt?: number
  nextReviewAt: number
  stage: number
  status: WrongQuestionStatus
}

const STORAGE_KEY = 'wrong_questions_v1'
const intervals = [1, 3, 7, 14, 30, 60] // days

const nowMs = () => Date.now()
const toMs = (days: number) => days * 24 * 60 * 60 * 1000

function load(): WrongQuestion[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data
  } catch {}
  return []
}

function save(items: WrongQuestion[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listWrongQuestions() {
  return load()
}

export function listDueWrongQuestions(reference = nowMs()) {
  return load()
    .filter((q) => q.status === 'active' && q.nextReviewAt <= reference)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
}

export function addWrongQuestion(payload: Omit<WrongQuestion, 'id' | 'createdAt' | 'nextReviewAt' | 'stage' | 'status'> & { subject: string; question: string }) {
  const items = load()
  const next = nowMs() + toMs(intervals[0])
  const entry: WrongQuestion = {
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
    subject: payload.subject,
    question: payload.question,
    correctAnswer: payload.correctAnswer,
    userAnswer: payload.userAnswer,
    analysis: payload.analysis,
    source: payload.source,
    tags: payload.tags || [],
    createdAt: nowMs(),
    nextReviewAt: next,
    stage: 0,
    status: 'active'
  }
  items.unshift(entry)
  save(items)
  return entry
}

export function updateFeedback(id: string, feedback: WrongQuestionFeedback) {
  const items = load()
  const idx = items.findIndex((q) => q.id === id)
  if (idx === -1) return items
  let stage = items[idx].stage
  if (feedback === 'remember') stage = Math.min(stage + 1, intervals.length - 1)
  else if (feedback === 'fuzzy') stage = Math.max(stage - 1, 0)
  else stage = 0
  const days = intervals[stage] || intervals[intervals.length - 1]
  const next = nowMs() + toMs(days)
  items[idx] = {
    ...items[idx],
    stage,
    lastReviewedAt: nowMs(),
    nextReviewAt: next
  }
  save(items)
  return items
}

export function archiveWrongQuestion(id: string) {
  const items = load()
  const idx = items.findIndex((q) => q.id === id)
  if (idx === -1) return items
  items[idx].status = 'archived'
  save(items)
  return items
}

export function restoreWrongQuestion(id: string) {
  const items = load()
  const idx = items.findIndex((q) => q.id === id)
  if (idx === -1) return items
  items[idx].status = 'active'
  save(items)
  return items
}
