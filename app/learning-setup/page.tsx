'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { SUBJECTS } from '../types'
import { CurriculumService } from '../services/curriculumService'

export default function LearningSetupPage() {
  const router = useRouter()
  const curriculum = useMemo(() => CurriculumService.getInstance(), [])
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('')
  const [region, setRegion] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!subject || !grade || !region) {
      setSuggestions([])
      return
    }
    const standard = curriculum.getCurriculumStandard(region, grade, subject)
    setSuggestions(standard ? standard.topics.map((item) => ({ id: item.id, name: item.name })) : [])
  }, [subject, grade, region, curriculum])

  const canStart = Boolean(subject.trim() && topic.trim())

  const startLearning = () => {
    if (!canStart) return

    const params = new URLSearchParams()
    params.set('subject', subject)
    params.set('topic', topic)
    if (grade) params.set('grade', grade)
    if (region) params.set('region', region)
    router.push(`/learning-interface?${params.toString()}`)
  }

  return (
    <div className="zen-page">
      <section className="zen-panel px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8">
          <span className="zen-chip">学习配置</span>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">配置一次专注学习</h1>
          <p className="mt-2 text-slate-600 text-sm md:text-base">
            只填写与学习目标直接相关的信息，其他在流程中按需补充。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">学科</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value)} className="zen-select">
              <option value="">请选择学科</option>
              {SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">年级</span>
            <input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="例如：初中二年级"
              className="zen-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">地区</span>
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="例如：东莞"
              className="zen-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <Search className="w-4 h-4 text-slate-500" />
              主题/知识点
            </span>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="例如：机械运动"
              className="zen-input"
            />
          </label>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-slate-600">根据已选条件推荐：</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTopic(item.name)}
                  className="zen-button-secondary px-3.5 py-2 text-sm"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs md:text-sm text-slate-500">完成后会直接进入学习界面，并自动创建本次会话。</p>
          <button
            onClick={startLearning}
            disabled={!canStart}
            className="zen-button h-12 px-7 text-base inline-flex items-center justify-center"
          >
            开始系统学习
          </button>
        </div>
      </section>
    </div>
  )
}
