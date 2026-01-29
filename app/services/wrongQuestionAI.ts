import type { WrongQuestion, AIAnalysis, ErrorType } from '@/app/types/wrongQuestion'

// AI analysis for wrong questions
export async function analyzeWrongQuestion(question: WrongQuestion): Promise<AIAnalysis> {
  try {
    const response = await fetch('/api/wrong-questions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.question,
        correctAnswer: question.correctAnswer,
        userAnswer: question.userAnswer,
        subject: question.subject,
        analysis: question.analysis
      })
    })

    if (!response.ok) {
      throw new Error('Analysis failed')
    }

    const data = await response.json()
    return data.analysis
  } catch (error) {
    console.error('AI analysis failed:', error)
    // Return a default analysis
    return createDefaultAnalysis()
  }
}

// Generate review suggestions based on review history
export function generateReviewSuggestions(question: WrongQuestion): string[] {
  const suggestions: string[] = []
  const reviewHistory = question.reviewHistory || []
  const forgotCount = reviewHistory.filter(r => r.feedback === 'forgot').length
  const fuzzyCount = reviewHistory.filter(r => r.feedback === 'fuzzy').length

  if (forgotCount >= 3) {
    suggestions.push('此题遗忘频率较高，建议重新学习相关知识点')
    suggestions.push('尝试将此题与其他知识点建立关联记忆')
  }

  if (fuzzyCount >= 2) {
    suggestions.push('对此题理解不够深入，建议做更多同类型题目')
  }

  if (question.stage < 2 && reviewHistory.length > 5) {
    suggestions.push('进步较慢，建议换一种学习方法')
  }

  if (question.aiAnalysis?.errorType === 'concept') {
    suggestions.push('基础概念薄弱，建议回归教材复习')
  }

  if (question.aiAnalysis?.errorType === 'careless') {
    suggestions.push('注意审题，可以尝试"读题三遍"策略')
  }

  if (suggestions.length === 0) {
    suggestions.push('保持当前学习节奏，继续巩固')
  }

  return suggestions
}

// Recommend similar questions based on knowledge points
export function findSimilarQuestions(
  currentQuestion: WrongQuestion,
  allQuestions: WrongQuestion[],
  limit = 5
): WrongQuestion[] {
  if (!currentQuestion.knowledgePoints || currentQuestion.knowledgePoints.length === 0) {
    // Fall back to same subject
    return allQuestions
      .filter(q => q.id !== currentQuestion.id && q.subject === currentQuestion.subject)
      .slice(0, limit)
  }

  // Score each question based on overlapping knowledge points
  const scored = allQuestions
    .filter(q => q.id !== currentQuestion.id)
    .map(q => {
      const overlap = (q.knowledgePoints || []).filter(kp =>
        currentQuestion.knowledgePoints.includes(kp)
      ).length
      const sameSubject = q.subject === currentQuestion.subject ? 1 : 0
      return { question: q, score: overlap * 2 + sameSubject }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(s => s.question)
}

// Generate a study plan for weak areas
export function generateStudyPlan(questions: WrongQuestion[]): StudyPlanItem[] {
  const plan: StudyPlanItem[] = []

  // Group by subject
  const bySubject = groupBy(questions, 'subject')

  for (const [subject, subjectQuestions] of Object.entries(bySubject)) {
    // Count error types
    const errorTypeCounts: Record<ErrorType, number> = {
      concept: 0,
      calculation: 0,
      careless: 0,
      method: 0,
      knowledge_gap: 0,
      other: 0
    }

    subjectQuestions.forEach(q => {
      if (q.aiAnalysis?.errorType) {
        errorTypeCounts[q.aiAnalysis.errorType]++
      }
    })

    // Find dominant error type
    const dominantType = Object.entries(errorTypeCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as ErrorType

    // Collect weak knowledge points
    const weakPoints = new Set<string>()
    subjectQuestions.forEach(q => {
      if (q.stage < 3) {
        q.knowledgePoints?.forEach(kp => weakPoints.add(kp))
        q.aiAnalysis?.knowledgeGaps?.forEach(kg => weakPoints.add(kg))
      }
    })

    plan.push({
      subject,
      questionCount: subjectQuestions.length,
      dueCount: subjectQuestions.filter(q => q.nextReviewAt <= Date.now()).length,
      dominantErrorType: dominantType,
      weakKnowledgePoints: Array.from(weakPoints).slice(0, 5),
      priority: calculatePriority(subjectQuestions),
      suggestions: generateSubjectSuggestions(dominantType, subjectQuestions.length)
    })
  }

  // Sort by priority
  return plan.sort((a, b) => b.priority - a.priority)
}

export interface StudyPlanItem {
  subject: string
  questionCount: number
  dueCount: number
  dominantErrorType: ErrorType
  weakKnowledgePoints: string[]
  priority: number // 0-100
  suggestions: string[]
}

// Helper functions

function createDefaultAnalysis(): AIAnalysis {
  return {
    errorType: 'other',
    errorTypeLabel: '其他',
    rootCause: '需要进一步分析',
    knowledgeGaps: [],
    suggestions: ['多做同类型题目练习'],
    similarTopics: [],
    difficultyLevel: 3,
    masteryProbability: 0.5,
    generatedAt: Date.now()
  }
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

function calculatePriority(questions: WrongQuestion[]): number {
  const dueCount = questions.filter(q => q.nextReviewAt <= Date.now()).length
  const lowStageCount = questions.filter(q => q.stage < 2).length
  const total = questions.length

  if (total === 0) return 0

  const duePriority = (dueCount / total) * 40
  const stagePriority = (lowStageCount / total) * 40
  const volumePriority = Math.min(total / 10, 1) * 20

  return Math.round(duePriority + stagePriority + volumePriority)
}

function generateSubjectSuggestions(errorType: ErrorType, count: number): string[] {
  const suggestions: string[] = []

  switch (errorType) {
    case 'concept':
      suggestions.push('建议重点复习基础概念和定义')
      suggestions.push('可以尝试制作概念思维导图')
      break
    case 'calculation':
      suggestions.push('建议多做计算练习，提高准确性')
      suggestions.push('检验答案时可以用逆运算验证')
      break
    case 'careless':
      suggestions.push('做题时放慢速度，仔细审题')
      suggestions.push('建议使用打草稿纸，规范书写')
      break
    case 'method':
      suggestions.push('总结常见题型的解题方法')
      suggestions.push('可以尝试一题多解，拓宽思路')
      break
    case 'knowledge_gap':
      suggestions.push('找出知识薄弱点，针对性补课')
      suggestions.push('建议系统复习相关章节')
      break
    default:
      suggestions.push('继续保持练习')
  }

  if (count > 20) {
    suggestions.push(`该学科错题较多(${count}题)，建议制定专项复习计划`)
  }

  return suggestions
}

// Parse question text using OCR (placeholder - actual implementation in ImageCapture component)
export async function parseQuestionFromImage(imageUrl: string): Promise<{
  text: string
  confidence: number
}> {
  // This would be called from the ImageCapture component which uses Tesseract.js
  // Just a placeholder here for type consistency
  return {
    text: '',
    confidence: 0
  }
}
