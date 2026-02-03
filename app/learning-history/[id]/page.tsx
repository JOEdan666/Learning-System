'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { ArrowLeft, BookOpen, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react'
import FloatingChatWidget from '@/app/components/FloatingChatWidget'

interface QuizQuestion {
  id: string
  question: string
  type: string
  options: any
  correctAnswer: string
  explanation: string
  order: number
  userAnswers: {
    userAnswer: string
    isCorrect: boolean
  }[]
}

interface LearningSession {
  id: string
  conversationId: string
  subject: string
  topic: string
  grade: string
  region: string
  aiExplanation: string
  currentStep: string
  isCompleted: boolean
  createdAt: string
  quizQuestions: QuizQuestion[]
}

export default function SessionArchivePage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<LearningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSession = async () => {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      if (!id) return

      try {
        const res = await fetch(`/api/learning-progress?conversationId=${id}&includeStats=true`)
        const data = await res.json()
        
        if (data.session) {
          setSession(data.session)
        } else {
          setError('未找到该学习记录')
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
        setError('加载失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">正在加载学习档案...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || '无法找到该记录'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  // Construct context for the AI Chat
  const chatContext = `
Reviewing Learning Session:
Subject: ${session.subject}
Topic: ${session.topic}
Grade: ${session.grade}
Date: ${new Date(session.createdAt).toLocaleString()}

--- AI Explanation Content ---
${session.aiExplanation || '(No explanation content)'}

--- Quiz Results ---
${session.quizQuestions.map((q, idx) => {
  const userAnswer = q.userAnswers?.[0]
  return `
Question ${idx + 1}: ${q.question}
Type: ${q.type}
Correct Answer: ${q.correctAnswer}
User Answer: ${userAnswer?.userAnswer || 'Not answered'}
Result: ${userAnswer?.isCorrect ? 'Correct' : 'Incorrect'}
Explanation: ${q.explanation}
`
}).join('\n')}
`

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{session.topic}</h1>
              <div className="text-xs text-gray-500 flex gap-2">
                <span>{session.subject}</span>
                <span>•</span>
                <span>{session.grade}</span>
                <span>•</span>
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            session.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {session.isCompleted ? '已完成' : '进行中'}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        
        {/* Module 1: Knowledge Explanation */}
        {session.aiExplanation && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-blue-900">知识点讲解</h2>
            </div>
            <div className="p-6 md:p-8">
              <MarkdownRenderer content={session.aiExplanation} fontSize="lg" />
            </div>
          </section>
        )}

        {/* Module 2: Quiz Review */}
        {session.quizQuestions && session.quizQuestions.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-purple-900">测验回顾</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {session.quizQuestions.map((q, idx) => {
                const userAnswer = q.userAnswers?.[0]
                const isCorrect = userAnswer?.isCorrect
                
                return (
                  <div key={q.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-3">
                        {/* Question */}
                        <div className="text-gray-900 font-medium">{q.question}</div>
                        
                        {/* Options (if MC) */}
                        {q.options && Array.isArray(q.options) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt: string, optIdx: number) => {
                              const label = String.fromCharCode(65 + optIdx)
                              const isUserSelected = userAnswer?.userAnswer === label
                              const isCorrectOpt = q.correctAnswer === label
                              
                              let itemClass = "border-gray-200 bg-white"
                              if (isCorrectOpt) itemClass = "border-green-300 bg-green-50 text-green-700"
                              else if (isUserSelected && !isCorrect) itemClass = "border-red-300 bg-red-50 text-red-700"
                              
                              return (
                                <div key={optIdx} className={`px-4 py-2 border rounded-lg text-sm flex items-center gap-2 ${itemClass}`}>
                                  <span className="font-medium">{label}.</span>
                                  <span>{opt}</span>
                                  {isCorrectOpt && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                                  {isUserSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 ml-auto" />}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Non-MC User Answer Display */}
                        {(!q.options || !Array.isArray(q.options)) && (
                          <div className={`p-3 rounded-lg text-sm border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <span className="font-medium mr-2">你的答案:</span>
                            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {userAnswer?.userAnswer || '未作答'}
                            </span>
                            {!isCorrect && (
                              <div className="mt-1 pt-1 border-t border-red-100 text-red-600">
                                <span className="font-medium mr-2">正确答案:</span>
                                {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                            <span className="font-bold block mb-1 text-gray-900">解析：</span>
                            <MarkdownRenderer 
                              content={q.explanation}
                              fontSize="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget context={chatContext} title={`复习助手 - ${session.topic}`} />
    </div>
  )
}
