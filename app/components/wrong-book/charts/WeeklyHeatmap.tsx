'use client'

import React from 'react'
import type { WeeklyHeatmapData } from '@/app/types/wrongQuestion'

interface WeeklyHeatmapProps {
  data: WeeklyHeatmapData[]
  weeks?: number
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export default function WeeklyHeatmap({ data, weeks = 12 }: WeeklyHeatmapProps) {
  // Generate grid of weeks x days
  const grid: (WeeklyHeatmapData | null)[][] = []

  for (let w = 0; w < weeks; w++) {
    const week: (WeeklyHeatmapData | null)[] = []
    for (let d = 0; d < 7; d++) {
      const item = data.find(i => i.week === w && i.day === d)
      week.push(item || null)
    }
    grid.push(week)
  }

  // Calculate max for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1)

  const getColor = (count: number | null): string => {
    if (count === null || count === 0) return 'bg-slate-100'
    const intensity = count / maxCount
    if (intensity < 0.25) return 'bg-green-200'
    if (intensity < 0.5) return 'bg-green-300'
    if (intensity < 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  // Calculate stats
  const totalDays = data.filter(d => d.count > 0).length
  const totalReviews = data.reduce((sum, d) => sum + d.count, 0)
  const avgPerDay = totalDays > 0 ? Math.round(totalReviews / totalDays) : 0

  // Find streak
  const sortedDates = [...data].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  for (const item of sortedDates) {
    if (item.date === today || streak > 0) {
      if (item.count > 0) streak++
      else break
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <div className="text-lg font-bold text-slate-700">{totalDays}</div>
          <div className="text-xs text-slate-500">学习天数</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <div className="text-lg font-bold text-slate-700">{totalReviews}</div>
          <div className="text-xs text-slate-500">复习次数</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{streak}</div>
          <div className="text-xs text-slate-500">当前连续</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-3 w-4 text-[10px] text-slate-400 flex items-center justify-end pr-1"
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getColor(day?.count ?? null)} transition-colors hover:ring-2 hover:ring-green-400 hover:ring-offset-1`}
                  title={day ? `${day.date}: ${day.count} 题` : '无数据'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>更少</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
        </div>
        <span>更多</span>
      </div>
    </div>
  )
}
