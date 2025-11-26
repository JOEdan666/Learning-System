'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

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

interface QuizQuestion {
  id: string
  sessionId: string
  question: string
  options: string
  correctAnswer: string
  explanation: string
  createdAt: string
}

interface UserAnswer {
  id: string
  questionId: string
  userAnswer: string
  isCorrect: boolean
  createdAt: string
  question?: QuizQuestion
}

export default function LearningHistoryPage() {
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([])
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null)
  const [activeTab, setActiveTab] = useState<'sessions' | 'knowledge' | 'mistakes'>('sessions')

  useEffect(() => {
    document.body.classList.add('bg-learn')
    fetchData()
    return () => document.body.classList.remove('bg-learn')
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessionsResponse, answersResponse] = await Promise.all([
        fetch('/api/learning-progress?getAllSessions=true&limit=50&offset=0'),
        fetch('/api/user-answers?incorrectOnly=true&limit=50&offset=0'),
      ])

      const sessionsData = await sessionsResponse.json()
      setLearningSessions(sessionsData.success && sessionsData.sessions ? sessionsData.sessions : [])

      const answersData = await answersResponse.json()
      setUserAnswers(answersData.success && answersData.userAnswers ? answersData.userAnswers : [])
    } catch (error) {
      console.error('获取学习历史失败:', error)
      setLearningSessions([])
      setUserAnswers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN')
  const parseDialogue = (dialogueString: string) => { try { return JSON.parse(dialogueString) } catch { return [] } }
  const getStepName = (step: string) => ({ EXPLAIN: '讲解阶段', CONFIRM: '确认理解', QUIZ: '测验阶段', REVIEW: '复习阶段', DONE: '已完成' } as any)[step] || step
  const getStepColor = (step: string) => ({ EXPLAIN: 'bg-blue-100 text-blue-800', CONFIRM: 'bg-yellow-100 text-yellow-800', QUIZ: 'bg-purple-100 text-purple-800', REVIEW: 'bg-orange-100 text-orange-800', DONE: 'bg-green-100 text-green-800' } as any)[step] || 'bg-gray-100 text-gray-800'

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64"><div className="text-lg">加载学习历史中...</div></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">学习历史</h1>
        <p className="text-gray-600">查看您的AI学习记录、知识点和错题集</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['sessions','knowledge','mistakes'] as const).map((tab)=> (
              <button key={tab} onClick={()=>setActiveTab(tab)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab===tab?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab==='sessions'?'学习会话':tab==='knowledge'?'AI知识点':'错题集'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {learningSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center"><div className="text-4xl mb-4">📚</div><p className="text-gray-500">暂无学习会话记录</p></div>
          ) : (
            learningSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6" onClick={() => setSelectedSession(session)}>
                <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">{session.subject} - {session.topic}</h3><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepColor(session.currentStep)}`}>{getStepName(session.currentStep)}</span>{session.isCompleted ? (<span className="text-green-500">✅</span>) : (<span className="text-yellow-500">⏰</span>)}</div></div>
                <div className="space-y-2"><p className="text-sm text-gray-600">年级: {session.grade} | 地区: {session.region}</p><p className="text-sm text-gray-500">创建时间: {formatDate(session.createdAt)}</p>{session.aiExplanation && (<p className="text-sm text-gray-700 line-clamp-2">AI讲解: {session.aiExplanation.substring(0, 100)}...</p>)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {learningSessions.filter(s => s.aiExplanation).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center"><div className="text-4xl mb-4">💬</div><p className="text-gray-500">暂无AI知识点记录</p></div>
          ) : (
            learningSessions.filter(session => session.aiExplanation).map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4"><h3 className="text-lg font-semibold">{session.subject} - {session.topic}</h3><p className="text-sm text-gray-500">{formatDate(session.createdAt)}</p></div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4"><h4 className="font-semibold mb-2">AI讲解内容:</h4><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{session.aiExplanation}</ReactMarkdown></div></div>
                {/* 移除对话记录展示，聚焦 AI 讲解内容 */}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          {userAnswers.filter(a => !a.isCorrect).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center"><div className="text-4xl mb-4">✅</div><p className="text-gray-500">太棒了！暂无错题记录</p></div>
          ) : (
            userAnswers.filter(answer => !answer.isCorrect).map((answer) => (
              <div key={answer.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4"><span className="text-red-500">❌</span><h3 className="text-lg font-semibold text-red-700">错题</h3><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">需要复习</span></div>
                <p className="text-sm text-gray-500 mb-4">答题时间: {formatDate(answer.createdAt)}</p>
                {answer.question && (<div className="space-y-4"><div><h4 className="font-semibold mb-2">题目:</h4><p className="text-gray-700">{answer.question.question}</p></div><div><h4 className="font-semibold mb-2">您的答案:</h4><p className="text-red-600 bg-red-50 p-2 rounded">{answer.userAnswer}</p></div><div><h4 className="font-semibold mb-2">正确答案:</h4><p className="text-green-600 bg-green-50 p-2 rounded">{answer.question.correctAnswer}</p></div>{answer.question.explanation && (<div><h4 className="font-semibold mb-2">解析:</h4><p className="text-gray-700 bg-blue-50 p-2 rounded">{answer.question.explanation}</p></div>)}</div>)}
              </div>
            ))
          )}
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold">{selectedSession.subject} - {selectedSession.topic}</h2><button onClick={() => setSelectedSession(null)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">关闭</button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><p><strong>年级:</strong> {selectedSession.grade}</p><p><strong>地区:</strong> {selectedSession.region}</p></div><div><p><strong>当前阶段:</strong> {getStepName(selectedSession.currentStep)}</p><p><strong>完成状态:</strong> {selectedSession.isCompleted ? '已完成' : '进行中'}</p></div></div>
              {selectedSession.aiExplanation && (<div className="bg-blue-50 p-4 rounded-lg"><h4 className="font-semibold mb-2">AI讲解:</h4><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{selectedSession.aiExplanation}</ReactMarkdown></div></div>)}
              {/* 移除对话历史展示，保持详情简洁 */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
