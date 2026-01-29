'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowRight, Activity, Clock, PlayCircle } from 'lucide-react'
import { ConversationService } from '../../services/conversationService'
import { ConversationHistory } from '../../types/conversation'
import { STEP_METADATA } from '../../types/learning'

export default function CurrentLearningCard() {
  const router = useRouter()
  const [latestSession, setLatestSession] = useState<ConversationHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取最近的学习会话
    const fetchLatestSession = () => {
      try {
        const cs = ConversationService.getInstance()
        const conversations = cs.getAllConversations()
        
        // 筛选出学习类型的会话，并按最后活动时间排序
        const learningSessions = conversations
          .filter(c => c.type === 'learning' && !c.isArchived && c.learningSession)
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
        
        if (learningSessions.length > 0) {
          setLatestSession(learningSessions[0])
        }
      } catch (error) {
        console.error('Failed to fetch learning session:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestSession()
  }, [])

  const handleContinue = () => {
    if (!latestSession) return
    router.push(`/learning-interface?subject=${encodeURIComponent(latestSession.subject || '')}&topic=${encodeURIComponent(latestSession.topic || '')}`)
  }

  if (loading || !latestSession) return null

  // 计算当前状态描述
  const currentState = latestSession.learningSession?.state || 'DIAGNOSE'
  const stateMeta = STEP_METADATA[currentState] || { label: '进行中', desc: '正在学习中' }
  
  // 计算最后活动时间描述
  const getLastActiveText = (date: Date) => {
    const diff = new Date().getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-blue-100 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* 左侧信息 */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase">
                <Activity className="w-3.5 h-3.5" />
                正在进行
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                上次活跃：{getLastActiveText(latestSession.lastActivity)}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                {latestSession.subject} · {latestSession.topic}
              </h2>
              <p className="text-slate-600 text-base">
                当前阶段：<span className="font-semibold text-blue-700">{stateMeta.label}</span> - {stateMeta.desc}
              </p>
            </div>

            {/* 简易进度指示条 */}
            <div className="w-full max-w-md h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full animate-pulse" 
                style={{ width: '60%' }} // 这里暂时写死，后续可以根据 state 计算进度
              />
            </div>
          </div>

          {/* 右侧行动按钮 */}
          <button
            onClick={handleContinue}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
          >
            <PlayCircle className="w-5 h-5 fill-current" />
            <span>继续学习</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* 底部装饰条 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />
      </div>
    </div>
  )
}
