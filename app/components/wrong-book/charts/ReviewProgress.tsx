'use client'

import React from 'react'
import { REVIEW_INTERVALS } from '@/app/types/wrongQuestion'

interface ReviewProgressProps {
  stageDistribution: number[] // count at each stage
  totalQuestions: number
}

export default function ReviewProgress({ stageDistribution, totalQuestions }: ReviewProgressProps) {
  if (totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
        暂无错题数据
      </div>
    )
  }

  const stages = REVIEW_INTERVALS.map((days, index) => ({
    stage: index,
    days,
    count: stageDistribution[index] || 0,
    label: index === 0 ? '新题' : index === REVIEW_INTERVALS.length - 1 ? '已掌握' : `${days}天`
  }))

  // Calculate cumulative mastery
  const masteredCount = stages.filter(s => s.stage >= 4).reduce((sum, s) => sum + s.count, 0)
  const masteryRate = Math.round((masteredCount / totalQuestions) * 100)

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex">
        {stages.map((stage, index) => {
          const width = totalQuestions > 0 ? (stage.count / totalQuestions) * 100 : 0
          if (width === 0) return null

          const colors = [
            'bg-red-400',      // stage 0
            'bg-orange-400',   // stage 1
            'bg-yellow-400',   // stage 2
            'bg-lime-400',     // stage 3
            'bg-green-400',    // stage 4
            'bg-emerald-400',  // stage 5
            'bg-teal-400'      // stage 6+
          ]

          return (
            <div
              key={index}
              className={`${colors[Math.min(index, colors.length - 1)]} h-full transition-all`}
              style={{ width: `${width}%` }}
              title={`${stage.label}: ${stage.count} 题`}
            />
          )
        })}
      </div>

      {/* Stage Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {stages.slice(0, 4).map((stage, index) => {
          const colors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-lime-600']
          const bgColors = ['bg-red-50', 'bg-orange-50', 'bg-yellow-50', 'bg-lime-50']

          return (
            <div
              key={index}
              className={`${bgColors[index]} rounded-lg p-2 text-center`}
            >
              <div className={`${colors[index]} font-bold text-lg`}>{stage.count}</div>
              <div className="text-slate-500">{stage.label}</div>
            </div>
          )
        })}
      </div>

      {/* Mastery Summary */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">已掌握题目</div>
            <div className="text-xs text-slate-500">复习阶段 ≥ 4</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
          <div className="text-xs text-slate-500">占比 {masteryRate}%</div>
        </div>
      </div>
    </div>
  )
}
