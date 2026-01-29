'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StatCardSkeleton } from '../ui/Skeleton'
import {
  BookOpen,
  CheckCircle,
  Target,
  Flame,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'

interface DashboardStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  totalQuestions: number
  totalCorrect: number
  overallAccuracy: number
  totalTimeSpent: number
  currentStreak: number
  longestStreak: number
  subjectBreakdown: Array<{ subject: string; count: number }>
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  color: string
  delay?: number
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  delay = 0
}) => {
  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
    pink: { bg: 'bg-pink-50', icon: 'text-pink-500', border: 'border-pink-100' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-100' }
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`${classes.bg} rounded-xl border ${classes.border} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className={`w-10 h-10 rounded-lg ${classes.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${classes.icon}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500">{subValue}</div>
      )}
    </motion.div>
  )
}

interface LearningDashboardProps {
  className?: string
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics?type=dashboard')
      if (!response.ok) {
        throw new Error('获取数据失败')
      }
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        throw new Error(data.error || '获取数据失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
      // Set fallback data for demo
      setStats({
        totalSessions: 0,
        completedSessions: 0,
        completionRate: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        subjectBreakdown: []
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={BookOpen}
          label="学习会话"
          value={stats.totalSessions}
          subValue={`${stats.completedSessions} 已完成`}
          color="blue"
          delay={0}
        />
        <StatCard
          icon={CheckCircle}
          label="完成率"
          value={`${stats.completionRate}%`}
          subValue={`${stats.completedSessions}/${stats.totalSessions} 会话`}
          color="green"
          delay={0.1}
        />
        <StatCard
          icon={Target}
          label="总体正确率"
          value={`${stats.overallAccuracy}%`}
          subValue={`${stats.totalCorrect}/${stats.totalQuestions} 题`}
          color="purple"
          delay={0.2}
        />
        <StatCard
          icon={Flame}
          label="学习连续"
          value={`${stats.currentStreak} 天`}
          subValue={`最长 ${stats.longestStreak} 天`}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Secondary Stats */}
      {(stats.totalTimeSpent > 0 || stats.subjectBreakdown.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Stats */}
          {stats.totalTimeSpent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-900">学习时长</h3>
              </div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {formatTime(stats.totalTimeSpent)}
              </div>
              <div className="text-sm text-gray-500">
                总计学习时间
              </div>
            </motion.div>
          )}

          {/* Subject Breakdown */}
          {stats.subjectBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-pink-500" />
                <h3 className="text-lg font-semibold text-gray-900">学科分布</h3>
              </div>
              <div className="space-y-3">
                {stats.subjectBreakdown.slice(0, 5).map((item, index) => {
                  const maxCount = stats.subjectBreakdown[0].count
                  const percentage = Math.round((item.count / maxCount) * 100)
                  return (
                    <div key={item.subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{item.subject}</span>
                        <span className="text-gray-500">{item.count} 次</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Empty state */}
      {stats.totalSessions === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200"
        >
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">开始你的学习之旅</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            完成学习会话后，这里将显示你的学习统计和进度。
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default LearningDashboard
