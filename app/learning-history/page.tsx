'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Book, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import { SessionCardSkeleton, NoteCardSkeleton } from '../components/ui/Skeleton'
import LearningDashboard from '../components/analytics/LearningDashboard'
import MarkdownRenderer from '../components/MarkdownRenderer'

interface LearningSession {
  id: string
  conversationId: string
  subject: string
  topic: string
  region: string
  grade: string
  aiExplanation: string
  socraticDialogue: string
  currentStep: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface UserAnswer {
  id: string
  questionId: string
  userAnswer: string
  isCorrect: boolean
  createdAt: string
  question?: {
    question: string
    correctAnswer: string
    explanation: string
  }
}

interface Note {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: string
}

export default function LearningHistoryPage() {
  const router = useRouter()
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([])
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'mistakes' | 'notes'>('sessions')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessionsResponse, answersResponse, notesResponse] = await Promise.all([
        fetch('/api/learning-progress?getAllSessions=true&limit=50&offset=0'),
        fetch('/api/user-answers?incorrectOnly=true&limit=50&offset=0'),
        fetch('/api/learning-items'),
      ])

      const sessionsData = await sessionsResponse.json()
      setLearningSessions(sessionsData.success && sessionsData.sessions ? sessionsData.sessions : [])

      const answersData = await answersResponse.json()
      setUserAnswers(answersData.success && answersData.userAnswers ? answersData.userAnswers : [])

      const notesData = await notesResponse.json()
      setNotes(notesData.success && notesData.data ? notesData.data : [])
    } catch (error) {
      console.error('获取学习历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN')
  
  const getStepName = (step: string) => ({ 
    EXPLAIN: '讲解阶段', 
    CONFIRM: '确认理解', 
    QUIZ: '测验阶段', 
    REVIEW: '复习阶段', 
    DONE: '已完成' 
  } as any)[step] || step

  const getStepColor = (step: string) => ({ 
    EXPLAIN: 'bg-blue-100 text-blue-800', 
    CONFIRM: 'bg-yellow-100 text-yellow-800', 
    QUIZ: 'bg-purple-100 text-purple-800', 
    REVIEW: 'bg-orange-100 text-orange-800', 
    DONE: 'bg-green-100 text-green-800' 
  } as any)[step] || 'bg-gray-100 text-gray-800'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200 p-1">
              <div className="h-10 w-24 bg-gray-100 rounded-md mx-2" />
              <div className="h-10 w-24 bg-gray-100 rounded-md mx-2" />
              <div className="h-10 w-24 bg-gray-100 rounded-md mx-2" />
            </div>
            <div className="p-6 space-y-4">
              <SessionCardSkeleton />
              <SessionCardSkeleton />
              <SessionCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学习档案</h1>
          <p className="text-gray-600">回顾您的学习历程、知识点和错题</p>
        </div>

        {/* Learning Dashboard */}
        <LearningDashboard className="mb-8" />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'sessions', label: '学习会话', icon: Book },
              { id: 'mistakes', label: '错题本', icon: AlertCircle },
              { id: 'notes', label: '我的笔记', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 -mb-px ${
                    isActive 
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'sessions' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {learningSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无学习记录</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {learningSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        onClick={() => router.push(`/learning-history/${session.conversationId}`)}
                        className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {session.topic}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStepColor(session.currentStep)}`}>
                              {getStepName(session.currentStep)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{session.subject}</span>
                            <span>•</span>
                            <span>{session.grade}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(session.createdAt)}
                            </span>
                          </div>
                          {session.aiExplanation && (
                            <p className="text-sm text-gray-600 line-clamp-1 max-w-2xl">
                              {session.aiExplanation.substring(0, 100).replace(/[#*`]/g, '')}...
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'mistakes' && (
              <div className="space-y-6">
                {userAnswers.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无错题记录</p>
                  </div>
                ) : (
                  userAnswers.map((answer) => (
                    <div key={answer.id} className="bg-white border border-red-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-3 text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>错题回顾</span>
                        <span className="text-xs text-gray-400 font-normal ml-auto">{formatDate(answer.createdAt)}</span>
                      </div>
                      
                      {answer.question && (
                        <div className="space-y-4">
                          <MarkdownRenderer
                            content={answer.question.question}
                            fontSize="sm"
                            className="!prose-p:my-1 !prose-h1:mt-3 !prose-h2:mt-3 !prose-h3:mt-2"
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                              <span className="block text-red-600 text-xs mb-1">你的答案</span>
                              <span className="font-medium text-red-900">{answer.userAnswer}</span>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                              <span className="block text-green-600 text-xs mb-1">正确答案</span>
                              <span className="font-medium text-green-900">{answer.question.correctAnswer}</span>
                            </div>
                          </div>
                          {answer.question.explanation && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                              <div className="font-medium text-gray-900 mb-1">解析:</div>
                              <MarkdownRenderer
                                content={answer.question.explanation}
                                fontSize="sm"
                                className="!prose-p:my-1 !prose-h1:mt-3 !prose-h2:mt-3 !prose-h3:mt-2"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无笔记</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-64">
                      <div className="flex items-center mb-3">
                        <div className="w-1.5 h-6 rounded-full mr-3" style={{ backgroundColor: note.color || '#3b82f6' }}></div>
                        <h3 className="font-bold text-gray-900 truncate flex-1">{note.title}</h3>
                      </div>
                      <div className="flex-1 overflow-hidden relative mb-3">
                        <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: note.content }} />
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {note.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
